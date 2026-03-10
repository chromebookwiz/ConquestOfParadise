import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Fix global playerCivIndex references
// We'll change the signature of initGame, doTurn, updateVis
code = code.replace(/function updateVis\(cells, units, cities, civId\)/g, 'function updateVis(cells, units, cities, playerCivIndex = 0)');
code = code.replace(/function initGame\(seed, civId, numAI\)/g, 'function initGame(seed, civId, numAI, mapOpt="Normal", playerCivIndex = 0)');
code = code.replace(/function doTurn\(state\)/g, 'function doTurn(state, playerCivIndex = 0)');

// We also need to fix where they are called from HexlessGame
code = code.replace(/initGame\(Math.floor\(Math.random\(\) \* 99999\), selCiv, 4\)/g, 'initGame(Math.floor(Math.random() * 99999), selCiv, 4, mapSize, 0)');
code = code.replace(/doTurn\(\{ \.\.\.game \}\)/g, 'doTurn({ ...game }, playerCivIndex)');

// Because patch.js replaced literal '0' with 'playerCivIndex', and inside initGame we had a loop variable 'i' for owners:
// Before patch.js: map.cells.forEach(c => { if (dist([c.cx, c.cy], [cell.cx, cell.cy]) < 8) c.owner = i; });
// After patch.js: ... c.owner = playerCivIndex;  WAIT! Actually let's check what it is because my grep search didn't show it!
// Let me just replace the whole initGame block so it works for multiplayer correctly.

const fixedInitGame = `function initGame(seed, civId, numAI, mapOpt = "Normal", localPlayerId = 0) {
    if (mapOpt === "Small") { MAP_W = 120; MAP_H = 80; NUM_CELLS = 120; }
    else if (mapOpt === "Huge") { MAP_W = 300; MAP_H = 200; NUM_CELLS = 450; }
    else { MAP_W = 200; MAP_H = 140; NUM_CELLS = 260; }

    const map = generateMap(seed);
    const rng = seededRandom(seed + 777);
    const land = map.cells.filter(c => !["ocean", "coast", "mountain", "arctic"].includes(c.biome));
    const starts = [];
    for (let i = 0; i < 1 + numAI; i++) {
        let best = null, bestD = 0;
        for (let a = 0; a < 60; a++) {
            const c = land[Math.floor(rng() * land.length)];
            const md = starts.length === 0 ? 1e9 : Math.min(...starts.map(s => dist([c.cx, c.cy], [map.cells[s].cx, map.cells[s].cy])));
            if (md > bestD) { best = c.id; bestD = md; }
        }
        if (best !== null) starts.push(best);
    }

    const playerCivData = CIVS.find(c => c.id === civId) || CIVS[0];
    const civs = [{ id: 0, ...playerCivData, isPlayer: true, gold: 0, science: 0, culture: 0, currentTech: "agriculture", techProg: 0, techs: [], score: 0, era: 0, mars: 0 }];
    const used = new Set([playerCivData.id]);
    const shuffled = [...CIVS].sort(() => rng() - 0.5);
    for (let i = 1; i <= numAI; i++) {
        const cd = shuffled.find(c => !used.has(c.id)) || shuffled[i % shuffled.length];
        used.add(cd.id);
        civs.push({ id: i, ...cd, isPlayer: false, gold: 0, science: 0, culture: 0, currentTech: "agriculture", techProg: 0, techs: [], score: 0, era: 0, mars: 0 });
    }

    const cities = [], units = [];
    let uid = 0;
    civs.forEach((civ, i) => {
        if (i >= starts.length) return;
        const cell = map.cells[starts[i]];
        cities.push({ id: i, civId: i, cellId: cell.id, name: \`\${civ.name}\`, x: cell.cx, y: cell.cy, pop: 1, food: 0, foodNeed: 15, prod: 0, currentBuild: null, buildings: [], hp: 200, maxHp: 200, borderR: 8, culture: 0, isCapital: true, housing: 4 });
        map.cells.forEach(c => { if (dist([c.cx, c.cy], [cell.cx, cell.cy]) < 8) c.owner = i; });
        units.push({ id: uid++, type: "warrior", civId: i, x: cell.cx - 3, y: cell.cy + 2, hp: 100, maxHp: 100, moveLeft: 6, xp: 0, fortified: false });
        units.push({ id: uid++, type: "scout", civId: i, x: cell.cx + 3, y: cell.cy - 2, hp: 100, maxHp: 100, moveLeft: 10, xp: 0, fortified: false });
        units.push({ id: uid++, type: "settler", civId: i, x: cell.cx, y: cell.cy + 4, hp: 100, maxHp: 100, moveLeft: 5, xp: 0, fortified: false });
    });

    updateVis(map.cells, units, cities, localPlayerId);
    return { map, civs, cities, units, nextUid: uid, turn: 1, selUnit: null, selCity: null, combatLog: [], notifs: [], victory: null };
}`;

code = code.replace(/function initGame\(seed, civId, numAI(?:, mapOpt="Normal", playerCivIndex = 0)?\) \{[\s\S]*?return \{ map, civs, cities, units, nextUid: uid, turn: 1, selUnit: null, selCity: null, combatLog: \[\], notifs: \[\], victory: null \};\n\}/, fixedInitGame);


// Add mapSize state to frontend
code = code.replace(/const \[selCiv, setSelCiv\] = useState\("egypt"\);/, 'const [selCiv, setSelCiv] = useState("egypt");\n    const [mapSize, setMapSize] = useState("Normal");');

