let os = require('os');
let path = require('path');
let fs = require('fs');

let { fetch } = require('cross-fetch');

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
      `CREATE TABLE IF NOT EXISTS files (specifiedUrl TEXT, httpUrl TEXT, content TEXT, hash TEXT, fetchedTime TEXT, etag TEXT, responseHeaders TEXT);`
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

async function store(specifiedUrl, httpUrl, content, hash, fetchedTime, etag, responseHeaders) {
  _db.run(
    `INSERT INTO files (specifiedUrl, httpUrl, content, hash, fetchedTime, etag, responseHeaders) VALUES (?, ?, ?, ?, ?, ?)`,
    [specifiedUrl, httpUrl, hash, fetchedTime, etag, responseHeaders],
    (err, result)
  );
  _db.finalize();
}

async function fetchFile(url) {
  let response = await fetch(url); // TODO: Add headers
  let headers = response.headers();
  let text = response.text();
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
};
