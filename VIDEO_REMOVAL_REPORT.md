# Brand Syndicate — No Video Build

Video generation has been removed from this app copy.

## Removed active video pipeline
- `src/lib/video/`
- `src/app/api/generate-video/`
- `src/app/api/rerender-video/`
- `src/app/api/admin/rerender-videos/`

## Removed user-facing video elements
- Homepage `Generate Video` chip
- Homepage video options: ratio, resolution, duration
- Generate page video chip and video options
- Generate page video generation request to `/api/generate-video`
- Generate page video preview component
- My Work video detection and video preview card

## Removed admin video elements
- Admin video tab
- Admin video stats references
- Admin video re-render panel
- Admin recent video generation table references
- Admin history video preview/download references

## Removed deployment video dependency
- Removed FFmpeg install command from `render.yaml` build command because the no-video app does not need server-side video rendering.

## Validation performed
- Searched the cleaned app for active video route/library/UI keywords. No active references to `generate-video`, `rerender-video`, `src/lib/video`, `Generate Video`, `videoStats`, `videoUrl`, `ffmpeg`, or Seedance remain.
- Ran `npx tsc --noEmit --pretty false`. It progressed past syntax checks; remaining output was dependency/type resolution because `node_modules` is not included in the uploaded zip/sandbox.
