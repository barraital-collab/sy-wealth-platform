const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sy_wealth.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(investments)", (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Investments table schema:');
    rows.forEach(row => {
        console.log(`- ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? 'DEFAULT ' + row.dflt_value : ''}`);
    });

    db.close();
});