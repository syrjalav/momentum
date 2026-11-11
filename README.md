# Momentum Focus Dashboard

A calm, privacy-friendly Chrome new-tab extension for focused work. It combines a live clock and greeting, daily focus, Google search, a persistent focus timer, tasks, notes, and four rotating illustrated landscapes.

![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-43dca7)
![No build step](https://img.shields.io/badge/build-none-173837)

## Features

- **Clock, greeting, and daily focus** that adapt to local time
- **Focus timer** with 25, 5, and 15 minute presets; it continues in the background and sends a completion notification
- **Google search** from the centre of the dashboard
- **Tasks and notes** saved locally with `chrome.storage.local`
- **Rotating backgrounds** that change every 30 seconds, with manual and pause controls
- **Responsive and accessible UI** with keyboard-friendly controls and reduced-motion support
- **Private by design**: no account, analytics, server, API key, or remote asset is used

## Install locally

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose this repository folder.
6. Open a new tab.

After changing the code, use the reload button on the extension card in `chrome://extensions`.

## Project structure

| File | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 configuration and new-tab override |
| `newtab.html` | Semantic dashboard markup |
| `newtab.css` | Responsive glassmorphism interface |
| `newtab.js` | Clock, search, tasks, notes, focus, and backgrounds |
| `background.js` | Persistent focus timer, alarms, and notification |
| `images.js` | Bundled background and quote catalogue |
| `PRODUCT_SPEC.md` | Scope and acceptance criteria |
| `PRIVACY.md` | Plain-language data handling summary |

## Test

The extension has no dependencies or build step. Run the structural smoke tests with:

```bash
npm test
```

## Version history

- **v1.0.0** — complete first release with all five planned features

Built for the Applied Programming & AI Fundamentals course.
