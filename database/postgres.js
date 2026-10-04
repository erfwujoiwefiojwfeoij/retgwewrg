const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

function loadEnv() {
  try {
    require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
      path: path.join(__dirname, '../backend/.env'),
    });
  } catch {
    // backend dependencies are installed later
  }
}

loadEnv();

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function loadEmbedded() {
  const entry = path.join(__dirname, '../backend/node_modules/embedded-postgres/dist/index.js');
  const mod = await import(pathToFileURL(entry).href);
  return mod.default;
}

let instance = null;

function waitForPort(port, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      if (await canConnect(port)) return resolve();
      if (Date.now() - started > timeoutMs) return reject(new Error('PostgreSQL не поднялся'));
      setTimeout(tick, 400);
    };
    tick();
  });
}

function startRestricted() {
  const script = path.join(__dirname, 'postgres.js');
  const child = spawn('runas', ['/trustlevel:0x20000', `node "${script}" --child`], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
}

async function startEmbedded() {
  const port = Number(process.env.PG_PORT || 5433);
  const EmbeddedPostgres = await loadEmbedded();
  let log = '';
  instance = new EmbeddedPostgres({
    databaseDir: path.join(__dirname, 'data'),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    port,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: (message) => { log += `${message}\n`; },
    onError: (message) => { log += `${message}\n`; },
  });

  try {
    await instance.initialise();
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    if (!/already|exists|initdb/i.test(message)) throw error;
  }

  try {
    await instance.start();
  } catch (error) {
    if (/administrative permissions/i.test(log)) {
      const adminError = new Error('PostgreSQL не запускается из-под администратора');
      adminError.code = 'PG_ADMIN';
      throw adminError;
    }
    throw error || new Error(log || 'Не удалось запустить PostgreSQL');
  }

  try {
    await instance.createDatabase(process.env.PG_DATABASE || 'lunea');
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    if (!/already exists|duplicate/i.test(message)) throw error;
  }
}

async function ensurePostgres() {
  if (process.env.EMBEDDED_POSTGRES === 'false') return;
  const port = Number(process.env.PG_PORT || 5433);
  if (await canConnect(port)) return;

  const child = process.argv.includes('--child');
  if (process.platform === 'win32' && !child) {
    startRestricted();
    await waitForPort(port, 40000);
    return;
  }

  try {
    await startEmbedded();
  } catch (error) {
    if (error.code !== 'PG_ADMIN' || child) throw error;
    startRestricted();
    await waitForPort(port, 40000);
  }
}

async function stopPostgres() {
  if (instance) await instance.stop();
}

module.exports = { ensurePostgres, stopPostgres };

if (require.main === module) {
  ensurePostgres()
    .then(() => {
      console.log(`PostgreSQL слушает 127.0.0.1:${process.env.PG_PORT || 5433}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
