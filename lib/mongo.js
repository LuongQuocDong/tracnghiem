'use strict';

const { MongoClient } = require('mongodb');
const dns = require('node:dns');
let connection;

async function database() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI chưa được cấu hình.');
  if (!connection) {
    // Optional local workaround for machines whose Node resolver points at a dead loopback DNS.
    if (process.env.MONGODB_DNS_SERVERS) dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map((s) => s.trim()));
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    connection = client.connect().then(() => client.db(process.env.MONGODB_DB || 'tracnghiemapp'))
      .catch((error) => { connection = undefined; throw error; });
  }
  return connection;
}

module.exports = { database };
