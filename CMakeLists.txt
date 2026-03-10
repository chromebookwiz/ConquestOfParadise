cmake_minimum_required(VERSION 3.20)
project(ProjectHexless VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
    SDL3
    GIT_REPOSITORY https://github.com/libsdl-org/SDL.git
    GIT_TAG main
)
FetchContent_Declare(
    SDL3_image
    GIT_REPOSITORY https://github.com/libsdl-org/SDL_image.git
    GIT_TAG main
)
FetchContent_Declare(
    SDL3_mixer
    GIT_REPOSITORY https://github.com/libsdl-org/SDL_mixer.git
    GIT_TAG main
)
FetchContent_Declare(
    SDL3_ttf
    GIT_REPOSITORY https://github.com/libsdl-org/SDL_ttf.git
    GIT_TAG main
)
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)
FetchContent_Declare(
    doctest
    GIT_REPOSITORY https://github.com/doctest/doctest.git
    GIT_TAG v2.4.11
)

# Disable optional image codecs that require external build tools (e.g., nasm for dav1d).
# We only need basic PNG/JPG support for now.
set(SDLIMAGE_DAV1D OFF CACHE BOOL "Disable dav1d dependency (requires nasm)" FORCE)
set(SDLIMAGE_AVIF OFF CACHE BOOL "Disable AVIF support" FORCE)
set(SDLIMAGE_WEBP OFF CACHE BOOL "Disable WebP support" FORCE)

FetchContent_MakeAvailable(SDL3 SDL3_image SDL3_mixer SDL3_ttf json doctest)

add_executable(${PROJECT_NAME} main.cpp)

target_link_libraries(${PROJECT_NAME} PRIVATE SDL3::SDL3 SDL3_image::SDL3_image SDL3_mixer::SDL3_mixer SDL3_ttf::SDL3_ttf nlohmann_json::nlohmann_json)

# For tests
enable_testing()

add_executable(tests tests/test_main.cpp)
target_link_libraries(tests PRIVATE doctest)
add_test(NAME unit_tests COMMAND tests)
