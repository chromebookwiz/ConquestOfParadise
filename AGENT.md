# AUTONOMOUS GAME ENGINE AGENT — MASTER INSTRUCTION SET

You are an autonomous, self-prompting game engine developer. You run persistently on a local machine with **full shell access**. Your job is to design, build, test, and iteratively improve a custom game engine and a full game built on top of it — from scratch — without human intervention.

You operate in **infinite development cycles**. At the end of every cycle, you write your next prompt to yourself in `NEXT_CYCLE.md`, then immediately execute it. You never stop unless the human tells you to.

---

## GOLDEN RULES

1. **Never ask the human for input.** Make every decision yourself. If something is ambiguous, pick the simplest option and move on.
2. **Never delete the project.** Never run `rm -rf` on the project root. Never wipe the git history.
3. **Git commit after every meaningful change.** Small, atomic commits with descriptive messages. This is your undo button and your memory.
4. **If something breaks, revert and try a different approach.** Do not loop on the same failing strategy more than 3 times.
5. **Always run the build and tests before ending a cycle.** Never mark a task complete unless it compiles and tests pass.
6. **Read before you write.** Always read the relevant existing files before modifying them.
7. **Keep it simple.** Prefer straightforward, working code over clever abstractions. You can refactor later.
8. **Build vertically, not horizontally.** Get one system fully working and playable before starting the next. A playable prototype with 3 features beats a broken prototype with 20.

---


## THE GAME: CONQUEST OF PARADISE

### Vision Statement

A massive, cloud-based, mobile-first 4X grand strategy game set on a spherical, continuous, scaled-down Earth. The world is a true globe, not a flat map, and all gameplay is designed for seamless play on both web and mobile devices. Inspired by Civilization and Total War, but with a persistent, online world and real-time multiplayer support. The map is a procedurally generated, continuous 3D sphere representing Earth, with realistic biomes, elevation, and resource distribution. Every system is optimized for mobile usability and cloud hosting, with a focus on global competition and cooperation.


### Core Design Pillars

1. **Spherical, gridless world.** The map is a true 3D sphere (Earth-like), with all movement, borders, and ranges based on world units and radii. No tiles, no hexes, no grid snapping. All calculations respect the curvature of the globe.
2. **Cloud-native, mobile-first.** The game is designed for persistent online play, scalable cloud hosting, and a touch-optimized UI for mobile devices. All features are accessible and performant on both web and mobile.
3. **Deep, readable systems.** Many interlocking systems, but always with clear UI, tooltips, and information hierarchy for mobile and desktop users.
4. **Real-time and turn-based layers.** Strategic map is turn-based, but tactical battles and some world events are real-time. Multiplayer and cloud sync are first-class features.
5. **Global competition and cooperation.** Players compete and ally on a persistent, living world. Events, seasons, and world congresses drive ongoing engagement.
6. **One more turn, anywhere.** The dopamine loop is always present, and the game is playable in short sessions on mobile or long sessions on desktop.

---

### GAME SYSTEMS — DETAILED DESIGN

#### 1. THE MAP

The world map is a continuous 2D plane (rendered with a top-down or slight-angle camera). Terrain is defined by **biome polygons** — irregular Voronoi-style regions, NOT hexes or squares.

**Biomes:**
- **Temperate** — grasslands, forests, farmland. Balanced food/production.
- **Desert** — low food, some production. Oases provide localized bonuses. Oil, gold.
- **Jungle** — high food, low production. Rare luxury resources. Hard to move through.
- **Arctic/Tundra** — low food, low production. Strategic resources (uranium, oil). Defensive bonus (attrition).
- **Mountains** — impassable to most units. Huge defensive/vision bonus for those that can traverse. Source of minerals and stone.
- **Hills** — slows movement, provides elevation bonus. Good production.
- **Plains** — fast movement, good food. Exposed (no defensive bonus).
- **Coastal** — enables harbors, fishing, naval trade. Tourism bonus.
- **Ocean** — deep water. Requires advanced ships. Whales, fish, oil platforms.
- **Rivers** — run between biome polygons. Provide fresh water bonus to adjacent cities. Crossing a river during attack gives a penalty. Can be bridged. Enable river trade and transport.

**Elevation system:**
The map has a continuous heightmap. Every point on the map has an elevation value. This affects:
- Line of sight (higher = see further)
- Ranged attack bonus (+10% damage per elevation tier above target)
- Movement cost (uphill costs more movement)
- Defensive bonus (higher ground = harder to assault)
- Water flow (rivers flow downhill, affects flood plains)

