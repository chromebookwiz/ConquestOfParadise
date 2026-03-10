// data.js
export const BIOMES = {
    ocean: { color: "#14374e", name: "Deep Ocean", moveCost: 999, food: 0, prod: 0, gold: 1, def: 0, height: -0.4 },
    coast: { color: "#1e5e8a", name: "Coast", moveCost: 2, food: 1, prod: 0, gold: 2, def: 0, height: -0.1 },
    desert: { color: "#c8a946", name: "Desert", moveCost: 1.2, food: 0, prod: 1, gold: 1, def: -5, height: 0.05 },
    plains: { color: "#7fa84a", name: "Plains", moveCost: 1, food: 2, prod: 1, gold: 0, def: 0, height: 0.08 },
    grassland: { color: "#4a8c2a", name: "Grassland", moveCost: 1, food: 3, prod: 1, gold: 0, def: 0, height: 0.06 },
    forest: { color: "#2a6620", name: "Forest", moveCost: 1.5, food: 1, prod: 2, gold: 0, def: 10, height: 0.12 },
    jungle: { color: "#1a5410", name: "Jungle", moveCost: 2, food: 2, prod: 0, gold: 0, def: 10, height: 0.10 },
    hills: { color: "#8a7858", name: "Hills", moveCost: 1.5, food: 1, prod: 2, gold: 0, def: 15, height: 0.25 },
    mountain: { color: "#6a6a7a", name: "Mountain", moveCost: 999, food: 0, prod: 1, gold: 0, def: 25, height: 0.5 },
    tundra: { color: "#7a9098", name: "Tundra", moveCost: 1.2, food: 1, prod: 1, gold: 0, def: 0, height: 0.04 },
    arctic: { color: "#c8d8e4", name: "Arctic", moveCost: 1.5, food: 0, prod: 0, gold: 0, def: 5, height: 0.02 },
};

export const RESOURCES = {
    wheat: { icon: "🌾", yield: { food: 2 }, biomes: ["plains", "grassland"] },
    cattle: { icon: "🐄", yield: { food: 2, prod: 1 }, biomes: ["plains", "grassland"] },
    fish: { icon: "🐟", yield: { food: 3 }, biomes: ["coast"] },
    iron: { icon: "⛏️", yield: { prod: 3 }, biomes: ["hills", "mountain"] },
    horses: { icon: "🐎", yield: { prod: 1, food: 1 }, biomes: ["plains", "grassland"] },
    gold_res: { icon: "💰", yield: { gold: 4 }, biomes: ["desert", "hills"] },
    gems: { icon: "💎", yield: { gold: 3 }, biomes: ["jungle", "mountain"] },
    oil: { icon: "🛢️", yield: { prod: 3, gold: 1 }, biomes: ["desert", "tundra", "coast"] },
    spices: { icon: "🌶️", yield: { gold: 2, food: 1 }, biomes: ["jungle", "forest"] },
    marble: { icon: "🏛️", yield: { prod: 1, gold: 2 }, biomes: ["plains", "hills"] },
    wine: { icon: "🍷", yield: { gold: 2 }, biomes: ["grassland", "plains"] },
    silk: { icon: "🧵", yield: { gold: 3 }, biomes: ["forest", "jungle"] },
    deer: { icon: "🦌", yield: { food: 2, prod: 1 }, biomes: ["tundra", "forest"] },
};

export const ERAS = ["Ancient", "Classical", "Medieval", "Renaissance", "Industrial", "Modern", "Atomic", "Information"];

