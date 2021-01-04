const mysql = require('mysql');

let username = process.env.USERNAME;
let password = process.env.PASSWORD;
let host = process.env.HOST;

let conn = mysql.createConnection({
    host: host,
    user: username,
    password: password
});

let databases = [
    {
        name: '1kp1km',
        players: 1000,
        matches: 1000,
    },
]

let scores = [1.0, 0.5, 0.0];

conn.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }

    databases.forEach((database) => {
        console.log(`Creating database: ${database.name}`);
        conn.query(`CREATE DATABASE IF NOT EXISTS ${database.name};`, (error) => {
            if (error) {
                console.log(error);
                return;
            }

            console.log(`${database.name} created.`);

            conn.query(`CREATE TABLE IF NOT EXISTS \`${database.name}\`.players (
                rating FLOAT NULL,
                rd FLOAT NULL,
                sigma FLOAT NULL
            )`);

            conn.query(`CREATE TABLE IF NOT EXISTS \`${database.name}\`.matches (
                player1 INT NULL,
                player2 INT NULL,
                score FLOAT NULL
            )`);


            for (let i = 0; i < database.players; i++) {
                conn.query(`INSERT INTO \`${database.name}\`.players SET rating=${randBetween(1000, 2800)},rd=${randBetween(50, 400)},sigma=0.06`);
            }

            for (let i = 0; i < database.matches; i++) {
                conn.query(`INSERT INTO \`${database.name}\`.matches SET player1=${randBetween(1, database.matches)},player2=${randBetween(1, database.matches)},score=${scores[randBetween(0, 2)]}`);
            }
        });
    });
});

function randBetween(min, max) { 
    return Math.floor(Math.random() * (max - min + 1) + min);
}