# PROJECT HEXLESS — FULL MACHINE SETUP GUIDE

Everything you need to do, in order, to get your autonomous game dev agent running on your 5090. Copy-paste each block into your terminal or follow the instructions exactly.

---

## STEP 1 — INSTALL OLLAMA

Open a terminal (PowerShell on Windows, Terminal on Linux/Mac).

**Windows:**
Download and run the installer from https://ollama.com/download/windows

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Mac:**
Download and run the installer from https://ollama.com/download/mac

After installing, verify it works:
```bash
ollama --version
```

---

## STEP 2 — PULL YOUR MODEL

This downloads the Unsloth Q4_K_M quant of Qwen3.5-27B (~17GB). It will take a while depending on your internet speed.

```bash
ollama pull hf.co/unsloth/Qwen3.5-27B-GGUF:Q4_K_M
```

Verify it downloaded:
```bash
ollama list
```

You should see `hf.co/unsloth/Qwen3.5-27B-GGUF:Q4_K_M` in the list.

---

## STEP 3 — KEEP THE MODEL LOADED IN VRAM PERMANENTLY

By default Ollama unloads models after 5 minutes of inactivity. You don't want that.

**Option A — One-time command (do this every time you reboot):**
```bash
curl http://localhost:11434/api/generate -d "{\"model\": \"hf.co/unsloth/Qwen3.5-27B-GGUF:Q4_K_M\", \"keep_alive\": -1}"
```

**Option B — Set it globally so you never have to think about it:**

*Windows:*
1. Open System Properties → Environment Variables
2. Under "User variables", click New
3. Variable name: `OLLAMA_KEEP_ALIVE`
4. Variable value: `-1`
5. Click OK, restart Ollama

*Linux:*
```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_KEEP_ALIVE=-1"
EOF
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

*Mac:*
```bash
launchctl setenv OLLAMA_KEEP_ALIVE "-1"
```
Then restart Ollama (quit from menu bar and reopen).

---

## STEP 4 — INCREASE CONTEXT WINDOW

The default context window in Ollama is 2048 tokens, which is way too small for an agent working on a codebase. Bump it up.

```bash
ollama run hf.co/unsloth/Qwen3.5-27B-GGUF:Q4_K_M
```

Once the chat loads, type these commands inside the Ollama chat:
```
/set parameter num_ctx 32768
/save hf.co/unsloth/Qwen3.5-27B-GGUF:Q4_K_M
/bye
```

This saves a 32K context window as the default for this model. On your 5090 with 32GB VRAM at Q4_K_M (~17GB model), you have plenty of room for this.

---

## STEP 5 — INSTALL VS CODE (if you don't have it)

Download from https://code.visualstudio.com/ and install normally.

---

## STEP 6 — INSTALL THE CONTINUE EXTENSION

1. Open VS Code
2. Press `Ctrl+Shift+X` (opens the Extensions panel)
3. Search for **Continue**
4. Install the one by **Continue.dev** (it has the blue logo and millions of installs)
5. Wait for it to finish installing — it may show a welcome/setup wizard. Close it.

---

## STEP 7 — CONFIGURE CONTINUE TO USE YOUR LOCAL MODEL

1. Press `Ctrl+Shift+P` to open the Command Palette
2. Type `Continue: Open Config` and select it
3. This opens a file called `config.json`. **Delete everything in it** and paste this:

```json
{
  "models": [
    {
      "title": "Qwen3.5 27B Q4_K_M",
      "provider": "ollama",
      "model": "hf.co/unsloth/Qwen3.5-27B-GGUF:Q4_K_M",
      "apiBase": "http://localhost:11434",
      "contextLength": 32768
    }
  ],
  "tabAutocompleteModel": {
    "title": "Qwen3.5 27B Autocomplete",
    "provider": "ollama",
    "model": "hf.co/unsloth/Qwen3.5-27B-GGUF:Q4_K_M",
    "apiBase": "http://localhost:11434"
  },
  "allowAnonymousTelemetry": false
}
```

4. Save the file (`Ctrl+S`)

---

## STEP 8 — INSTALL BUILD TOOLS (for the C++ game engine)

The agent is going to write C++ code and build it. You need a compiler and CMake.

**Windows:**
1. Install Visual Studio Build Tools (free): https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - During install, check "Desktop development with C++"
2. Install CMake: https://cmake.org/download/
   - During install, check "Add CMake to the system PATH"
3. Install Git: https://git-scm.com/download/win

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y build-essential cmake git pkg-config libx11-dev libxext-dev libxrandr-dev libxi-dev libgl1-mesa-dev libglu1-mesa-dev libwayland-dev libxkbcommon-dev libasound2-dev libpulse-dev
```

**Mac:**
```bash
xcode-select --install
brew install cmake git
```

Verify everything works:
```bash
g++ --version      # or cl on Windows (open Developer Command Prompt)
cmake --version
git --version
```

---

## STEP 9 — CREATE YOUR PROJECT FOLDER

Pick where you want the game to live and create the folder.

