# Product specification

## Product idea

Momentum Focus Dashboard replaces Chrome's default new-tab page with a calm workspace that helps the user decide what matters, start a focused work session, and capture tasks without opening another app.

## Target user

A student or knowledge worker who opens many browser tabs and wants a lightweight, visually calm productivity dashboard with no account setup.

## Product principles

1. **Useful in two seconds:** the time, daily focus, and next tasks are immediately visible.
2. **Calm rather than crowded:** one central action and two supporting panels.
3. **Local first:** personal content stays in Chrome's local extension storage.
4. **Works without setup:** all imagery and functionality are bundled in the extension.

## Scope: five features

| # | Feature | User value |
| --- | --- | --- |
| 1 | Clock, greeting, daily focus | Gives immediate context and one clear priority |
| 2 | Rotating backgrounds | Makes the new tab feel calm and personal |
| 3 | Focus timer | Supports 25-minute focus, 5-minute break, and 15-minute reset sessions |
| 4 | Google search | Keeps the default new-tab page's core utility |
| 5 | Tasks and notes | Captures small commitments and thoughts without another tool |

## Acceptance criteria

- [ ] Opening a new Chrome tab displays the dashboard instead of the default new-tab page.
- [ ] The time updates automatically and the greeting matches the time of day.
- [ ] A daily focus can be saved and remains after Chrome is reopened.
- [ ] The background changes every 30 seconds without reloading the page.
- [ ] The user can manually change the background and pause or resume rotation.
- [ ] The timer supports 25, 5, and 15 minute presets, plus start, pause, and reset.
- [ ] A running timer continues after the user changes tabs or closes the new-tab page.
- [ ] Chrome displays a notification when a focus session ends.
- [ ] Submitting a search opens Google results for the entered query.
- [ ] Tasks can be added, completed, deleted, and cleared.
- [ ] Tasks and notes remain after Chrome is closed and reopened.
- [ ] The page remains usable on a narrow browser window and with keyboard navigation.
- [ ] No personal data is sent to an external server.

## Out of scope for v1

- Spotify authentication or playback
- Cloud sync across different Chrome profiles
- Calendar integration
- User accounts or analytics

These are deliberately excluded to keep the first version secure, testable, and ready to demonstrate.
