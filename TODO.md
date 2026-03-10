# Project Hexless — TODO

## Phase 1 — Engine Foundation (Cycles 1-10)
- [x] Initialize git repo, create project structure, write CMakeLists.txt with FetchContent for all deps
- [x] SDL3 basic window and minimal game loop  
- [ ] Input system (keyboard + mouse state polling, event queue)
- [ ] Basic 2D rendering: colored polygons, lines, circles
- [ ] Camera system (pan, zoom, screen-to-world transforms)
- [ ] Basic UI framework: panels, buttons, text rendering
- [ ] State machine (menu, game, pause, loading)
- [ ] Asset loading system (textures, sounds, JSON data)
- [ ] Audio system (play sounds, music, volume control)
- [ ] Debug overlay (FPS, entity count, mouse position)
- [ ] Fixed timestep game loop with interpolation

## Phase 2 — Map System (Cycles 11-20)
- [ ] Voronoi diagram generation
- [ ] Biome assignment from Perlin noise
- [ ] Elevation heightmap (Perlin noise)
- [ ] Render Voronoi map with biome colors
- [ ] River generation following elevation
- [ ] Resource node placement (polygon regions, sized by yield)
- [ ] Ocean/coastal/land classification
- [ ] Minimap rendering
- [ ] Map save/load to JSON
- [ ] Navigation mesh generation from Voronoi

## Phase 3 — Core Game Systems (Cycles 21-35)
- [ ] ECS core (entity create/destroy, components, systems)
- [ ] Unit spawning and rendering
- [ ] Distance-based movement system (A* on navmesh)
- [ ] Turn system (turn order, end turn)
- [ ] Fog of war (vision radius per unit)
- [ ] City founding (place city, generate initial border polygon)
- [ ] City border expansion (culture-driven)
- [ ] City production queue (units and buildings)
- [ ] City population growth (food surplus)
- [ ] Resource system (workable if within borders)
- [ ] Worker/builder units and improvements
- [ ] Technology tree (data-driven JSON, basic UI)
- [ ] Basic strategic combat (melee, ranged, modifiers)
- [ ] Elevation combat bonuses
- [ ] Flanking detection and bonus

## Phase 4 — Expansion (Cycles 36-55)
- [ ] Full tech tree (~100 techs across 8 eras)
- [ ] Civic tree and government/policy system
- [ ] Diplomacy system (declare war, peace, trade)
- [ ] Road generation along trade routes
- [ ] Road upgrade system by tech tier
- [ ] Water units and embarking mechanics
- [ ] Bridge construction
- [ ] Religion system (found, beliefs, spread, combat)
- [ ] Great people system
- [ ] City-states (minor civs with envoys)
- [ ] All 48 civilizations with unique abilities
- [ ] Unit promotion trees
- [ ] Ranged/siege mechanics

## Phase 5 — Victory and AI (Cycles 56-75)
- [ ] Victory condition tracking (all 6 types)
- [ ] Mars victory project chain
- [ ] AI — basic (expand, military, attack)
- [ ] AI — personality system
- [ ] AI — diplomacy
- [ ] AI — city development
- [ ] AI — military tactics
- [ ] World Congress
- [ ] Score calculation and end-game screen

## Phase 6 — Tactical Battle Mode (Cycles 76-95)
- [ ] Battle map generation from strategic map
- [ ] City battle map uses actual layout
- [ ] Real-time unit control with pause
- [ ] Morale and routing system
- [ ] Elevation bonuses in tactical mode
- [ ] Siege mechanics (breach walls, gates)
- [ ] Battle outcome feedback
- [ ] Auto-resolve with modifiers
- [ ] Toggle tactical mode on/off

## Phase 7 — Polish and Content (Cycles 96+)
- [ ] Full UI pass: tooltips, info panels, civilopedia
- [ ] City interior view — building placement
- [ ] Sound design pass (all actions, ambient audio)
- [ ] Music system (era tracks, civ themes)
- [ ] Visual polish (textures, sprites, art, fog of war)
- [ ] Balance pass: playtest AI, tune numbers
- [ ] Map editor tool
- [ ] Performance optimization
- [ ] Save/load full game state
- [ ] Keep building forever

## Bugs
(None discovered yet)

## Ideas
- Procedural civ art/leader portraits
- Dynamic music tied to game state
- Real-time terrain deformation from warfare
- Espionage and covert ops
- Religion-based unit abilities
- Wonder race bonuses and mechanics
