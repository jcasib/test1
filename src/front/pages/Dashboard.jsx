import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { api } from "../store";

const STATUS_LABELS = { propuesta: "Propuesta", votacion: "Votación", confirmado: "Confirmado", en_curso: "En curso", cerrado: "Cerrado" };
const STATUS_COLORS = { propuesta: "chip-gray", votacion: "chip-purple", confirmado: "chip-coral", en_curso: "chip-green", cerrado: "chip-gray" };

export function Dashboard() {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupForm, setGroupForm] = useState({ name: "", emoji: "🎉", description: "" });

    useEffect(() => {
        loadData();
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const data = await api(store.token, "GET", "/auth/me");
            dispatch({ type: "set_user", payload: data });
        } catch (e) { dispatch({ type: "logout" }); navigate("/login"); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, g] = await Promise.all([
                api(store.token, "GET", "/plans"),
                api(store.token, "GET", "/groups"),
            ]);
            setPlans(p); setGroups(g);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const createGroup = async (e) => {
        e.preventDefault();
        try {
            await api(store.token, "POST", "/groups", groupForm);
            setShowCreateGroup(false);
            setGroupForm({ name: "", emoji: "🎉", description: "" });
            loadData();
            dispatch({ type: "set_toast", payload: "¡Grupo creado! 🎉" });
        } catch (err) { alert(err.message); }
    };

    const activePlans = plans.filter(p => p.status !== "cerrado");

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div style={{ minHeight: "calc(100vh - 128px)" }}>
            {/* Header */}
            <div className="page-header">
                <div className="container">
                    <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>BIENVENIDO DE VUELTA</p>
                    <h1>Hola, {store.user?.username} 👋</h1>
                    <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                        <Link to="/create-plan"><button className="btn btn-primary">+ Nuevo Plan</button></Link>
                        <button className="btn btn-ghost" style={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}
                            onClick={() => setShowCreateGroup(true)}>+ Crear Grupo</button>
                        <Link to="/explore"><button className="btn btn-ghost" style={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}>🔍 Explorar</button></Link>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: "32px 20px" }}>

                {/* Create group modal */}
                {showCreateGroup && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                        <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
                            <h3 style={{ marginBottom: "20px" }}>Crear nuevo grupo</h3>
                            <form onSubmit={createGroup}>
                                <div className="form-group">
                                    <label className="form-label">Emoji del grupo</label>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {["🎉", "🔥", "🏔️", "🎮", "🍕", "🎭", "🏖️", "⚽"].map(e => (
                                            <button key={e} type="button"
                                                style={{ fontSize: "1.5rem", padding: "8px", borderRadius: "8px", border: "2px solid", borderColor: groupForm.emoji === e ? "var(--coral)" : "var(--cream-dark)", background: "white", cursor: "pointer" }}
                                                onClick={() => setGroupForm(f => ({ ...f, emoji: e }))}>{e}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nombre *</label>
                                    <input className="form-input" placeholder="La Pandilla del Norte"
                                        value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Descripción</label>
                                    <input className="form-input" placeholder="Los mejores planes..."
                                        value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} />
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowCreateGroup(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear grupo</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Active plans */}
                <section style={{ marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>
                        Planes activos {activePlans.length > 0 && <span className="chip chip-coral">{activePlans.length}</span>}
                    </h2>
                    {activePlans.length === 0 ? (
                        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                            <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🚀</p>
                            <p style={{ color: "var(--gray)" }}>Sin planes activos. ¡Crea el primero!</p>
                        </div>
                    ) : (
                        <div className="grid-auto">
                            {activePlans.map(plan => (
                                <div key={plan.id} className="plan-card" onClick={() => navigate(`/plans/${plan.id}`)}>
                                    <div style={{ padding: "20px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                            <span className={`chip ${STATUS_COLORS[plan.status]}`}>{STATUS_LABELS[plan.status]}</span>
                                            <span style={{ fontSize: "1.2rem" }}>{plan.category === "cena" ? "🍽️" : plan.category === "aventura" ? "🏔️" : plan.category === "ocio" ? "🎮" : "🎉"}</span>
                                        </div>
                                        <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>{plan.title}</h3>
                                        {plan.location && <p style={{ color: "var(--gray)", fontSize: "0.85rem" }}>📍 {plan.location}</p>}
                                        {plan.scheduled_date && <p style={{ color: "var(--gray)", fontSize: "0.85rem" }}>📅 {new Date(plan.scheduled_date).toLocaleDateString("es-ES")}</p>}
                                        <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                                            {["propuesta", "votacion", "confirmado", "en_curso", "cerrado"].map((s, i) => {
                                                const idx = ["propuesta", "votacion", "confirmado", "en_curso", "cerrado"].indexOf(plan.status);
                                                return <div key={s} className={`status-step ${i < idx ? "done" : i === idx ? "active" : ""}`} />;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Groups */}
                <section>
                    <h2 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>Mis grupos</h2>
                    {groups.length === 0 ? (
                        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                            <p style={{ fontSize: "2rem", marginBottom: "12px" }}>👥</p>
                            <p style={{ color: "var(--gray)" }}>Sin grupos todavía.</p>
                        </div>
                    ) : (
                        <div className="grid-auto">
                            {groups.map(group => (
                                <div key={group.id} className="group-card" onClick={() => navigate(`/groups/${group.id}`)}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                                        <div style={{ fontSize: "2rem", width: "52px", height: "52px", background: "var(--cream)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {group.emoji}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "1rem" }}>{group.name}</h3>
                                            <p style={{ color: "var(--gray)", fontSize: "0.82rem" }}>{group.member_count} miembros</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "-8px" }}>
                                        {group.members.slice(0, 5).map(m => (
                                            <div key={m.id} className="avatar avatar-sm" style={{ background: m.avatar_color, border: "2px solid white", marginRight: "-6px" }}>
                                                {m.avatar_initial}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
