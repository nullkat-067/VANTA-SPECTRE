#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  Browsers,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

const ROOT        = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(ROOT, 'config.json');
const AUTH_PATH   = path.join(ROOT, 'auth_info');
const baileysLog  = pino({ level: 'silent' });

// ─── COLORS ───────────────────────────────────────────────────────────────────
const R  = s => `\x1b[38;5;160m${s}\x1b[0m`;   // red
const DR = s => `\x1b[38;5;88m${s}\x1b[0m`;    // dark red
const G  = s => `\x1b[38;5;71m${s}\x1b[0m`;    // green
const GR = s => `\x1b[38;5;245m${s}\x1b[0m`;   // grey
const W  = s => `\x1b[38;5;255m${s}\x1b[0m`;   // white
const DM = s => `\x1b[2m${s}\x1b[0m`;          // dim
const BD = s => `\x1b[1m${s}\x1b[0m`;          // bold
const CL = '\x1b[2K\r';
const RAIN = ['0', '1', '0', '1', '7', 'A', 'F', 'x', '>', '/', ':', '░', '▓'];
const NULLKAT_COLORS = [196, 202, 208, 214, 220, 46, 51, 45, 39, 93, 129, 165];
const rainbow = (text, offset = 0) => [...text].map((char, i) => `\x1b[38;5;${NULLKAT_COLORS[(i + offset) % NULLKAT_COLORS.length]}m${char}`).join('') + '\x1b[0m';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const now   = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
const stamp = () => GR(now());
const out   = s => process.stdout.write(s);
const ln    = (s = '') => out(s + '\n');

// ─── BOOT ANIMATION ───────────────────────────────────────────────────────────
async function hackerRain() {
  const width = Math.max(42, Math.min(process.stdout.columns || 72, 86));
  const rows = 8;
  for (let row = 0; row < rows; row++) {
    let stream = '';
    for (let col = 0; col < width; col++) {
      const char = RAIN[Math.floor(Math.random() * RAIN.length)];
      const bright = Math.random() > 0.72;
      stream += bright ? `\x1b[38;5;${Math.random() > 0.55 ? 196 : 202}m${char}` : `\x1b[38;5;88m${char}`;
    }
    ln(`  ${stream}\x1b[0m`);
    await sleep(55);
  }
  await sleep(280);
  process.stdout.write('\x1b[2J\x1b[H');
}

function randomStep() {
  const steps = [1, 1, 1, 2, 2, 2, 5, 5, 5, 10];
  return steps[Math.floor(Math.random() * steps.length)];
}

function progressBar(pct, width = 28) {
  const filled = Math.round((pct / 100) * width);
  return R('▓'.repeat(filled)) + DR('░'.repeat(width - filled));
}

async function slowRandomProgress(label) {
  const started = Date.now();
  let pct = 0;
  while (pct < 100) {
    pct = Math.min(100, pct + randomStep());
    out(`${CL}  ${GR('[')}${progressBar(pct)}${GR(']')} ${W(String(pct).padStart(3) + '%')}  ${DM(label)}`);
    await sleep(120 + Math.floor(Math.random() * 150));
  }
  const remaining = 2200 - (Date.now() - started);
  if (remaining > 0) await sleep(remaining);
  out(`${CL}  ${GR('[')}${progressBar(100)}${GR(']')} ${W('100%')}  ${G(label)}`);
  ln();
}

async function bootSequence() {
  await hackerRain();

  // ASCII art logo — VANTA SPECTRE
  ln();
  ln(`  ${R('██╗   ██╗ █████╗ ███╗   ██╗████████╗ █████╗ ')}`);
  ln(`  ${R('██║   ██║██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗')}`);
  ln(`  ${R('██║   ██║███████║██╔██╗ ██║   ██║   ███████║')}`);
  ln(`  ${R('╚██╗ ██╔╝██╔══██║██║╚██╗██║   ██║   ██╔══██║')}`);
  ln(`  ${R(' ╚████╔╝ ██║  ██║██║ ╚████║   ██║   ██║  ██║')}`);
  ln(`  ${R('  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝')}`);
  ln();
  ln(`  ${DR('·')}  ${W('S  P  E  C  T  R  E')}  ${DR('·')}  ${DM('profile relay system')}`);
  ln(`  ${DM('made by:')}  ${rainbow('NullKat', Math.floor(Date.now() / 120))}`);
  ln(`  ${GR('─────────────────────────────────────────────────')}`);
  ln();

  await slowRandomProgress('initializing VANTA SPECTRE core');
  ln(`  ${G('✓')} ${W('SYSTEM READY')}  ${DM('boot sequence complete')}`);
  ln(`  ${G('✓')} ${W('CORE ONLINE')}   ${DM('secure channel prepared')}`);
  ln(`  ${G('✓')} ${W('SPECTRE ARMED')}  ${DM('awaiting target input')}`);
  ln();
}

