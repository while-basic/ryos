import { Redis } from "@upstash/redis";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// One-time scanner/cleaner: find spam users by prefix patterns, list their tokens/keys,
// then optionally delete users and tokens in batches after confirmation.
// Usage:
//   REDIS_KV_REST_API_URL=... REDIS_KV_REST_API_TOKEN=... bun run scripts/scan-spam-users.ts [--yes]
//   - Default behavior: list matches, ask for confirmation, then delete in batches if confirmed.
//   - Pass --yes to skip the prompt and proceed with deletion immediately.
//   - Env knobs:
//       FULL_OLD_MAPPING_SCAN=true|false (default true)
//       INCLUDE_GRACE_IN_DELETION=true|false (default false)
//       INCLUDE_LEGACY_SINGLE_IN_DELETION=true|false (default true)
//       PIPELINE_CHUNK=200 (keys per pipeline batch)
//
// Output: JSON report to stdout. Redirect to a file to keep a copy.
//   bun run scan:spam-users | tee spam-scan.json

const CHAT_USERS_PREFIX = "chat:users:";
const AUTH_TOKEN_PREFIX = "chat:token:";
// Note: presence keys aren't targeted by this one-time cleaner.
const PASSWORD_HASH_PREFIX = "chat:password:";

// Spam username prefix patterns provided by user
// Interpret the list as username-prefix globs. Some entries include trailing '-' or '_' explicitly.
const SPAM_USERNAME_PATTERNS = [
  "any-*",
  "avoid*",
  "cease_*",
  "dont*",
  "my-*",
  "never*",
  "our-*",
  "privacy_*",
  "quit*",
  "script_*",
  "skip*",
  "stop*",
  "the-*",
  "their-*",
  "ur-*",
  "vibe_*",
  "your-*",
  "zen_*",
];

// Toggle whether to do a full scan across old mapping keys chat:token:{token} -> username
// This may be heavier but ensures we catch tokens that only exist in the old mapping.
const FULL_OLD_MAPPING_SCAN = process.env.FULL_OLD_MAPPING_SCAN !== "false"; // default true
// Include grace records in deletion key list (not tokens, but prevents grace refresh). Default false.
const INCLUDE_GRACE_IN_DELETION = process.env.INCLUDE_GRACE_IN_DELETION === "true";
// Include legacy single key chat:token:{username} in deletion list. Default true.
const INCLUDE_LEGACY_SINGLE_IN_DELETION = process.env.INCLUDE_LEGACY_SINGLE_IN_DELETION !== "false";

// Upstash Redis client
const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

const argv = new Set(process.argv.slice(2));
const AUTO_YES = argv.has("--yes") || argv.has("-y");
const SHOW_PROGRESS = argv.has("--progress") || process.env.PROGRESS === "true" || true; // default true for visibility
const PIPELINE_CHUNK = Number(process.env.PIPELINE_CHUNK || "200");
const PER_USER_DELETE = argv.has("--per-user") || process.env.PER_USER_DELETE === "true";
const CHUNKED_CONFIRM = argv.has("--chunked") || process.env.CHUNKED === "true";
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || "100");
// Simplified mode: only scan chat:users:* and per-user token keys; no global scans over chat:token:*
const SIMPLE = argv.has("--simple") || process.env.SIMPLE === "true";

function assertEnv() {
  const missing: string[] = [];
  if (!process.env.REDIS_KV_REST_API_URL) missing.push("REDIS_KV_REST_API_URL");
  if (!process.env.REDIS_KV_REST_API_TOKEN) missing.push("REDIS_KV_REST_API_TOKEN");
  if (missing.length) {
    console.error(
      `Missing required env vars: ${missing.join(", ")}. Set them before running. ` +
        `Example: REDIS_KV_REST_API_URL=... REDIS_KV_REST_API_TOKEN=... bun run scripts/scan-spam-users.ts`
    );
    process.exit(1);
  }
}

async function scanKeys(match: string, count = 200): Promise<string[]> {
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [newCursor, found] = (await redis.scan(cursor, { match, count })) as [number | string, string[]];
    cursor = typeof newCursor === "string" ? parseInt(newCursor, 10) : newCursor;
    if (found?.length) keys.push(...found);
    if (SHOW_PROGRESS) console.error(`[scan] match="${match}" cursor=${cursor} total=${keys.length}`);
  } while (cursor !== 0);
  return keys;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function extractUsernameFromKey(userKey: string): string {
  return userKey.substring(CHAT_USERS_PREFIX.length);
}

