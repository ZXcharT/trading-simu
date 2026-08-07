const VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const TYPE_MAP = { callback:'B1', startup:'B2' };

function domain() {
  const value = window.__ONECHART_KELLY_COOKIE_DOMAIN__;
  return typeof value === 'string' && value.trim() ? value.trim() : '.onechart.top';
}
function valid(data, type) {
  const now = Date.now();
  return data?.v === VERSION && data.type === type
    && Number.isFinite(data.full) && Number.isFinite(data.half) && Number.isFinite(data.timestamp)
    && data.full >= 0 && data.full <= 100 && data.half >= 0 && data.half <= data.full
    && data.timestamp >= now - MAX_AGE_SECONDS * 1000 && data.timestamp <= now + 300000;
}
function writeLocal(type, data) {
  try { localStorage.setItem('zxchart_kelly_' + type, JSON.stringify(data)); return true; }
  catch { return false; }
}
function cookieName(type) { return `onechart_kelly_${type}_v${VERSION}`; }
function readCookie(type) {
  try {
    const prefix = cookieName(type) + '=';
    const entry = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
    if (!entry) return null;
    const data = JSON.parse(decodeURIComponent(entry.slice(prefix.length)));
    return valid(data,type) ? data : null;
  } catch { return null; }
}
function writeCookie(type,data) {
  try {
    document.cookie = `${cookieName(type)}=${encodeURIComponent(JSON.stringify(data))}; Max-Age=${MAX_AGE_SECONDS}; Path=/; Domain=${domain()}; SameSite=Lax; Secure`;
    return readCookie(type)?.timestamp === data.timestamp;
  } catch { return false; }
}

export function syncRiskSuggestion(buyPoint, full, half) {
  const type = TYPE_MAP[buyPoint];
  const data = { v:VERSION, type, full, half, timestamp:Date.now() };
  if (!type || !valid(data,type)) return { ok:false, reason:'invalid' };
  const local = writeLocal(type,data);
  const cookie = writeCookie(type,data);
  return { ok:cookie, local, cookie, buyPoint, timestamp:data.timestamp };
}
