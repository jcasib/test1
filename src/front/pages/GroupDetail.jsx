import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { api } from "../store";

export function GroupDetail() {
    const { groupId } = useParams();
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteUsername, setInviteUsername] = useState("");
    const [showInvite, setShowInvite] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState(null);

    useEffect(() => { loadData(); }, [groupId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [g, p] = await Promise.all([
                api(store.token, "GET", `/groups/${groupId}`),
                api(store.token, "GET", `/groups/${groupId}/plans`),
            ]);
            setGroup(g); setPlans(p);
        } catch (e) { navigate("/dashboard"); }
        setLoading(false);
    };

    const [searchResults, setSearchResults] = useState([]);

    const searchUsers = async (q) => {
        setInviteUsername(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try {
            const results = await api(store.token, "GET", `/users/search?q=${encodeURIComponent(q)}`);
            setSearchResults(results.filter(u => !group.members.find(m => m.id === u.id)));
        } catch (e) { setSearchResults([]); }
    };

    const inviteUser = async (username) => {
        try {
            await api(store.token, "POST", `/groups/${groupId}/invite`, { username });
            setInviteUsername(""); setSearchResults([]); setShowInvite(false);
            dispatch({ type: "set_toast", payload: `¡${username} añadido al grupo!` });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const spin = async () => {
        setSpinning(true); setWinner(null);
        try {
            const data = await api(store.token, "POST", `/groups/${groupId}/spin`);
            setTimeout(() => { setWinner(data.plan_master); setSpinning(false); }, 2000);
        } catch (e) { setSpinning(false); }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (!group) return null;

    return (
        <div>
            <div className="page-header">
                <div className="container">
                    <button onClick={() => navigate("/dashboard")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "8px 16px", borderRadius: "100px", cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.82rem", marginBottom: "16px" }}>← Volver</button>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ width: "60px", height: "60px", background: "rgba(255,255,255,0.15)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                            {group.emoji}
                        </div>
                        <div>
                            <h1>{group.name}</h1>
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>{group.description}</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={spin} disabled={spinning}>
                            {spinning ? "🎰 Girando..." : "🎰 Sortear Plan Master"}
                        </button>
                        <Link to={`/create-plan?group=${groupId}`}><button className="btn btn-ghost" style={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}>+ Nuevo Plan</button></Link>
                        <button className="btn btn-ghost" style={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }} onClick={() => setShowInvite(!showInvite)}>👥 Invitar</button>
                    </div>

                    {/* Winner */}
                    {winner && (
                        <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="avatar avatar-lg" style={{ background: winner.avatar_color }}>{winner.avatar_initial}</div>
                            <div>
                                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem" }}>🏆 {winner.username} es el Plan Master</p>
                                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>¡Tiene 48h para proponer el plan!</p>
                            </div>
                        </div>
                    )}

                    {/* Invite form with live search */}
                    {showInvite && (
                        <div style={{ marginTop: "16px" }}>
                            <input className="form-input" placeholder="Buscar usuario..." value={inviteUsername}
                                onChange={e => searchUsers(e.target.value)}
                                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white" }} />
                            {searchResults.length > 0 && (
                                <div style={{ background: "white", borderRadius: "var(--radius)", marginTop: "4px", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
                                    {searchResults.map(u => (
                                        <button key={u.id} type="button"
                                            onClick={() => inviteUser(u.username)}
                                            style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--cream-dark)", textAlign: "left" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--cream)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                            <div className="avatar avatar-sm" style={{ background: u.avatar_color }}>{u.avatar_initial}</div>
                                            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{u.username}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                        {group.members.map(m => (
                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div className="avatar avatar-sm" style={{ background: m.avatar_color }}>{m.avatar_initial}</div>
                                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)" }}>{m.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: "32px 20px" }}>
                {plans.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "50px" }}>
                        <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🚀</p>
                        <h3>Sin planes todavía</h3>
                        <Link to={`/create-plan?group=${groupId}`} style={{ marginTop: "16px", display: "inline-block" }}>
                            <button className="btn btn-primary">Crear el primer plan</button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid-auto">
                        {plans.map(plan => (
                            <div key={plan.id} className="plan-card" onClick={() => navigate(`/plans/${plan.id}`)}>
                                <div style={{ padding: "20px" }}>
                                    <span className="chip chip-coral" style={{ marginBottom: "10px" }}>{plan.status}</span>
                                    <h3 style={{ fontSize: "1.1rem", marginBottom: "6px" }}>{plan.title}</h3>
                                    {plan.location && <p style={{ color: "var(--gray)", fontSize: "0.85rem" }}>📍 {plan.location}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}