function extractTokenFromDirectKey(key: string): string {
  // chat:token:{token}
  return key.substring(AUTH_TOKEN_PREFIX.length);
}

async function getValue(key: string): Promise<unknown> {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

function normalizeMappedUser(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "object" && value !== null && typeof (value as { username?: unknown }).username === "string") {
    return ((value as { username: string }).username).toLowerCase();
  }
  return null;
}

async function listNewSchemeTokens(username: string) {
  // chat:token:user:{username}:{token} -> timestamp
  const pattern = `${AUTH_TOKEN_PREFIX}user:${username}:*`;
  const keys = await scanKeys(pattern);
  const results: { key: string; token: string; createdAt?: number | string | null }[] = [];
  if (!keys.length) return results;

  // Batch fetch timestamps
  for (const batch of chunk(keys, 200)) {
    const values = await redis.mget(...batch);
    for (let i = 0; i < batch.length; i++) {
      const key = batch[i];
      const parts = key.split(":");
      const token = parts[parts.length - 1];
      const v = values[i] as unknown;
      const createdAt = typeof v === "number" || typeof v === "string" ? v : null;
      results.push({ key, token, createdAt });
    }
  }
  return results;
}

async function listLegacySingleToken(username: string) {
  // chat:token:{username} -> token
  const key = `${AUTH_TOKEN_PREFIX}${username}`;
  const token = await getValue(key);
  if (!token || typeof token !== "string") return null;
  return { key, token };
}

async function listGraceLast(username: string) {
  // chat:token:last:{username} -> { token, expiredAt }
  const key = `${AUTH_TOKEN_PREFIX}last:${username}`;
  const raw = await getValue(key);
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { key, token: parsed?.token ?? null, expiredAt: parsed?.expiredAt ?? null };
  } catch {
    return { key, token: null, expiredAt: null };
  }
}

async function listOldMappingTokensForUsers(usernames: Set<string>) {
  // Scan all direct mapping keys chat:token:{token} -> username
  // Exclude new scheme (":user:") and grace ("last:")
  const pattern = `${AUTH_TOKEN_PREFIX}*`;
  const keys = await scanKeys(pattern);
  const candidates = keys.filter((k) => !k.includes(":user:") && !k.startsWith(`${AUTH_TOKEN_PREFIX}last:`));
  const byUser: Record<string, { key: string; token: string }[]> = {};

  for (const batch of chunk(candidates, 200)) {
    const values = await redis.mget(...batch);
    for (let i = 0; i < batch.length; i++) {
      const key = batch[i];
      const mapped = normalizeMappedUser(values[i]);
      if (!mapped) continue;
      if (!usernames.has(mapped)) continue;
      const token = extractTokenFromDirectKey(key);
      if (!byUser[mapped]) byUser[mapped] = [];
      byUser[mapped].push({ key, token });
    }
  }

  return byUser;
}

function collectUserDeletionKeys(
  r: { username: string; tokens: {
    newScheme: { key: string; token: string }[];
    legacySingle: { key: string; token: string } | null;
    graceLast: { key: string; token: string | null; expiredAt: number | null } | null;
    oldMapping: { key: string; token: string }[];
  }},
  includeGrace: boolean,
  includeLegacy: boolean,
  userScopedAll: string[]
): string[] {
  const keys: string[] = [];
  keys.push(`${CHAT_USERS_PREFIX}${r.username}`);
  keys.push(`${PASSWORD_HASH_PREFIX}${r.username}`);
  for (const t of r.tokens.newScheme) {
    keys.push(t.key);
    keys.push(`${AUTH_TOKEN_PREFIX}${t.token}`);
  }
  // In SIMPLE mode, oldMapping is empty (we don't globally scan direct mappings)
  for (const t of r.tokens.oldMapping) keys.push(t.key);
  if (includeLegacy && r.tokens.legacySingle?.key) keys.push(r.tokens.legacySingle.key);
  if (includeGrace && r.tokens.graceLast?.key) keys.push(r.tokens.graceLast.key);

  if (!SIMPLE && userScopedAll.length) {
    const tokenSet = new Set<string>([
      ...r.tokens.newScheme.map((t) => t.token),
      ...r.tokens.oldMapping.map((t) => t.token),
      r.tokens.legacySingle?.token ? [r.tokens.legacySingle.token] : [],
    ].flat());
    for (const k of userScopedAll) {
      const token = k.split(":").at(-1);
      if (token && tokenSet.has(token)) keys.push(k);
    }
  }
  return Array.from(new Set(keys));
}

