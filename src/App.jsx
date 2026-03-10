import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { BIOMES, RESOURCES, ERAS, TECHS, BUILDINGS, UNITS, CIVS } from "./data.js";

let MAP_W = 200, MAP_H = 140, NUM_CELLS = 260;

// ─────────────────────────────────────────────────────
// HELPERS & NOISE
// ─────────────────────────────────────────────────────
function dist(p1, p2) {
    if (!p1 || !p2) return 1e9;
    return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function seededRandom(s) {
    let mask = 0xffffffff;
    let m_w = (123456789 + s) & mask;
    let m_z = (987654321 - s) & mask;
    return () => {
        m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
        m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;
        let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
        return result / 4294967296;
    };
}

class SimplexNoise {
    constructor(seed = 0) {
        const rng = seededRandom(seed);
        this.p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        this.perm = new Uint8Array(512);
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    }
    dot(g, x, y) { return g[0] * x + g[1] * y; }
    noise2D(xin, yin) {
        const G2 = (3 - Math.sqrt(3)) / 6;
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        let n0, n1, n2;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        const ii = i & 255, jj = j & 255;
        const grad2 = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
        const gi0 = this.perm[ii + this.perm[jj]] % 8;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 8;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 8;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0; else { t0 *= t0; n0 = t0 * t0 * this.dot(grad2[gi0], x0, y0); }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0; else { t1 *= t1; n1 = t1 * t1 * this.dot(grad2[gi1], x1, y1); }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0; else { t2 *= t2; n2 = t2 * t2 * this.dot(grad2[gi2], x2, y2); }
        return 70 * (n0 + n1 + n2);
    }
}

// ─────────────────────────────────────────────────────
// VORONOI MAP GENERATION (d3-delaunay inline)
// ─────────────────────────────────────────────────────
function computeVoronoi(points, w, h) {
    // Simple Fortune's algorithm approximation via nearest-point assignment on grid
    const res = 2;
    const gw = Math.ceil(w / res), gh = Math.ceil(h / res);
    const assignment = new Int16Array(gw * gh);
    // Assign each grid cell to nearest point
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = gx * res, py = gy * res;
            let best = 0, bestD = 1e9;
            for (let i = 0; i < points.length; i++) {
                const d = (points[i][0] - px) ** 2 + (points[i][1] - py) ** 2;
                if (d < bestD) { bestD = d; best = i; }
            }
            assignment[gy * gw + gx] = best;
        }
    }
    // Find neighbors by checking adjacent grid cells
    const neighbors = points.map(() => new Set());
    for (let gy = 0; gy < gh - 1; gy++) {
        for (let gx = 0; gx < gw - 1; gx++) {
            const idx = gy * gw + gx;
            const c = assignment[idx];
            const r = assignment[idx + 1];
            const b = assignment[idx + gw];
            if (c !== r) { neighbors[c].add(r); neighbors[r].add(c); }
            if (c !== b) { neighbors[c].add(b); neighbors[b].add(c); }
        }
    }
    // Build polygon edges by tracing boundaries
    const polygons = points.map((p, i) => {
        const angles = [];
        // Sample boundary points
        const boundaryPts = [];
        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) {
                if (assignment[gy * gw + gx] !== i) continue;
                const px = gx * res, py = gy * res;
                // Check if on boundary
                let onBoundary = gx === 0 || gx === gw - 1 || gy === 0 || gy === gh - 1;
                if (!onBoundary) {
                    const idx = gy * gw + gx;
                    if (assignment[idx - 1] !== i || assignment[idx + 1] !== i || assignment[idx - gw] !== i || assignment[idx + gw] !== i) onBoundary = true;
                }
                if (onBoundary) boundaryPts.push([px, py]);
            }
        }
        if (boundaryPts.length < 3) return [[p[0] - 2, p[1] - 2], [p[0] + 2, p[1] - 2], [p[0] + 2, p[1] + 2], [p[0] - 2, p[1] + 2]];
        // Sort by angle
        const cx = p[0], cy = p[1];
        boundaryPts.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
        // Simplify - take every Nth point
        const step = Math.max(1, Math.floor(boundaryPts.length / 12));
        const simplified = [];
        for (let k = 0; k < boundaryPts.length; k += step) simplified.push(boundaryPts[k]);
        return simplified.length >= 3 ? simplified : boundaryPts.slice(0, Math.min(12, boundaryPts.length));
    });
    return { assignment, gw, gh, res, neighbors: neighbors.map(s => [...s]), polygons };
}

function generateMap(seed) {
    const rng = seededRandom(seed);
    const noise = new SimplexNoise(seed);
    const noise2 = new SimplexNoise(seed + 100);
    const noise3 = new SimplexNoise(seed + 200);

    const points = [];
    // Poisson-ish distribution
    for (let i = 0; i < NUM_CELLS; i++) {
        let px, py, ok;
        for (let attempt = 0; attempt < 30; attempt++) {
            px = 4 + rng() * (MAP_W - 8);
            py = 4 + rng() * (MAP_H - 8);
            ok = true;
            for (const p of points) {
                if (dist([px, py], p) < 6) { ok = false; break; }
            }
            if (ok) break;
        }
        points.push([px, py]);
    }

    const vor = computeVoronoi(points, MAP_W, MAP_H);
    const cells = [];

    for (let i = 0; i < points.length; i++) {
        const cx = points[i][0], cy = points[i][1];
        const nx = cx / MAP_W, ny = cy / MAP_H;

        let elevation = noise.noise2D(nx * 3, ny * 3) * 0.5 +
            noise.noise2D(nx * 6, ny * 6) * 0.25 +
            noise.noise2D(nx * 12, ny * 12) * 0.125;
        const edgeDist = Math.min(cx, cy, MAP_W - cx, MAP_H - cy) / 20;
        elevation = elevation * 0.7 + Math.min(edgeDist, 1) * 0.3 - 0.15;

        const moisture = noise2.noise2D(nx * 4, ny * 4) * 0.5 + noise2.noise2D(nx * 8, ny * 8) * 0.25 + 0.5;
        const latFactor = 1 - Math.abs(cy / MAP_H - 0.5) * 2;
        const temperature = latFactor * 0.7 + noise3.noise2D(nx * 3, ny * 3) * 0.3;

        let biome;
        if (elevation < -0.15) biome = "ocean";
        else if (elevation < -0.05) biome = "coast";
        else if (elevation > 0.45) biome = "mountain";
        else if (elevation > 0.3) biome = "hills";
        else if (temperature < 0.15) biome = "arctic";
        else if (temperature < 0.3) biome = "tundra";
        else if (moisture < 0.25) biome = "desert";
        else if (moisture > 0.65 && temperature > 0.6) biome = "jungle";
        else if (moisture > 0.5) biome = "forest";
        else if (moisture > 0.35) biome = "grassland";
        else biome = "plains";

        let resource = null;
        if (!["ocean", "mountain"].includes(biome) && rng() < 0.22) {
            const valid = Object.entries(RESOURCES).filter(([k, r]) => r.biomes.includes(biome));
            if (valid.length > 0) resource = valid[Math.floor(rng() * valid.length)][0];
        }
        if (biome === "coast" && rng() < 0.3) resource = "fish";

        cells.push({
            id: i, cx, cy, polygon: vor.polygons[i], neighbors: vor.neighbors[i],
            elevation, moisture, temperature, biome, resource,
            owner: null, visible: false, explored: false,
        });
    }

    // Rivers
    const rivers = [];
    const highCells = cells.filter(c => c.elevation > 0.25 && c.biome !== "ocean").sort((a, b) => b.elevation - a.elevation);
    for (let k = 0; k < Math.min(6, highCells.length); k++) {
        let cur = highCells[k];
        const path = [[cur.cx, cur.cy]];
        const visited = new Set([cur.id]);
        for (let step = 0; step < 20; step++) {
            const lower = cur.neighbors.filter(n => cells[n] && !visited.has(n) && cells[n].elevation < cur.elevation + 0.02);
            if (lower.length === 0) break;
            const next = lower.reduce((a, b) => cells[a].elevation < cells[b].elevation ? a : b);
            visited.add(next);
            path.push([cells[next].cx, cells[next].cy]);
            if (cells[next].biome === "ocean" || cells[next].biome === "coast") break;
            cur = cells[next];
        }
        if (path.length > 3) rivers.push(path);
    }

    return { cells, rivers, points };
}

// ─────────────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────────────
function getCellAt(cells, x, y) {
    let best = null, bestD = 1e9;
    for (const c of cells) {
        const d = (c.cx - x) ** 2 + (c.cy - y) ** 2;
        if (d < bestD) { bestD = d; best = c; }
    }
    return best;
}

function updateVis(cells, units, cities, playerCivIndex = 0) {
    for (const c of cells) c.visible = false;
    for (const u of units) {
        if (u.civId !== playerCivIndex) continue;
        const vr = (UNITS[u.type]?.move || 6) * 1.2;
        for (const c of cells) {
            if (dist([c.cx, c.cy], [u.x, u.y]) < vr) { c.visible = true; c.explored = true; }
        }
    }
    for (const city of cities) {
        if (city.civId !== playerCivIndex) continue;
        for (const c of cells) {
            if (dist([c.cx, c.cy], [city.x, city.y]) < (city.borderR || 8) + 6) { c.visible = true; c.explored = true; }
        }
    }
}