// ─── BANNER (after boot, keeps logo visible) ──────────────────────────────────
function banner() {
  console.clear();
  ln();
  ln(`  ${R('██╗   ██╗ █████╗ ███╗   ██╗████████╗ █████╗ ')}`);
  ln(`  ${R('██║   ██║██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗')}`);
  ln(`  ${R('██║   ██║███████║██╔██╗ ██║   ██║   ███████║')}`);
  ln(`  ${R('╚██╗ ██╔╝██╔══██║██║╚██╗██║   ██║   ██╔══██║')}`);
  ln(`  ${R(' ╚████╔╝ ██║  ██║██║ ╚████║   ██║   ██║  ██║')}`);
  ln(`  ${R('  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝')}`);
  ln();
  ln(`  ${DR('·')}  ${W('S  P  E  C  T  R  E')}  ${DR('·')}  ${DM('profile relay system')}`);
  ln(`  ${DM('made by:')}  ${rainbow('NullKat', Math.floor(Date.now() / 120))}`);
  ln(`  ${GR('─────────────────────────────────────────────────')}`);
  ln();
}

// ─── LOGGING ──────────────────────────────────────────────────────────────────
function status(msg, level = 'INFO') {
  const tag = level === 'OK'  ? G(`[OK ]`) :
              level === 'ERR' ? R(`[ERR]`) :
                                DR(`[···]`);
  ln(`  ${stamp()}  ${tag}  ${msg}`);
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
async function spin(msg, action) {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  const t = setInterval(() => {
    out(`${CL}  ${stamp()}  ${R(frames[i++ % frames.length])}  ${DM(msg)}`);
  }, 80);
  try {
    const r = await action(); clearInterval(t); out(CL); return r;
  } catch (e) {
    clearInterval(t); out(CL); throw e;
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function digitsOnly(v) { return v.trim().replace(/[\s()+-]/g, ''); }
function validateNumber(v, label) {
  let n = digitsOnly(v);
  if (n.startsWith('0')) n = `62${n.slice(1)}`;
  if (!/^\d{8,15}$/.test(n)) throw new Error(`${label}: use 8-15 digits in international format.`);
  return n;
}

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    const cfg = JSON.parse(raw);
    return { ...cfg, recipient: validateNumber(cfg.recipient, 'recipient') };
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error('config.json is missing. Create it with a "recipient" field.');
    if (e instanceof SyntaxError) throw new Error('config.json is invalid.');
    throw e;
  }
}

// ─── CLI: node index.js add <number> ──────────────────────────────────────────
async function handleCLI() {
  const [,, cmd, arg] = process.argv;
  if (cmd !== 'add') return false;
  if (!arg) { ln(R('  Usage: node index.js add <number>')); process.exit(1); }
  let number;
  try { number = validateNumber(arg, 'number'); } catch (e) { ln(R(`  ${e.message}`)); process.exit(1); }
  let cfg = {};
  try { cfg = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8')); } catch {}
  cfg.recipient = number;
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n');
  banner();
  status(`recipient updated → ${W(number)}`, 'OK');
  ln();
  return true;
}

// ─── CONNECTION ───────────────────────────────────────────────────────────────
let sock = null, connState = 'OFFLINE', pairingWaiter = null;
let reconnTimer = null, shuttingDown = false;

function waitForConnection(ms = 120000) {
  return new Promise(resolve => {
    const t = setTimeout(() => { pairingWaiter = null; resolve('TIMEOUT'); }, ms);
    pairingWaiter = r => { clearTimeout(t); pairingWaiter = null; resolve(r); };
  });
}

async function startConnection(phone) {
  if (connState === 'ONLINE' || connState === 'CONNECTING') return;
  if (reconnTimer) { clearTimeout(reconnTimer); reconnTimer = null; }
  if (sock) { try { sock.ev.removeAllListeners(); sock.end(undefined); } catch {} sock = null; }
  connState = 'CONNECTING';

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  const s = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, baileysLog) },
    logger: baileysLog,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });
  sock = s;

  let codeRequested = false;
  const requestCode = async () => {
    if (codeRequested || !phone || s.authState.creds.registered) return;
    codeRequested = true;
    for (let a = 1; a <= 3; a++) {
      try {
        await sleep(a === 1 ? 500 : 2000);
        const raw  = await s.requestPairingCode(phone);
        const code = raw.match(/.{1,4}/g)?.join('-') || raw;
        ln();
        ln(`  ${GR('─────────────────────────────────────────────────')}`);
        ln(`  ${DR('·')}  ${W('PAIRING CODE')}  ${DR('·')}`);
        ln();
        ln(`       ${BD(R(code))}`);
        ln();
        ln(`  ${DM('WhatsApp › Linked devices › Link with phone number')}`);
        ln(`  ${GR('─────────────────────────────────────────────────')}`);
        ln();
        return;
      } catch (e) {
        status(`pairing attempt ${a}/3: ${e.message}`, 'ERR');
      }
    }
    connState = 'PAIRING_FAILED';
    status('pairing failed three times. Delete auth_info/ and try again.', 'ERR');
    pairingWaiter?.('FAILED');
  };

  s.ev.on('creds.update', saveCreds);
  s.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
    if (s !== sock) return;
    if (qr) requestCode();
    if (connection === 'open') {
      connState = 'ONLINE';
      status('session linked', 'OK');
      pairingWaiter?.('ONLINE');
    }
    if (connection === 'close' && !shuttingDown) {
      const code      = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut || code === 401;
      const restart   = code === DisconnectReason.restartRequired;
      connState = 'OFFLINE';
      if (loggedOut) {
        await fs.rm(AUTH_PATH, { recursive: true, force: true });
        status('session logged out. auth_info/ was removed. Run the program again.', 'ERR');
        pairingWaiter?.('FAILED'); return;
      }
      if (!s.authState.creds.registered && !restart) {
        status('connection closed before pairing completed.', 'ERR');
        pairingWaiter?.('FAILED'); return;
      }
      if (!reconnTimer) {
        reconnTimer = setTimeout(() => {
          reconnTimer = null;
          startConnection(phone).catch(e => status(e.message, 'ERR'));
        }, 3000);
      }
    }
  });

  if (phone && !s.authState.creds.registered) setTimeout(requestCode, 3000);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  if (await handleCLI()) return;

  await bootSequence();
  banner();

  const config = await loadConfig();
  status(`recipient  ${GR('→')}  ${W(config.recipient)}`);
  ln();

  const rl = readline.createInterface({ input, output });
  try {
    // Check for an existing session and connect directly when available.
    let phone;
    try {
      await fs.access(path.join(AUTH_PATH, 'creds.json'));
      status('existing session found, connecting...');
    } catch {
      const raw = await rl.question(`  ${R('▸')} ${W('linking number')}  ${GR('(international digits)')}  ${R('›')} `);
      phone = validateNumber(raw, 'number');
    }
    ln();

    await startConnection(phone);
    const result = await waitForConnection();
    if (result !== 'ONLINE') throw new Error(`connection failed (${result}). Delete auth_info/ and try again.`);
    ln();

    const recipientJid = `${config.recipient}@s.whatsapp.net`;

    while (true) {
      ln(`  ${R('>>')} ${W('VANTA SPECTRE')} ${DM('— see the unseen. relay the signal.')}`);
      const rawTarget = await rl.question(`  ${R('▸')} ${W('target number')}  ${GR('(or "exit")')}  ${R('›')} `);
      if (rawTarget.trim().toLowerCase() === 'exit') { ln(); status('terminated.'); break; }

      let target;
      try { target = validateNumber(rawTarget, 'target'); }
      catch (e) { status(e.message, 'ERR'); continue; }

      const jid = `${target}@s.whatsapp.net`;
      ln();

      try {
        const reg = await spin('verifying registration', () => sock.onWhatsApp(jid));
        if (!reg?.[0]?.exists) { status('number is not registered on WhatsApp.', 'ERR'); ln(); continue; }

        let url;
        try {
          url = await spin('acquiring profile picture', () => sock.profilePictureUrl(jid, 'image'));
        } catch (e) {
          const priv = e?.output?.statusCode === 404 || /not-authorized|privacy|404/i.test(e?.message || '');
          status(priv ? 'profile picture is protected by the target privacy settings.' : e.message, 'ERR'); ln(); continue;
        }

        if (!url) { status('profile picture is unavailable.', 'ERR'); ln(); continue; }

        await spin('relaying to recipient', () =>
          sock.sendMessage(recipientJid, {
            image: { url },
            caption: `VANTA SPECTRE // relay // ${target}`,
          }),
        );

        status(`delivered  ${GR('→')}  ${W(config.recipient)}`, 'OK');
      } catch (e) {
        status(e.message, 'ERR');
      }
      ln();
    }
  } finally {
    rl.close();
    shuttingDown = true;
    if (reconnTimer) clearTimeout(reconnTimer);
    try { sock?.end(undefined); } catch {}
  }
}

main().catch(e => {
  out(CL);
  ln(`  ${R('[ERR]')}  ${e.message || 'operation failed.'}`);
  process.exitCode = 1;
});
