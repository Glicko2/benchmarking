const bench = require('nanobench');
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
    {
        name: '100kp100km',
        players: 100000,
        matches: 100000,
    },
];


conn.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }

    let GoGlicko = require('go-glicko');

    databases.forEach((db) => {
        for (let i = 0; i < 3; i++) {
            bench(`go-glicko '${db.name}' rating period #${i+1}`, (b) => {
                b.start();

                let players = new Map();
                let period = new GoGlicko.Period();

                conn.query(`SELECT * FROM \`${db.name}\`.players`, (err, r, f) => {
                    r.forEach((p) => {
                        let gP = new GoGlicko.Player(new GoGlicko.Rating(p['rating'], p['rd'], p['sigma']));
                        players.set(p['id'], gP);
                        period.addPlayer(gP);
                    });

                    conn.query(`SELECT * FROM \`${db.name}\`.matches`, (err, rM, fM) => {
                        rM.forEach((m) => {
                            period.addMatch(players.get(m['player1']), players.get(m['player2']), m['score']);
                        });

                        
                        period.Calculate();

                        b.end();
                    });
                });
            });
        }
    });
});