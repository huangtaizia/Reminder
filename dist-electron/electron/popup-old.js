"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showReminderPopup = showReminderPopup;
const electron_1 = require("electron");
const isDev = !process.mainModule?.filename.includes('app.asar');
let popups = [];
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function wrapToTwoLines(message) {
    const text = message.replace(/\s+/g, ' ').trim();
    if (!text)
        return { line1: '', truncated: false };
    const maxCharsPerLine = 26;
    if (text.length <= maxCharsPerLine)
        return { line1: text, truncated: false };
    const cutAtSpaceBefore = (s, idx) => {
        const sub = s.slice(0, idx);
        const lastSpace = sub.lastIndexOf(' ');
        return lastSpace > 0 ? lastSpace : idx;
    };
    const i1 = cutAtSpaceBefore(text, maxCharsPerLine + 1);
    const line1 = text.slice(0, i1).trim();
    const rest = text.slice(i1).trim();
    if (rest.length <= maxCharsPerLine)
        return { line1, line2: rest, truncated: false };
    const i2 = cutAtSpaceBefore(rest, maxCharsPerLine + 1);
    const line2 = rest.slice(0, i2).trim();
    const truncated = rest.slice(i2).trim().length > 0;
    return { line1, line2, truncated };
}
function dataUrlForReminder(reminder) {
    const { color, icon, message, displayMs } = reminder.config;
    const { line1, line2, truncated } = wrapToTwoLines(message);
    const safe = (s) => s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    const msgColor = color;
    const halo = color;
    const cfg = {
        displayMs: clamp(displayMs, 60_000, 24 * 60 * 60_000),
        startAt: Date.now(),
    };
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder</title>
  <style>
    :root{
      --bg: rgba(0,0,0,0.45);
      --card: #0a1424;
      --stroke: rgba(255,255,255,0.10);
      --text: #e7eefc;
      --muted: rgba(231,238,252,0.65);
      --accent: ${safe(color)};
    }
    html, body { height:100%; margin:0; }
    body{
      background: var(--bg);
      font-family: "Segoe UI Variable", "Segoe UI", Roboto, Arial, "Noto Sans", "Liberation Sans",system-ui, sans-serif;
      color: var(--text);
      display:flex;
      align-items:center;
      justify-content:center;
    }
    @keyframes haloPulse {
      0%   { opacity: 0.35; transform: scale(0.96); filter: blur(26px); }
      50%  { opacity: 0.95; transform: scale(1.03); filter: blur(18px); }
      100% { opacity: 0.35; transform: scale(0.96); filter: blur(26px); }
    }
    .card{
      width: 680px;
      border-radius: 18px;
      background: var(--card);
      border: 1px solid var(--stroke);
      box-shadow: 0 40px 90px rgba(0,0,0,0.60);
      position: relative;
      overflow:hidden;
    }
    .close{
      position:absolute;
      top: 14px;
      right: 14px;
      width: 36px;
      height: 36px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.06);
      color: var(--text);
      display:flex;
      align-items:center;
      justify-content:space-around;
      padding: 0;
      cursor:pointer;
      user-select:none;
      font-size: 20px;
      line-height: 1;
      font-weight:400;
    }
    .close:hover{ background: rgba(255,255,255,0.10); }
    .content{
      padding: 54px 44px 36px;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap: 14px;
    }
    .iconWrap{
      width: 110px;
      height: 110px;
      border-radius: 22px;
      display:grid;
      place-items:center;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      position: relative;
      isolation: isolate;
    }
    .iconWrap::before{
      content:"";
      position:absolute;
      inset: -26px;
      background: radial-gradient(circle at 50% 50%, ${safe(halo)}cc 0%, ${safe(halo)}22 45%, transparent 70%);
      opacity: 0.8;
      z-index: -1;
      animation: haloPulse 1.4s ease-in-out infinite;
    }
    .icon{
      font-size: 42px;
      filter: drop-shadow(0 0 12px ${safe(halo)}55);
    }
    .msg{
      text-align:center;
      font-weight: 600;
      letter-spacing: 0.2px;
      color: ${safe(msgColor)};
      font-size: 34px;
      line-height: 1.2;
      max-width: 90%;
      min-height: 84px;
      display:flex;
      flex-direction:column;
      justify-content:center;
    }
    .msg .line{ white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
    .time{
      margin-top: -2px;
      font-size: 16px;
      color: var(--muted);
    }
    .progress{
      height: 10px;
      background: rgba(255,255,255,0.08);
      width: 100%;
    }
    .bar{
      height: 100%;
      width: 100%;
      background: ${safe(color)};
      box-shadow: 0 0 22px ${safe(color)}66;
      transform-origin: left center;
    }
    .hint{
      font-size: 12px;
      color: rgba(231,238,252,0.40);
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="close" id="closeBtn" title="Close (Esc)">X</div>
    <div class="content">
      <div class="iconWrap"><div class="icon">${safe(icon)}</div></div>
      <div class="msg">
        <div class="line">${safe(line1)}${truncated && !line2 ? '…' : ''}</div>
        ${line2 ? `<div class="line">${safe(line2)}${truncated ? '…' : ''}</div>` : ''}
      </div>
      <div class="time" id="clock">--:--</div>
      <div class="hint">Nhấn Esc hoặc click X để đóng</div>
    </div>
    <div class="progress"><div class="bar" id="bar"></div></div>
  </div>
  <script>
    const CFG = ${JSON.stringify(cfg)};
    const close = () => window.close();
    document.getElementById('closeBtn').addEventListener('click', close);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    const bar = document.getElementById('bar');
    const clock = document.getElementById('clock');

    const fmtClock = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return hh + ':' + mm;
    };

    const tick = () => {
      const now = Date.now();
      const elapsed = now - CFG.startAt;
      const remaining = Math.max(0, CFG.displayMs - elapsed);
      const pct = Math.max(0, Math.min(1, remaining / CFG.displayMs));
      bar.style.transform = 'scaleX(' + pct.toFixed(4) + ')';
      clock.textContent = fmtClock();
      if (remaining <= 0) close();
      requestAnimationFrame(tick);
    };
    clock.textContent = fmtClock();
    requestAnimationFrame(tick);
  </script>
</body>
</html>`;
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
function showReminderPopup(reminder) {
    const primary = electron_1.screen.getPrimaryDisplay();
    const { bounds } = primary;
    const displayMs = clamp(reminder.config.displayMs, 60_000, 24 * 60 * 60_000);
    const x = bounds.x;
    const y = bounds.y;
    const width = bounds.width;
    const height = bounds.height;
    const win = new electron_1.BrowserWindow({
        x,
        y,
        width,
        height,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        fullscreen: true,
        skipTaskbar: true,
        focusable: true,
        backgroundColor: '#00000000',
        webPreferences: {
            devTools: isDev,
        },
    });
    // Stack behavior: slightly offset the card via CSS? simplest: just keep windows on top in order.
    popups.push({ win, reminderId: reminder.id });
    win.on('closed', () => {
        popups = popups.filter((p) => p.win !== win);
    });
    win.once('ready-to-show', () => {
        win.show();
        win.focus();
    });
    // first load
    win.loadURL(dataUrlForReminder({ ...reminder, config: { ...reminder.config, displayMs } }));
    win.showInactive();
    win.setAlwaysOnTop(true, 'screen-saver');
    win.focus();
}