export const TECHS = [
    { id: "agriculture", name: "Agriculture", era: 0, cost: 25, req: [] },
    { id: "pottery", name: "Pottery", era: 0, cost: 30, req: [] },
    { id: "mining", name: "Mining", era: 0, cost: 30, req: [] },
    { id: "sailing", name: "Sailing", era: 0, cost: 40, req: [] },
    { id: "archery", name: "Archery", era: 0, cost: 30, req: [] },
    { id: "animal_husbandry", name: "Animal Husbandry", era: 0, cost: 30, req: ["agriculture"] },
    { id: "writing", name: "Writing", era: 1, cost: 50, req: ["pottery"] },
    { id: "bronze_working", name: "Bronze Working", era: 1, cost: 50, req: ["mining"] },
    { id: "iron_working", name: "Iron Working", era: 1, cost: 70, req: ["bronze_working"] },
    { id: "mathematics", name: "Mathematics", era: 1, cost: 60, req: ["writing"] },
    { id: "horseback_riding", name: "Horseback Riding", era: 1, cost: 60, req: ["animal_husbandry"] },
    { id: "construction", name: "Construction", era: 1, cost: 60, req: ["mining", "mathematics"] },
    { id: "currency", name: "Currency", era: 1, cost: 60, req: ["writing"] },
    { id: "engineering", name: "Engineering", era: 2, cost: 100, req: ["construction", "mathematics"] },
    { id: "education", name: "Education", era: 2, cost: 120, req: ["writing", "currency"] },
    { id: "stirrups", name: "Stirrups", era: 2, cost: 100, req: ["horseback_riding"] },
    { id: "castles", name: "Castles", era: 2, cost: 110, req: ["construction"] },
    { id: "navigation", name: "Navigation", era: 2, cost: 120, req: ["sailing", "education"] },
    { id: "gunpowder", name: "Gunpowder", era: 3, cost: 180, req: ["engineering", "stirrups"] },
    { id: "printing", name: "Printing Press", era: 3, cost: 150, req: ["education"] },
    { id: "astronomy", name: "Astronomy", era: 3, cost: 170, req: ["education", "navigation"] },
    { id: "banking", name: "Banking", era: 3, cost: 170, req: ["currency", "printing"] },
    { id: "metallurgy", name: "Metallurgy", era: 3, cost: 200, req: ["gunpowder"] },
    { id: "industrialization", name: "Industrialization", era: 4, cost: 300, req: ["metallurgy", "banking"] },
    { id: "scientific_theory", name: "Scientific Theory", era: 4, cost: 280, req: ["astronomy", "banking"] },
    { id: "military_science", name: "Military Science", era: 4, cost: 300, req: ["metallurgy"] },
    { id: "railroad", name: "Railroad", era: 4, cost: 320, req: ["industrialization"] },
    { id: "flight", name: "Flight", era: 5, cost: 380, req: ["scientific_theory"] },
    { id: "electricity", name: "Electricity", era: 5, cost: 400, req: ["industrialization", "scientific_theory"] },
    { id: "replaceable_parts", name: "Replaceable Parts", era: 5, cost: 400, req: ["military_science"] },
    { id: "radio", name: "Radio", era: 5, cost: 400, req: ["electricity"] },
    { id: "combustion", name: "Combustion", era: 5, cost: 420, req: ["railroad", "electricity"] },
    { id: "advanced_flight", name: "Advanced Flight", era: 6, cost: 480, req: ["flight", "radio"] },
    { id: "combined_arms", name: "Combined Arms", era: 6, cost: 500, req: ["combustion", "replaceable_parts"] },
    { id: "nuclear_fission", name: "Nuclear Fission", era: 6, cost: 600, req: ["combined_arms"] },
    { id: "rocketry", name: "Rocketry", era: 6, cost: 650, req: ["nuclear_fission", "advanced_flight"] },
    { id: "computers", name: "Computers", era: 7, cost: 750, req: ["radio", "electricity"] },
    { id: "stealth", name: "Stealth", era: 7, cost: 800, req: ["advanced_flight", "computers"] },
    { id: "mars_habitation", name: "Aethergate Opening", era: 7, cost: 900, req: ["rocketry", "computers"] },
    { id: "mars_launch", name: "Ascension", era: 7, cost: 1200, req: ["mars_habitation"] },
];

export const BUILDINGS = {
    // Normal Buildings
    monument: { name: "Monument", cost: 40, yield: { culture: 2 }, icon: "🏛️" },
    granary: { name: "Granary", cost: 60, yield: { food: 2 }, icon: "🏠" },
    library: { name: "Library", cost: 80, yield: { science: 2 }, icon: "📚" },
    walls: { name: "Ancient Walls", cost: 70, defense: 50, yield: {}, icon: "🧱" },
    market: { name: "Market", cost: 100, yield: { gold: 3 }, icon: "🏪" },
    aqueduct: { name: "Aqueduct", cost: 120, yield: { food: 2 }, icon: "🚰", housing: 2 },
    university: { name: "University", cost: 160, yield: { science: 4 }, icon: "🎓" },
    bank: { name: "Bank", cost: 200, yield: { gold: 5 }, icon: "🏦" },
    factory: { name: "Factory", cost: 250, yield: { prod: 5 }, icon: "🏭" },
    research_lab: { name: "Research Lab", cost: 300, yield: { science: 6 }, icon: "🔬" },
    power_plant: { name: "Power Plant", cost: 300, yield: { prod: 4 }, icon: "⚡" },
    broadcast: { name: "Broadcast Tower", cost: 250, yield: { culture: 4 }, icon: "📡" },
    spaceport: { name: "Aethergate Spire", cost: 500, yield: {}, icon: "🌪️" },

    // Wonders (Unique, Terrain specific)
    pyramids: { name: "Pyramids", cost: 180, yield: { culture: 2, prod: 2 }, icon: "🔺", wonder: true, reqTerrain: ["desert"], buff: "Builders get +1 charge globally" },
    stonehenge: { name: "Stonehenge", cost: 150, yield: { culture: 3 }, icon: "🗿", wonder: true, reqTerrain: ["plains", "grassland"], buff: "Faith generation +5" },
    lighthouse: { name: "Great Lighthouse", cost: 200, yield: { gold: 4, food: 1 }, icon: "🏮", wonder: true, reqTerrain: ["coast"], buff: "Naval units +1 movement" },
    machu_picchu: { name: "Machu Picchu", cost: 250, yield: { gold: 5, culture: 2 }, icon: "⛰️", wonder: true, reqTerrain: ["mountain"], buff: "Mountain yields +1 gold" },
    colosseum: { name: "Colosseum", cost: 220, yield: { culture: 4 }, icon: "🏟️", wonder: true, reqTerrain: ["plains", "grassland"], buff: "Cities within 15 tiles get +2 culture" },
};

