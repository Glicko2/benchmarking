const bench = require('nanobench');
const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');
require('sequelize-batches');

let username = process.env.USERNAME;
let password = process.env.PASSWORD;
let host = process.env.HOST;
let database = process.env.DATABASE;

let consoleOutput = fs.createWriteStream(`benchmarks/${database}.log`, {flags : 'w'});

console.log = function(message) {
    consoleOutput.write(`${message}\n`);
    console.info(message);
};

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

function start() {
    return new Promise(async (resolve, reject) => {
        let dPlayers = await Player.findAll();
        let dMatches = await Match.findAll();
    
        for(let i = 1; i < 4; i++) {
            bench(`go-glicko rating period #${i}`, async (b) => {
                b.start();
        
                let players = new Map();
                let period = new GoGlicko.Period();
                
                for(dP in dPlayers) {
                    let gP = new GoGlicko.Player(new GoGlicko.Rating(dPlayers[dP]['rating'], dPlayers[dP]['rd'], dPlayers[dP]['sigma']));
                    players.set(dPlayers[dP]['id'], gP);
                    period.addPlayer(gP);
                }
    
                for(dM in dMatches) {
                    period.addMatch(players.get(dMatches[dM]['player1']), players.get(dMatches[dM]['player2']), dMatches[dM]['score']);
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
                
                for(dP in dPlayers) {
                    let gP = g2.makePlayer(dPlayers[dP]['rating'], dPlayers[dP]['rd'], dPlayers[dP]['sigma']);
                    players.set(dPlayers[dP]['id'], gP);
                }
    
                for(dM in dMatches) {
                    matches.push([players.get(dMatches[dM]['player1']), players.get(dMatches[dM]['player2']), dMatches[dM]['score']]);
                }
        
                g2.updateRatings(matches);
        
                b.end();
            });
        }
        
        for(let i = 1; i < 4; i++) {
            bench(`glicko-two rating period #${i}`, async (b) => {
                b.start();
        
                let players = new Map();
                
                for(dP in dPlayers) {
                    let gP = new glickoTwo.Player({
                        rating: dPlayers[dP]['rating'],
                        ratingDeviation: dPlayers[dP]['rd'],
                        tau: 0.05,
                        volatility: dPlayers[dP]['sigma']
                    });
        
                    players.set(dPlayers[dP]['id'], gP);
                }
    
                for(dM in dMatches) {
                    players.get(dMatches[dM]['player1']).addResult(players.get(dMatches[dM]['player2']), dMatches[dM]['score']);
                }
        
                players.forEach((player, key) => {
                    player.updateRating();
                });
        
                b.end();
            });
        }
        
        for(let i = 1; i < 4; i++) {
            bench(`glicko2-js rating period #${i}`, async (b) => {
                b.start();
                let ratings = new glicko2JS();

                for(dP in dPlayers) {
                    ratings.addPlayer(dPlayers[dP]['id'], dPlayers[dP]['rating'], dPlayers[dP]['rd'], dPlayers[dP]['sigma']);
                }
                for(dM in dMatches) {
                    switch(dMatches[dM]['score']) {
                        case 1.0:
                            ratings.addMatch(dMatches[dM]['player2'], dMatches[dM]['player1']);
                            break;
                        case 0.5:
                            ratings.addMatch(dMatches[dM]['player1'], dMatches[dM]['player2'], true);
                            break;
                        case 0.0:
                            ratings.addMatch(dMatches[dM]['player1'], dMatches[dM]['player2']);
                            break;
                    }
                }
        
                ratings.calculateRankings();
        
                b.end();
            });
        }
    
        resolve();
    });
}

start();