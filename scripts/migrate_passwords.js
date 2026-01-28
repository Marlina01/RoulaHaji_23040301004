const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'database', 'kirtasiye.db');
const db = new sqlite3.Database(dbPath);

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function migrateTable(tableName, idCol, passCol) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT ${idCol}, ${passCol} FROM ${tableName}`, [], (err, rows) => {
            if (err) return reject(err);

            let count = 0;
            const updates = rows.map(row => {
                const password = row[passCol];
                // Check if already hashed (contains colon and looks like hex)
                if (password && !password.includes(':')) {
                    const newPass = hashPassword(password);
                    return new Promise((res, rej) => {
                        db.run(
                            `UPDATE ${tableName} SET ${passCol} = ? WHERE ${idCol} = ?`,
                            [newPass, row[idCol]],
                            (err) => {
                                if (err) rej(err);
                                else {
                                    count++;
                                    res();
                                }
                            }
                        );
                    });
                }
                return Promise.resolve();
            });

            Promise.all(updates)
                .then(() => resolve(count))
                .catch(reject);
        });
    });
}

async function run() {
    try {
        console.log('Migrating Admin passwords...');
        const adminCount = await migrateTable('adminler', 'id', 'sifre');
        console.log(`Updated ${adminCount} admins.`);

        console.log('Migrating User passwords...');
        const userCount = await migrateTable('kullanicilar', 'id', 'sifre');
        console.log(`Updated ${userCount} users.`);

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        db.close();
    }
}

run();
