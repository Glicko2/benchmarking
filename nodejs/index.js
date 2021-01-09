const bench = require('nanobench');
const { Sequelize, DataTypes } = require('sequelize');
require('sequelize-batches');

let username = process.env.USERNAME;
let password = process.env.PASSWORD;
let host = process.env.HOST;
let database = process.env.DATABASE;

let conn = new Sequelize({
    database: database,
    username: username,
    password: password,
    host: host,
    dialect: 'mysql',
    logging: false
});

let Player = conn.define('Player', {
    rating: {
        type: DataTypes.FLOAT
    },
    rd: {
        type: DataTypes.FLOAT
    },
    sigma: {
        type: DataTypes.FLOAT
    }
}, { timestamps: false, tableName: 'players' });

let Match = conn.define('Match', {
    player1: {
        type: DataTypes.NUMBER
    },
    player2: {
        type: DataTypes.NUMBER
    },
    score: {
        type: DataTypes.NUMBER
    }
}, { timestamps: false, tableName: 'matches' });

const GoGlicko = require('go-glicko');
const glicko2 = require('glicko2');
const glickoTwo = require('glicko-two');
const glicko2JS = require('glicko2-js');

// TODO: Make these benchmarks in a promise so we can safely conn.close() after benchmarks have finished.
for(let i = 1; i < 4; i++) {
    bench(`go-glicko rating period #${i}`, async (b) => {
        b.start();

        let players = new Map();
        let period = new GoGlicko.Period();
        let dPlayers = await Player.findAll();
        
        for(dP in dPlayers) {
            let gP = new GoGlicko.Player(new GoGlicko.Rating(dP['rating'], dP['rd'], dP['sigma']));
            players.set(dP['id'], gP);
            period.addPlayer(gP);
        }

        let dMatches = await Match.findAll();

        for(dM in dMatches) {
            period.addMatch(players.get(dM['player1']), players.get(dM['player2']), dM['score']);
        }

        period.Calculate();

        b.end();
    });
}

for(let i = 1; i < 4; i++) {
    bench(`glicko2 rating period #${i}`, async (b) => {
        b.start();

        let g2 = new glicko2.Glicko2({
            tau : 0.5,
            rating : 1500,
            rd : 200,
            vol : 0.06
        });

        let players = new Map();
        let matches = [];
        let dPlayers = await Player.findAll();
        
        for(dP in dPlayers) {
            let gP = g2.makePlayer(dP['rating'], dP['rd'], dP['sigma']);
            players.set(dP['id'], gP);
        }

        let dMatches = await Match.findAll();

        for(dM in dMatches) {
            matches.push([players.get(dM['player1']), players.get(dM['player2']), dM['score']]);
        }

        g2.updateRatings(matches);

        b.end();
    });
}

for(let i = 1; i < 4; i++) {
    bench(`glicko2 rating period #${i}`, async (b) => {
        b.start();

        let players = new Map();
        let dPlayers = await Player.findAll();
        
        for(dP in dPlayers) {
            let gP = new glickoTwo.Player({
                rating: dP['rating'],
                ratingDeviation: dP['rd'],
                tau: 0.05,
                volatility: dP['sigma']
            });

            players.set(dP['id'], gP);
        }

        let dMatches = await Match.findAll();

        for(dM in dMatches) {
            players.get(dM['player1']).addResult(players.get(dM['player2']), dM['score']);
        }

        players.forEach((player, key) => {
            player.updateRating();
        });

        b.end();
    });
}

for(let i = 1; i < 4; i++) {
    bench(`glicko2 rating period #${i}`, async (b) => {
        b.start();

        let dPlayers = await Player.findAll();
        let ratings = new glicko2JS();

        for(dP in dPlayers) {
            ratings.addPlayer(dP['id'], dP['rating'], dP['rd'], dP['sigma']);
        }

        let dMatches = await Match.findAll();

        for(dM in dMatches) {
            switch(dM['score']) {
                case 1.0:
                    ratings.addMatch(dM['player2'], dM['player1']);
                    break;
                case 0.5:
                    ratings.addMatch(dM['player1'], dM['player2'], true);
                    break;
                case 0.0:
                    ratings.addMatch(dM['player1'], dM['player2']);
                    break;
            }
        }

        ratings.calculateRankings();

        b.end();
    });
}