# Cycle 1 — Mar 8, 2026

**Task:** Initialize git repo, create project structure, set up CMakeLists.txt with SDL3/JSON/doctest via FetchContent, write minimal main.cpp

**Result:** Successful (with caveats)

**Changes:**
- Initialized git repository
- Created full directory structure (engine/*, game/*, tests/, tools/, build/)
- Created CMakeLists.txt with FetchContent for SDL3, SDL3_image, SDL3_mixer, SDL3_ttf, nlohmann/json, and doctest
- Disabled optional image codecs (AVIF, dav1d, WebP) that require external tools like nasm
- Created main.cpp that initializes SDL3, creates a window, renders a colored background
- Created test_main.cpp with minimal sanity test
- Created DESIGN.md, TODO.md

**Issues:**
- CTest not discovering tests despite enable_testing() in CMakeLists.txt. The "add_test()" command may not be registering properly with the Visual Studio generator. Deferred to next cycle since build compiles successfully.
- SDL3_image dependencies on nasm/dav1d caused initial build failures; disabled optional codecs to workaround.

**Next:** Cycle 2 should implement the input system (keyboard + mouse polling) and basic rendering loop with fixed timestep, then begin camera system work.
