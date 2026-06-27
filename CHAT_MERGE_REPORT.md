# Brand Chat Merge Report

## What was added

- Added a new **Chat** chip to the existing homepage chip selector.
- Added a full chat studio inside `/generate` when the user opens `?chip=chat`.
- Added user-visible chat history, per-thread costs, token counts and local-vs-external indicator.
- Added backend chat APIs:
  - `GET /api/chat/threads`
  - `POST /api/chat/threads`
  - `GET /api/chat/threads/[threadId]`
  - `POST /api/chat/messages`
- Added Prisma models:
  - `ChatThread`
  - `ChatMessage`
- Added migration:
  - `20260616000000_brand_chat_history_costs`
- Added local intelligence routing:
  - `src/lib/chat/local-intelligence.ts`

## Cost behavior

The chat first tries local Brand Syndicate intelligence. If confidence is high, it replies without calling Claude/OpenAI, so API cost is ₹0 for that reply.

It uses external AI only when:

- the local confidence is low,
- the user asks for creative output,
- the user asks for specific strategy/copy/planning,
- the user asks something uncertain or complex.

External API usage is stored in both `chat_messages` and `api_call_logs`.

## Social automation removal

Removed/hid social automation entry points:

- Removed `/social` app directory.
- Removed `/admin/social` app directory.
- Removed `/api/social` API directory.
- Removed `src/lib/social`.
- Removed social automation nav links.
- Removed social worker npm script.
- Replaced My Work “Social” action with “Ask AI”.

Note: `SocialLinks` profile/contact link functionality remains because it is not automation.

## Required env vars

At least one of these is required for external chat replies:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

Optional:

- `CHAT_MODEL`
- `OPENAI_CHAT_MODEL`

Without keys, chat still works using local intelligence and tells the user that deeper external AI is not configured.


## Customer-facing privacy update

The chat UI no longer shows token counts, API provider names, external-AI labels, or rupee costs to users. Those values remain stored internally in `chat_messages` and `api_call_logs` for admin/cost monitoring.

## Sidebar timing

For a new user with no chat history, the chat starts as a clean full-width chat canvas. The sidebar with chat history and the New Chat button appears after the first chat exists. If the user already has previous chats, the sidebar appears immediately after history loads.
