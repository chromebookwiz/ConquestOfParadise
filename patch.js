import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Add Socket.io import
if (!content.includes('socket.io-client')) {
    content = content.replace(/import { useState[^}]*\} from "react";/,
        'import { useState, useEffect, useCallback, useRef, useMemo } from "react";\nimport { io } from "socket.io-client";');
}

// 2. Add full 48 Civs
const fullCivs = `const CIVS = [
    { id: "egypt", name: "Egypt", color: "#d4a843", accent: "#f5d580", bonus: "+20% Wonder Production", icon: "𓂀" },
    { id: "rome", name: "Rome", color: "#9b1b1b", accent: "#e84040", bonus: "Free roads to capital", icon: "SPQR" },
    { id: "greece", name: "Greece (Athens)", color: "#2255aa", accent: "#5588dd", bonus: "+15% Culture", icon: "Ω" },
    { id: "sparta", name: "Greece (Sparta)", color: "#aa2222", accent: "#cc5555", bonus: "Military +25% XP", icon: "Λ" },
    { id: "china", name: "China", color: "#cc2222", accent: "#ff6644", bonus: "Great Wall defense", icon: "龍" },
    { id: "japan", name: "Japan", color: "#e8e8e8", accent: "#cc0033", bonus: "Full strength damaged", icon: "侍" },
    { id: "india", name: "India", color: "#e68a00", accent: "#ff9933", bonus: "Religion +30%", icon: "ॐ" },
    { id: "persia", name: "Persia", color: "#b8862a", accent: "#f0c060", bonus: "Golden Age +50%", icon: "☽" },
    { id: "aztec", name: "Aztec", color: "#1a6633", accent: "#44cc66", bonus: "Luxury = +1 prod", icon: "☀" },
    { id: "mongolia", name: "Mongolia", color: "#4a2a8a", accent: "#8855cc", bonus: "Cavalry +25%", icon: "Ө" },
    { id: "england", name: "England", color: "#1a3366", accent: "#cc0033", bonus: "Naval +20%", icon: "♔" },
    { id: "france", name: "France", color: "#0055a4", accent: "#ef4135", bonus: "Tourism +20%", icon: "⚜" },
    { id: "germany", name: "Germany", color: "#2a2a2a", accent: "#dd0000", bonus: "Production +15%", icon: "✠" },
    { id: "russia", name: "Russia", color: "#114477", accent: "#4488cc", bonus: "Extra territory", icon: "Ж" },
    { id: "america", name: "America", color: "#3c3b6e", accent: "#b22234", bonus: "Diplomatic +50%", icon: "★" },
    { id: "brazil", name: "Brazil", color: "#009739", accent: "#ffdf00", bonus: "Great People +15%", icon: "♦" },
    { id: "arabia", name: "Arabia", color: "#1a4c33", accent: "#4cc080", bonus: "Faith/Sci synergy", icon: "☪" },
    { id: "ottoman", name: "Ottoman", color: "#c03a3a", accent: "#ef5555", bonus: "Siege +25%", icon: "☾" },
    { id: "zulu", name: "Zulu", color: "#1a1a1a", accent: "#cc8800", bonus: "XP gain +25%", icon: "⚒" },
    { id: "kongo", name: "Kongo", color: "#6a4a2a", accent: "#a88055", bonus: "Relics +50%", icon: "🛡" },
    { id: "spain", name: "Spain", color: "#ffc107", accent: "#ffeb3b", bonus: "Religious Combat", icon: "❦" },
    { id: "netherlands", name: "Netherlands", color: "#e86020", accent: "#ffa040", bonus: "Trade +50%", icon: "🌷" },
    { id: "poland", name: "Poland", color: "#cc2244", accent: "#ff6688", bonus: "Culture bomb", icon: "🦅" },
    { id: "norway", name: "Norway", color: "#2a4a5a", accent: "#4a8aac", bonus: "Naval Raiding", icon: "ᚢ" },
    { id: "sweden", name: "Sweden", color: "#1155aa", accent: "#ffd700", bonus: "Great People", icon: "👑" },
    { id: "korea", name: "Korea", color: "#2a2aa8", accent: "#5a5aff", bonus: "Science +20%", icon: "태" },
    { id: "scythia", name: "Scythia", color: "#a84a20", accent: "#d4804a", bonus: "Cavalry pairs", icon: "🐎" },
    { id: "sumeria", name: "Sumeria", color: "#3a5a8a", accent: "#6a8acc", bonus: "Early War", icon: "𒀭" },
    { id: "babylon", name: "Babylon", color: "#2080a8", accent: "#4ac0e6", bonus: "Full tech Eureka", icon: "⛩" },
    { id: "ethiopia", name: "Ethiopia", color: "#3a8a3a", accent: "#6acc6a", bonus: "Hill Defense", icon: "🦁" },
    { id: "maori", name: "Maori", color: "#2a6a6a", accent: "#4aabab", bonus: "Ocean start", icon: "🌀" },
    { id: "vietnam", name: "Vietnam", color: "#1a5a4a", accent: "#4a9a8a", bonus: "Jungle combat", icon: "🐉" },
    { id: "portugal", name: "Portugal", color: "#eeeeee", accent: "#2255aa", bonus: "Naval Trade", icon: "⚓" },
    { id: "inca", name: "Inca", color: "#d4a040", accent: "#f5d080", bonus: "Mountain yields", icon: "⛰" },
    { id: "mali", name: "Mali", color: "#e0b020", accent: "#ffe050", bonus: "Massive Gold", icon: "💰" },
    { id: "phoenicia", name: "Phoenicia", color: "#5a2a8a", accent: "#8a5acc", bonus: "Coastal cities", icon: "🚢" },
    { id: "scotland", name: "Scotland", color: "#2a4a8a", accent: "#5a8add", bonus: "Happy Science", icon: "🦄" },
    { id: "australia", name: "Australia", color: "#1a6a4a", accent: "#4aa87a", bonus: "Liberation bonus", icon: "🦘" },
    { id: "canada", name: "Canada", color: "#aa2222", accent: "#ee5555", bonus: "No surprise war", icon: "🍁" },
    { id: "nubia", name: "Nubia", color: "#8a5a20", accent: "#cc8a4a", bonus: "Ranged +30%", icon: "🏹" },
    { id: "georgia", name: "Georgia", color: "#ee2222", accent: "#ffffff", bonus: "Walls + Faith", icon: "✣" },
    { id: "indonesia", name: "Indonesia", color: "#a82020", accent: "#d45050", bonus: "Coastal yields", icon: "🛶" },
    { id: "khmer", name: "Khmer", color: "#2a8a5a", accent: "#5acc8a", bonus: "Pop growth", icon: "🐘" },
    { id: "maya", name: "Maya", color: "#1a5a8a", accent: "#4a9add", bonus: "Capital proximity", icon: "🗿" },
    { id: "colombia", name: "Gran Colombia", color: "#ccaa11", accent: "#114499", bonus: "Movement +1", icon: "⚔" },
    { id: "byzantium", name: "Byzantium", color: "#aa2a6a", accent: "#dd5a9a", bonus: "Heavy Cavalry", icon: "☦" },
    { id: "gaul", name: "Gaul", color: "#4a6a2a", accent: "#8aa85a", bonus: "Mine Culture", icon: "⚒" },
    { id: "mapuche", name: "Mapuche", color: "#2a8aa8", accent: "#5accee", bonus: "Combat vs Golden", icon: "🦅" }
];`;

