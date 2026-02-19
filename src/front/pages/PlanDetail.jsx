import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { api } from "../store";

const STATUS_ORDER = ["propuesta", "votacion", "confirmado", "en_curso", "cerrado"];

export function PlanDetail() {
    const { planId } = useParams();
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [votes, setVotes] = useState({ summary: {}, votes: [] });
    const [memories, setMemories] = useState([]);
    const [tab, setTab] = useState("info");
    const [loading, setLoading] = useState(true);
    const [phrase, setPhrase] = useState("");
    const [rating, setRating] = useState(5);

    useEffect(() => { loadData(); }, [planId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, v, m] = await Promise.all([
                api(store.token, "GET", `/plans/${planId}`),
                api(store.token, "GET", `/plans/${planId}/votes`),
                api(store.token, "GET", `/plans/${planId}/memories`),
            ]);
            setPlan(p); setVotes(v); setMemories(m);
        } catch (e) { navigate("/dashboard"); }
        setLoading(false);
    };

    const vote = async (voteType, isVeto = false) => {
        try {
            await api(store.token, "POST", `/plans/${planId}/vote`, { vote_type: voteType, is_veto: isVeto });
            dispatch({ type: "set_toast", payload: `Voto "${voteType}" registrado` });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const advance = async () => {
        try {
            const updated = await api(store.token, "POST", `/plans/${planId}/advance`);
            setPlan(updated);
            dispatch({ type: "set_toast", payload: `Plan avanzado a: ${updated.status}` });
        } catch (err) { alert(err.message); }
    };

    const addMemory = async (e) => {
        e.preventDefault();
        try {
            await api(store.token, "POST", `/plans/${planId}/memories`, { phrase });
            setPhrase("");
            loadData();
            dispatch({ type: "set_toast", payload: "Recuerdo guardado 📸" });
        } catch (err) { alert(err.message); }
    };

    const closeWithRating = async () => {
        try {
            await api(store.token, "PUT", `/plans/${planId}`, { status: "cerrado", rating });
            loadData();
            dispatch({ type: "set_toast", payload: "Plan cerrado ✅" });
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (!plan) return null;

    const statusIdx = STATUS_ORDER.indexOf(plan.status);
    const isAdmin = store.user?.id === plan.admin_id;
    const myVote = votes.votes?.find(v => v.user_id === store.user?.id && !v.option_id);

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="container">
                    <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "8px 16px", borderRadius: "100px", cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.82rem", marginBottom: "16px" }}>← Volver</button>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <span className="chip" style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "10px", display: "inline-block" }}>{plan.status.toUpperCase()}</span>
                            <h1>{plan.title}</h1>
                            {plan.location && <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "6px" }}>📍 {plan.location}</p>}
                        </div>
                        {isAdmin && plan.status !== "cerrado" && (
                            <button className="btn btn-primary" onClick={advance}>Avanzar fase →</button>
                        )}
                    </div>
                    {/* Progress bar */}
                    <div className="status-steps" style={{ marginTop: "20px" }}>
                        {STATUS_ORDER.map((s, i) => (
                            <div key={s} className={`status-step ${i < statusIdx ? "done" : i === statusIdx ? "active" : ""}`} />
                        ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        {STATUS_ORDER.map(s => <span key={s} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{s}</span>)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ background: "white", borderBottom: "2px solid var(--cream-dark)" }}>
                <div className="container" style={{ display: "flex", gap: "0" }}>
                    {[["info", "📋 Info"], ["votar", "🗳️ Votar"], ["gastos", "💰 Gastos"], ["recuerdos", "📸 Recuerdos"]].map(([t, l]) => (
                        <button key={t} onClick={() => setTab(t)}
                            style={{ padding: "16px 20px", border: "none", background: "none", cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.85rem", borderBottom: tab === t ? "3px solid var(--coral)" : "3px solid transparent", color: tab === t ? "var(--coral)" : "var(--gray)" }}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            <div className="container" style={{ padding: "32px 20px" }}>

                {/* INFO */}
                {tab === "info" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "700px" }}>
                        {plan.description && <div className="card" style={{ gridColumn: "1/-1" }}><p>{plan.description}</p></div>}
                        {plan.challenge_type && <div className="card"><p className="form-label">Reto</p><p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>🏆 {plan.challenge_type}</p></div>}
                        {plan.is_surprise && plan.surprise_clue && <div className="card"><p className="form-label">Pista sorpresa</p><p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>🎁 {plan.surprise_clue}</p></div>}
                        <div className="card"><p className="form-label">Organizador</p><p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>👑 {plan.organizer_username || "—"}</p></div>
                        <div className="card"><p className="form-label">Presupuesto</p><p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>{plan.budget_level}</p></div>
                        {plan.scheduled_date && <div className="card"><p className="form-label">Fecha</p><p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>📅 {new Date(plan.scheduled_date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p></div>}
                        {plan.status === "en_curso" && (
                            <div className="card" style={{ gridColumn: "1/-1" }}>
                                <p className="form-label" style={{ marginBottom: "12px" }}>Cerrar plan y puntuar</p>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                    {[1,2,3,4,5].map(n => (
                                        <button key={n} onClick={() => setRating(n)}
                                            style={{ fontSize: "1.5rem", background: "none", border: "none", cursor: "pointer", opacity: n <= rating ? 1 : 0.3 }}>⭐</button>
                                    ))}
                                </div>
                                <button className="btn btn-primary" onClick={closeWithRating}>Cerrar plan ({rating}⭐)</button>
                            </div>
                        )}
                    </div>
                )}

                {/* VOTE */}
                {tab === "votar" && (
                    <div style={{ maxWidth: "500px" }}>
                        <div className="card" style={{ marginBottom: "20px" }}>
                            <h3 style={{ marginBottom: "16px" }}>Tu voto</h3>
                            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                {[["si", "✅ Sí"], ["no", "❌ No"], ["me_da_igual", "🤷 Me da igual"]].map(([v, l]) => (
                                    <button key={v} className={`btn btn-lg ${myVote?.vote_type === v ? "btn-primary" : "btn-ghost"}`}
                                        style={{ flex: 1 }} onClick={() => vote(v)}>{l}</button>
                                ))}
                            </div>
                            <button className="btn btn-sm" style={{ background: "#FEF2F2", color: "var(--red)", border: "none" }}
                                onClick={() => vote("no", true)}>💣 Usar veto</button>
                        </div>
                        <div className="card">
                            <h3 style={{ marginBottom: "12px" }}>Resumen</h3>
                            {Object.entries(votes.summary || {}).map(([type, count]) => (
                                <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--cream-dark)" }}>
                                    <span>{type === "si" ? "✅ Sí" : type === "no" ? "❌ No" : "🤷 Me da igual"}</span>
                                    <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* GASTOS */}
                {tab === "gastos" && (
                    <div>
                        <Link to={`/plans/${planId}/expenses`}>
                            <button className="btn btn-primary btn-lg">Ver y gestionar gastos →</button>
                        </Link>
                    </div>
                )}

                {/* RECUERDOS */}
                {tab === "recuerdos" && (
                    <div style={{ maxWidth: "500px" }}>
                        <form onSubmit={addMemory} style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                            <input className="form-input" placeholder="Escribe un recuerdo épico..." value={phrase}
                                onChange={e => setPhrase(e.target.value)} required style={{ flex: 1 }} />
                            <button type="submit" className="btn btn-primary">Guardar</button>
                        </form>
                        {memories.length === 0 ? (
                            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                                <p style={{ fontSize: "2rem", marginBottom: "8px" }}>📸</p>
                                <p style={{ color: "var(--gray)" }}>Sin recuerdos todavía</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {memories.map(m => (
                                    <div key={m.id} className="card">
                                        <p style={{ marginBottom: "8px" }}>"{m.phrase}"</p>
                                        <p style={{ color: "var(--gray)", fontSize: "0.82rem" }}>— {m.username}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
