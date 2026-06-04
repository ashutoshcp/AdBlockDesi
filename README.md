# AdBlockDesi

A simple Chrome extension scaffold that attempts to skip video ads automatically while videos are playing.

## Files

- `manifest.json`: Chrome extension manifest.
- `content.js`: Content script that detects common video ad skip buttons and fast-forwards ad video elements.

## Installation

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode` in the top-right.
3. Click `Load unpacked`.
4. Select this repository folder (`AdBlockDesi`).

## How it works

- Clicks common "Skip ad" and "Close ad" buttons on supported video players.
- Includes improved YouTube ad detection and auto-skip handling.
- Includes generic OTT/platform ad overlay detection and fast-forwarding for most HTML5 video ads.
- Hides common ad overlay containers and observes page changes to react when new ads appear.

## Notes

- This extension is a simple starting point and may not skip all video ads on every site.
- Some video platforms may load ads in ways that cannot be skipped reliably via a content script alone.
