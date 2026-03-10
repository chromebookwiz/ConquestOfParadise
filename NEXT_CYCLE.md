# Cycle 2 Instructions

## Priority Task
Implement the input system and basic 2D rendering framework. Specifically:
1. Create an input manager that polls keyboard and mouse state each frame
2. Implement basic 2D rendering for polygons, lines, and circles using SDL_Renderer
3. Implement a fixed-timestep game loop (60 FPS target) with interpolation
4. Create a basic camera system that can pan and zoom
5. Render a debug grid and text to screen to verify rendering works

## Context
- Build successfully compiles and produces a window
- CTest not working yet (low priority), but manual test runs should verify functionality
- No external geometry library yet; polygon rendering will initially be simple SDL shapes (rectangles, circles)
- Input should support wasd/arrow keys for camera movement and mouse clicks for future selection

## Warnings
- Do not add Voronoi generation or complex geometry yet. Keep Phase 1 focused on the engine foundation.
- The game loop MUST use a fixed timestep with separate render and update code paths. Do not use frame-based timing.
- CTest issue may persist; if still broken after this cycle, skip to next task. It's not blocking progress.
- Keep all systems decoupled: input, rendering, game state should be separate modules.

