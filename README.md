# VANTA SPECTRE

**NullKat / terminal-first WhatsApp profile relay**

VANTA SPECTRE is a Node.js CLI for Debian running inside Termux. It asks for a target number, requests the target's profile picture only when WhatsApp privacy settings allow access, and sends the image to the `recipient` configured in `config.json`.

At startup, the CLI shows a short hacker-rain animation, the VANTA SPECTRE banner, a color-shifting `made by: NullKat` credit, and one progress bar with random 1%, 2%, 5%, or 10% increments. The progress lasts about two seconds, then shows `SYSTEM READY`, `CORE ONLINE`, and `SPECTRE ARMED` before the target prompt.

## Why Baileys

This project uses `@whiskeysockets/baileys` instead of `whatsapp-web.js`. Baileys uses the WhatsApp Web WebSocket protocol and does not require Chromium, Puppeteer, a GUI, or desktop-only binaries. That makes it a more practical fit for Debian inside Termux. It is an unofficial library, and its use may violate WhatsApp's terms or cause an account restriction.

The implementation uses `onWhatsApp()` to check registration, `profilePictureUrl()` to request a profile picture URL subject to privacy settings, and `sendMessage()` to send the image. It does not send a message to the target number.

## Requirements

- Termux with Debian installed through `proot-distro`.
- Node.js 20 or newer.
- A WhatsApp account that can be linked as a companion device.
- An internet connection.

Inside Debian on Termux:

```bash
apt update
apt install -y nodejs npm ca-certificates
node --version   # must be v20 or newer
```

If the Debian package is too old, install Node.js 20+ with `nvm` inside Debian. Run the project from the Debian shell, not directly from the Android Termux shell.

## Installation

```bash
mkdir -p ~/VANTA-SPECTRE
cd ~/VANTA-SPECTRE
# copy the project source into this directory
npm install
cp config.example.json config.json
nano config.json
```

Set `config.json` to the recipient's international number using digits only, without `+`, spaces, or hyphens:

```json
{
  "recipient": "628xxxxxxxxxx"
}
```

## Running

```bash
node index.js
```

On the first run, VANTA SPECTRE asks for the WhatsApp number of the account being linked and displays a pairing code in the terminal. This is the account number, not the target number. On the primary phone, open **Settings > Linked devices > Link with phone number**, enter the number if requested, and then enter the pairing code shown in the terminal. The session is stored in `auth_info/`, so future runs do not need pairing while the session remains valid.

After `LINKED` appears, enter a target number such as `628123456789`. The target does not receive a message. If the number is registered and its profile picture is accessible, VANTA SPECTRE sends the image to the configured `recipient`.

You can also update the configured recipient from the CLI:

```bash
node index.js add 628123456789
```

## Status and limitations

`[SUCCESS]` is printed only after the `sendMessage()` promise completes without an error. This means Baileys accepted the relay operation through the WhatsApp connection. It does not guarantee that the recipient has opened or read the image, so the tool does not claim delivered or read status.

A profile picture may be unavailable because the number is not registered, no picture exists, or the owner’s privacy settings restrict access. In that case, the program stops without sending anything.

Baileys and WhatsApp Web can change without notice. Baileys is unofficial and is not affiliated with WhatsApp. Use this project only with accounts and numbers you are authorized to handle. Do not use it for bulk scraping, spam, or monitoring without permission.

## Structure

```text
VANTA-SPECTRE/
├── index.js
├── package.json
├── config.example.json
├── config.json          # local, created by the user, never committed
├── auth_info/           # local session credentials, never committed
└── README.md
```