function cityYields(city, cells) {
    let f = 2, p = 2, g = 1, s = 1, cu = 1;
    for (const c of cells) {
        if (c.owner === city.civId && dist([c.cx, c.cy], [city.x, city.y]) < city.borderR) {
            const b = BIOMES[c.biome]; f += b.food; p += b.prod; g += b.gold;
            if (c.resource && RESOURCES[c.resource]) {
                const r = RESOURCES[c.resource].yield;
                f += (r.food || 0); p += (r.prod || 0); g += (r.gold || 0);
            }
        }
    }
    for (const bid of city.buildings) {
        const b = BUILDINGS[bid];
        if (b?.yield) { f += (b.yield.food || 0); p += (b.yield.prod || 0); g += (b.yield.gold || 0); s += (b.yield.science || 0); cu += (b.yield.culture || 0); }
    }
    s += Math.floor(city.pop * 0.5);
    let extraCult = 0;
    cities.forEach(c => {
        if (c.buildings.includes("colosseum") && dist([c.x, c.y], [city.x, city.y]) <= 15) extraCult += 2;
    });
    cu += extraCult;
    return { food: f, prod: p, gold: g, science: s, culture: cu };
}

function initGame(seed, civId, numAI, mapOpt = "Normal", playerCivIndex = 0) {
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
    const civs = [{ id: 0, ...playerCivData, isPlayer: true, gold: 0, science: 0, culture: 0, currentTech: "agriculture", techProg: 0, techs: [], score: 0, era: 0, aethergate: 0 }];
    const used = new Set([playerCivData.id]);
    const shuffled = [...CIVS].sort(() => rng() - 0.5);
    for (let i = 1; i <= numAI; i++) {
        const cd = shuffled.find(c => !used.has(c.id)) || shuffled[i % shuffled.length];
        used.add(cd.id);
        civs.push({ id: i, ...cd, isPlayer: false, gold: 0, science: 0, culture: 0, currentTech: "agriculture", techProg: 0, techs: [], score: 0, era: 0, aethergate: 0 });
    }

    const cities = [], units = [];
    let uid = 0;
    civs.forEach((civ, i) => {
        if (i >= starts.length) return;
        const cell = map.cells[starts[i]];
        cities.push({ id: i, civId: i, cellId: cell.id, name: `${civ.name}`, x: cell.cx, y: cell.cy, pop: 1, food: 0, foodNeed: 15, prod: 0, currentBuild: null, buildings: [], hp: 200, maxHp: 200, borderR: 8, culture: 0, isCapital: true, housing: 4 });
        map.cells.forEach(c => { if (dist([c.cx, c.cy], [cell.cx, cell.cy]) < 8) c.owner = i; });
        units.push({ id: uid++, type: "warrior", civId: i, x: cell.cx - 3, y: cell.cy + 2, hp: 100, maxHp: 100, moveLeft: 6, xp: 0, fortified: false });
        units.push({ id: uid++, type: "scout", civId: i, x: cell.cx + 3, y: cell.cy - 2, hp: 100, maxHp: 100, moveLeft: 10, xp: 0, fortified: false });
        units.push({ id: uid++, type: "settler", civId: i, x: cell.cx, y: cell.cy + 4, hp: 100, maxHp: 100, moveLeft: 5, xp: 0, fortified: false });
    });

    updateVis(map.cells, units, cities, 0);
    return { map, civs, cities, units, nextUid: uid, turn: 1, selUnit: null, selCity: null, combatLog: [], notifs: [], victory: null };
}

function doTurn(state, playerCivIndex = 0) {
    const { map, civs, cities, units } = state;
    const notifs = [];
    // Process each civ
    for (let ci = 0; ci < civs.length; ci++) {
        const civ = civs[ci];
        let tGold = 0, tSci = 0, tCul = 0;
        for (const city of cities.filter(c => c.civId === ci)) {
            const y = cityYields(city, map.cells);
            tGold += y.gold; tSci += y.science; tCul += y.culture;
            city.food += y.food - city.pop * 2;
            if (city.food >= city.foodNeed) {
                city.food -= city.foodNeed;
                if (city.pop < city.housing + 2) { city.pop++; city.foodNeed = Math.floor(city.foodNeed * 1.3); if (ci === playerCivIndex) notifs.push(`${city.name} grew to ${city.pop}!`); }
            }
            if (city.food < 0) { city.food = 0; if (city.pop > 1) city.pop--; }
            if (city.currentBuild) {
                city.prod += y.prod;
                const uType = UNITS[city.currentBuild];
                const bType = BUILDINGS[city.currentBuild];
                const cost = uType ? uType.cost : bType ? bType.cost : city.currentBuild === "mars_project" ? 500 : 999;
                if (city.prod >= cost) {
                    city.prod -= cost;
                    if (uType) {
                        units.push({ id: state.nextUid++, type: city.currentBuild, civId: ci, x: city.x + (Math.random() - 0.5) * 4, y: city.y + (Math.random() - 0.5) * 4, hp: 100, maxHp: 100, moveLeft: uType.move, xp: 0, fortified: false });
                        if (ci === playerCivIndex) notifs.push(`${city.name} trained ${uType.name}!`);
                    } else if (bType) {
                        city.buildings.push(city.currentBuild);
                        if (bType.defense) city.maxHp += bType.defense;
                        if (bType.housing) city.housing += bType.housing;
                        if (ci === playerCivIndex) notifs.push(`${city.name} built ${bType.name}!`);
                    } else if (city.currentBuild === "mars_project") {
                        civ.mars++;
                        if (ci === playerCivIndex) notifs.push(`Mars Project ${civ.mars}/5!`);
                        if (civ.mars >= 5) state.victory = { type: "Science", civ: civ.name };
                    }
                    city.currentBuild = null;
                }
            }
            city.culture += tCul;
            if (city.culture > city.borderR * 20) {
                city.borderR = Math.min(city.borderR + 1, 25);
                map.cells.forEach(c => { if (!c.owner && dist([c.cx, c.cy], [city.x, city.y]) < city.borderR) c.owner = ci; });
            }
            if (city.hp < city.maxHp) city.hp = Math.min(city.maxHp, city.hp + 10);
        }
        civ.gold += tGold; civ.science += tSci; civ.culture += tCul;
        if (civ.currentTech) {
            civ.techProg += tSci;
            const tech = TECHS.find(t => t.id === civ.currentTech);
            if (tech && civ.techProg >= tech.cost) {
                civ.techs.push(civ.currentTech); civ.techProg = 0;
                if (ci === playerCivIndex) notifs.push(`Discovered ${tech.name}!`);
                civ.era = Math.max(civ.era, tech.era);
                const avail = TECHS.filter(t => !civ.techs.includes(t.id) && t.req.every(r => civ.techs.includes(r)));
                civ.currentTech = avail.length > 0 ? avail.sort((a, b) => a.cost - b.cost)[0].id : null;
            }
        }
        // AI actions
        if (!civ.isPlayer) {
            for (const city of cities.filter(c => c.civId === ci)) {
                if (!city.currentBuild) {
                    const mil = units.filter(u => u.civId === ci && (UNITS[u.type]?.str || 0) > 0).length;
                    if (mil < 3) { const avail = Object.entries(UNITS).filter(([k, u]) => u.era <= civ.era && u.str > 0 && !u.naval); city.currentBuild = avail.length > 0 ? avail[avail.length - 1][0] : "warrior"; }
                    else city.currentBuild = !city.buildings.includes("library") && civ.techs.includes("writing") ? "library" : !city.buildings.includes("granary") && civ.techs.includes("pottery") ? "granary" : "warrior";
                }
            }
            // AI unit movement
            for (const unit of units.filter(u => u.civId === ci && (UNITS[u.type]?.str || 0) > 0)) {
                const enemies = units.filter(u => u.civId !== ci && dist([u.x, u.y], [unit.x, unit.y]) < 30);
                if (enemies.length > 0 && unit.hp > 40) {
                    const t = enemies[0];
                    const d = dist([unit.x, unit.y], [t.x, t.y]);
                    const mv = Math.min((UNITS[unit.type]?.move || 5) * 0.7, d);
                    unit.x += ((t.x - unit.x) / d) * mv; unit.y += ((t.y - unit.y) / d) * mv;
                    if (dist([unit.x, unit.y], [t.x, t.y]) < 4) {
                        const dmg = Math.max(5, Math.floor(30 * (UNITS[unit.type].str / Math.max(1, UNITS[t.type]?.str || 10))));
                        const dmg2 = Math.max(3, Math.floor(20 * ((UNITS[t.type]?.str || 10) / Math.max(1, UNITS[unit.type].str))));
                        t.hp -= dmg; unit.hp -= dmg2;
                        if (t.hp <= 0) { const idx = units.indexOf(t); if (idx !== -1) units.splice(idx, 1); }
                        if (unit.hp <= 0) { const idx = units.indexOf(unit); if (idx !== -1) units.splice(idx, 1); }
                    }
                } else {
                    unit.x += (Math.random() - 0.5) * (UNITS[unit.type]?.move || 5) * 0.6;
                    unit.y += (Math.random() - 0.5) * (UNITS[unit.type]?.move || 5) * 0.6;
                    unit.x = clamp(unit.x, 4, MAP_W - 4); unit.y = clamp(unit.y, 4, MAP_H - 4);
                }
            }
            // AI settlers
            for (const unit of [...units.filter(u => u.civId === ci && UNITS[u.type]?.special === "settle")]) {
                const aiCities = cities.filter(c => c.civId === ci).length;
                if (aiCities < 3) {
                    unit.x += (Math.random() - 0.5) * 8; unit.y += (Math.random() - 0.5) * 8;
                    unit.x = clamp(unit.x, 8, MAP_W - 8); unit.y = clamp(unit.y, 8, MAP_H - 8);
                    const cell = getCellAt(map.cells, unit.x, unit.y);
                    if (cell && !["ocean", "coast", "mountain"].includes(cell.biome) && !cities.some(c => dist([c.x, c.y], [unit.x, unit.y]) < 12)) {
                        cities.push({ id: cities.length, civId: ci, cellId: cell.id, name: `${civ.name} ${aiCities + 1}`, x: unit.x, y: unit.y, pop: 1, food: 0, foodNeed: 15, prod: 0, currentBuild: null, buildings: [], hp: 200, maxHp: 200, borderR: 6, culture: 0, isCapital: false, housing: 4 });
                        map.cells.forEach(c => { if (!c.owner && dist([c.cx, c.cy], [unit.x, unit.y]) < 6) c.owner = ci; });
                        const idx = units.indexOf(unit); if (idx !== -1) units.splice(idx, 1);
                    }
                }
            }
        }
        // Reset movement
        for (const u of units.filter(u => u.civId === ci)) { u.moveLeft = UNITS[u.type]?.move || 5; if (u.fortified) u.hp = Math.min(u.maxHp, u.hp + 5); }
        // Score
        civ.score = cities.filter(c => c.civId === ci).reduce((s, c) => s + c.pop * 5, 0) + civ.techs.length * 3 + units.filter(u => u.civId === ci).length * 2 + Math.floor(civ.gold / 10);
    }
    updateVis(map.cells, units, cities, 0);
    if (state.turn >= 300 && !state.victory) {
        const w = civs.reduce((a, b) => a.score > b.score ? a : b);
        state.victory = { type: "Score", civ: w.name };
    }
    return { ...state, turn: state.turn + 1, notifs };
}

