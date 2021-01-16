const glob = require('glob');
const fs = require('fs');

let package = require('./package.json');

glob('./benchmarks/*json', (err, files) => {
    let exportObj = {};

    files.forEach((file) => {
        let data = fs.readFileSync(file, 'utf8');
        let name = file.split('/')[2].split('.')[0];
        let obj = {};
        data = JSON.parse(data);

        data.benchmarks.forEach((b) => {
            let pkg = b.name.split(' ')[0];
            let version = package['dependencies'][pkg].split('^')[1];

            if (obj[pkg]) {
                obj[pkg].benchmarks.push(b.time);
            } else {
                obj[pkg] = {
                    package: pkg,
                    version: version,
                    benchmarks: [b.time]
                }
            }

            exportObj[name] = obj;
        });
    });

    fs.writeFileSync('./benchmarks/export.json', JSON.stringify(exportObj));
});