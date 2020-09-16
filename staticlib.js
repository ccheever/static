let crypto = require('crypto');
let fs = require('fs');
let os = require('os');
let path = require('path');
let sqlite3 = require('sqlite3');

let { fetch } = require('cross-fetch');

function md5(x) {
  return crypto.createHash('md5').update(x).digest('hex');
}

let _staticDir = null;
function staticDir() {
  if (_staticDir === null) {
    let dir = path.join(os.homedir(), '.static');
    fs.mkdirSync(dir, { recursive: true });
    _staticDir = dir;
  }
  return _staticDir;
}

function cacheFile() {
  return path.join(staticDir(), 'cache.db');
}

let _db = null;

async function cacheDb() {
  if (_db === null) {
    _db = new sqlite3.Database(cacheFile());
    await _dbRun(
      _db,
      `CREATE TABLE IF NOT EXISTS files (importType TEXT, specifiedUrl TEXT, httpUrl TEXT, content TEXT, contentHash TEXT, fetchedTime TEXT, etag TEXT, responseHeaders TEXT, responseDate TEXT);`
    );
    await _dbRun(_db, `CREATE TABLE IF NOT EXISTS staticMeta (version INTEGER)`);
  }
  return _db;
}

async function dbAll(...args) {
  let db = await cacheDb();
  return await _dbAll(db, ...args);
}

async function dbGet(...args) {
  let db = await cacheDb();
  return await _dbGet(db, ...args);
}

async function _dbRun(db, ...args) {
  return await new Promise((resolve, reject) => {
    db.run(...args, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve({
          changes: this.changes,
          lastID: this.lastID,
          result,
        });
      }
    });
  });
}

async function _dbAll(db, ...args) {
  return await new Promise((resolve, reject) => {
    db.all(...args, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function _dbGet(db, ...args) {
  return await new Promise((resolve, reject) => {
    db.get(...args, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function dbRun(...args) {
  let db = await cacheDb();
  return await _dbRun(db, ...args);
}

async function store({
  importType,
  specifiedUrl,
  httpUrl,
  content,
  contentHash,
  fetchedTime,
  etag,
  responseHeaders,
  responseDate,
}) {
  await dbRun(
    `INSERT INTO files (importType, specifiedUrl, httpUrl, content, contentHash, fetchedTime, etag, responseHeaders, responseDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      importType,
      specifiedUrl,
      httpUrl,
      content,
      contentHash,
      fetchedTime,
      etag,
      responseHeaders,
      responseDate,
    ]
  );
}

async function getFile({ specifiedUrl, httpUrl, importType }) {
  // For now, assume everything is static

  // First, check database to see if file is already there
  let cachedResult = await dbGet(
    'SELECT * FROM files WHERE specifiedUrl = ? AND httpUrl = ? AND importType = ?',
    specifiedUrl,
    httpUrl,
    importType
  );
  if (cachedResult) {
    return cachedResult;
  } else {
    console.log(`Fetching ${importType}: ${specifiedUrl} --> ${httpUrl}`);
    let response = await fetch(httpUrl);
    let headers = response.headers;
    let fetchedTime = Date.now();
    let text = await response.text();
    let contentHash = md5(text);
    let responseHeaders = JSON.stringify(headers.raw());
    let responseDate = headers.get('date');
    let etag = headers.get('etag');
    let result = {
      importType,
      specifiedUrl,
      httpUrl,
      content: text,
      contentHash,
      fetchedTime,
      etag,
      responseHeaders,
      responseDate,
    };
    await store(result);
    return result;
  }
}

async function fetchFile(httpUrl) {
  let response = await fetch(httpUrl); // TODO: Add headers
  let text = response.text();

  return {
    headers,
    text,
  };
}

module.exports = {
  staticDir,
  cacheDb,
  dbRun,
  dbAll,
  dbGet,
  _dbRun,
  _dbGet,
  _dbAll,
  getFile,
};
