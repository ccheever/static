let os = require("os");
let path = require("path");
let fs = require("fs");

let { fetch } = require("cross-fetch");

let _staticDir = null;
function staticDir() {
  if (_staticDir === null) {
    let dir = path.join(os.homedir(), ".static");
    fs.mkdirSync(dir, { recursive: true });
    _staticDir = dir;
  }
  return _staticDir;
}

function cacheFile() {
  return path.join(staticDir(), "cache.db");
}

let _db = null;
function cacheDb() {
  if (_db === null) {
    _db = new sqlite3.Database(cacheFile());
    _db.run(
      `CREATE TABLE IF NOT EXISTS files (url TEXT, hash TEXT, fetchedTime TEXT, etag TEXT)`
    );
  }
  return _db;
}

async function fetchFile(url) {
  let response = await fetch(url); // TODO: Add headers
  let headers = response.headers();
  let text = response.text();
}




module.exports = {
  staticDir,
  cacheDb,
};
