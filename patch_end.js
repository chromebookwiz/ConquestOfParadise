import fs from 'fs';
let content = fs.readFileSync('src/App.jsx', 'utf-8');

// The file ends at: `                                {game.combatLog.length > 0 &&`
// Let's replace that exact string and append the rest.

let remainder = `                                {game.combatLog.length > 0 && (
                                    <div style={{ marginTop: 20, padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 4, maxHeight: 100, overflowY: "auto", fontSize: 10, color: "var(--text-dim)" }}>
                                        {game.combatLog.slice(-5).map((log, i) => <div key={i}>{log}</div>)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CITY panel */}
                        {panel === "city" && selCity && (
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold-light)", marginBottom: 4 }}>🏙️ {selCity.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
                                    Pop: {selCity.pop}/{selCity.housing} · HP: {selCity.hp}/{selCity.maxHp}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
                                    <div className="yield-badge" style={{ justifyContent: "center", color: "#8cba44", padding: 4 }}>🌾 {cityYields(selCity, game.map.cells).food}</div>
                                    <div className="yield-badge" style={{ justifyContent: "center", color: "#c8964a", padding: 4 }}>⚒️ {cityYields(selCity, game.map.cells).prod}</div>
                                </div>
                                
                                {selCity.currentBuild ? (
                                    <div style={{ padding: 10, background: "var(--bg-card)", borderRadius: 4, marginBottom: 12 }}>
                                        <div style={{ fontSize: 11, color: "var(--gold)" }}>Building: {UNITS[selCity.currentBuild]?.name || BUILDINGS[selCity.currentBuild]?.name || 'Mars Project'}</div>
                                        <div className="progress-bar" style={{ marginTop: 6, marginBottom: 4 }}>
                                            <div className="progress-fill" style={{ width: \`\${(selCity.prod / (UNITS[selCity.currentBuild]?.cost || BUILDINGS[selCity.currentBuild]?.cost || 500)) * 100}%\`, background: "var(--gold-dark)" }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{Math.floor(selCity.prod)} / {UNITS[selCity.currentBuild]?.cost || BUILDINGS[selCity.currentBuild]?.cost || 500}</div>
                                        <button className="btn-build" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => { selCity.currentBuild = null; emitState({ ...game }); }}>Cancel</button>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 12 }}>Idle. Choose production:</div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {availBuilds.map(b => (
                                        <button key={b.id} className="btn-build" onClick={() => { selCity.currentBuild = b.id; emitState({ ...game }); }} style={{ padding: "6px 10px" }}>
                                            <span style={{ fontSize: 14 }}>{b.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 11, fontWeight: 600 }}>{b.name}</div>
                                                <div style={{ fontSize: 9, color: "var(--text-dim)" }}>{b.cost} ⚒️</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* WORLD panel */}
                        {panel === "civs" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>Civilizations</div>
                                {game.civs.map((c, i) => (
                                    <div key={i} style={{ padding: "8px 12px", background: "var(--bg-card)", borderLeft: \`3px solid \${c.color}\`, borderRadius: 4, display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: 18 }}>{c.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-bright)" }}>{c.name} {i === playerCivIndex ? "(You)" : ""}</div>
                                            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{ERAS[c.era] || 'Ancient'} Era · Score {c.score}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* End Turn Button */}
                    <button className="btn-gold" style={{ padding: 16, fontSize: 14, fontWeight: 700, letterSpacing: 3, borderTop: "1px solid var(--border-gold)", borderRadius: 0 }} onClick={endTurn}>
                        END TURN
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none", zIndex: 100 }}>
                {notifs.map((n, i) => (
                    <div key={i} style={{ background: "rgba(0,0,0,0.8)", border: "1px solid var(--gold-dark)", padding: "8px 16px", borderRadius: 4, fontSize: 12, color: "var(--gold-light)", animation: "fadeUp 0.3s ease", letterSpacing: 1 }}>
                        {n}
                    </div>
                ))}
            </div>
        </div>
    );
}
`;

content = content.replace('{game.combatLog.length > 0 &&', remainder);
fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx fixed successfully!');