// Scan any user-scoped token keys chat:token:user:* and include those whose token maps
// to a spam username via the direct mapping chat:token:{token}. This catches variants
// where the segment after 'user:' might not equal the username (e.g., an internal id).
async function listAnyUserScopedKeysForSpamTokens(spamUsers: Set<string>, alreadyNewSchemeKeys: Set<string>) {
  const pattern = `${AUTH_TOKEN_PREFIX}user:*`;
  const keys = await scanKeys(pattern);
  const otherUserScoped: string[] = [];

  if (!keys.length) return otherUserScoped;

  // Build direct mapping keys for tokens in batches
  for (const batch of chunk(keys, 200)) {
    // Extract tokens from user-scoped keys
    const tokens = batch.map((k) => k.split(":").at(-1) as string);
    const directKeys = tokens.map((t) => `${AUTH_TOKEN_PREFIX}${t}`);
    const mapped = await redis.mget(...directKeys);

    for (let i = 0; i < batch.length; i++) {
      const userScopedKey = batch[i];
      if (alreadyNewSchemeKeys.has(userScopedKey)) continue; // avoid duplicates
      const mappedLower = normalizeMappedUser(mapped[i]);
      if (mappedLower && spamUsers.has(mappedLower)) {
        otherUserScoped.push(userScopedKey);
      }
    }
  }

  return otherUserScoped;
}