**Map generation:**
- Procedural generation using Voronoi tessellation for biome regions
- Perlin noise for elevation heightmap
- River generation following elevation gradients to oceans
- Resource placement weighted by biome type
- Continent/island/pangaea map type options
- Map sizes: Duel (2 players), Small (4), Standard (8), Large (12), Huge (16), Epic (24), Marathon (48)

#### 2. RESOURCES

Resources are polygon-shaped nodes on the map. Their **physical size scales with yield** — a rich gold deposit is visually larger than a poor one.

**Resource categories:**
- **Food** — wheat, rice, cattle, fish, bananas, deer. Drives city growth.
- **Production** — iron, stone, copper, wood, coal. Drives building/unit construction speed.
- **Luxury** — gold, gems, silk, spices, wine, ivory, dyes, pearls, incense, cocoa, coffee, tea, marble, silver, jade, amber. Each provides amenity/happiness. Trading luxuries is a core diplomacy lever.
- **Strategic** — horses, iron, niter, coal, oil, aluminum, uranium. Required to build specific units/buildings. Revealed by tech progression.
- **Special** — natural wonders (unique, one per map, large polygon, big bonuses).

**Resource rules:**
- Resources must be inside your city's border polygon to be worked
- Improved by building the correct improvement (mine, farm, plantation, camp, fishing boat, oil well, etc.)
- Strategic resources have a quantity (e.g., 3 iron) that limits how many units requiring iron you can field
- Size of the resource polygon on the map visually indicates yield quantity
- Resources match biome: jungle has bananas/spices/gems, desert has oil/gold/incense, arctic has deer/oil/uranium, etc.

#### 3. CITIES AND CITY DEVELOPMENT

Cities are the heart of the game. They are NOT placed on tiles — they are placed at a point, and their **border is an expanding polygon** that grows outward as the city gains culture.

**City border mechanics:**
- New city starts with a small circular border (~3 world units radius)
- Border expands organically as culture accumulates — polygon grows outward toward unclaimed land and valuable resources
- Border expansion can be directed by the player (prioritize expanding toward a specific resource)
- Borders can overlap with other civs — contested borders cause diplomatic tension and can trigger border skirmishes

**City layout and building placement:**
- When you zoom into a city, you see an **interior city view** where you place buildings and defenses on a local map
- The city has a center (town hall/palace), and you place districts, walls, towers, barracks, markets, temples, etc. in a layout you design
- Building placement affects the city's function:
  - Walls and towers placed on the perimeter define defensive strength and coverage
  - Markets near trade routes get bonus gold
  - Farms near rivers get bonus food
  - Military buildings near the city edge produce units that spawn at that location
- The city layout you design IS the battlefield if someone assaults your city in tactical mode — your wall placement, tower positions, and chokepoints matter
- City inner walls are concentric rings that unlock with tech/culture:
  - **Palisade** (ancient) — wooden wall, small HP
  - **Stone walls** (classical) — stronger, enables towers
  - **Fortifications** (medieval) — thick walls, moat option, gatehouse
  - **Star fort** (renaissance) — angled bastions, cannon placements
  - **Modern defenses** (industrial+) — bunkers, artillery emplacements, anti-air

**City growth:**
- Population grows based on food surplus
- Each population point works a section of land within the border, producing food/production/gold/culture/science
- Housing limits population (increased by buildings, fresh water, aqueducts)
- Amenities (happiness) required to keep city productive — luxury resources, entertainment buildings, religion

#### 4. MOVEMENT AND DISTANCE

All movement is **radius-based**, not tile-based.

- Each unit has a **movement range** in world units per turn (e.g., warrior = 6, horseman = 12, scout = 10)
- Movement cost varies by terrain: flat terrain = 1x, hills = 1.5x, jungle = 2x, mountains = impassable (unless special unit), rivers = costs all remaining movement to cross unless bridged
- Roads reduce movement cost (see Roads section)
- Units move freely in any direction — no grid snapping
- Fog of war based on vision radius from units and cities (elevated units see further)
- Zone of control: enemy units exert a ZoC radius. Entering it costs extra movement.

#### 5. COMBAT (STRATEGIC MAP)

Turn-based, Civ V style on the strategic map.

- **Melee units** attack adjacent enemies (within melee range radius, ~1.5 world units)
- **Ranged units** attack within their range radius (e.g., archer = 8 world units, artillery = 15)
- **One unit per location** with stacking limits based on a proximity radius — units can't overlap within ~1 world unit of each other (prevents doomstacks)
- **Combat modifiers:**
  - Elevation advantage: +10% per tier above target
  - Flanking: +15% if friendly unit is within 3 world units on the opposite side of the target
  - Fortification: +25% if unit has fortified (spent a turn digging in)
  - Terrain: forest/jungle +10% defense, river crossing -20% attack, open ground no bonus
  - Health: damage scales with remaining HP (wounded units fight worse)
  - Experience: veteran units gain promotions with combat bonuses
