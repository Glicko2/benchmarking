const parse = require('nanobench/parse');
const fs = require('fs');
const fileName = process.env.FILE;

console.log(`Parsing ${fileName} to ${fileName}.json with nanobench/parse.`);

let log = fs.readFileSync(`benchmarks/${fileName}`);
let logOut = parse(log);

fs.writeFileSync(`benchmarks/${fileName}.json`, JSON.stringify(logOut, null, 2));

console.log(`Finished parsing and writing to ${fileName}.json`);