async function main() {
  assertEnv();

  // 1) Collect spam usernames by scanning chat:users:{pattern}
  if (SHOW_PROGRESS) console.error(`[stage] scanning users for ${SPAM_USERNAME_PATTERNS.length} prefixes...`);
  const spamUserSet = new Set<string>();
  for (const pat of SPAM_USERNAME_PATTERNS) {
    const match = `${CHAT_USERS_PREFIX}${pat.toLowerCase()}`;
    const keys = await scanKeys(match);
    for (const key of keys) {
      spamUserSet.add(extractUsernameFromKey(key));
    }
    if (SHOW_PROGRESS) console.error(`[stage] prefix ${pat} -> ${keys.length} matches (cumulative users=${spamUserSet.size})`);
  }

  const spamUsers = Array.from(spamUserSet).sort();
  if (SHOW_PROGRESS) console.error(`[stage] total matched users=${spamUsers.length}`);

  // 2) For each username, list tokens in all schemes
  const perUserResults: Array<{
    username: string;
    tokens: {
      newScheme: { key: string; token: string; createdAt?: number | string | null }[];
      legacySingle: { key: string; token: string } | null;
      graceLast: { key: string; token: string | null; expiredAt: number | null } | null;
      oldMapping: { key: string; token: string }[]; // filled later if FULL_OLD_MAPPING_SCAN
    };
  }> = [];

  let idx = 0;
  const totalUsers = spamUsers.length;
  for (const username of spamUsers) {
    const [newScheme, legacy, grace] = await Promise.all([
      listNewSchemeTokens(username),
      listLegacySingleToken(username),
      listGraceLast(username),
    ]);

    perUserResults.push({
      username,
      tokens: {
        newScheme,
        legacySingle: legacy,
        graceLast: grace,
        oldMapping: [],
      },
    });
    idx++;
    if (SHOW_PROGRESS && idx % 100 === 0) console.error(`[tokens] per-user token listing ${idx}/${totalUsers}`);
  }

  // 3) Optionally scan old mappings globally and attach per user
  if (!SIMPLE && FULL_OLD_MAPPING_SCAN && spamUsers.length) {
    if (SHOW_PROGRESS) console.error(`[stage] scanning old token direct mappings chat:token:* (this may take a while)...`);
    const oldByUser = await listOldMappingTokensForUsers(spamUserSet);
    for (const row of perUserResults) {
      row.tokens.oldMapping = oldByUser[row.username] || [];
    }
    if (SHOW_PROGRESS) console.error(`[stage] old token mapping scan complete.`);
  }

  // 4) Summaries
  let totalNew = 0,
    totalLegacy = 0,
    totalGrace = 0,
    totalOld = 0;
  for (const r of perUserResults) {
    totalNew += r.tokens.newScheme.length;
    totalLegacy += r.tokens.legacySingle ? 1 : 0;
    totalGrace += r.tokens.graceLast ? 1 : 0;
    totalOld += r.tokens.oldMapping.length;
  }

  // Build deletion buckets (including user objects)
  const deletionBuckets = (() => {
    const keysNew: string[] = [];
    const keysDirect: string[] = [];
    const keysLegacySingle: string[] = [];
    const keysGrace: string[] = [];
    const userKeys: string[] = [];
    const passwordKeys: string[] = [];

    for (const r of perUserResults) {
      userKeys.push(`${CHAT_USERS_PREFIX}${r.username}`);
      passwordKeys.push(`${PASSWORD_HASH_PREFIX}${r.username}`);

      for (const t of r.tokens.newScheme) {
        keysNew.push(t.key);
        // Also ensure we delete direct mapping for these tokens
        keysDirect.push(`${AUTH_TOKEN_PREFIX}${t.token}`);
      }
      for (const t of r.tokens.oldMapping) keysDirect.push(t.key);
      if (r.tokens.legacySingle?.key && INCLUDE_LEGACY_SINGLE_IN_DELETION) {
        keysLegacySingle.push(r.tokens.legacySingle.key);
      }
      if (r.tokens.graceLast?.key && INCLUDE_GRACE_IN_DELETION) {
        keysGrace.push(r.tokens.graceLast.key);
      }
    }

    // Deduplicate
    const dedupe = (arr: string[]) => Array.from(new Set(arr));
    return {
      newScheme: dedupe(keysNew),
      directMapping: dedupe(keysDirect),
      legacySingle: dedupe(keysLegacySingle),
      grace: dedupe(keysGrace),
      userKeys: dedupe(userKeys),
      passwordKeys: dedupe(passwordKeys),
    };
  })();

  // Also include any user-scoped token keys where the owner resolves to a spam username,
  // even if the middle segment after 'user:' is not the username.
  const alreadyNewSet = new Set(deletionBuckets.newScheme);
  const userScopedOther = SIMPLE
    ? []
    : await listAnyUserScopedKeysForSpamTokens(spamUserSet, alreadyNewSet);

  const plannedDeletionTotal =
    deletionBuckets.newScheme.length +
    deletionBuckets.directMapping.length +
    deletionBuckets.legacySingle.length +
    deletionBuckets.grace.length +
    deletionBuckets.userKeys.length +
    deletionBuckets.passwordKeys.length +
    userScopedOther.length;

  const report = {
    generatedAt: new Date().toISOString(),
    patterns: SPAM_USERNAME_PATTERNS,
    usersMatched: spamUsers.length,
    totals: {
      newScheme: totalNew,
      legacySingle: totalLegacy,
      graceLast: totalGrace,
      oldMapping: totalOld,
      allTokens: totalNew + totalLegacy + totalOld, // grace is metadata, not an active token
    },
    users: perUserResults,
    deletion: {
      includeGrace: INCLUDE_GRACE_IN_DELETION,
      includeLegacySingle: INCLUDE_LEGACY_SINGLE_IN_DELETION,
      counts: {
        newScheme: deletionBuckets.newScheme.length,
        directMapping: deletionBuckets.directMapping.length,
        legacySingle: deletionBuckets.legacySingle.length,
        grace: deletionBuckets.grace.length,
        userKeys: deletionBuckets.userKeys.length,
        passwordKeys: deletionBuckets.passwordKeys.length,
        userScopedOther: userScopedOther.length,
        total: plannedDeletionTotal,
      },
      keys: { ...deletionBuckets, userScopedOther },
    },
    deletionPlanHint: {
      // Hints for deletion keys (to be used manually if desired)
      description:
        "Delete user keys (chat:users:{username}), password keys (chat:password:{username}), newScheme keys (chat:token:user:{username}:{token}) and direct mapping keys (chat:token:{token}). Also delete any user-scoped keys chat:token:user:* whose token maps to a spam user. Optionally delete legacy single key (chat:token:{username}) and grace key chat:token:last:{username} if you want to prevent grace refresh.",
      examples: [
        "DEL chat:users:{username}",
        "DEL chat:password:{username}",
        "DEL chat:token:user:{username}:{token}",
        "DEL chat:token:user:{id}:{token}",
        "DEL chat:token:{token}",
        "DEL chat:token:{username}",
        "DEL chat:token:last:{username}",
      ],
    },
  } as const;

  // Print JSON
  console.log(JSON.stringify(report, null, 2));

  if (!spamUsers.length) return;

  // Interactive confirmation
  let proceed = AUTO_YES;
  if (!AUTO_YES) {
    const rl = createInterface({ input, output });
    const answer = (await rl.question(
      `\nDelete ${spamUsers.length} users and ${plannedDeletionTotal} keys now? Type 'yes' to proceed: `
    )).trim().toLowerCase();
    rl.close();
    proceed = answer === "y" || answer === "yes";
  }

  if (!proceed) {
    console.log("Aborted. No keys were deleted.");
    return;
  }

  // Execute deletions
  if (PER_USER_DELETE) {
    let processed = 0;
    for (const r of perUserResults) {
      const keys = collectUserDeletionKeys(r, INCLUDE_GRACE_IN_DELETION, INCLUDE_LEGACY_SINGLE_IN_DELETION, userScopedOther);

      // Delete in sub-batches for this user
      for (let i = 0; i < keys.length; i += PIPELINE_CHUNK) {
        const slice = keys.slice(i, i + PIPELINE_CHUNK);
        const pipe = redis.pipeline();
        for (const k of slice) pipe.del(k);
        try {
          await pipe.exec();
        } catch (e) {
          console.error(`[per-user] delete failed for ${r.username} at offset ${i}:`, e);
        }
      }

      processed++;
      if (SHOW_PROGRESS && processed % 50 === 0) console.error(`[per-user] deleted for ${processed}/${perUserResults.length}`);
    }
    console.log(`\nDone. Per-user deletions completed for ${perUserResults.length} users.`);
  } else if (CHUNKED_CONFIRM) {
    // Chunk by usernames and confirm per chunk
    let start = 0;
    let chunkIndex = 0;
    while (start < perUserResults.length) {
      const end = Math.min(start + CHUNK_SIZE, perUserResults.length);
      const chunk = perUserResults.slice(start, end);
      const usernames = chunk.map((r) => r.username);

      // Build deletion keys for this chunk
      const keys: string[] = [];
      for (const r of chunk) {
        keys.push(...collectUserDeletionKeys(r, INCLUDE_GRACE_IN_DELETION, INCLUDE_LEGACY_SINGLE_IN_DELETION, userScopedOther));
      }
      const deduped = Array.from(new Set(keys));

      // Show summary and ask confirm
      console.log(`\nChunk ${++chunkIndex} (${usernames.length} users: ${usernames.slice(0, 5).join(", ")}${usernames.length > 5 ? ", ..." : ""})`);
      console.log(`Planned deletions: ${deduped.length} keys for these users.`);
      let doChunk = AUTO_YES;
      if (!AUTO_YES) {
        const rl = createInterface({ input, output });
        const ans = (await rl.question("Proceed with deletion for this chunk? Type 'yes' to continue, 'skip' to skip, 'all' for all: ")).trim().toLowerCase();
        rl.close();
        if (ans === "all") {
          doChunk = true;
        } else if (ans === "yes" || ans === "y") {
          doChunk = true;
        } else if (ans === "skip" || ans === "s" || ans === "no" || ans === "n") {
          doChunk = false;
        } else {
          console.log("Aborted.");
          break;
        }
      }

      if (doChunk) {
        for (let i = 0; i < deduped.length; i += PIPELINE_CHUNK) {
          const slice = deduped.slice(i, i + PIPELINE_CHUNK);
          const pipe = redis.pipeline();
          for (const k of slice) pipe.del(k);
          try {
            await pipe.exec();
            if (SHOW_PROGRESS) console.error(`[chunk ${chunkIndex}] deleted ${Math.min(i + PIPELINE_CHUNK, deduped.length)}/${deduped.length}`);
          } catch (e) {
            console.error(`[chunk ${chunkIndex}] batch delete failed at offset ${i}:`, e);
          }
        }
      } else {
        console.log(`Skipped chunk ${chunkIndex}.`);
      }

      start = end;
    }
    console.log("\nDone. Chunked deletions complete.");
  } else {
    const allKeys: string[] = [
      ...deletionBuckets.userKeys,
      ...deletionBuckets.passwordKeys,
      ...deletionBuckets.newScheme,
      ...userScopedOther,
      ...deletionBuckets.directMapping,
      ...deletionBuckets.legacySingle,
      ...deletionBuckets.grace,
    ];

    let deletedAttempts = 0;
    for (let i = 0; i < allKeys.length; i += PIPELINE_CHUNK) {
      const slice = allKeys.slice(i, i + PIPELINE_CHUNK);
      const pipe = redis.pipeline();
      for (const k of slice) pipe.del(k);
      try {
        await pipe.exec();
        deletedAttempts += slice.length;
        console.log(`Deleted ~${deletedAttempts}/${allKeys.length} keys...`);
      } catch (e) {
        console.error(`Batch delete failed at offset ${i}:`, e);
      }
    }

    console.log(
      `\nDone. Attempted to delete ${allKeys.length} keys across ${spamUsers.length} users.`
    );
  }
}

main().catch((err) => {
  console.error("scan-spam-users failed:", err);
  process.exit(1);
});

