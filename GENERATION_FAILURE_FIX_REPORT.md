# Generation Failure Fix Report

This patch focuses only on content-generation reliability for website, graphics, logo, strategy, calendar and business/content generation.

## Main failure causes found

1. Several routes used hardcoded Claude model IDs such as `claude-sonnet-4-6`. If the provider rejects that model ID, the API key can be correct but generation still fails.
2. Strategy, calendar, business and website-template planning used direct `JSON.parse()`. If the AI returned fenced JSON, leading text, or partially wrapped JSON, the whole generation failed.
3. Logo generation used one OpenAI image payload shape. Some OpenAI accounts/models reject `quality`, `output_format`, or `response_format`, causing failure even when the key is valid.
4. The generate page catch block hid real server errors behind `Generation failed. Please try again.`, making debugging impossible.
5. Logo generation created a generation record but did not return `generationId` to the frontend.

## Fixes added

- Added `src/lib/ai/anthropic-fallback.ts` for Anthropic model fallback attempts.
- Added `src/lib/ai/safe-json.ts` to recover JSON from AI responses safely.
- Updated website template planning to use model fallback + safe JSON parsing.
- Updated strategy/calendar generation to use model fallback + fallback business-safe output if JSON parsing fails.
- Updated business generation to use model fallback + safe output fallback.
- Updated personal generation core to use model fallback + safe JSON fallback.
- Updated graphics Creative Director parsing to use safe JSON and show real server error messages.
- Updated logo generation with multiple OpenAI image payload/model attempts: configured model, gpt-image-1, DALL·E 3, DALL·E 2 compatibility.
- Logo route now returns `generationId` so the frontend can attach the generated asset properly.
- Generate page now shows actual server error messages instead of a generic failure.

## Required env vars

For websites, strategy, calendar, content/business generation:

```env
ANTHROPIC_API_KEY=...
```

For logo images and OpenAI Creative Director for posters:

```env
OPENAI_API_KEY=...
```

For real stock-photo posters:

```env
PEXELS_API_KEY=...
UNSPLASH_ACCESS_KEY=...
```

If Pexels/Unsplash are missing, brand images now still try to render a safe text-only poster instead of failing.