// ─────────────────────────────────────────────────────
// THREE.JS 3D RENDERER
// ─────────────────────────────────────────────────────
function init3D(container, gameState) {
    const THREE = window.THREE;
    if (!THREE) return null;

    const w = container.clientWidth, h = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);
    scene.fog = new THREE.FogExp2(0x1a2a3e, 0.003);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(MAP_W / 2, 80, MAP_H / 2 + 60);
    camera.lookAt(MAP_W / 2, 0, MAP_H / 2);

    // Lights
    const ambient = new THREE.AmbientLight(0x4466aa, 0.4);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a5a2a, 0.5);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe8c0, 1.2);
    sun.position.set(MAP_W * 0.3, 60, -MAP_H * 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -MAP_W;
    sun.shadow.camera.right = MAP_W;
    sun.shadow.camera.top = MAP_H;
    sun.shadow.camera.bottom = -MAP_H;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    scene.add(sun);

    // Terrain
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    // Create terrain mesh per cell
    const biomeColors = {
        ocean: 0x14374e, coast: 0x1e5e8a, desert: 0xc8a946, plains: 0x7fa84a,
        grassland: 0x4a8c2a, forest: 0x2a6620, jungle: 0x1a5410, hills: 0x8a7858,
        mountain: 0x6a6a7a, tundra: 0x7a9098, arctic: 0xc8d8e4,
    };

    const cellMeshes = [];
    const { cells, rivers } = gameState.map;

    cells.forEach((cell, idx) => {
        const poly = cell.polygon;
        if (!poly || poly.length < 3) return;
        const shape = new THREE.Shape();
        shape.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) shape.lineTo(poly[i][0], poly[i][1]);
        shape.closePath();

        const h = Math.max(0.1, (cell.elevation + 0.2) * 12);
        const waterLevel = cell.biome === "ocean" || cell.biome === "coast";
        const extH = waterLevel ? 0.3 : h;

        const geo = new THREE.ExtrudeGeometry(shape, { depth: extH, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 1 });
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, waterLevel ? -0.5 : 0, 0);

        const color = biomeColors[cell.biome] || 0x666666;
        const mat = new THREE.MeshStandardMaterial({
            color,
            roughness: waterLevel ? 0.2 : 0.85,
            metalness: waterLevel ? 0.3 : 0.05,
            flatShading: !waterLevel,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        mesh.castShadow = !waterLevel;
        mesh.userData = { cellId: idx };
        terrainGroup.add(mesh);
        cellMeshes.push(mesh);

        // Trees for forest/jungle
        if ((cell.biome === "forest" || cell.biome === "jungle") && cell.visible) {
            const numTrees = 3 + Math.floor(Math.random() * 4);
            for (let t = 0; t < numTrees; t++) {
                const tx = cell.cx + (Math.random() - 0.5) * 5;
                const tz = cell.cy + (Math.random() - 0.5) * 5;
                const treeH = 1.5 + Math.random() * 2;
                // Trunk
                const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, treeH * 0.4, 5);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set(tx, h + treeH * 0.2, tz);
                trunk.castShadow = true;
                terrainGroup.add(trunk);
                // Canopy
                const canopyGeo = new THREE.SphereGeometry(treeH * 0.35, 6, 5);
                const canopyColor = cell.biome === "jungle" ? 0x1a5a10 : 0x2a7020;
                const canopyMat = new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.8, flatShading: true });
                const canopy = new THREE.Mesh(canopyGeo, canopyMat);
                canopy.position.set(tx, h + treeH * 0.5, tz);
                canopy.castShadow = true;
                terrainGroup.add(canopy);
            }
        }

        // Mountain peaks
        if (cell.biome === "mountain") {
            const peakGeo = new THREE.ConeGeometry(2.5, 6, 6);
            const peakMat = new THREE.MeshStandardMaterial({ color: 0x8a8a9a, roughness: 0.7, flatShading: true });
            const peak = new THREE.Mesh(peakGeo, peakMat);
            peak.position.set(cell.cx, h + 3, cell.cy);
            peak.castShadow = true;
            terrainGroup.add(peak);
            // Snow cap
            const snowGeo = new THREE.ConeGeometry(1.2, 2, 6);
            const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f8, roughness: 0.4 });
            const snow = new THREE.Mesh(snowGeo, snowMat);
            snow.position.set(cell.cx, h + 6, cell.cy);
            terrainGroup.add(snow);
        }

        // Hills bumps
        if (cell.biome === "hills") {
            for (let b = 0; b < 2; b++) {
                const bx = cell.cx + (Math.random() - 0.5) * 4;
                const bz = cell.cy + (Math.random() - 0.5) * 4;
                const bumpGeo = new THREE.SphereGeometry(1.5 + Math.random(), 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.5);
                const bumpMat = new THREE.MeshStandardMaterial({ color: 0x8a7a58, roughness: 0.9, flatShading: true });
                const bump = new THREE.Mesh(bumpGeo, bumpMat);
                bump.position.set(bx, h, bz);
                bump.castShadow = true;
                terrainGroup.add(bump);
            }
        }

        // Desert dunes
        if (cell.biome === "desert") {
            const duneGeo = new THREE.SphereGeometry(2, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.3);
            const duneMat = new THREE.MeshStandardMaterial({ color: 0xd4b850, roughness: 0.95 });
            const dune = new THREE.Mesh(duneGeo, duneMat);
            dune.position.set(cell.cx + Math.random() * 2, h, cell.cy + Math.random() * 2);
            dune.scale.set(1.5, 0.6, 1);
            terrainGroup.add(dune);
        }
    });

    // Rivers as tube geometry
    rivers.forEach(rPath => {
        if (rPath.length < 2) return;
        const pts = rPath.map(p => new THREE.Vector3(p[0], 2, p[1]));
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, rPath.length * 4, 0.4, 6, false);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x3388cc, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.8 });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        terrainGroup.add(tube);
    });

    // Water plane
    const waterGeo = new THREE.PlaneGeometry(MAP_W * 1.5, MAP_H * 1.5);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0a2840, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(MAP_W / 2, -0.8, MAP_H / 2);
    scene.add(water);

    // Dynamic objects group
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    return { renderer, scene, camera, terrainGroup, dynamicGroup, cellMeshes, raycaster, mouse, water };
}

