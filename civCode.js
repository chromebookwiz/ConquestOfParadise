import fs from 'fs';

// Ancient / Alternate History 48 Civs generator
const civData = [
    { id: "egypt", name: "Egypt", color: "#d4a843", icon: "𓂀", buffs: ["+20% Wonder Production", "Floodplains +1 Food"], uu: "Maryannu Chariot", uuEra: 0, uuStats: { str: 25, move: 10, cost: 50, model: "horse" } },
    { id: "rome", name: "Rome", color: "#9b1b1b", icon: "SPQR", buffs: ["Free roads to capital", "Cities start with Monument"], uu: "Legion", uuEra: 1, uuStats: { str: 40, move: 5, cost: 90, model: "sword" } },
    { id: "greece", name: "Greece (Athens)", color: "#2255aa", icon: "Ω", buffs: ["+15% Lore", "Wildcard policy slot"], uu: "Hoplite", uuEra: 1, uuStats: { str: 38, move: 5, cost: 80, model: "sword" } },
    { id: "sparta", name: "Greece (Sparta)", color: "#aa2222", icon: "Λ", buffs: ["Military +25% XP", "Units heal in enemy territory"], uu: "Agema", uuEra: 1, uuStats: { str: 42, move: 5, cost: 85, model: "sword" } },
    { id: "china", name: "China", color: "#cc2222", icon: "龍", buffs: ["Great Wall defense", "Builders have +1 charge"], uu: "Crouching Tiger", uuEra: 2, uuStats: { str: 10, rStr: 45, ranged: true, range: 10, move: 4, cost: 110, model: "siege", siege: true } },
    { id: "japan", name: "Japan", color: "#e8e8e8", icon: "侍", buffs: ["Full strength damaged", "Coastal combat bonus"], uu: "Samurai", uuEra: 2, uuStats: { str: 52, move: 5, cost: 130, model: "sword" } },
    { id: "india", name: "India", color: "#e68a00", icon: "ॐ", buffs: ["Faith +30%", "Bonus food from farms"], uu: "Varu", uuEra: 1, uuStats: { str: 45, move: 8, cost: 110, model: "horse" } },
    { id: "persia", name: "Persia", color: "#b8862a", icon: "☽", buffs: ["Golden Age length +50%", "+1 Movement in Golden Age"], uu: "Immortal", uuEra: 1, uuStats: { str: 35, rStr: 25, ranged: true, range: 10, move: 5, cost: 90, model: "bow" } },
    { id: "aztec", name: "Aztec", color: "#1a6633", icon: "☀", buffs: ["Luxury = +1 prod", "Workers capture enemies"], uu: "Eagle Warrior", uuEra: 0, uuStats: { str: 28, move: 6, cost: 45, model: "sword" } },
    { id: "mongolia", name: "Mongolia", color: "#4a2a8a", icon: "Ө", buffs: ["Cavalry +25%", "Captured cities grant cavalry"], uu: "Keshik", uuEra: 2, uuStats: { str: 30, rStr: 45, ranged: true, range: 12, move: 14, cost: 140, model: "horse" } },
    { id: "england", name: "England", color: "#1a3366", icon: "♔", buffs: ["Naval +20%", "Free melee unit settling across coast"], uu: "Sea Dog", uuEra: 3, uuStats: { str: 45, rStr: 55, ranged: true, range: 14, move: 12, cost: 210, model: "ship", naval: true } },
    { id: "france", name: "France", color: "#0055a4", icon: "⚜", buffs: ["Tourism +20%", "Spy effectiveness +1"], uu: "Garde Impériale", uuEra: 4, uuStats: { str: 68, move: 5, cost: 210, model: "musket" } },
    { id: "germany", name: "Germany", color: "#2a2a2a", icon: "✠", buffs: ["Production +15%", "+1 combat vs unaligned"], uu: "U-Boat", uuEra: 5, uuStats: { str: 60, rStr: 70, ranged: true, range: 14, move: 12, cost: 300, model: "ship", naval: true } },
    { id: "russia", name: "Russia", color: "#114477", icon: "Ж", buffs: ["Extra territory", "Tundra provides +1 Aether, +1 Lore"], uu: "Cossack", uuEra: 4, uuStats: { str: 68, move: 16, cost: 220, model: "horse" } },
    { id: "america", name: "America", color: "#3c3b6e", icon: "★", buffs: ["Diplomatic +50%", "+5 combat on home continent"], uu: "Rough Rider", uuEra: 5, uuStats: { str: 75, move: 14, cost: 260, model: "horse" } },
    { id: "brazil", name: "Brazil", color: "#009739", icon: "♦", buffs: ["Great People +15%", "Jungle +1 Lore"], uu: "Minas Geraes", uuEra: 5, uuStats: { str: 70, rStr: 85, ranged: true, range: 20, move: 10, cost: 320, model: "ship", naval: true } },
    { id: "arabia", name: "Arabia", color: "#1a4c33", icon: "☪", buffs: ["Faith/Aether synergy", "Cheaper temples"], uu: "Mamluk", uuEra: 2, uuStats: { str: 50, move: 12, cost: 150, model: "horse" } },
    { id: "ottoman", name: "Ottoman", color: "#c03a3a", icon: "☾", buffs: ["Siege +25%", "Naval units cost -20%"], uu: "Janissary", uuEra: 3, uuStats: { str: 60, move: 5, cost: 170, model: "musket" } },
    { id: "zulu", name: "Zulu", color: "#1a1a1a", icon: "⚒", buffs: ["XP gain +25%", "Cheaper corps"], uu: "Impi", uuEra: 2, uuStats: { str: 45, move: 6, cost: 120, model: "sword" } },
    { id: "kongo", name: "Kongo", color: "#6a4a2a", icon: "🛡", buffs: ["Relics +50%", "Extra food from artifacts"], uu: "Ngao Mbeba", uuEra: 1, uuStats: { str: 38, move: 5, cost: 90, model: "sword" } },
    { id: "spain", name: "Spain", color: "#ffc107", icon: "❦", buffs: ["Religious Combat", "Trade routes +2 gold"], uu: "Conquistador", uuEra: 3, uuStats: { str: 58, move: 12, cost: 180, model: "horse" } },
    { id: "netherlands", name: "Netherlands", color: "#e86020", icon: "🌷", buffs: ["Trade +50%", "Polders +1 food"], uu: "De Zeven Provinciën", uuEra: 3, uuStats: { str: 45, rStr: 60, ranged: true, range: 16, move: 12, cost: 220, model: "ship", naval: true } },
    { id: "poland", name: "Poland", color: "#cc2244", icon: "🦅", buffs: ["Culture bomb on forts", "Relic yields +2"], uu: "Winged Hussar", uuEra: 3, uuStats: { str: 62, move: 14, cost: 200, model: "horse" } },
    { id: "norway", name: "Norway", color: "#2a4a5a", icon: "ᚢ", buffs: ["Naval Raiding without movement cost", "Ocean travel unlocked early"], uu: "Berserker", uuEra: 2, uuStats: { str: 50, move: 6, cost: 130, model: "sword" } },
    { id: "sweden", name: "Sweden", color: "#1155aa", icon: "👑", buffs: ["Great People generation +20%", "Auto-theming museums"], uu: "Carolean", uuEra: 4, uuStats: { str: 65, move: 6, cost: 200, model: "musket" } },
    { id: "korea", name: "Korea", color: "#2a2aa8", icon: "태", buffs: ["Aether +20%", "Hills +1 Aether"], uu: "Hwacha", uuEra: 2, uuStats: { str: 20, rStr: 50, ranged: true, range: 14, move: 4, cost: 120, model: "siege", siege: true } },
    { id: "scythia", name: "Scythia", color: "#a84a20", icon: "🐎", buffs: ["Cavalry built in pairs", "Heal 30 HP on kill"], uu: "Saka Horse Archer", uuEra: 0, uuStats: { str: 15, rStr: 25, ranged: true, range: 10, move: 12, cost: 60, model: "bow" } },
    { id: "sumeria", name: "Sumeria", color: "#3a5a8a", icon: "𒀭", buffs: ["Early War no grievance", "Ziggurats +1 Aether"], uu: "War Cart", uuEra: 0, uuStats: { str: 30, move: 12, cost: 55, model: "wagon" } },
    { id: "babylon", name: "Babylon", color: "#2080a8", icon: "⛩", buffs: ["Full tech Eureka", "-50% raw Aether generation"], uu: "Sabum Kibittum", uuEra: 0, uuStats: { str: 22, move: 8, cost: 35, model: "sword" } },
    { id: "ethiopia", name: "Ethiopia", color: "#3a8a3a", icon: "🦁", buffs: ["Hill Defense +5", "Faith converts to Aether"], uu: "Oromo Cavalry", uuEra: 4, uuStats: { str: 65, move: 14, cost: 190, model: "horse" } },
    { id: "maori", name: "Maori", color: "#2a6a6a", icon: "🌀", buffs: ["Ocean start", "Unimproved woods +1 production"], uu: "Toa", uuEra: 1, uuStats: { str: 40, move: 5, cost: 85, model: "sword" } },
    { id: "vietnam", name: "Vietnam", color: "#1a5a4a", icon: "🐉", buffs: ["Jungle combat +5", "Districts in woods +1 Lore"], uu: "Voi Chiến", uuEra: 2, uuStats: { str: 40, rStr: 45, ranged: true, range: 12, move: 10, cost: 140, model: "horse" } },
    { id: "portugal", name: "Portugal", color: "#eeeeee", icon: "⚓", buffs: ["Naval Trade +50%", "Extra trade route capacity"], uu: "Nau", uuEra: 3, uuStats: { str: 35, move: 12, cost: 150, model: "ship", naval: true } },
    { id: "inca", name: "Inca", color: "#d4a040", icon: "⛰", buffs: ["Mountain yields +1 food", "Terrace farms +1 prod"], uu: "Warak'aq", uuEra: 2, uuStats: { str: 25, rStr: 40, ranged: true, range: 12, move: 8, cost: 110, model: "bow" } },
    { id: "mali", name: "Mali", color: "#e0b020", icon: "💰", buffs: ["Massive Gold generation", "Mines -1 Prod, +4 Gold"], uu: "Mandekalu Cavalry", uuEra: 2, uuStats: { str: 48, move: 12, cost: 150, model: "horse" } },
    { id: "phoenicia", name: "Phoenicia", color: "#5a2a8a", icon: "🚢", buffs: ["Coastal cities +loyalty", "Settlers +2 move embarked"], uu: "Bireme", uuEra: 0, uuStats: { str: 30, move: 10, cost: 70, model: "ship", naval: true } },
    { id: "scotland", name: "Scotland", color: "#2a4a8a", icon: "🦄", buffs: ["Happy Science +10%", "Happy Prod +10%"], uu: "Highlander", uuEra: 4, uuStats: { str: 60, rStr: 65, ranged: true, range: 14, move: 6, cost: 230, model: "bow" } },
    { id: "australia", name: "Australia", color: "#1a6a4a", icon: "🦘", buffs: ["Liberation bonus +100% prod", "Pastures +1 culture"], uu: "Digger", uuEra: 5, uuStats: { str: 72, move: 5, cost: 240, model: "modern" } },
    { id: "canada", name: "Canada", color: "#aa2222", icon: "🍁", buffs: ["No surprise war", "Tundra farms +2 food"], uu: "Mountie", uuEra: 5, uuStats: { str: 68, move: 14, cost: 220, model: "horse" } },
    { id: "nubia", name: "Nubia", color: "#8a5a20", icon: "🏹", buffs: ["Ranged +30% prod", "Mines +1 gold"], uu: "Pitati Archer", uuEra: 0, uuStats: { str: 18, rStr: 30, ranged: true, range: 14, move: 6, cost: 60, model: "bow" } },
    { id: "georgia", name: "Georgia", color: "#ee2222", icon: "✣", buffs: ["Walls + Faith", "Golden age dedication +1"], uu: "Khevsur", uuEra: 2, uuStats: { str: 48, move: 5, cost: 130, model: "sword" } },
    { id: "indonesia", name: "Indonesia", color: "#a82020", icon: "🛶", buffs: ["Coastal faith yields", "Naval faith buying"], uu: "Jong", uuEra: 2, uuStats: { str: 38, rStr: 45, ranged: true, range: 14, move: 14, cost: 150, model: "ship", naval: true } },
    { id: "khmer", name: "Khmer", color: "#2a8a5a", icon: "🐘", buffs: ["Aqueducts +3 faith", "Pop growth +10%"], uu: "Domrey", uuEra: 2, uuStats: { str: 35, rStr: 45, ranged: true, range: 14, move: 6, cost: 135, model: "siege", siege: true } },
    { id: "maya", name: "Maya", color: "#1a5a8a", icon: "🗿", buffs: ["Capital proximity +10% yields", "Farms +1 housing"], uu: "Hul'che", uuEra: 0, uuStats: { str: 16, rStr: 28, ranged: true, range: 12, move: 5, cost: 55, model: "bow" } },
    { id: "colombia", name: "Gran Colombia", color: "#ccaa11", icon: "⚔", buffs: ["Movement +1 all units", "Promotions don't end turn"], uu: "Llanero", uuEra: 4, uuStats: { str: 65, move: 16, cost: 200, model: "horse" } },
    { id: "byzantium", name: "Byzantium", color: "#aa2a6a", icon: "☦", buffs: ["Heavy Cavalry spreads religion", "+3 combat per holy city"], uu: "Tagma", uuEra: 2, uuStats: { str: 52, move: 12, cost: 160, model: "horse" } },
    { id: "gaul", name: "Gaul", color: "#4a6a2a", icon: "⚒", buffs: ["Mine Culture +1", "Encampments have ranged attack"], uu: "Gaesatae", uuEra: 0, uuStats: { str: 24, move: 6, cost: 45, model: "sword" } },
    { id: "mapuche", name: "Mapuche", color: "#2a8aa8", icon: "🦅", buffs: ["Combat vs Golden +10", "Governors provide loyalty"], uu: "Malón Raider", uuEra: 3, uuStats: { str: 55, move: 14, cost: 180, model: "horse" } }
];

