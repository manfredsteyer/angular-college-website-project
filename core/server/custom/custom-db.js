var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('custom-db.db');

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS readers (email TEXT, date TEXT, notify INTEGER)");
});

module.exports = db;