function createUnitMesh(THREE, unit, civColor) {
    const group = new THREE.Group();
    const uType = UNITS[unit.type];
    const col = new THREE.Color(civColor);
    const darkCol = col.clone().multiplyScalar(0.6);

    // Base platform
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    group.add(base);

    // Unit-specific model
    if (uType.model === "sword" || uType.model === "musket" || uType.model === "modern") {
        // Humanoid
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: darkCol, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        body.castShadow = true;
        group.add(body);
        const headGeo = new THREE.SphereGeometry(0.2, 6, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.6;
        group.add(head);
        if (uType.model === "sword") {
            const swordGeo = new THREE.BoxGeometry(0.06, 0.8, 0.06);
            const swordMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
            const sword = new THREE.Mesh(swordGeo, swordMat);
            sword.position.set(0.35, 1.0, 0);
            sword.rotation.z = 0.3;
            group.add(sword);
        }
        // Shield for swordsman/knight era
        if (uType.era >= 1 && uType.model === "sword") {
            const shieldGeo = new THREE.BoxGeometry(0.4, 0.5, 0.06);
            const shieldMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.2 });
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.position.set(-0.35, 1.0, 0);
            group.add(shield);
        }
    } else if (uType.model === "bow") {
        const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.1, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a6a3a, roughness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.75;
        body.castShadow = true;
        group.add(body);
        const headGeo = new THREE.SphereGeometry(0.18, 6, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.5;
        group.add(head);
        // Bow
        const bowCurve = new THREE.EllipseCurve(0, 0, 0.4, 0.15, -Math.PI * 0.7, Math.PI * 0.7, false);
        const bowPts = bowCurve.getPoints(12);
        const bowGeo = new THREE.BufferGeometry().setFromPoints(bowPts.map(p => new THREE.Vector3(p.x, p.y, 0)));
        const bowMat = new THREE.LineBasicMaterial({ color: 0x8a6a30 });
        const bow = new THREE.Line(bowGeo, bowMat);
        bow.position.set(-0.3, 1.0, 0);
        bow.rotation.z = Math.PI / 2;
        group.add(bow);
    } else if (uType.model === "horse") {
        // Horse body
        const horseGeo = new THREE.BoxGeometry(1.2, 0.6, 0.5);
        const horseMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.8 });
        const horse = new THREE.Mesh(horseGeo, horseMat);
        horse.position.y = 0.7;
        horse.castShadow = true;
        group.add(horse);
        // Head
        const hHeadGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3);
        const hHead = new THREE.Mesh(hHeadGeo, horseMat);
        hHead.position.set(0.7, 1.1, 0);
        hHead.rotation.z = 0.3;
        group.add(hHead);
        // Rider
        const riderGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 6);
        const riderMat = new THREE.MeshStandardMaterial({ color: darkCol, roughness: 0.7 });
        const rider = new THREE.Mesh(riderGeo, riderMat);
        rider.position.set(0, 1.4, 0);
        rider.castShadow = true;
        group.add(rider);
        // Legs
        for (let l = 0; l < 4; l++) {
            const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4);
            const leg = new THREE.Mesh(legGeo, horseMat);
            leg.position.set((l < 2 ? 0.4 : -0.4), 0.25, (l % 2 === 0 ? 0.15 : -0.15));
            group.add(leg);
        }
    } else if (uType.model === "wagon") {
        // Settler wagon
        const wagonGeo = new THREE.BoxGeometry(1.2, 0.5, 0.8);
        const wagonMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 });
        const wagon = new THREE.Mesh(wagonGeo, wagonMat);
        wagon.position.y = 0.6;
        wagon.castShadow = true;
        group.add(wagon);
        // Canvas top
        const canvasGeo = new THREE.SphereGeometry(0.6, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const canvasMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 });
        const canvas = new THREE.Mesh(canvasGeo, canvasMat);
        canvas.position.y = 0.85;
        canvas.scale.set(1.2, 0.8, 0.8);
        group.add(canvas);
        // Wheels
        for (let wh = 0; wh < 4; wh++) {
            const wheelGeo = new THREE.TorusGeometry(0.2, 0.05, 6, 8);
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set((wh < 2 ? 0.5 : -0.5), 0.25, (wh % 2 === 0 ? 0.45 : -0.45));
            wheel.rotation.y = Math.PI / 2;
            group.add(wheel);
        }
    } else if (uType.model === "siege") {
        // Siege weapon
        const frameGeo = new THREE.BoxGeometry(1.0, 0.3, 0.6);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 0.9 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.5;
        frame.castShadow = true;
        group.add(frame);
        // Arm
        const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 4);
        const arm = new THREE.Mesh(armGeo, frameMat);
        arm.position.set(0, 1.0, 0);
        arm.rotation.z = 0.5;
        arm.castShadow = true;
        group.add(arm);
        // Wheels
        for (let wh = 0; wh < 2; wh++) {
            const wheelGeo = new THREE.TorusGeometry(0.25, 0.06, 6, 8);
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(0, 0.25, wh === 0 ? 0.4 : -0.4);
            wheel.rotation.y = Math.PI / 2;
            group.add(wheel);
        }
    } else if (uType.model === "tank") {
        const hullGeo = new THREE.BoxGeometry(1.4, 0.4, 0.9);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.7, metalness: 0.3 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 0.5;
        hull.castShadow = true;
        group.add(hull);
        const turretGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.3, 8);
        const turret = new THREE.Mesh(turretGeo, hullMat);
        turret.position.y = 0.85;
        turret.castShadow = true;
        group.add(turret);
        const barrelGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6);
        const barrel = new THREE.Mesh(barrelGeo, new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6 }));
        barrel.position.set(0.6, 0.85, 0);
        barrel.rotation.z = Math.PI / 2;
        group.add(barrel);
        // Tracks
        for (let s = -1; s <= 1; s += 2) {
            const trackGeo = new THREE.BoxGeometry(1.5, 0.25, 0.15);
            const trackMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
            const track = new THREE.Mesh(trackGeo, trackMat);
            track.position.set(0, 0.25, s * 0.5);
            group.add(track);
        }
    } else if (uType.model === "ship") {
        const hullShape = new THREE.Shape();
        hullShape.moveTo(-0.8, 0); hullShape.quadraticCurveTo(-0.8, 0.4, 0, 0.5);
        hullShape.quadraticCurveTo(0.8, 0.4, 0.8, 0); hullShape.lineTo(-0.8, 0);
        const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.6, bevelEnabled: false });
        const hullMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.8 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.rotation.x = -Math.PI / 2;
        hull.position.set(0, 0.2, -0.3);
        hull.castShadow = true;
        group.add(hull);
        // Mast
        const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 2, 4);
        const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({ color: 0x5a3a1a }));
        mast.position.y = 1.2;
        group.add(mast);
        // Sail
        const sailGeo = new THREE.PlaneGeometry(0.8, 1.2);
        const sailMat = new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.9 });
        const sail = new THREE.Mesh(sailGeo, sailMat);
        sail.position.set(0.1, 1.4, 0);
        group.add(sail);
    } else {
        // Default - simple figure
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.0, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: darkCol, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.7;
        body.castShadow = true;
        group.add(body);
        const headGeo = new THREE.SphereGeometry(0.18, 6, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.4;
        group.add(head);
    }

    // Selection ring (hidden by default)
    const ringGeo = new THREE.TorusGeometry(0.8, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.visible = false;
    group.add(ring);
    group.userData = { unitId: unit.id, selectionRing: ring };

    // HP bar (sprite)
    const canvas = document.createElement("canvas");
    canvas.width = 64; canvas.height = 8;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#222"; ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = unit.hp > 50 ? "#4a4" : "#a44";
    ctx.fillRect(1, 1, 62 * (unit.hp / unit.maxHp), 6);
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 0.15, 1);
    sprite.position.y = 2.2;
    group.add(sprite);
    group.userData.hpSprite = sprite;
    group.userData.hpCanvas = canvas;

    return group;
}

