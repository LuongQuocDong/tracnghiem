'use strict';

const crypto = require('node:crypto');
const { database } = require('../lib/mongo');
const { canUseMethod } = require('../lib/access');
const { callService } = require('../lib/service');

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => {
    const index = part.indexOf('=');
    return index < 0 ? [] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).filter((pair) => pair.length === 2));
}

function signedAdmin() {
  const stamp = String(Date.now());
  const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(stamp).digest('hex');
  return `${stamp}.${signature}`;
}

function isAdminCookie(value) {
  if (!value || !process.env.SESSION_SECRET || !process.env.ADMIN_PASSWORD) return false;
  const [stamp, signature] = value.split('.');
  if (!/^\d{13}$/.test(stamp) || !/^[0-9a-f]{64}$/.test(signature) || Date.now() - Number(stamp) > 7 * 86400000) return false;
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(stamp).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

function equalPassword(provided) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) return false;
  const expected = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();
  const actual = crypto.createHash('sha256').update(String(provided || '')).digest();
  return crypto.timingSafeEqual(expected, actual);
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'Chỉ hỗ trợ POST.' })); }
  try {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) {
      res.statusCode = 403; throw new Error('Nguồn yêu cầu không hợp lệ.');
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { method, args = [] } = body || {};
    if (typeof method !== 'string' || !Array.isArray(args)) throw new Error('Yêu cầu không hợp lệ.');
    const cookies = parseCookies(req.headers.cookie);
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    const visitorId = /^[0-9a-f-]{36}$/i.test(cookies.tn_visitor || '') ? cookies.tn_visitor : crypto.randomUUID();
    const setCookies = [];
    if (visitorId !== cookies.tn_visitor) setCookies.push(`tn_visitor=${visitorId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`);
    let admin = isAdminCookie(cookies.tn_admin);
    if (method === 'loginAdmin') {
      if (!equalPassword(args[0])) { res.statusCode = 401; throw new Error('Mật khẩu quản trị không đúng hoặc chưa được cấu hình.'); }
      setCookies.push(`tn_admin=${signedAdmin()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure}`);
      admin = true;
    } else if (method === 'logoutAdmin') {
      setCookies.push(`tn_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
      admin = false;
    }
    if (setCookies.length) res.setHeader('Set-Cookie', setCookies);
    if (method === 'authStatus' || method === 'loginAdmin' || method === 'logoutAdmin') return res.end(JSON.stringify({ result: { admin } }));
    if (!canUseMethod(method, admin)) {
      res.statusCode = 403;
      throw new Error('Chức năng này chỉ dành cho quản trị viên.');
    }
    const db = await database();
    const result = await callService(db, method, args, { isAdmin: admin, visitorId });
    return res.end(JSON.stringify({ result }));
  } catch (error) {
    if (res.statusCode < 400) res.statusCode = error.message.includes('MONGODB_URI') ? 503 : 400;
    return res.end(JSON.stringify({ error: error.message || 'Không xử lý được yêu cầu.' }));
  }
};
