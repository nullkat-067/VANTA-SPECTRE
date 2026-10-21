# Library decision log

Research date: 2026-10-19

## Decision

Baileys was selected for VANTA SPECTRE. It communicates through the WhatsApp Web WebSocket protocol without browser overhead, making it more practical for Debian inside Termux than `whatsapp-web.js`, which relies on Puppeteer and Chromium.

The implementation uses:

- `useMultiFileAuthState()` to persist the linked-device session.
- `onWhatsApp()` to check whether a target number is registered.
- `profilePictureUrl()` to request a profile-picture URL; WhatsApp may deny access based on privacy settings.
- `sendMessage()` with `{ image: { url } }` to send the media to the configured recipient.

## Important findings

Baileys requires Node.js 20 or newer. Pairing-code linking is available from the terminal. Baileys media documentation supports image uploads from a URL, buffer, or stream. This project does not require Chromium, Puppeteer, a GUI, `ffmpeg`, or additional native modules.

Sending a profile picture does not guarantee that the recipient has seen or read it. The program prints success only after the `sendMessage()` promise completes without an exception, which means the WhatsApp connection accepted the relay operation.

## Sources

1. [Baileys installation](https://baileys.wiki/installation) — Node.js 20+, installation, and optional peer dependencies.
2. [Baileys README](https://github.com/WhiskeySockets/Baileys/blob/master/README.md) — WebSocket transport, pairing, authentication state, and connection events.
3. [Baileys media messages](https://baileys.wiki/messaging/media-messages) — image uploads from URLs, buffers, and streams.
4. [Baileys TypeScript declarations](https://unpkg.com/@whiskeysockets/baileys@6.7.7/lib/Socket/messages-send.d.ts) — the `profilePictureUrl`, `onWhatsApp`, and `sendMessage` APIs.
5. [whatsapp-web.js documentation](https://docs.wwebjs.dev/) — comparison reference for profile pictures and media through Puppeteer.
6. [whatsapp-web.js Termux issue](https://github.com/wwebjs/whatsapp-web.js/issues/2419) — the Android platform limitation reported by Puppeteer and the external-browser workaround.