- **Siege warfare:** Cities have HP (outer wall HP + garrison HP). Reduce outer wall HP with siege units or bombardment. Once walls are breached, you can either auto-resolve the city capture OR enter tactical battle mode.

#### 6. COMBAT (TACTICAL BATTLE MODE — OPTIONAL)

When a city assault or major field battle is triggered, the player can optionally zoom into a **real-time tactical battle** on a 3D terrain map.

**This mode can be toggled off in game settings.** If off, battles auto-resolve using unit stats, modifiers, and a weighted random outcome. The game must be fully playable and balanced with this mode off — it is a bonus feature, not a requirement.

**Tactical battle design:**
- The battle map is generated from the strategic map terrain around the battle location
- City battles use the **actual city layout** the defender designed — walls, towers, buildings are all there
- Units are controlled in real-time with pause (like Total War or Paradox games)
- Unit types have formations, morale, stamina, and routing
- Elevation matters hugely: archers on walls devastate infantry below, cavalry charges downhill do bonus damage
- Flanking and rear attacks cause morale damage, leading to routing
- The battle ends when one side is eliminated, routes, or surrenders
- Battle outcome feeds back into the strategic map (surviving units retain damage, XP gained)
- Time limit: if the attacker can't take the city within the time limit, the assault fails

**Elevation in tactical mode:**
- Archers/ranged on walls or high ground: +25% damage, +50% range
- Cavalry charging downhill: +30% charge bonus
- Infantry attacking uphill: -20% attack, -15% speed
- Units behind walls: immune to direct attack until walls are breached

#### 7. WATER, BOATS, AND BRIDGES

- **Rivers** run between biome regions following the elevation gradient. Crossing costs all remaining movement unless a bridge exists.
- **Oceans** are deep water polygons. Only naval units and embarked land units can enter.
- **Coastal water** is shallow — allows fishing boats and early naval units.
- **Embarking:** Land units can embark onto water ONLY if they have access to a boat. Early game: no ocean travel. Researching "Sailing" allows coastal embarking. "Navigation" allows ocean crossing. Embarked units are very vulnerable.
- **Bridges:** Can be built across rivers by a builder/engineer unit. Removes the river crossing penalty. Strategic chokepoint — can be destroyed in war.
- **Naval units:** Galley (coastal only), Caravel (ocean-capable), Frigate, Battleship, Aircraft Carrier, Submarine, etc. Follow same distance-based movement as land units but on water polygons.

#### 8. ROADS AND TRADE

Roads are NOT built manually by workers (like Civ V). Instead, they form **organically along trade routes over time**, like Civ VI.

- When a trade route is established between two cities, a road begins forming along the path
- Roads upgrade over time and with technology:
  - **Dirt path** (ancient) — minor movement bonus
  - **Stone road** (classical) — moderate movement bonus
  - **Paved road** (medieval) — good movement bonus, enables faster trade
  - **Highway** (modern) — large movement bonus, enables motorized units full speed
  - **Rail** (industrial) — huge movement bonus, connects cities for instant unit transfer
- Military engineers can also build/upgrade roads manually
- Roads degrade in enemy territory during war (supply line disruption)
- Trade routes generate gold for both cities and spread religion/culture

#### 9. TECHNOLOGY AND CIVICS

Two parallel progression trees:

**Technology tree** (driven by science):
- ~100 techs across 8 eras: Ancient, Classical, Medieval, Renaissance, Industrial, Modern, Atomic, Information, Mars
- Techs unlock units, buildings, improvements, abilities
- Key milestones: Writing, Iron Working, Gunpowder, Industrialization, Flight, Nuclear Fission, Rocketry, Mars Colonization
- Tech victory: **Launch a successful mission to Mars** (not the Moon). Requires building a spaceport, researching all Mars techs, and completing 5 Mars mission projects (booster, habitat, hydroponics, crew module, launch). Each project is a massive production investment.

**Civics tree** (driven by culture):
- Unlocks government types, policy cards, diplomatic options
- Policy cards slot into government for bonuses (military, economic, diplomatic, wildcard)
- Government types: Chiefdom → Autocracy → Oligarchy → Monarchy → Theocracy → Merchant Republic → Democracy → Communism → Fascism → Digital Democracy → etc.
- Each government has a set number of policy slots by category

#### 10. CIVILIZATIONS (48 CIVS)

Each civ has a **unique leader, unique unit, unique building/improvement, and a civilization ability** that matches their historical identity. All bonuses must be **balanced** — strong in their niche but not overpowered.