let appCode = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Generate full CIVS array string
let civsString = \`const CIVS = [\n\`;
let newUnitsObj = '';
for (const civ of civData) {
    civsString += \`    { id: "\${civ.id}", name: "\${civ.name}", color: "\${civ.color}", icon: "\${civ.icon}", buffs: [\` + civ.buffs.map(b => \`"\${b}"\`).join(", ") + \`], uu: "\${civ.uu}" },\n\`;
    
    // Convert era correctly
    // Add unique trait to unit for identification
    let rStrProp = civ.uuStats.rStr ? \`, rStr: \${civ.uuStats.rStr}\` : '';
    let rangedProp = civ.uuStats.ranged ? \`, ranged: true, range: \${civ.uuStats.range}\` : '';
    let navalProp = civ.uuStats.naval ? \`, naval: true\` : '';
    let siegeProp = civ.uuStats.siege ? \`, siege: true\` : '';
    
    const key = civ.id + "_uu";
    newUnitsObj += \`    \${key}: { name: "\${civ.uu} (\${civ.name})", str: \${civ.uuStats.str}\${rStrProp}\${rangedProp}, move: \${civ.uuStats.move}, cost: \${civ.uuStats.cost}, era: \${civ.uuEra}, model: "\${civ.uuStats.model}"\${navalProp}\${siegeProp}, unique: "\${civ.id}" },\n\`;
}
civsString += \`];\`;

appCode = appCode.replace(/const CIVS = \[[\\s\\S]*?\];\s*?(?=\/\/)/, civsString + '\\n\\n');

// 2. Inject Unique Units into UNITS
appCode = appCode.replace(/\/\/ Unique civ units.*?(?=\s*\};)/, '// Unique civ units\\n' + newUnitsObj);

// 3. Update Menu UI to show 2 buffs instead of 1
// Previous code in App.jsx: {selCiv === civ.id && <span style={{ fontSize: 9, color: civ.accent || civ.color, opacity: 0.8 }}>{civ.bonus}</span>}
// Let's find UI displaying buffs and replace it. Wait, patch.js erased the bonuses inside the menu UI.
// Let's replace the grid rendering with an updated version.
const replacementGridInfo = \`{CIVS.map(civ => (
                            <button key={civ.id} onClick={() => setSelCiv(civ.id)} style={{
                                background: selCiv === civ.id ? \\\`linear-gradient(135deg, \\\${civ.color}44, \\\${civ.color}22)\\\` : "rgba(255,255,255,0.02)",
                                border: selCiv === civ.id ? \\\`1px solid \\\${civ.color}ee\\\` : "1px solid rgba(255,255,255,0.06)",
                                color: "var(--text)", padding: "8px 4px", cursor: "pointer", borderRadius: 4,
                                fontFamily: "'Cinzel', serif", fontSize: 10, transition: "all 0.2s",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                                boxShadow: selCiv === civ.id ? \\\`0 0 20px \\\${civ.color}44\\\` : "none",
                            }}>
                                <span style={{ fontSize: 18, lineHeight: 1, fontFamily: "serif" }}>{civ.icon}</span>
                                <span style={{ fontWeight: 600, letterSpacing: 0, textAlign: "center", lineHeight: 1 }}>{civ.name}</span>
                                {selCiv === civ.id && <span style={{ fontSize: 8, color: "var(--gold)", textAlign: "center", fontStyle: "italic", marginTop: 2 }}>{civ.buffs[0]}<br/>{civ.buffs[1]}<br/>UU: {civ.uu}</span>}
                            </button>
                        ))}\`;
                        
appCode = appCode.replace(/\{CIVS\.map\(civ => \([\s\S]*?<\/button>\s*\)\)\}/, replacementGridInfo);

fs.writeFileSync('src/App.jsx', appCode);
console.log('Civs and unique units updated successfully!');
