## Global Game Structure and Monetization

- Single, persistent global server for all players.
- Each game cycle lasts about one year, followed by a global reset and new world generation.
- Only four IAP packs: $1, $5, $20, $100, max twice daily; $5+ disables ads.
- No other microtransactions or pay-to-win.
- Global chat, guilds, alliances, and 24/7 attack system.
- Players choose spawn location anywhere on the globe, with real-world bonuses for certain locations.
- 1:1 scale Earth map using real map data for biomes, elevation, and resources. Players can start at their real or chosen location.

# Conquest of Paradise — Design Document


## Vision
A massive, cloud-based, mobile-first 4X grand strategy game set on a spherical, continuous, scaled-down Earth. The world is a true globe, not a flat map, and all gameplay is designed for seamless play on both web and mobile devices. Inspired by Civilization and Total War, but with a persistent, online world and real-time multiplayer support. The map is a procedurally generated, continuous 3D sphere representing Earth, with realistic biomes, elevation, and resource distribution. Every system is optimized for mobile usability and cloud hosting, with a focus on global competition and cooperation.

---


## Core Systems Design (from AGENT.md, adapted for Conquest of Paradise)


### 1. The Map
- Continuous 3D sphere (Earth-like) using spherical Voronoi tessellation for biomes
- 10+ biome types: Temperate, Desert, Jungle, Arctic, Mountains, Hills, Plains, Coastal, Ocean, Rivers, plus polar caps and equatorial zones
- Continuous heightmap via Perlin/simplex noise for elevation effects on a sphere
- River system following elevation gradients on a globe
- Procedural resource placement, respecting latitude and longitude for realism

### 2. Resources
- 4 categories: Food, Production, Luxury, Strategic, Special
- Resource polygons sized by yield
- Must be within city borders to be worked
- Biome-appropriate placement

### 3. Cities
- Placed at points with expanding polygon borders (culture-driven)
- Interior city view for building/defense placement
- Population growth from food surplus
- Production queues for units and buildings
- Multiple wall types unlocking with tech progression

### 4. Movement & Combat
- Radius-based (not tile-based)
- Distance-based movement costs by terrain
- Elevation bonuses/penalties for combat
- Flanking bonuses
- Siege mechanics

### 5. Victory Conditions
- Domination (capture capitals)
- Science (Mars victory)
- Culture (Tourism)
- Religious
- Diplomatic
- Score

### 6. AI & Diplomacy
- Personality-based AI
- Diplomatic actions (war, peace, trade, alliances)
- World Congress
- Grievance system

### 7. Technology & Civics
- ~100 techs across 8 eras
- Parallel civics tree
- Government with policy cards


### 8. 48+ Civilizations
- Each with unique unit, building, ability, and starting location on the globe
- Balanced for global, persistent, competitive play

---

## Implementation Phases

### Phase 1: Engine Foundation (Cycles 1-10)
- [x] Git + project structure
- [x] SDL3 window and game loop
- [ ] Input system (keyboard, mouse)
- [ ] 2D rendering (polygons, lines, circles)
- [ ] Camera system (pan, zoom)
- [ ] UI framework (panels, buttons, text)
- [ ] State machine (menu, game, pause)
- [ ] Asset loader
- [ ] Audio system
- [ ] Debug overlay

### Phase 2: Map System (Cycles 11-20)
- [ ] Voronoi generation
- [ ] Biome assignment
- [ ] Elevation heightmap
- [ ] River generation
- [ ] Resource placement
- [ ] Minimap
- [ ] Map save/load

### Phase 3: Core Game Systems (Cycles 21-35)
- [ ] ECS core
- [ ] Unit system
- [ ] Movement system
- [ ] Turn system
- [ ] Fog of war
- [ ] City system
- [ ] Tech tree
- [ ] Combat system

### Phase 4: Expansion (Cycles 36-55)
- [ ] Full tech tree
- [ ] Civics/government
- [ ] Diplomacy
- [ ] Roads & trade
- [ ] Religion
- [ ] Great people
- [ ] All 48 civs

### Phase 5: Victory & AI (Cycles 56-75)
- [ ] Victory tracking
- [ ] AI systems
- [ ] World Congress
- [ ] Scoring

### Phase 6: Tactical Battle Mode (Cycles 76-95)
- [ ] Real-time battles
- [ ] Battle UI
- [ ] Morale system
- [ ] Auto-resolve

### Phase 7: Polish (Cycles 96+)
- [ ] UI polish
- [ ] Sound design
- [ ] Music
- [ ] Visual polish
- [ ] Balance pass

---

## Technology Stack

- **Language:** C++17
- **Window/Input/Audio:** SDL3
- **Graphics:** SDL3::Renderer (fallback from SDL_GPUDevice)
- **Build:** CMake 3.20+
- **Testing:** doctest
- **Data:** nlohmann/json
- **Images:** SDL3_image (PNG, JPG)
- **Audio:** SDL3_mixer (WAV, OGG)
- **Text:** SDL3_ttf
- **Geometry:** TBD (Voronoi, polygon ops)
- **Pathfinding:** A* on navigation mesh

---

## Current Status

- [x] Git initialized
- [x] Project structure created
- [x] CMakeLists.txt with FetchContent
- [x] Minimal SDL3 window
- [ ] Input system
- [ ] Rendering pipeline
- [ ] Game loop with fixed timestep

---

## Notes
- Keep systems decoupled and well-tested
- Prioritize playability over feature completeness
- Use git for efficient iteration
- No grid/hex anywhere—pure polygons and distance-based systems