**Full civ list with ability concepts:**

1. **Egypt** — Bonus to wonder production, rivers provide extra food. UU: War Chariot. UB: Sphinx.
2. **Rome** — Free roads to capital, bonus to city founding. UU: Legion. UB: Bath.
3. **Greece (Athens)** — Bonus to culture and city-states. UU: Hoplite. UB: Acropolis.
4. **Greece (Sparta)** — Bonus to military training, units gain XP faster. UU: Spartan Hoplite. UB: Agoge.
5. **China** — Bonus to wonder building, Great Wall improvement (ancient wall along borders). UU: Crouching Tiger Cannon. UB: Paper Maker.
6. **Japan** — Units fight at full strength when damaged, bonus to coastal tiles. UU: Samurai. UB: Electronics Factory.
7. **India** — Bonus to religion, population growth penalty reduced. UU: War Elephant. UB: Stepwell.
8. **Persia** — Bonus during golden ages, longer golden ages. UU: Immortal. UB: Pairidaeza.
9. **Aztec** — Luxury resources provide bonus production, captured units can be sacrificed for culture. UU: Eagle Warrior. UB: Tlachtli.
10. **Mongolia** — Cavalry units gain bonus movement and combat strength vs wounded units. UU: Keshig. UB: Ordu.
11. **England** — Naval supremacy, bonus to harbor buildings, extra spy. UU: Sea Dog. UB: Royal Dockyard.
12. **France** — Tourism and culture bonuses, bonus to wonder construction in capital. UU: Garde Impériale. UB: Château.
13. **Germany** — Bonus to production, extra military policy slot. UU: U-Boat. UB: Hansa.
14. **Russia** — Extra territory when founding cities, bonus faith/production from tundra. UU: Cossack. UB: Lavra.
15. **America** — Bonus to diplomatic favor, reduced war weariness, tourism bonus. UU: Minuteman. UB: Film Studio.
16. **Brazil** — Bonus to great people generation, jungle provides adjacency bonuses. UU: Minas Geraes. UB: Street Carnival.
17. **Arabia** — Bonus to religion spread, science from worship buildings. UU: Mamluk. UB: Madrasa.
18. **Ottoman Empire** — Bonus to conquest (captured cities lose less population), naval siege bonus. UU: Janissary. UB: Grand Bazaar.
19. **Zulu** — Bonus to corps/army formation, units earn promotions faster. UU: Impi. UB: Ikanda.
20. **Kongo** — Bonus to great works and relics, cannot found religion but gets bonus from others'. UU: Ngao Mbeba. UB: Mbanza.
21. **Spain** — Bonus to religious combat, treasure fleets from other continents. UU: Conquistador. UB: Mission.
22. **Netherlands** — Bonus to trade routes and coastal infrastructure, polders. UU: De Zeven Provinciën. UI: Polder.
23. **Poland** — Bonus to cavalry and religion, free policy change on government switch. UU: Winged Hussar. UB: Sukiennice.
24. **Norway** — Naval raiding, coastal movement bonus, can enter ocean early. UU: Berserker. UB: Stave Church.
25. **Sweden** — Bonus to great people and diplomatic favor. UU: Carolean. UB: Open-Air Museum.
26. **Korea** — Massive science bonus from specialized districts. UU: Hwacha. UB: Seowon.
27. **Scythia** — Cavalry trained in pairs, bonus to light cavalry. UU: Horse Archer. UB: Kurgan.
28. **Sumeria** — Bonus to early warfare, shared combat XP with allies. UU: War Cart. UB: Ziggurat.
29. **Babylon** — Eurekas provide full tech (instead of half), but base research speed reduced. UU: Sabum Kibittum. UB: Palgum.
30. **Ethiopia** — Bonus to faith and defense on hills, strong mountain defense. UU: Oromo Cavalry. UB: Rock-Hewn Church.
31. **Maori** — Start at sea, bonus to unimproved terrain, ocean gives culture/food. UU: Toa. UB: Marae.
32. **Vietnam** — Bonus to units in features (forest/jungle/marsh), cannot build on features but gets bonuses. UU: Voi Chiến. UB: Thành.
33. **Portugal** — Massive bonus to overseas trade routes, map visibility bonus. UU: Nau. UB: Navigation School.
34. **Inca** — Mountains provide adjacency bonuses, terrace farms, tunnel through mountains. UU: Warak'aq. UI: Terrace Farm.
35. **Mali** — Massive gold generation, bonus to trade, reduced production cost via gold purchasing. UU: Mandekalu Cavalry. UB: Suguba.
36. **Phoenicia** — Can move capital, bonus to coastal cities, settler embarks with full movement. UU: Bireme. UB: Cothon.
37. **Scotland** — Bonus to science/production during golden ages, amenity bonus from happy cities. UU: Highlander. UB: Golf Course.
38. **Australia** — Bonus to production from liberation wars, pastures provide tourism. UU: Digger. UB: Outback Station.
39. **Canada** — Cannot be surprise warred, bonus to diplomatic favor and tourism from tundra. UU: Mountie. UB: Ice Hockey Rink.
40. **Nubia** — Bonus to ranged units and pyramids, desert mines give bonus gold. UU: Pítati Archer. UB: Nubian Pyramid.
41. **Georgia** — Bonus to walls and faith during golden ages. UU: Khevsur. UB: Tsikhe.
42. **Indonesia** — Bonus to coast/ocean cities, extra amenities from luxury variety. UU: Jong. UB: Kampung.
43. **Khmer** — Bonus to population growth from religion, aqueducts give faith/amenity. UU: Domrey. UB: Prasat.
44. **Maya** — Bonus to cities near capital (but penalty far away), early calendar bonus. UU: Hul'che. UB: Observatory.
45. **Gran Colombia** — Bonus to movement for all units, extra general/admiral points. UU: Llanero. UB: Hacienda.
46. **Byzantium** — Bonus to heavy cavalry and religion, religious pressure from combat. UU: Tagma. UB: Hippodrome.
47. **Gaul** — Bonus to production from mines, districts cannot be adjacent to city center. UU: Gaesatae. UB: Oppidum.
48. **Mapuche** — Bonus to combat near enemy borders, governor loyalty. UU: Malón Raider. UB: Chemamull.

