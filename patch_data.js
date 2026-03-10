import fs from 'fs';

let appCode = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Replace the data block
const startIdx = appCode.indexOf('let MAP_W = 200');
const endString = '// ─────────────────────────────────────────────────────\\n// VORONOI';
const endIdx = appCode.indexOf(endString);

if (startIdx !== -1 && endIdx !== -1) {
    const finalImport = 'import { BIOMES, RESOURCES, ERAS, TECHS, BUILDINGS, UNITS, CIVS } from "./data.js";\\n\\nlet MAP_W = 200, MAP_H = 140, NUM_CELLS = 260;\\n';
    appCode = appCode.substring(0, startIdx) + finalImport + appCode.substring(endIdx);
} else {
    console.error("Could not find data block boundaries.", startIdx, endIdx);
}

// 2. Add Wonder Logic
const availBuildsStart = appCode.indexOf('const availBuilds = [];');
const availBuildsEndStr = 'Object.keys(UNITS).forEach(uid => {';
let availBuildsEnd = appCode.indexOf(availBuildsEndStr, availBuildsStart);
if (availBuildsEnd !== -1) {
    // find the end of the units foreach block
    const closingBrace = appCode.indexOf('});', availBuildsEnd) + 3;
    const blockToRemove = appCode.substring(availBuildsStart, closingBrace);

    const robustBuildObj = [
        '    const availBuilds = [];',
        '    if (selCity) {',
        '        Object.keys(BUILDINGS).forEach(bid => {',
        '            const b = BUILDINGS[bid];',
        '            if (selCity.buildings.includes(bid)) return;',
        '            if (b.wonder) {',
        '                let alreadyBuilt = false;',
        '                game.cities.forEach(c => { if (c.buildings.includes(bid) || c.currentBuild === bid) alreadyBuilt = true; });',
        '                if (alreadyBuilt) return;',
        '                if (b.reqTerrain && b.reqTerrain.length > 0) {',
        '                    const cityCell = game.map.cells[selCity.cellId];',
        '                    let hasTerrain = b.reqTerrain.includes(cityCell.biome);',
        '                    if (!hasTerrain && cityCell.neighbors) {',
        '                        cityCell.neighbors.forEach(nId => {',
        '                            if (game.map.cells[nId] && b.reqTerrain.includes(game.map.cells[nId].biome)) hasTerrain = true;',
        '                        });',
        '                    }',
        '                    if (!hasTerrain) return;',
        '                }',
        '            }',
        '            availBuilds.push({id: bid, ...b});',
        '        });',
        '        Object.keys(UNITS).forEach(uid => {',
        '            const u = UNITS[uid];',
        '            if (u.unique && u.unique !== playerCiv?.id) return;',
        '            availBuilds.push({id: uid, ...u});',
        '        });',
        '    }'
    ].join('\\n');

    appCode = appCode.replace(blockToRemove, robustBuildObj);
} else {
    console.error("Could not find availBuilds block.", availBuildsStart);
}

// 3. Fix movement for flying units
appCode = appCode.replace(/if \\(BIOMES\\[cell\\.biome\\]\\?\\.moveCost < 999\\)/g, 'if (UNITS[unit.type]?.flying || BIOMES[cell.biome]?.moveCost < 999)');

// 4. Update the City Yield logic
const yieldSearch = 's += Math.floor(city.pop * 0.5);';
if (appCode.indexOf(yieldSearch) !== -1) {
    const colosseumBuff = [
        '    let extraCult = 0;',
        '    cities.forEach(c => {',
        '        if (c.buildings.includes("colosseum") && dist([c.x, c.y], [city.x, city.y]) <= 15) extraCult += 2;',
        '    });',
        '    cu += extraCult;'
    ].join('\\n');
    appCode = appCode.replace(yieldSearch, yieldSearch + '\\n' + colosseumBuff);
    appCode = appCode.replace(/cityYields\\(city, cells\\)/g, "cityYields(city, cells, game?.cities || [])");
    appCode = appCode.replace(/function cityYields\\(city, cells\\)/g, "function cityYields(city, cells, cities = [])");
} else {
    console.error("Could not find yields calculation array");
}

fs.writeFileSync('src/App.jsx', appCode);
console.log("App.jsx patched successfully!");