function createCityMesh(THREE, city, civColor) {
    const group = new THREE.Group();
    const col = new THREE.Color(civColor);

    // Main building
    const buildGeo = new THREE.BoxGeometry(1.5, 1.8, 1.5);
    const buildMat = new THREE.MeshStandardMaterial({ color: 0xd0c0a0, roughness: 0.7 });
    const build = new THREE.Mesh(buildGeo, buildMat);
    build.position.y = 0.9;
    build.castShadow = true;
    group.add(build);

    // Roof
    const roofGeo = new THREE.ConeGeometry(1.3, 1.0, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3a2a, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Side buildings
    for (let i = 0; i < Math.min(city.pop, 6); i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = 2 + Math.random();
        const bh = 0.6 + Math.random() * 0.8;
        const sGeo = new THREE.BoxGeometry(0.7, bh, 0.7);
        const sMat = new THREE.MeshStandardMaterial({ color: 0xc0b090, roughness: 0.8 });
        const sMesh = new THREE.Mesh(sGeo, sMat);
        sMesh.position.set(Math.cos(angle) * r, bh / 2, Math.sin(angle) * r);
        sMesh.castShadow = true;
        group.add(sMesh);
    }

    // Banner
    const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 3, 4);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.5 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 1.5, 0);
    group.add(pole);
    const flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
    const flagMat = new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.9 });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.4, 2.8, 0);
    group.add(flag);

    // Border ring
    const borderGeo = new THREE.RingGeometry(city.borderR - 0.3, city.borderR, 32);
    const borderMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.rotation.x = -Math.PI / 2;
    borderMesh.position.y = 0.1;
    group.add(borderMesh);
    group.userData = { cityId: city.id, borderMesh };

    return group;
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function HexlessGame() {
    const [screen, setScreen] = useState("menu");
    const [game, setGame] = useState(null);
    const [selCiv, setSelCiv] = useState("egypt");
    const [mapSize, setMapSize] = useState("Normal");
    const [hoveredCell, setHoveredCell] = useState(null);
    const [panel, setPanel] = useState("tech"); // tech | city | civs
    const [showCivList, setShowCivList] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [threeLoaded, setThreeLoaded] = useState(false);
    const containerRef = useRef(null);
    const threeRef = useRef(null);
    const animRef = useRef(null);
    const playerCivIndex = 0;
    const cameraControlRef = useRef({ yaw: 0, pitch: 0.8, dist: 60, targetX: MAP_W / 2, targetZ: MAP_H / 2, isDragging: false, lastMouse: [0, 0] });

    const emitState = useCallback((s) => {
        setGame({ ...s });
    }, []);

    // Load Three.js
    useEffect(() => {
        if (window.THREE) { setThreeLoaded(true); return; }
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        s.onload = () => setThreeLoaded(true);
        document.head.appendChild(s);
    }, []);

    const startGame = useCallback(() => {
        const state = initGame(Math.floor(Math.random() * 99999), selCiv, 4, mapSize, 0);
        setGame(state);
        setScreen("game");
    }, [selCiv]);

    // 3D Scene setup
    useEffect(() => {
        if (screen !== "game" || !game || !threeLoaded || !containerRef.current) return;
        if (threeRef.current) return; // already initialized

        const ctx = init3D(containerRef.current, game);
        if (!ctx) return;
        threeRef.current = ctx;

        const cam = cameraControlRef.current;
        const startCity = game.cities.find(c => c.civId === playerCivIndex);
        if (startCity) { cam.targetX = startCity.x; cam.targetZ = startCity.y; }

        // Update dynamic objects
        const updateDynamic = () => {
            const THREE = window.THREE;
            const { dynamicGroup } = ctx;
            // Clear old
            while (dynamicGroup.children.length) dynamicGroup.remove(dynamicGroup.children[0]);

            // Cities
            for (const city of game.cities) {
                const cell = getCellAt(game.map.cells, city.x, city.y);
                if (cell && !cell.explored) continue;
                const civData = game.civs[city.civId];
                const mesh = createCityMesh(THREE, city, civData?.color || "#888");
                const h = cell ? Math.max(0.3, (cell.elevation + 0.2) * 12) : 1;
                mesh.position.set(city.x, h, city.y);
                dynamicGroup.add(mesh);
            }

            // Units
            for (const unit of game.units) {
                const cell = getCellAt(game.map.cells, unit.x, unit.y);
                if (cell && !cell.visible) continue;
                const civData = game.civs[unit.civId];
                const mesh = createUnitMesh(THREE, unit, civData?.color || "#888");
                const h = cell ? Math.max(0.3, (cell.elevation + 0.2) * 12) : 1;
                mesh.position.set(unit.x, h, unit.y);
                // Show selection ring
                if (game.selUnit === unit.id) mesh.userData.selectionRing.visible = true;
                dynamicGroup.add(mesh);
            }
        };

        updateDynamic();

        // Animation loop
        let time = 0;
        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            time += 0.01;

            // Camera orbit
            const { yaw, pitch, dist: d, targetX, targetZ } = cam;
            ctx.camera.position.set(
                targetX + Math.sin(yaw) * Math.cos(pitch) * d,
                Math.sin(pitch) * d,
                targetZ + Math.cos(yaw) * Math.cos(pitch) * d
            );
            ctx.camera.lookAt(targetX, 0, targetZ);

            // Animate water
            if (ctx.water) {
                ctx.water.position.y = -0.8 + Math.sin(time * 2) * 0.1;
            }

            // Fog of war via material opacity
            game.map.cells.forEach((cell, i) => {
                if (ctx.cellMeshes[i]) {
                    const mat = ctx.cellMeshes[i].material;
                    if (!cell.explored) { mat.opacity = 0.15; mat.transparent = true; }
                    else if (!cell.visible) { mat.opacity = 0.5; mat.transparent = true; }
                    else { mat.opacity = 1; mat.transparent = false; }
                }
            });

            ctx.renderer.render(ctx.scene, ctx.camera);
        };
        animate();

        // Store update function
        threeRef.current.updateDynamic = updateDynamic;

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            if (ctx.renderer && containerRef.current) {
                try { containerRef.current.removeChild(ctx.renderer.domElement); } catch (e) { }
            }
            threeRef.current = null;
        };
    }, [screen, game?.turn, threeLoaded]);

    // Update 3D when game changes
    useEffect(() => {
        if (threeRef.current?.updateDynamic && game) threeRef.current.updateDynamic();
    }, [game]);

    // Mouse handlers for 3D
    const handlePointerDown = (e) => {
        if (!game) return;
        const cam = cameraControlRef.current;
        if (e.button === 2 || e.button === 1) {
            cam.isDragging = true;
            cam.lastMouse = [e.clientX, e.clientY];
            return;
        }
        // Left click - raycast
        if (!threeRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        threeRef.current.mouse.set(mx, my);
        threeRef.current.raycaster.setFromCamera(threeRef.current.mouse, threeRef.current.camera);

        // Check units first
        const unitIntersects = threeRef.current.raycaster.intersectObjects(threeRef.current.dynamicGroup.children, true);
        for (const hit of unitIntersects) {
            let obj = hit.object;
            while (obj.parent && !obj.userData.unitId && obj.parent !== threeRef.current.dynamicGroup) obj = obj.parent;
            if (obj.userData.unitId !== undefined) {
                const unit = game.units.find(u => u.id === obj.userData.unitId);
                if (unit && unit.civId === playerCivIndex) {
                    emitState({ ...game, selUnit: unit.id, selCity: null });
                    setPanel("tech");
                    return;
                }
            }
            if (obj.userData.cityId !== undefined) {
                const city = game.cities.find(c => c.id === obj.userData.cityId);
                if (city && city.civId === playerCivIndex) {
                    emitState({ ...game, selCity: city.id, selUnit: null });
                    setPanel("city");
                    return;
                }
            }
        }

        // Check terrain
        const terrainIntersects = threeRef.current.raycaster.intersectObjects(threeRef.current.cellMeshes);
        if (terrainIntersects.length > 0) {
            const hit = terrainIntersects[0];
            const cellId = hit.object.userData.cellId;
            const cell = game.map.cells[cellId];
            if (!cell) return;
            setHoveredCell(cellId);

            // If unit selected, try to move
            if (game.selUnit !== null) {
                const unit = game.units.find(u => u.id === game.selUnit);
                if (unit && unit.moveLeft > 0) {
                    // Check for enemy at target
                    const enemy = game.units.find(u => u.civId !== playerCivIndex && dist([u.x, u.y], [cell.cx, cell.cy]) < 4);
                    if (enemy) {
                        const uType = UNITS[unit.type];
                        const range = uType.ranged ? uType.range : 4;
                        if (dist([unit.x, unit.y], [enemy.x, enemy.y]) <= range) {
                            // Combat
                            const aStr = uType.ranged ? (uType.rStr || uType.str) : uType.str;
                            const dStr = UNITS[enemy.type]?.str || 10;
                            const dmg = Math.max(5, Math.floor(30 * aStr / Math.max(1, dStr)));
                            const dmg2 = uType.ranged ? 0 : Math.max(3, Math.floor(20 * dStr / Math.max(1, aStr)));
                            enemy.hp -= dmg; unit.hp -= dmg2;
                            unit.moveLeft = 0; unit.xp += 5;
                            if (enemy.hp <= 0) { const idx = game.units.indexOf(enemy); if (idx !== -1) game.units.splice(idx, 1); unit.xp += 10; }
                            if (unit.hp <= 0) { const idx = game.units.indexOf(unit); if (idx !== -1) game.units.splice(idx, 1); }
                            emitState({ ...game, combatLog: [...game.combatLog, `${uType.name} attacks ${UNITS[enemy.type]?.name}: ${dmg} dmg`] });
                            return;
                        }
                    }

                    // Move
                    if (BIOMES[cell.biome]?.moveCost < 999) {
                        const d = dist([unit.x, unit.y], [cell.cx, cell.cy]);
                        const cost = d / (0.8 * BIOMES[cell.biome].moveCost);
                        if (cost <= unit.moveLeft + 0.1) {
                            // Settle
                            if (UNITS[unit.type]?.special === "settle") {
                                if (!game.cities.some(c => dist([c.x, c.y], [cell.cx, cell.cy]) < 12) && !["ocean", "coast", "mountain"].includes(cell.biome)) {
                                    const civ = game.civs[playerCivIndex];
                                    const name = `${civ.name} ${game.cities.filter(c => c.civId === playerCivIndex).length + 1}`;
                                    game.cities.push({ id: game.cities.length, civId: playerCivIndex, cellId: cell.id, name, x: cell.cx, y: cell.cy, pop: 1, food: 0, foodNeed: 15, prod: 0, currentBuild: null, buildings: [], hp: 200, maxHp: 200, borderR: 6, culture: 0, isCapital: false, housing: 4 });
                                    game.map.cells.forEach(c => { if (!c.owner && dist([c.cx, c.cy], [cell.cx, cell.cy]) < 6) c.owner = playerCivIndex; });
                                    const idx = game.units.indexOf(unit); if (idx !== -1) game.units.splice(idx, 1);
                                    updateVis(game.map.cells, game.units, game.cities, playerCivIndex);
                                    emitState({ ...game, selUnit: null, notifs: [`Founded ${name}!`] });
                                    setNotifs([`Founded ${name}!`]); setTimeout(() => setNotifs([]), 3000);
                                    return;
                                }
                            }
                            unit.x = cell.cx; unit.y = cell.cy;
                            unit.moveLeft -= cost; unit.fortified = false;
                            updateVis(game.map.cells, game.units, game.cities, playerCivIndex);
                            emitState({ ...game });
                        }
                    }
                }
            }
        }
    };

    const handlePointerMove = (e) => {
        const cam = cameraControlRef.current;
        if (cam.isDragging) {
            const dx = e.clientX - cam.lastMouse[0];
            const dy = e.clientY - cam.lastMouse[1];
            cam.yaw -= dx * 0.005;
            cam.pitch = clamp(cam.pitch + dy * 0.003, 0.2, 1.4);
            cam.lastMouse = [e.clientX, e.clientY];
        }
    };

    const handlePointerUp = () => { cameraControlRef.current.isDragging = false; };

    const handleWheel = (e) => {
        const cam = cameraControlRef.current;
        cam.dist = clamp(cam.dist + e.deltaY * 0.05, 15, 150);
        // Pan with scroll
        const forward = [Math.sin(cam.yaw), Math.cos(cam.yaw)];
        if (e.shiftKey) {
            cam.targetX += forward[0] * e.deltaY * 0.05;
            cam.targetZ += forward[1] * e.deltaY * 0.05;
        }
    };

    const handleKeyDown = useCallback((e) => {
        const cam = cameraControlRef.current;
        const speed = 3;
        const fw = [Math.sin(cam.yaw), Math.cos(cam.yaw)];
        const rt = [Math.cos(cam.yaw), -Math.sin(cam.yaw)];
        if (e.key === "w" || e.key === "ArrowUp") { cam.targetX -= fw[0] * speed; cam.targetZ -= fw[1] * speed; }
        if (e.key === "s" || e.key === "ArrowDown") { cam.targetX += fw[0] * speed; cam.targetZ += fw[1] * speed; }
        if (e.key === "a" || e.key === "ArrowLeft") { cam.targetX -= rt[0] * speed; cam.targetZ -= rt[1] * speed; }
        if (e.key === "d" || e.key === "ArrowRight") { cam.targetX += rt[0] * speed; cam.targetZ += rt[1] * speed; }
        if (e.key === "q") cam.yaw -= 0.1;
        if (e.key === "e") cam.yaw += 0.1;
    }, []);

    useEffect(() => {
        if (screen === "game") {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [screen, handleKeyDown]);

    const endTurn = useCallback(() => {
        if (!game) return;
        const newState = doTurn({ ...game }, playerCivIndex);
        emitState(newState);
        if (newState.notifs.length > 0) { setNotifs(newState.notifs); setTimeout(() => setNotifs([]), 4000); }
    }, [game]);

    const playerCiv = game?.civs?.[playerCivIndex];
    const selUnit = game?.units?.find(u => u.id === game?.selUnit);
    const selCity = game?.cities?.find(c => c.id === game?.selCity);

    // ─────────────────────────────────────────────────────
    // CSS
    // ─────────────────────────────────────────────────────
    const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --gold: #c9a84c; --gold-light: #e8d48b; --gold-dark: #8a6a20;
      --bg-deep: #0c0e14; --bg-panel: #12141e; --bg-card: #181c28;
      --border: #2a2e3a; --border-gold: #4a3a1a;
      --text: #d8d0c0; --text-dim: #706858; --text-bright: #f0e8d8;
      --accent-red: #a83030; --accent-green: #308a30; --accent-blue: #3060a8;
    }
    body { overflow: hidden; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg-deep); }
    ::-webkit-scrollbar-thumb { background: var(--gold-dark); border-radius: 3px; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes glow { 0%, 100% { text-shadow: 0 0 10px rgba(201,168,76,0.3); } 50% { text-shadow: 0 0 30px rgba(201,168,76,0.6), 0 0 60px rgba(201,168,76,0.2); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes rotateGlow { 0% { transform: rotate(0deg); opacity: 0.3; } 50% { opacity: 0.6; } 100% { transform: rotate(360deg); opacity: 0.3; } }
    .ornate-border { border: 1px solid var(--border); position: relative; }
    .ornate-border::before { content: ''; position: absolute; top: -1px; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-dark), transparent); }
    .ornate-border::after { content: ''; position: absolute; bottom: -1px; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-dark), transparent); }
    .btn-gold { background: linear-gradient(180deg, #2a2010 0%, #1a1408 100%); border: 1px solid var(--gold-dark); color: var(--gold); cursor: pointer; font-family: 'Cinzel', serif; transition: all 0.2s; position: relative; overflow: hidden; }
    .btn-gold:hover { background: linear-gradient(180deg, #3a2a14 0%, #2a1a0a 100%); border-color: var(--gold); box-shadow: 0 0 12px rgba(201,168,76,0.2); }
    .btn-gold::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); transition: 0.5s; }
    .btn-gold:hover::after { left: 100%; }
    .parchment {
      background: #f4e4bc;
      background-image: url('https://www.transparenttextures.com/patterns/papyros.png');
      color: #2a1a0a;
      border: 2px solid #8b5e34;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 40px rgba(139,94,52,0.2);
      position: relative;
    }
    .ancient-card {
      background: rgba(20, 15, 10, 0.85);
      border: 1px solid var(--gold-dark);
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
    }
    .dropdown-scroll::-webkit-scrollbar { width: 4px; }
    .dropdown-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
    .dropdown-scroll::-webkit-scrollbar-thumb { background: var(--gold-dark); border-radius: 2px; }
    .yield-badge { display: inline-flex; align-items: center; gap: 2px; padding: 1px 5px; border-radius: 3px; font-size: 11px; background: rgba(255,255,255,0.04); }
    .progress-bar { height: 4px; background: var(--bg-deep); border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
    .tab-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; font-family: 'Cinzel', serif; font-size: 11px; padding: 6px 12px; letter-spacing: 1px; transition: all 0.15s; border-bottom: 2px solid transparent; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); }
  `;

    // ─────────────────────────────────────────────────────
    // MENU SCREEN
    // ─────────────────────────────────────────────────────
    if (screen === "menu") {
        return (
            <div style={{ width: "100vw", height: "100vh", background: `radial-gradient(ellipse at 30% 20%, #1a1428 0%, #0c0e14 50%, #080a10 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", color: "var(--text)", overflow: "hidden", position: "relative" }}>
                <style>{css}</style>
                {/* Ornamental corners */}
                <div style={{ position: "absolute", inset: 20, border: "1px solid rgba(201,168,76,0.1)", pointerEvents: "none" }}>
                    {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => (
                        <div key={v + h} style={{ position: "absolute", [v]: -2, [h]: -2, width: 30, height: 30, borderTop: v === "top" ? "2px solid var(--gold-dark)" : "none", borderBottom: v === "bottom" ? "2px solid var(--gold-dark)" : "none", borderLeft: h === "left" ? "2px solid var(--gold-dark)" : "none", borderRight: h === "right" ? "2px solid var(--gold-dark)" : "none" }} />
                    ))}
                </div>
                {/* Stars */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                    {Array.from({ length: 80 }).map((_, i) => (
                        <div key={i} style={{ position: "absolute", left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: Math.random() * 2 + 0.5, height: Math.random() * 2 + 0.5, background: "#e8d8b0", borderRadius: "50%", opacity: Math.random() * 0.5 + 0.1, animation: `pulse ${3 + Math.random() * 4}s ease-in-out infinite`, animationDelay: `${Math.random() * 5}s` }} />
                    ))}
                </div>

                {/* Ancient Background Ornament */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, border: "1px solid rgba(201,168,76,0.05)", borderRadius: "50%", pointerEvents: "none", animation: "rotateGlow 20s linear infinite" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, border: "1px solid rgba(201,168,76,0.03)", borderRadius: "50%", pointerEvents: "none", animation: "rotateGlow 30s linear reverse infinite" }} />

                {/* Title */}
                <div style={{ textAlign: "center", zIndex: 1, animation: "fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                    <div style={{ fontSize: 13, letterSpacing: 12, textTransform: "uppercase", color: "var(--gold-dark)", marginBottom: 16, fontWeight: 700, opacity: 0.8 }}>A Gridless 4X Strategy Game</div>
                    <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 96, fontWeight: 900, margin: 0, letterSpacing: 12, background: "linear-gradient(180deg, #f0e6c8 0%, #c9a84c 40%, #8a6a20 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "glow 5s ease-in-out infinite", lineHeight: 0.9 }}>HEXLESS</h1>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, fontStyle: "italic", color: "var(--text-dim)", marginTop: 20, letterSpacing: 3, opacity: 0.7 }}>"The world is yours to claim."</div>
                </div>

                {/* Civ selection Dropdown */}
                <div style={{ marginTop: 60, zIndex: 10, animation: "fadeUp 1.5s ease", width: "100%", maxWidth: 500, position: "relative" }}>
                    <div style={{ fontSize: 12, letterSpacing: 6, textTransform: "uppercase", color: "var(--gold-dark)", textAlign: "center", marginBottom: 20, fontWeight: 600 }}>Choose Your Civilization</div>

                    {/* Main Dropdown Button */}
                    <div
                        onClick={() => setShowCivList(!showCivList)}
                        className="ancient-card"
                        style={{
                            padding: "16px 24px",
                            cursor: "pointer",
                            borderRadius: "8px 8px 0 0",
                            border: "1px solid var(--gold-dark)",
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            transition: "all 0.3s",
                            borderBottom: showCivList ? "none" : "1px solid var(--gold-dark)",
                            background: "linear-gradient(135deg, rgba(30,25,20,0.95), rgba(15,12,10,0.95))"
                        }}
                    >
                        <span style={{ fontSize: 32, textShadow: `0 0 15px ${CIVS.find(c => c.id === selCiv)?.color}66` }}>
                            {CIVS.find(c => c.id === selCiv)?.icon}
                        </span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "var(--gold-light)" }}>
                                {CIVS.find(c => c.id === selCiv)?.name.toUpperCase()}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{CIVS.find(c => c.id === selCiv)?.buffs[0]}</div>
                        </div>
                        <span style={{ transform: showCivList ? "rotate(180deg)" : "none", transition: "0.3s", color: "var(--gold)" }}>▼</span>
                    </div>

                    {/* Dropdown List */}
                    {showCivList && (
                        <div
                            className="dropdown-scroll"
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                maxHeight: 280,
                                overflowY: "auto",
                                background: "rgba(10,8,6,0.98)",
                                border: "1px solid var(--gold-dark)",
                                borderTop: "none",
                                borderBottomLeftRadius: 8,
                                borderBottomRightRadius: 8,
                                zIndex: 100,
                                boxShadow: "0 20px 40px rgba(0,0,0,0.8)"
                            }}
                        >
                            {CIVS.map(civ => (
                                <div
                                    key={civ.id}
                                    onClick={() => { setSelCiv(civ.id); setShowCivList(false); }}
                                    style={{
                                        padding: "12px 24px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 14,
                                        cursor: "pointer",
                                        background: selCiv === civ.id ? `linear-gradient(90deg, ${civ.color}33, transparent)` : "transparent",
                                        transition: "all 0.2s",
                                        borderBottom: "1px solid rgba(255,255,255,0.03)"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(90deg, ${civ.color}22, transparent)`; }}
                                    onMouseLeave={(e) => { if (selCiv !== civ.id) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <span style={{ fontSize: 24 }}>{civ.icon}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>{civ.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Civ Details parchment */}
                    {selCiv && (
                        <div className="ancient-card" style={{ marginTop: 24, padding: "20px 24px", borderRadius: 8, animation: "fadeIn 0.5s ease" }}>
                            <div style={{ display: "flex", gap: 30 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: "var(--gold-dark)", letterSpacing: 2, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>Civilization Traits</div>
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                        {CIVS.find(c => c.id === selCiv)?.buffs.map((buff, i) => (
                                            <li key={i} style={{ fontSize: 13, color: "var(--text)", marginBottom: 6, display: "flex", gap: 8, alignItems: "flex-start" }}>
                                                <span style={{ color: "var(--gold)" }}>•</span>
                                                {buff}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div style={{ width: "1px", background: "linear-gradient(180deg, transparent, var(--gold-dark), transparent)", opacity: 0.3 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: "var(--gold-dark)", letterSpacing: 2, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>Unique Unit</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                        <span style={{ fontSize: 20 }}>{UNITS[selCiv + "_uu"]?.icon || "⚔️"}</span>
                                        <span style={{ fontWeight: 700, color: "var(--gold-light)", fontSize: 14 }}>{CIVS.find(c => c.id === selCiv)?.uu}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>
                                        {UNITS[selCiv + "_uu"]?.str} Combat Strength · {UNITS[selCiv + "_uu"]?.move} Movement
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Start button panel */}
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                        <button onClick={startGame} className="btn-gold" style={{
                            padding: "16px 80px", fontSize: 18, fontWeight: 900, letterSpacing: 6, borderRadius: 4,
                            boxShadow: "0 0 40px rgba(201,168,76,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                            textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                        }}>
                            CONQUER
                        </button>
                        <div style={{ marginTop: 24, fontSize: 11, color: "var(--text-dim)", letterSpacing: 3, fontFamily: "'EB Garamond', serif", opacity: 0.6 }}>
                            ~ THE AGE OF DISCOVERY AWAITS ~
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────
    // VICTORY SCREEN
    // ─────────────────────────────────────────────────────
    if (game?.victory) {
        return (
            <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at center, #1a1428, #0c0e14)", fontFamily: "'Cinzel Decorative', serif", color: "var(--gold-light)" }}>
                <style>{css}</style>
                <div style={{ fontSize: 14, letterSpacing: 8, color: "var(--gold-dark)", marginBottom: 24, textTransform: "uppercase" }}>{game.victory.type} Victory</div>
                <h1 style={{ fontSize: 48, background: "linear-gradient(180deg, #f0e6c8, #c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🏆 {game.victory.civ} Wins!</h1>
                <div style={{ marginTop: 16, fontSize: 14, color: "var(--text-dim)", fontFamily: "'EB Garamond', serif" }}>Turn {game.turn}</div>
                <button onClick={() => { setScreen("menu"); setGame(null); threeRef.current = null; }} className="btn-gold" style={{ marginTop: 40, padding: "12px 40px", fontSize: 14, letterSpacing: 3, borderRadius: 4 }}>Return to Menu</button>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────
    // GAME SCREEN
    // ─────────────────────────────────────────────────────
    if (screen !== "game" || !game) return null;

    const pCities = game.cities.filter(c => c.civId === playerCivIndex);
    const totalY = pCities.reduce((a, city) => { const y = cityYields(city, game.map.cells); return { food: a.food + y.food, prod: a.prod + y.prod, gold: a.gold + y.gold, science: a.science + y.science, culture: a.culture + y.culture }; }, { food: 0, prod: 0, gold: 0, science: 0, culture: 0 });
    const curTech = TECHS.find(t => t.id === playerCiv?.currentTech);
    const availTechs = TECHS.filter(t => !playerCiv?.techs?.includes(t.id) && t.req.every(r => playerCiv?.techs?.includes(r)));
    const hovCell = hoveredCell !== null ? game.map.cells[hoveredCell] : null;

    const availBuilds = selCity ? [
        ...Object.entries(UNITS).filter(([k, u]) => u.era <= (playerCiv?.era || 0) && !u.naval).map(([k, u]) => ({ id: k, name: u.name, cost: u.cost, icon: u.icon, type: "unit" })),
        ...Object.entries(BUILDINGS).filter(([k]) => !selCity.buildings.includes(k)).map(([k, b]) => ({ id: k, name: b.name, cost: b.cost, icon: b.icon, type: "building" })),
        ...(playerCiv?.techs?.includes("rocketry") && selCity.buildings.includes("spaceport") ? [{ id: "mars_project", name: `Mars ${(playerCiv?.mars || 0) + 1}/5`, cost: 500, icon: "🚀", type: "project" }] : []),
    ] : [];

    return (
        <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-deep)", fontFamily: "'Cinzel', serif", color: "var(--text)", overflow: "hidden", userSelect: "none" }}>
            <style>{css}</style>

            {/* ─── TOP BAR ─── */}
            <div style={{ height: 48, background: "linear-gradient(180deg, #16182400 0%, #161824 100%)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 20px", gap: 0, fontSize: 12, flexShrink: 0, position: "relative", zIndex: 20 }}>
                {/* Gold ornament line */}
                <div style={{ position: "absolute", bottom: 0, left: "5%", right: "5%", height: 1, background: "linear-gradient(90deg, transparent, var(--gold-dark), transparent)" }} />

                <span style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 14, color: "var(--gold)", letterSpacing: 3, marginRight: 20 }}>HEXLESS</span>

                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span className="yield-badge" style={{ color: "#8cba44" }}>🌾 {totalY.food}</span>
                    <span className="yield-badge" style={{ color: "#c8964a" }}>⚒️ {totalY.prod}</span>
                    <span className="yield-badge" style={{ color: "#d4a843" }}>💰 {Math.floor(playerCiv?.gold || 0)} <span style={{ opacity: 0.5 }}>+{totalY.gold}</span></span>
                    <span className="yield-badge" style={{ color: "#5a9aca" }}>🔬 {totalY.science}</span>
                    <span className="yield-badge" style={{ color: "#a86aaa" }}>🎭 {totalY.culture}</span>
                </div>

                {/* Tech progress */}
                <div style={{ marginLeft: 20, display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    {curTech && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>🔬</span>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{curTech.name}</span>
                            <div className="progress-bar" style={{ width: 80 }}>
                                <div className="progress-fill" style={{ width: `${((playerCiv?.techProg || 0) / curTech.cost) * 100}%`, background: "linear-gradient(90deg, #3060a8, #5a9aca)" }} />
                            </div>
                            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{Math.floor(playerCiv?.techProg || 0)}/{curTech.cost}</span>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 11 }}>
                    <span style={{ color: "var(--gold-dark)" }}>{ERAS[playerCiv?.era || 0]} Era</span>
                    <span style={{ color: "var(--text-dim)" }}>Turn {game.turn}</span>
                    <span style={{ color: "var(--gold)" }}>⭐ {playerCiv?.score || 0}</span>
                </div>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
                {/* ─── 3D VIEWPORT ─── */}
                <div
                    ref={containerRef}
                    style={{ flex: 1, cursor: "grab", position: "relative" }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onWheel={handleWheel}
                    onContextMenu={e => e.preventDefault()}
                />

                {/* ─── RIGHT PANEL ─── */}
                <div className="ornate-border" style={{ width: 300, background: "var(--bg-panel)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, borderTop: "none", borderBottom: "none", borderRight: "none" }}>
                    {/* Tab bar */}
                    <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-deep)" }}>
                        <button className={`tab-btn ${panel === "tech" ? "active" : ""}`} onClick={() => setPanel("tech")}>RESEARCH</button>
                        <button className={`tab-btn ${panel === "city" ? "active" : ""}`} onClick={() => setPanel("city")}>CITY</button>
                        <button className={`tab-btn ${panel === "civs" ? "active" : ""}`} onClick={() => setPanel("civs")}>WORLD</button>
                    </div>

                    {/* Cell info on hover */}
                    {hovCell && (
                        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", fontSize: 11 }}>
                            <div style={{ fontWeight: 700, color: "var(--gold-light)", fontSize: 12 }}>{BIOMES[hovCell.biome]?.name}</div>
                            <div style={{ color: "var(--text-dim)", marginTop: 2 }}>
                                Elev: {hovCell.elevation.toFixed(2)} · {BIOMES[hovCell.biome]?.moveCost >= 999 ? "Impassable" : `${BIOMES[hovCell.biome]?.moveCost}× move`}
                            </div>
                            <div style={{ marginTop: 2 }}>
                                <span className="yield-badge">🌾{BIOMES[hovCell.biome]?.food}</span>{" "}
                                <span className="yield-badge">⚒️{BIOMES[hovCell.biome]?.prod}</span>{" "}
                                <span className="yield-badge">💰{BIOMES[hovCell.biome]?.gold}</span>
                                {hovCell.resource && <span style={{ marginLeft: 6 }}>{RESOURCES[hovCell.resource]?.icon} {hovCell.resource}</span>}
                            </div>
                        </div>
                    )}

                    {/* Selected unit */}
                    {selUnit && (
                        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "rgba(201,168,76,0.03)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 20 }}>{UNITS[selUnit.type]?.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--gold-light)" }}>{UNITS[selUnit.type]?.name}</div>
                                    <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
                                        ❤️ {selUnit.hp}/{selUnit.maxHp} · 🏃 {selUnit.moveLeft.toFixed(1)}/{UNITS[selUnit.type]?.move}
                                        · ⚔️ {UNITS[selUnit.type]?.str}{UNITS[selUnit.type]?.ranged ? ` · 🏹 ${UNITS[selUnit.type]?.rStr}` : ""}
                                        · XP: {selUnit.xp}
                                    </div>
                                </div>
                            </div>
                            <div className="progress-bar" style={{ marginTop: 6 }}>
                                <div className="progress-fill" style={{ width: `${selUnit.hp}%`, background: selUnit.hp > 50 ? "var(--accent-green)" : "var(--accent-red)" }} />
                            </div>
                            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                                <button className="btn-gold" onClick={() => { selUnit.fortified = true; selUnit.moveLeft = 0; emitState({ ...game }); }} style={{ padding: "4px 10px", fontSize: 10, letterSpacing: 1 }}>🛡️ Fortify</button>
                                <button className="btn-gold" onClick={() => { selUnit.moveLeft = 0; emitState({ ...game }); }} style={{ padding: "4px 10px", fontSize: 10, letterSpacing: 1 }}>💤 Skip</button>
                                {UNITS[selUnit.type]?.special === "settle" && (
                                    <button className="btn-gold" style={{ padding: "4px 10px", fontSize: 10, letterSpacing: 1, color: "var(--accent-green)" }}>🏙️ Settle</button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Panel content */}
                    <div style={{ flex: 1, overflow: "auto", padding: "10px 12px" }}>
                        {/* RESEARCH panel */}
                        {panel === "tech" && (
                            <div>
                                {curTech && (
                                    <div style={{ marginBottom: 12, padding: 10, background: "var(--bg-card)", borderRadius: 4, border: "1px solid var(--border)" }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-light)" }}>🔬 {curTech.name}</div>
                                        <div className="progress-bar" style={{ marginTop: 6 }}>
                                            <div className="progress-fill" style={{ width: `${((playerCiv?.techProg || 0) / curTech.cost) * 100}%`, background: "linear-gradient(90deg, #2a4a7a, #5a9aca)" }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>{Math.floor(playerCiv?.techProg || 0)}/{curTech.cost} · ~{Math.ceil((curTech.cost - (playerCiv?.techProg || 0)) / Math.max(1, totalY.science))} turns</div>
                                    </div>
                                )}
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--gold-dark)", marginBottom: 6, textTransform: "uppercase" }}>Available</div>
                                {availTechs.map(tech => (
                                    <button key={tech.id} className={`btn-build ${playerCiv?.currentTech === tech.id ? "active" : ""}`} onClick={() => { playerCiv.currentTech = tech.id; playerCiv.techProg = 0; emitState({ ...game }); }} style={{ width: "100%", padding: "6px 10px", marginBottom: 3, borderRadius: 3, fontSize: 11 }}>
                                        <span style={{ fontSize: 14 }}>🔬</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{tech.name}</div>
                                            <div style={{ fontSize: 9, color: "var(--text-dim)" }}>{ERAS[tech.era]} · {tech.cost} 🔬</div>
                                        </div>
                                    </button>
                                ))}
                                {/* Combat log */}
                                {game.combatLog.length > 0 && (
                                    <div style={{ marginTop: 20, padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 4, maxHeight: 100, overflowY: "auto", fontSize: 10, color: "var(--text-dim)" }}>
                                        {game.combatLog.slice(-5).map((log, i) => <div key={i}>{log}</div>)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CITY panel */}
                        {panel === "city" && selCity && (
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold-light)", marginBottom: 4 }}>🏙️ {selCity.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
                                    Pop: {selCity.pop}/{selCity.housing} · HP: {selCity.hp}/{selCity.maxHp}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
                                    <div className="yield-badge" style={{ justifyContent: "center", color: "#8cba44", padding: 4 }}>🌾 {cityYields(selCity, game.map.cells).food}</div>
                                    <div className="yield-badge" style={{ justifyContent: "center", color: "#c8964a", padding: 4 }}>⚒️ {cityYields(selCity, game.map.cells).prod}</div>
                                </div>

                                {selCity.currentBuild ? (
                                    <div style={{ padding: 10, background: "var(--bg-card)", borderRadius: 4, marginBottom: 12 }}>
                                        <div style={{ fontSize: 11, color: "var(--gold)" }}>Building: {UNITS[selCity.currentBuild]?.name || BUILDINGS[selCity.currentBuild]?.name || 'Mars Project'}</div>
                                        <div className="progress-bar" style={{ marginTop: 6, marginBottom: 4 }}>
                                            <div className="progress-fill" style={{ width: `${(selCity.prod / (UNITS[selCity.currentBuild]?.cost || BUILDINGS[selCity.currentBuild]?.cost || 500)) * 100}%`, background: "var(--gold-dark)" }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{Math.floor(selCity.prod)} / {UNITS[selCity.currentBuild]?.cost || BUILDINGS[selCity.currentBuild]?.cost || 500}</div>
                                        <button className="btn-build" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => { selCity.currentBuild = null; emitState({ ...game }); }}>Cancel</button>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 12 }}>Idle. Choose production:</div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {availBuilds.map(b => (
                                        <button key={b.id} className="btn-build" onClick={() => { selCity.currentBuild = b.id; emitState({ ...game }); }} style={{ padding: "6px 10px" }}>
                                            <span style={{ fontSize: 14 }}>{b.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 11, fontWeight: 600 }}>{b.name}</div>
                                                <div style={{ fontSize: 9, color: "var(--text-dim)" }}>{b.cost} ⚒️</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* WORLD panel */}
                        {panel === "civs" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>Civilizations</div>
                                {game.civs.map((c, i) => (
                                    <div key={i} style={{ padding: "8px 12px", background: "var(--bg-card)", borderLeft: `3px solid ${c.color}`, borderRadius: 4, display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: 18 }}>{c.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-bright)" }}>{c.name} {i === playerCivIndex ? "(You)" : ""}</div>
                                            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{ERAS[c.era] || 'Ancient'} Era · Score {c.score}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* End Turn Button */}
                    <button className="btn-gold" style={{ padding: 16, fontSize: 14, fontWeight: 700, letterSpacing: 3, borderTop: "1px solid var(--border-gold)", borderRadius: 0 }} onClick={endTurn}>
                        END TURN
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none", zIndex: 100 }}>
                {notifs.map((n, i) => (
                    <div key={i} style={{ background: "rgba(0,0,0,0.8)", border: "1px solid var(--gold-dark)", padding: "8px 16px", borderRadius: 4, fontSize: 12, color: "var(--gold-light)", animation: "fadeUp 0.3s ease", letterSpacing: 1 }}>
                        {n}
                    </div>
                ))}
            </div>
        </div>
    );
}
