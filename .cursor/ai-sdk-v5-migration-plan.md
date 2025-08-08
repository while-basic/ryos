# AI SDK v5 Migration Plan (Repo: ryOS)

This plan upgrades your chat services from AI SDK v4 → v5 with minimal risk. It focuses on dependency updates, streaming changes, tool schema updates, and message type adjustments.

## 1) Dependencies
- Update versions:
  - `ai`: `5.0.0`
  - `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/anthropic`: `2.0.0`
  - `zod`: already OK (>= `3.25.0`)
- Commands (bun):
  - `bun remove ai @ai-sdk/openai @ai-sdk/google @ai-sdk/anthropic`
  - `bun add ai@5.0.0 @ai-sdk/openai@2.0.0 @ai-sdk/google@2.0.0 @ai-sdk/anthropic@2.0.0`
- Run codemods:
  - `npx @ai-sdk/codemod v5`

## 2) Server APIs: switch to UIMessage streams + v5 inputs

### api/chat.ts
- Replace `toDataStreamResponse()` with v5 UI streams:
  - Use `createUIMessageStream({ execute({ writer }) { ... } })`
  - Inside, call `streamText(...)`
  - `writer.merge(result.toUIMessageStream())`
  - Return `createUIMessageStreamResponse({ stream })`
- Rename options:
  - `maxTokens` → `maxOutputTokens`
  - remove `toolCallStreaming`
- Convert UI messages to model messages for the model call:
  - Wrap the messages passed to `streamText` with `convertToModelMessages([...])`
- Tools: rename definitions:
  - `parameters: z.object(...)` → `inputSchema: z.object(...)`
- Keep `providerOptions` naming (already v5-compliant).

### api/ie-generate.ts
- Imports/types:
  - Replace `type Message, CoreMessage` with `type UIMessage` (request shape) and `convertToModelMessages` for server call
- `streamText` invocation:
  - `messages: convertToModelMessages([{ role: 'system', content: systemPrompt }, ...messagesFromClient])`
- Rename options:
  - `maxTokens` → `maxOutputTokens`
- Replace `toDataStreamResponse()` with the same UI stream pattern as above.

## 3) Client hooks (React): adapt to UIMessage changes
- Files:
  - `src/apps/internet-explorer/hooks/useAiGeneration.ts`
  - `src/apps/chats/hooks/useAiChat.ts`
- `useChat` remains; its `Message` type is a v5 UI message (with `parts`).
- Tool-calls:
  - In `onToolCall`, rename `toolCall.args` → `toolCall.input`.
- Messages:
  - Prefer using `parts[]` (`{ type: 'text', text: '...' }`) over `content` going forward. Your UI already handles `parts` for assistant in several places; preserve that path and progressively migrate any `content` usage.

## 4) Chat UI components: tool parts + message shape
- File: `src/apps/chats/components/ChatMessages.tsx`
  - Use the v5 UI message type from `ai`.
  - Tool parts in v5 use typed names: `tool-${toolName}` and `dynamic-tool` instead of generic `tool-invocation`.
  - Update any assumptions that look for `.toolInvocation`, `.args`, `.result` to the v5 shapes if accessed directly. In general UI, read `part.type`, `part.input`, `part.output`.

## 5) Renames you’ll likely encounter during build
- `maxTokens` → `maxOutputTokens`
- Tool `parameters` → `inputSchema`
- Tool call fields: `args` → `input`, `result` → `output`
- Types: `CoreMessage` → `ModelMessage` (use `convertToModelMessages` at server boundary)

## 6) Test plan
- `bun run build`
- Exercise endpoints:
  - `/api/chat` (tool calling, normal chat)
  - `/api/ie-generate` (streaming HTML generation)
- Verify:
  - Tool UI parts render (typed `tool-...` names and `dynamic-tool` supported)
  - Streaming works end-to-end
  - No lingering `toolCallStreaming`
  - Auth / rate-limit logic unchanged
  - If tool parts don’t render, log assistant `parts` to align the UI renderer.

## 7) Phased rollout suggestion
1. Dependencies + codemods; compile; apply easy renames (tokens/options/tools).
2. Server streaming migration (DataStream → UIMessage stream).
3. Tool UI parts migration to v5 typed names.
4. Replace remaining `content` usage with `parts` where feasible.