content = content.replace(/const CIVS = \[[^\]]*\];/s, fullCivs);

// 3. Add Multiplayer Context & Replace local player indices
content = content.replace(/c\.civId === 0/g, 'c.civId === playerCivIndex');
content = content.replace(/unit\.civId === 0/g, 'unit.civId === playerCivIndex');
content = content.replace(/city\.civId === 0/g, 'city.civId === playerCivIndex');
content = content.replace(/u\.civId !== 0/g, 'u.civId !== playerCivIndex');
content = content.replace(/civ\.name\} \$\{game\.cities\.filter\(c => c\.civId === 0\)/g, 'civ.name} ${game.cities.filter(c => c.civId === playerCivIndex)');
content = content.replace(/c\.owner = 0/g, 'c.owner = playerCivIndex');
content = content.replace(/game\.civs\[0\]/g, 'game.civs[playerCivIndex]');
content = content.replace(/game\?\.civs\?\.\[0\]/g, 'game?.civs?.[playerCivIndex]');
content = content.replace(/civId: 0/g, 'civId: playerCivIndex');
content = content.replace(/game\.map\.cells, game\.units, game\.cities, 0/g, 'game.map.cells, game.units, game.cities, playerCivIndex');
content = content.replace(/ci === 0/g, 'ci === playerCivIndex');