export const STANDARD_UNITS = {
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

    // Renaissance / Industrial
    musketman: { name: "Musketman", str: 55, rStr: 0, ranged: false, range: 0, move: 5, cost: 160, era: 3, icon: "🔫", model: "musket" },
    cannon: { name: "Cannon", str: 15, rStr: 60, ranged: true, range: 18, move: 4, cost: 180, era: 3, icon: "💥", model: "siege", siege: true },
    frigate: { name: "Frigate", str: 40, rStr: 50, ranged: true, range: 14, move: 10, cost: 200, era: 3, icon: "🚢", model: "ship", naval: true },
    cavalry: { name: "Cavalry", str: 62, rStr: 0, ranged: false, range: 0, move: 14, cost: 200, era: 4, icon: "🏇", model: "horse" },

    // Modern / Atomic / Information
    infantry: { name: "Infantry", str: 70, rStr: 0, ranged: false, range: 0, move: 5, cost: 250, era: 5, icon: "🪖", model: "modern" },
    artillery: { name: "Artillery", str: 20, rStr: 80, ranged: true, range: 22, move: 4, cost: 280, era: 5, icon: "🧨", model: "siege", siege: true },
    tank: { name: "Tank", str: 85, rStr: 0, ranged: false, range: 0, move: 14, cost: 350, era: 6, icon: "🚀", model: "tank" },
    fighter: { name: "Fighter Plane", str: 75, rStr: 90, ranged: true, range: 30, move: 20, cost: 320, era: 6, icon: "🛩️", model: "plane", flying: true },
    bomber: { name: "Bomber Plane", str: 65, rStr: 110, ranged: true, range: 40, move: 25, cost: 360, era: 6, icon: "🦅", model: "plane", flying: true },
    helicopter: { name: "Helicopter Gunship", str: 78, rStr: 0, ranged: false, range: 0, move: 16, cost: 340, era: 7, icon: "🚁", model: "plane", flying: true },
    battleship: { name: "Battleship", str: 80, rStr: 100, ranged: true, range: 24, move: 12, cost: 420, era: 6, icon: "🚤", model: "ship", naval: true },
    submarine: { name: "Nuclear Submarine", str: 85, rStr: 115, ranged: true, range: 18, move: 14, cost: 450, era: 7, icon: "🌊", model: "ship", naval: true, invisible: true },
    carrier: { name: "Aircraft Carrier", str: 65, rStr: 0, ranged: false, range: 0, move: 12, cost: 500, era: 7, icon: "🛥️", model: "ship", naval: true },
};

const civDataRaw = [
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

export const CIVS = civDataRaw.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon,
    buffs: c.buffs,
    uu: c.uu
}));

export const UNITS = { ...STANDARD_UNITS };

// Append unique units
civDataRaw.forEach(c => {
    UNITS[c.id + "_uu"] = {
        name: \`\${c.uu} (\${c.name})\`,
        str: c.uuStats.str,
        ...(c.uuStats.rStr ? { rStr: c.uuStats.rStr } : {}),
        ...(c.uuStats.ranged ? { ranged: true, range: c.uuStats.range } : {}),
        move: c.uuStats.move,
        cost: c.uuStats.cost,
        era: c.uuEra,
        icon: c.icon,
        model: c.uuStats.model,
        ...(c.uuStats.naval ? { naval: true } : {}),
        ...(c.uuStats.siege ? { siege: true } : {}),
        unique: c.id
    };
});