**Windows (PowerShell):**
```powershell
mkdir C:\Projects\hexless
cd C:\Projects\hexless
git init
```

**Linux/Mac:**
```bash
mkdir -p ~/Projects/hexless
cd ~/Projects/hexless
git init
```

---

## STEP 10 — DROP IN THE AGENT FILE

Copy the `AGENT.md` file you downloaded from our conversation into your project folder:

**Windows:**
```powershell
copy C:\Users\YourName\Downloads\AGENT.md C:\Projects\hexless\AGENT.md
```

**Linux/Mac:**
```bash
cp ~/Downloads/AGENT.md ~/Projects/hexless/AGENT.md
```

---

## STEP 11 — OPEN THE PROJECT IN VS CODE

```bash
code C:\Projects\hexless
```
or
```bash
code ~/Projects/hexless
```

This opens VS Code with your project folder as the workspace.

---

## STEP 12 — VERIFY EVERYTHING IS CONNECTED

1. Look at the left sidebar — you should see the Continue icon (looks like a play button or the Continue logo)
2. Click it to open the Continue chat panel
3. At the top of the chat, you should see a model dropdown — click it and select **"Qwen3.5 27B Q4_K_M"**
4. Type a quick test message like: `Hello, are you working?`
5. Wait for a response. The first response may take 10-20 seconds as the model loads into VRAM. Subsequent responses will be fast.

If you get an error:
- Make sure Ollama is running (`ollama serve` in a terminal, or check that the Ollama app is open)
- Make sure the model name in config.json exactly matches what `ollama list` shows
- Try reloading VS Code (`Ctrl+Shift+P` → "Developer: Reload Window")

---

## STEP 13 — SWITCH TO AGENT MODE AND LAUNCH

1. In the Continue chat panel, look at the top where it says the mode (might say "Chat" or "Ask")
2. Click it and switch to **"Agent"**
3. Paste this exact message and hit Enter:

```
Read the file AGENT.md in this workspace. It contains your complete instruction set. You are an autonomous game engine developer. Follow every instruction in that document exactly. Begin Cycle 1 now.
```

4. Watch it go. It will start creating files, writing CMakeLists.txt, setting up the project structure, and building.

---

## WHAT TO EXPECT

- **Cycle 1** will take the longest — it's setting up the entire project structure, writing CMakeLists.txt, creating main.cpp, and doing the first build. SDL3 fetching from source via CMake takes a while the first time.
- The agent will talk to itself through NEXT_CYCLE.md. Each cycle it reads its own instructions, does the work, commits, and writes the next set of instructions.
- You can watch progress by checking:
  - **Git log:** `git log --oneline` in the terminal to see commits
  - **DEVLOG.md:** the agent writes what it did each cycle
  - **TODO.md:** tasks get checked off as they're completed
- The agent may get stuck sometimes — that's normal. It has recovery procedures built in. If it loops badly, you can step in with a new message in Continue to redirect it.

---

## USEFUL COMMANDS FOR MONITORING

Open a terminal in VS Code (`Ctrl+``) and use these:

```bash
# See recent commits (what the agent has been doing)
git log --oneline -20

# See what changed in the last commit
git diff HEAD~1

# See the current build status
cmake --build build/ 2>&1 | tail -20

# Run the game (once it's built)
./build/hexless          # Linux/Mac
.\build\Debug\hexless.exe  # Windows

# Nuclear option — undo everything the agent did since last good commit
git log --oneline -20    # find the good commit hash
git reset --hard abc1234 # replace abc1234 with the hash
```

---

## TROUBLESHOOTING

**"Ollama connection refused"**
→ Ollama isn't running. Open a terminal and run `ollama serve`, or start the Ollama app.

**"Model not found"**
→ The model name in Continue's config.json doesn't match. Run `ollama list`, copy the exact model name, and paste it into config.json.

**Continue shows no models in the dropdown**
→ Reload VS Code (`Ctrl+Shift+P` → "Developer: Reload Window"). Make sure Ollama is running first.

**Agent mode isn't available**
→ Make sure you have the latest version of Continue. Some older versions don't have Agent mode. Update the extension in VS Code.

**CMake build fails with "SDL3 not found"**
→ This is expected on the first build if your internet is slow — SDL3 is being downloaded via FetchContent. Wait for it. If it keeps failing, the agent should handle it (it has recovery instructions in AGENT.md).

**The agent stops responding mid-cycle**
→ It might have hit a very long generation. Wait a couple minutes. If it's truly stuck, send a new message: `Continue from where you left off. Read NEXT_CYCLE.md and proceed.`

**The agent is doing something dumb**
→ Send a message in Continue: `Stop. [explain what's wrong]. Revert your last changes with git checkout -- . and try [your suggestion] instead.`

---

## THAT'S IT

You now have:
- A local Qwen3.5-27B running permanently on your 5090
- VS Code with an AI agent that has full file and terminal access
- A 624-line master document telling it exactly what to build
- A Civilization-meets-Total-War game slowly assembling itself in your project folder

Go grab a coffee and check back in 30 minutes. You should have a window with a colored background by then. Check back in a few hours and you might have a map.
