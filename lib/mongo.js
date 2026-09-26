'use strict';

const { MongoClient } = require('mongodb');
const dns = require('node:dns');
const { toStandardAtlasUri } = require('./mongo-uri');
let connection;

async function database() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI chưa được cấu hình.');
  if (!connection) {
    // Optional local workaround for machines whose Node resolver points at a dead loopback DNS.
    if (process.env.MONGODB_DNS_SERVERS) dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map((s) => s.trim()));
    connection = (async () => {
      let uri = process.env.MONGODB_URI;
      if (uri.startsWith('mongodb+srv://')) {
        try { uri = await toStandardAtlasUri(uri); }
        catch (error) { console.warn('MongoDB DNS HTTPS lookup failed; trying native SRV:', error.message); }
      }
      const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
      await client.connect();
      return client.db(process.env.MONGODB_DB || 'tracnghiemapp');
    })()
      .catch((error) => { connection = undefined; throw error; });
  }
  return connection;
}

module.exports = { database };