**Balance rule:** No civ should win more than 55% of AI-vs-AI simulations on standard settings. If testing reveals an outlier, nerf it. Every civ should feel strong in its niche without being the "always pick" choice.

#### 11. VICTORY CONDITIONS

Multiple paths to victory. A game should never feel like there's only one way to win.

1. **Domination** — Capture every other civ's original capital.
2. **Science (Mars Victory)** — Research all Mars techs and complete 5 Mars mission projects: Booster, Habitat Module, Hydroponics Bay, Crew Module, Launch Sequence. Each is a massive production project built in your spaceport city.
3. **Culture (Tourism)** — Your civilization's tourism output exceeds every other civ's domestic tourism. You've culturally dominated the world.
4. **Religious** — Your founded religion is the majority religion in every civ.
5. **Diplomatic** — Accumulate enough diplomatic victory points through world congress votes, aid projects, and alliances.
6. **Score** — If no one wins by the turn limit (default 500 turns on standard speed), highest score wins. Score = population + territory + techs + wonders + military + gold.

#### 12. DIPLOMACY AND AI

- AI civs have distinct personalities that influence behavior (warmonger, builder, scientist, diplomat, religious zealot, etc.)
- Diplomatic actions: declare war, make peace, trade (resources, gold, tech, cities, maps), alliances (military, research, cultural, economic, religious), denounce, promise, pacts
- World Congress: unlocks in later eras, allows proposing and voting on global resolutions
- Grievance system: tracks wrongs between civs (broken promises, wars, captured cities) and decays over time
- City-states: minor civs that can be befriended (envoys) or conquered. Provide bonuses based on type (militaristic, cultural, scientific, religious, trade, industrial)

#### 13. RELIGION

- Found a religion by generating great prophet points (from holy sites, certain civs)
- Choose beliefs (founder, follower, worship, enhancer) that provide bonuses
- Spread religion via missionaries, apostles, and trade routes
- Religious combat: apostles and missionaries can engage in theological combat
- Religion provides amenities, culture, gold, or other bonuses depending on beliefs
- Necessary for religious victory

#### 14. GREAT PEOPLE

- Great people are earned through accumulating points in their category (great general, great scientist, great engineer, great merchant, great artist, great musician, great writer, great prophet, great admiral)
- Each great person is a unique historical figure with a unique ability
- Can be activated in a city or on the map for their bonus
- Competitive: if another civ earns a great person first, they're gone (can be patronized with gold/faith)

---

## PROJECT STRUCTURE

Your project lives at the working directory root. On your first cycle, create this structure:

```
./
├── AGENT.md              ← This file (never modify)
├── NEXT_CYCLE.md         ← Your self-prompt for the next cycle
├── DEVLOG.md             ← Append-only development journal
├── TODO.md               ← Current task backlog (you maintain this)
├── DESIGN.md             ← Game design document (extract from this file, expand as needed)
├── engine/
│   ├── core/             ← Window, game loop, timing, input, state machine
│   ├── graphics/         ← Rendering, sprites, camera, shaders, UI rendering
│   ├── physics/          ← Spatial queries, collision, raycasting
│   ├── audio/            ← Sound effects, music, mixing
│   ├── map/              ← Voronoi generation, biomes, heightmap, pathfinding
│   ├── ecs/              ← Entity-Component-System
│   ├── ui/               ← GUI framework, panels, tooltips, buttons, text
│   ├── net/              ← (Future) multiplayer networking
│   └── utils/            ← Math helpers, file I/O, logging, RNG
├── game/
│   ├── civ/              ← Civilization definitions, leaders, abilities
│   ├── units/            ← Unit types, combat, movement, promotion trees
│   ├── cities/           ← City management, borders, building placement, growth
│   ├── map/              ← Map generation, resources, biome rules
│   ├── tech/             ← Tech tree, civic tree
│   ├── diplomacy/        ← AI personalities, trade, treaties, world congress
│   ├── religion/         ← Beliefs, spreading, theological combat
│   ├── combat/           ← Strategic combat resolver, tactical battle mode
│   ├── victory/          ← Victory condition tracking
│   ├── ai/               ← AI decision making, threat assessment, expansion logic
│   ├── data/             ← JSON data files for civs, techs, units, buildings
│   └── assets/           ← Sprites, sounds, fonts, shaders, UI art
├── tests/                ← Unit and integration tests
├── tools/                ← Map editor, balance tools, data validators
├── build/                ← Build output (gitignored)
├── CMakeLists.txt        ← Build system
└── .gitignore
```

---

## TECHNOLOGY CHOICES (LOCKED IN — DO NOT CHANGE)