// 4. Update the Component State
const componentStateHook = `
    const [screen, setScreen] = useState("menu");
    const [game, setGame] = useState(null);
    const [playerCivIndex, setPlayerCivIndex] = useState(0);
    const [roomInfo, setRoomInfo] = useState(null);
    const socketRef = useRef(null);
    const [roomIdInput, setRoomIdInput] = useState("");
    const [pwdInput, setPwdInput] = useState("");

    useEffect(() => {
        socketRef.current = io(window.location.origin);
        socketRef.current.on('stateUpdated', (newState) => {
            setGame(newState);
        });
        socketRef.current.on('roomClosed', () => {
            setScreen("menu");
            setNotifs(["Host disconnected. Room closed."]);
        });
        return () => socketRef.current.disconnect();
    }, []);

    const emitState = useCallback((newState) => {
        setGame(newState);
        if (roomInfo) {
            socketRef.current.emit('syncState', { roomId: roomInfo.id, gameState: newState });
        }
    }, [roomInfo]);
`;
content = content.replace(/    const \[screen, setScreen\] = useState\("menu"\);\n    const \[game, setGame\] = useState\(null\);/, componentStateHook);

// Replace raw setGame calls that update game state with emitState, EXCLUDING the one inside emitState itself!
// Since we only shadow setGame, we can just replace the direct calls:
content = content.replace(/setGame\(\{ \.\.\.game \}\);/g, 'emitState({ ...game });');
content = content.replace(/setGame\(newState\);/g, 'emitState(newState);');
content = content.replace(/setGame\(\{ \.\.\.game, selUnit: null, notifs: \[`Founded \$\{name\}!`\] \}\);/g, 'emitState({ ...game, selUnit: null, notifs: [`Founded ${name}!`] });');
content = content.replace(/setGame\(prev => \(\{ \.\.\.prev, selUnit: unit\.id, selCity: null \}\)\);/g, 'emitState({ ...game, selUnit: unit.id, selCity: null });');
content = content.replace(/setGame\(prev => \(\{ \.\.\.prev, selCity: city\.id, selUnit: null \}\)\);/g, 'emitState({ ...game, selCity: city.id, selUnit: null });');
content = content.replace(/setGame\(\{ \.\.\.game, combatLog: \[\.\.\.game\.combatLog, \`\$\{uType\.name\} attacks \$\{UNITS\[enemy\.type\]\?\.name\}: \$\{dmg\} dmg\`\] \}\);/g, 'emitState({ ...game, combatLog: [...game.combatLog, `${uType.name} attacks ${UNITS[enemy.type]?.name}: ${dmg} dmg`] });');


// 5. Update Menu UI
const menuUI = `// ─────────────────────────────────────────────────────
    // MENU SCREEN
    // ─────────────────────────────────────────────────────
    if (screen === "menu") {
        return (
            <div style={{ width: "100vw", height: "100vh", background: \`radial-gradient(ellipse at 30% 20%, #1a1428 0%, #0c0e14 50%, #080a10 100%)\`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", color: "var(--text)", overflow: "hidden", position: "relative" }}>
                <style>{css}</style>
                <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 10, zIndex: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <input type="text" placeholder="Room ID" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value)} style={{ padding: "6px 10px", background: "rgba(0,0,0,0.5)", border: "1px solid var(--border)", color: "var(--gold)" }} />
                        <input type="password" placeholder="Password" value={pwdInput} onChange={e => setPwdInput(e.target.value)} style={{ padding: "6px 10px", background: "rgba(0,0,0,0.5)", border: "1px solid var(--border)", color: "var(--gold)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <button className="btn-gold" style={{ padding: "6px 16px", fontSize: 13 }} onClick={() => {
                            if (!roomIdInput) return alert("Enter Room ID");
                            const state = initGame(Math.floor(Math.random() * 99999), selCiv, 4);
                            socketRef.current.emit('createRoom', { roomId: roomIdInput, password: pwdInput, gameState: state }, (res) => {
                                if (res.success) {
                                    setRoomInfo({ id: roomIdInput, isHost: true });
                                    setPlayerCivIndex(0);
                                    emitState(state);
                                    setScreen("game");
                                } else alert(res.message);
                            });
                        }}>HOST GAME</button>
                        <button className="btn-gold" style={{ padding: "6px 16px", fontSize: 13 }} onClick={() => {
                            if (!roomIdInput) return alert("Enter Room ID");
                            socketRef.current.emit('joinRoom', { roomId: roomIdInput, password: pwdInput }, (res) => {
                                if (res.success) {
                                    setRoomInfo({ id: roomIdInput, isHost: false });
                                    // Hack: Join as Civ 1 (Player 2)
                                    setPlayerCivIndex(1);
                                    emitState(res.gameState);
                                    setScreen("game");
                                } else alert(res.message);
                            });
                        }}>JOIN GAME</button>
                    </div>
                </div>

                <div style={{ textAlign: "center", zIndex: 1, animation: "fadeUp 1s ease" }}>
                    <div style={{ fontSize: 12, letterSpacing: 10, textTransform: "uppercase", color: "var(--gold-dark)", marginBottom: 16, fontWeight: 600 }}>A Gridless 4X Strategy Game</div>
                    <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 56, fontWeight: 900, margin: 0, letterSpacing: 4, background: "linear-gradient(180deg, #f0e6c8 0%, #c9a84c 40%, #8a6a20 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "glow 5s ease-in-out infinite", lineHeight: 1 }}>CONQUEST OF PARADISE</h1>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, fontStyle: "italic", color: "var(--text-dim)", marginTop: 12, letterSpacing: 2 }}>"The world is yours to claim."</div>
                </div>
                
                <div style={{ marginTop: 30, zIndex: 1, animation: "fadeUp 1.3s ease", width: "100%", maxWidth: 1000, padding: "0 20px" }}>
                    <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--gold-dark)", textAlign: "center", marginBottom: 16 }}>Choose Your Civilization</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, maxHeight: "40vh", overflowY: "auto", padding: "10px" }}>
                        {CIVS.map(civ => (
                            <button key={civ.id} onClick={() => setSelCiv(civ.id)} style={{
                                background: selCiv === civ.id ? \`linear-gradient(135deg, \${civ.color}44, \${civ.color}22)\` : "rgba(255,255,255,0.02)",
                                border: selCiv === civ.id ? \`1px solid \${civ.color}ee\` : "1px solid rgba(255,255,255,0.06)",
                                color: "var(--text)", padding: "8px 4px", cursor: "pointer", borderRadius: 4,
                                fontFamily: "'Cinzel', serif", fontSize: 10, transition: "all 0.2s",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                                boxShadow: selCiv === civ.id ? \`0 0 20px \${civ.color}44\` : "none",
                            }}>
                                <span style={{ fontSize: 18, lineHeight: 1, fontFamily: "serif" }}>{civ.icon}</span>
                                <span style={{ fontWeight: 600, letterSpacing: 0, textAlign: "center", lineHeight: 1 }}>{civ.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={() => {
                    const state = initGame(Math.floor(Math.random() * 99999), selCiv, 4);
                    setPlayerCivIndex(0);
                    emitState(state);
                    setScreen("game");
                }} className="btn-gold" style={{
                    marginTop: 30, padding: "14px 60px", fontSize: 16, fontWeight: 700, letterSpacing: 4, borderRadius: 4, zIndex: 1, animation: "fadeUp 1.5s ease",
                    background: "linear-gradient(180deg, #2a2010, #1a1408)"
                }}>SINGLE PLAYER</button>
            </div>
        );
    }`;

content = content.replace(/\/\/ ─────────────────────────────────────────────────────\n\s*\/\/ MENU SCREEN[\s\S]*?(?=\/\/ ─────────────────────────────────────────────────────\n\s*\/\/ VICTORY SCREEN)/, menuUI + '\n\n    ');

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx modified successfully!');
