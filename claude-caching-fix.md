# Claude Sonnet Caching Issue - Fixed

## Problem Summary
Your AI prompts weren't getting cached because the cache control headers were only applied to the dynamic system state messages, not the static prompts that contain all your persona instructions, answer style, and other rarely-changing content.

## What Was Happening
1. **Static prompts** (from `aiPrompts.ts`) were passed via the `system` parameter without cache control
2. **Dynamic prompts** (system state) had `cacheControl: { type: "ephemeral" }` applied
3. Claude was reprocessing ~3000+ tokens of static instructions on every request

## The Fix
Modified `api/chat.ts` to:
1. Create a `staticSystemMessage` object with proper cache control headers
2. Include it in the `enrichedMessages` array instead of using the `system` parameter
3. Both static and dynamic messages now have appropriate cache control

## Benefits
- **Reduced latency**: Static prompts are cached and reused
- **Lower costs**: Fewer tokens processed per request
- **Better performance**: Faster response times for users

## Additional Recommendations

### 1. Consider Longer Cache Duration
Currently using `ephemeral` cache type. For static prompts that rarely change, consider using a longer cache duration:

```typescript
providerOptions: {
  anthropic: { 
    cacheControl: { 
      type: "ephemeral" // Consider "auto" or specific TTL
    } 
  },
}
```

### 2. Monitor Cache Hit Rates
Add logging to track when caches are being used:
- Check Anthropic's response headers for cache hit information
- Monitor token usage before/after to verify caching is working

### 3. Separate Truly Static vs Semi-Dynamic Content
Consider splitting prompts into three categories:
- **Truly static**: Persona, answer style (cache aggressively)
- **Semi-dynamic**: Tool instructions (cache moderately)
- **Dynamic**: System state (cache briefly or not at all)

### 4. Version Your Prompts
When you update prompts, consider adding a version identifier to bust the cache:
```typescript
const PROMPT_VERSION = "v1.2";
const staticSystemPrompt = `${PROMPT_VERSION}\n${prompts.join("\n")}`;
```

## Verification
To verify caching is working:
1. Make multiple requests with the same user
2. Check response times - cached requests should be faster
3. Monitor your Anthropic API usage dashboard for reduced token consumption