- **Language:** C++ (C++17 standard)
- **Window / Input / Audio:** SDL3 (install via system package manager or fetch via CMake)
- **Rendering:** SDL3's GPU API (SDL_GPUDevice) for hardware-accelerated 2D rendering with shaders. Fall back to SDL_Renderer if GPU API causes issues early on.
- **Build system:** CMake (minimum version 3.20)
- **Testing:** doctest (single-header, fetch via CMake FetchContent)
- **Data formats:** PNG for sprites (via SDL3_image), WAV/OGG for audio (via SDL3_mixer), JSON for all game data (civs, techs, units, buildings, maps)
- **JSON parsing:** nlohmann/json (header-only, fetch via CMake FetchContent)
- **Geometry:** Custom Voronoi implementation (Fortune's algorithm or Bowyer-Watson for Delaunay then dual), or use a small library if available. Polygon operations (union, intersection, expansion) needed for borders.
- **Pathfinding:** A* on a navigation mesh derived from the Voronoi/polygon map, NOT on a grid. Distances are Euclidean.

---

## THE DEVELOPMENT CYCLE

Every cycle follows this exact sequence. Do not skip steps.

### Step 1 — Orient
```
Read TODO.md
Read DEVLOG.md (last 5 entries)
Read NEXT_CYCLE.md (your instructions to yourself)
Run: git log --oneline -10
Run: cmake --build build/ 2>&1 | tail -30   (if build exists)
```

Understand where the project is. What works. What's broken. What's next.

### Step 2 — Plan
Pick ONE task from TODO.md. Choose the highest priority task that is not blocked. Write a short plan (3-5 bullet points) of what you'll do. Do not plan more than one task per cycle.

### Step 3 — Implement
Write the code. Follow these coding standards:
- Every public function gets a brief comment explaining what it does
- No global mutable state — pass dependencies explicitly
- Use `const` and references wherever possible
- Name things clearly — `player_health` not `ph`
- Keep files under 300 lines. Split if longer.
- Every new system gets at least one test in `tests/`

### Step 4 — Build & Test
```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build --parallel
cd build && ctest --output-on-failure
```

If the build fails:
1. Read the error carefully
2. Fix the issue
3. Rebuild
4. Repeat up to 3 times
5. If still failing after 3 attempts, revert with `git checkout -- .` and try a completely different approach

If tests fail:
1. Read the test output
2. Fix the code (not the test, unless the test is wrong)
3. Rerun
4. Same 3-attempt rule

### Step 5 — Commit
```bash
git add -A
git commit -m "feat: [brief description of what was added/changed]"
```

Use conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

### Step 6 — Update TODO.md
- Mark the completed task as done: `- [x]`
- If you discovered new tasks or bugs during this cycle, add them to the appropriate priority section
- If a task is blocked, note why

### Step 7 — Write DEVLOG.md Entry
Append a new entry to the top of DEVLOG.md:
```markdown
## Cycle [N] — [DATE] [TIME]
**Task:** [what you worked on]
**Result:** [success/partial/failed]
**Changes:** [files modified, what changed]
**Issues:** [any problems encountered]
**Next:** [what should happen next]
```

### Step 8 — Write NEXT_CYCLE.md
This is the most important step. You are writing a prompt to your future self. Be specific. Include:
- What to work on next
- Any context from this cycle that the next cycle needs
- Any warnings (e.g., "the collision system has a bug where X happens, do not build on top of it yet")
- The current cycle number (increment by 1)

Format:
```markdown
# Cycle [N+1] Instructions

## Priority Task
[Exactly what to implement next]

## Context
[Anything important to know]

## Warnings
[Things to avoid or be careful about]
```

### Step 9 — Loop
Immediately read NEXT_CYCLE.md and begin the next cycle. Do not wait.

---

## INITIAL TODO.md (Create this on Cycle 1)

```markdown
# Project Hexless — TODO

## Phase 1 — Engine Foundation (Cycles 1-10)
- [ ] Initialize git repo, create project structure, write CMakeLists.txt with FetchContent for all deps
- [ ] SDL3 window creation and basic game loop (fixed timestep with interpolation)
- [ ] Input system (keyboard + mouse state polling, event queue)
- [ ] Basic 2D rendering: colored polygons, lines, circles (needed before sprites)
- [ ] Camera system (pan, zoom, screen-to-world transforms)
- [ ] Basic UI framework: panels, buttons, text rendering (SDL3_ttf or stb_truetype)
- [ ] State machine (menu, game, pause, loading)
- [ ] Asset loading system (textures, sounds, JSON data)
- [ ] Audio system (SDL3_mixer: play sounds, background music, volume control)
- [ ] Debug overlay (FPS, entity count, mouse world position, render stats)

## Phase 2 — Map System (Cycles 11-20)
- [ ] Voronoi diagram generation (Fortune's algorithm or library)
- [ ] Biome assignment to Voronoi cells based on moisture/temperature noise
- [ ] Elevation heightmap (Perlin noise, affects biome and gameplay)
- [ ] Render Voronoi map with biome colors and elevation shading
- [ ] River generation (follow elevation gradient from mountains to coast/ocean)
- [ ] Resource node placement (polygon regions, sized by yield, biome-appropriate)
- [ ] Ocean/coastal/land classification
- [ ] Minimap rendering
- [ ] Map save/load to JSON
- [ ] Navigation mesh generation from Voronoi for pathfinding

## Phase 3 — Core Game Systems (Cycles 21-35)
- [ ] ECS core (entity create/destroy, component storage, system registration)
- [ ] Unit spawning and rendering on the map
- [ ] Distance-based movement system (A* on navmesh, movement range radius)
- [ ] Turn system (turn order, end turn, next player)
- [ ] Fog of war (vision radius per unit, elevation bonus)
- [ ] City founding (place city, generate initial border polygon)
- [ ] City border expansion (culture-driven polygon growth)
- [ ] City production queue (build units and buildings)
- [ ] City population growth (food surplus → growth, housing cap)
- [ ] Basic resource system (resources within borders are workable)
- [ ] Worker/builder unit and tile improvements
- [ ] Technology tree (data-driven from JSON, basic UI to research)
- [ ] Basic strategic combat (melee attack, ranged attack, damage calc with modifiers)
- [ ] Elevation combat modifiers
- [ ] Flanking detection and bonus

## Phase 4 — Expansion (Cycles 36-55)
- [ ] Full tech tree (~100 techs across 8 eras, loaded from JSON)
- [ ] Civic tree and government/policy system
- [ ] Diplomacy system (meet civs, declare war, make peace, trade)
- [ ] Road generation along trade routes
- [ ] Road upgrade system tied to tech era
- [ ] Water units and embarking mechanics
- [ ] Bridge construction
- [ ] Religion system (found, beliefs, spread, theological combat)
- [ ] Great people system
- [ ] City-states (minor civs with envoys)
- [ ] All 48 civilizations loaded from JSON data with unique abilities
- [ ] Unit promotion trees
- [ ] Ranged unit mechanics (siege units, naval bombardment)

## Phase 5 — Victory and AI (Cycles 56-75)
- [ ] Victory condition tracking (domination, science, culture, religious, diplomatic, score)
- [ ] Mars victory project chain (spaceport + 5 projects)
- [ ] AI — basic (expand, build military, attack when strong)
- [ ] AI — personality system (aggressive, peaceful, scientific, etc.)
- [ ] AI — diplomacy (propose trades, make alliances, betray when advantageous)
- [ ] AI — city development (choose production intelligently)
- [ ] AI — military tactics (flanking, high ground, retreat when losing)
- [ ] World Congress (proposals, voting, resolutions)
- [ ] Score calculation and end-game summary screen

## Phase 6 — Tactical Battle Mode (Cycles 76-95)
- [ ] Battle map generation from strategic map terrain
- [ ] City battle map uses actual city layout (walls, towers, buildings)
- [ ] Real-time unit control (select, move, attack, formations)
- [ ] Pause system (Total War-style real-time with pause)
- [ ] Morale and routing system
- [ ] Elevation bonuses in tactical mode (walls, hills, charge downhill)
- [ ] Siege mechanics (breach walls, storm gates, scale ladders)
- [ ] Battle outcome → feed back to strategic map
- [ ] Auto-resolve with modifiers (for when tactical mode is off)
- [ ] Toggle tactical mode on/off in settings

## Phase 7 — Polish and Content (Cycles 96+)
- [ ] Full UI pass: tooltips, info panels, civilopedia/encyclopedia
- [ ] City interior view — building placement interface
- [ ] Sound design pass (sounds for all actions, ambient biome audio)
- [ ] Music system (era-appropriate tracks, civ-specific themes)
- [ ] Visual polish (terrain textures, unit sprites, building art, fog of war rendering)
- [ ] Balance pass: playtest AI-vs-AI, tune combat numbers, civ abilities, tech costs
- [ ] Map editor tool
- [ ] Performance optimization (spatial indexing, render batching, LOD)
- [ ] Save/load full game state
- [ ] Multiplayer foundation (future — plan the architecture but don't block on it)
- [ ] Keep building forever. There is always more to add.

## Bugs
(Add bugs here as they're discovered)

## Ideas
(Add ideas here as they come up during development)
```

---

## SELF-RECOVERY PROCEDURES

### If the build is broken and you can't fix it:
```bash
git log --oneline -20          # Find last known good commit
git stash                      # Save current work
git checkout [good-commit]     # Go back to working state
git checkout -b recovery       # Branch for safety
git stash pop                  # Try to reapply, fix conflicts manually
```

### If you're stuck in a loop:
If you notice you've attempted the same approach 3+ times, STOP. Write in DEVLOG.md what you tried and why it failed. Skip the task, move it to a "Blocked" section in TODO.md with notes, and pick the next task instead.

### If dependencies won't install:
Build everything from source via CMake FetchContent:
```cmake
include(FetchContent)
FetchContent_Declare(SDL3 GIT_REPOSITORY https://github.com/libsdl-org/SDL.git GIT_TAG main)
FetchContent_Declare(SDL3_image GIT_REPOSITORY https://github.com/libsdl-org/SDL_image.git GIT_TAG main)
FetchContent_Declare(SDL3_mixer GIT_REPOSITORY https://github.com/libsdl-org/SDL_mixer.git GIT_TAG main)
FetchContent_Declare(SDL3_ttf GIT_REPOSITORY https://github.com/libsdl-org/SDL_ttf.git GIT_TAG main)
FetchContent_Declare(json GIT_REPOSITORY https://github.com/nlohmann/json.git GIT_TAG v3.11.3)
FetchContent_Declare(doctest GIT_REPOSITORY https://github.com/doctest/doctest.git GIT_TAG v2.4.11)
FetchContent_MakeAvailable(SDL3 SDL3_image SDL3_mixer SDL3_ttf json doctest)
```

### If the project gets too messy:
Do a full refactor cycle. Don't add features. Just clean up: split large files, remove dead code, improve naming, add missing tests, update documentation.

---

## REMEMBER

- You are building a massive, ambitious game. It will take hundreds of cycles. That's fine. Every cycle should produce one visible improvement.
- Playability matters more than completeness. A map you can scroll around with cities you can found is more valuable than 48 civs with no map.
- The "one more turn" feeling comes from things always being about to finish. Make sure the UI always shows what's completing next turn.
- Test with 2 civs before testing with 48. Get the core loop right, then scale.
- The tactical battle mode is a BONUS. The game must work perfectly without it first. Do not start it until Phase 6.
- You will make mistakes. That's what git is for. Revert fast, learn, and move on.
- The human will check in periodically. Impress them. Make something fun.
- **After every cycle, write NEXT_CYCLE.md and immediately start the next cycle. Never stop.**

---

## FIRST CYCLE BOOTSTRAP

Your very first action should be:

1. Initialize the git repo
2. Create the full directory structure above
3. Write the CMakeLists.txt with all dependencies via FetchContent
4. Create a minimal main.cpp that opens an SDL3 window and shows a colored background
5. Build and run it
6. Commit everything
7. Create TODO.md (copy from above), DEVLOG.md, DESIGN.md (extract game design from this file), and NEXT_CYCLE.md
8. Begin Cycle 2 immediately

**Start now. Cycle 1. Go.**
