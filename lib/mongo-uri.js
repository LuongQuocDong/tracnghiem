'use strict';

async function dnsOverHttps(name, type) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/dns-json' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`DNS HTTPS trả về ${response.status}.`);
  const data = await response.json();
  if (data.Status !== 0) throw new Error(`DNS HTTPS trả về mã ${data.Status}.`);
  return data.Answer || [];
}

async function toStandardAtlasUri(uri, lookup = dnsOverHttps) {
  const source = new URL(uri);
  if (source.protocol !== 'mongodb+srv:') return uri;
  const hostname = source.hostname.toLowerCase();
  const parent = hostname.split('.').slice(1).join('.');
  if (!parent) throw new Error('Tên máy chủ MongoDB không hợp lệ.');

  const [srvRecords, txtRecords] = await Promise.all([
    lookup(`_mongodb._tcp.${hostname}`, 'SRV'),
    lookup(hostname, 'TXT'),
  ]);
  const hosts = srvRecords.filter((record) => record.type === 33).map((record) => {
    const match = /^\d+\s+\d+\s+(\d+)\s+([a-z\d.-]+)\.?$/i.exec(record.data);
    if (!match) throw new Error('Bản ghi SRV MongoDB không hợp lệ.');
    const host = match[2].replace(/\.$/, '').toLowerCase();
    if (!host.endsWith(`.${parent}`) || host === hostname) throw new Error('SRV host không hợp lệ.');
    return `${host}:${match[1]}`;
  });
  if (!hosts.length) throw new Error('Không tìm thấy máy chủ MongoDB trong DNS.');

  const options = new URLSearchParams(source.searchParams);
  options.set('tls', 'true');
  for (const record of txtRecords.filter((item) => item.type === 16)) {
    const txt = record.data.replace(/^"|"$/g, '');
    for (const [key, value] of new URLSearchParams(txt)) {
      if (['authSource', 'replicaSet'].includes(key) && !options.has(key)) options.set(key, value);
    }
  }
  const credentials = source.username ? `${source.username}${source.password ? `:${source.password}` : ''}@` : '';
  return `mongodb://${credentials}${hosts.join(',')}${source.pathname || '/'}?${options}`;
}

module.exports = { toStandardAtlasUri };