// Add mapSize selector UI
const uiSelector = `
                    <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                        {["Small", "Normal", "Huge"].map(sz => (
                            <button key={sz} onClick={() => setMapSize(sz)} style={{
                                background: mapSize === sz ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.05)",
                                border: mapSize === sz ? "1px solid var(--gold)" : "1px solid var(--border)",
                                color: "var(--text)", padding: "8px 16px", cursor: "pointer", borderRadius: 4, fontFamily: "'Cinzel', serif"
                            }}>{sz} Map</button>
                        ))}
                    </div>
                </div>
`;
code = code.replace(/<\/div>(?=\s*<div style=\{\{ marginTop: 30, zIndex: 1, animation: "fadeUp 1\.3s ease")/, uiSelector);

// 2. Change Constants from const to let so they can be modified
code = code.replace(/const MAP_W = 200, MAP_H = 140, NUM_CELLS = 260;/, 'let MAP_W = 200, MAP_H = 140, NUM_CELLS = 260;');

// 3. Ancient Theme / Replace futuristic units
const ancientUnits = `const UNITS = {
    // Basic Ancient
    warrior: { name: "Warrior", str: 20, rStr: 0, ranged: false, range: 0, move: 6, cost: 40, era: 0, icon: "⚔️", model: "sword" },
    archer: { name: "Archer", str: 15, rStr: 25, ranged: true, range: 12, move: 5, cost: 50, era: 0, icon: "🏹", model: "bow" },
    settler: { name: "Settler", str: 0, rStr: 0, ranged: false, range: 0, move: 5, cost: 80, era: 0, icon: "🏕️", model: "wagon", special: "settle" },
    scout: { name: "Scout", str: 10, rStr: 0, ranged: false, range: 0, move: 10, cost: 30, era: 0, icon: "🔍", model: "scout" },
    builder: { name: "Builder", str: 0, rStr: 0, ranged: false, range: 0, move: 5, cost: 50, era: 0, icon: "🔨", model: "worker", special: "build", charges: 3 },
    galley: { name: "Galley", str: 25, rStr: 0, ranged: false, range: 0, move: 8, cost: 65, era: 0, icon: "⛵", model: "ship", naval: true },
    
    // Classical / Medieval
    horseman: { name: "Horseman", str: 28, rStr: 0, ranged: false, range: 0, move: 12, cost: 70, era: 1, icon: "🐴", model: "horse" },
    swordsman: { name: "Swordsman", str: 35, rStr: 0, ranged: false, range: 0, move: 5, cost: 90, era: 1, icon: "🗡️", model: "sword" },
    catapult: { name: "Catapult", str: 10, rStr: 35, ranged: true, range: 16, move: 4, cost: 100, era: 1, icon: "🪨", model: "siege", siege: true },
    crossbow: { name: "Crossbowman", str: 20, rStr: 40, ranged: true, range: 14, move: 5, cost: 100, era: 2, icon: "🎯", model: "bow" },
    knight: { name: "Knight", str: 48, rStr: 0, ranged: false, range: 0, move: 12, cost: 140, era: 2, icon: "🛡️", model: "horse" },

    // Renaissance / Ancient Advanced Tech (Instead of Musket/Cannon)
    arccaster: { name: "Arc-Caster", str: 55, rStr: 0, ranged: false, range: 0, move: 5, cost: 160, era: 3, icon: "⚡", model: "musket" },
    crystalcannon: { name: "Crystal Cannon", str: 15, rStr: 60, ranged: true, range: 18, move: 4, cost: 180, era: 3, icon: "🔮", model: "siege", siege: true },
    frigate: { name: "Aether Skiff", str: 40, rStr: 50, ranged: true, range: 14, move: 10, cost: 200, era: 3, icon: "🛸", model: "ship", naval: true },

    // Industrial / Advanced Ancients
    cavalry: { name: "Hover Chariot", str: 62, rStr: 0, ranged: false, range: 0, move: 14, cost: 200, era: 4, icon: "🛷", model: "horse" },
    sentinel: { name: "Golem Sentinel", str: 70, rStr: 0, ranged: false, range: 0, move: 5, cost: 250, era: 5, icon: "🗿", model: "modern" },
    artillery: { name: "Star-Bringer", str: 20, rStr: 80, ranged: true, range: 22, move: 4, cost: 280, era: 5, icon: "☄️", model: "siege", siege: true },

    // Modern / Pinnacle Tech
    tank: { name: "Goliath Walker", str: 85, rStr: 0, ranged: false, range: 0, move: 14, cost: 350, era: 6, icon: "🦾", model: "tank" },
    
    // Unique civ units (Added dynamically via the CIVS array logic)
};`;

code = code.replace(/const UNITS = \{[\s\S]*?\}\s*;\s*\n/, ancientUnits + '\n\n');

// Update Tech Tree and Buildings for Ancient Theme
code = code.replace(/"Mars Project"/g, '"Aethergate Ascension"');
code = code.replace(/mars: 0/g, 'aethergate: 0');
code = code.replace(/game\.victory = \{ type: "Mars", civ: playerCiv\.name \};/g, 'game.victory = { type: "Aethergate", civ: playerCiv.name };');
code = code.replace(/buildOpt === "tank"/g, 'buildOpt === "tank" || buildOpt === "walker" || buildOpt === "goliath"');

// Fix tech progress variable to track Aethergate properly if it was hardcoded 'mars'
code = code.replace(/playerCiv\.mars >= 1500/g, 'playerCiv.aethergate >= 1500');

fs.writeFileSync('src/App.jsx', code);
console.log('App rebuilt successfully');
