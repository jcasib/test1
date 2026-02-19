import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { api } from "../store";

const CATEGORIES = [
    { value: "cena", emoji: "🍽️", label: "Cena" },
    { value: "aventura", emoji: "🏔️", label: "Aventura" },
    { value: "ocio", emoji: "🎮", label: "Ocio" },
    { value: "cultura", emoji: "🎭", label: "Cultura" },
    { value: "playa", emoji: "🏖️", label: "Playa" },
    { value: "deporte", emoji: "⚽", label: "Deporte" },
];

export function CreatePlan() {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [groups, setGroups] = useState([]);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        title: params.get("title") || "",
        group_id: params.get("group") || "",
        location: params.get("location") || "",
        description: "",
        category: "cena",
        budget_level: "$$",
        energy_level: "normal",
        duration: "medio_dia",
        scheduled_date: "",
        challenge_type: null,
        is_surprise: false,
        surprise_clue: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api(store.token, "GET", "/groups").then(setGroups).catch(console.error);
    }, []);

    const submit = async () => {
        if (!form.title || !form.group_id) { alert("Título y grupo son obligatorios"); return; }
        setLoading(true);
        try {
            const plan = await api(store.token, "POST", "/plans", {
                ...form,
                group_id: parseInt(form.group_id),
                scheduled_date: form.scheduled_date || null,
            });
            dispatch({ type: "set_toast", payload: "¡Plan creado! 🎉" });
            navigate(`/plans/${plan.id}`);
        } catch (err) { alert(err.message); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "calc(100vh - 128px)", padding: "40px 20px" }}>
            <div style={{ maxWidth: "560px", margin: "0 auto" }}>
                {/* Progress */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ flex: 1, height: "6px", borderRadius: "3px", background: s <= step ? "var(--coral)" : "var(--cream-dark)", transition: "background 0.3s" }} />
                    ))}
                </div>

                {step === 1 && (
                    <div className="card">
                        <h2 style={{ marginBottom: "8px" }}>¿Qué tipo de plan? 🎭</h2>
                        <p style={{ color: "var(--gray)", marginBottom: "24px" }}>Elige la vibra del plan</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
                            {CATEGORIES.map(cat => (
                                <button key={cat.value} type="button"
                                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                    style={{ padding: "16px 8px", borderRadius: "12px", border: "2px solid", borderColor: form.category === cat.value ? "var(--coral)" : "var(--cream-dark)", background: form.category === cat.value ? "rgba(255,107,53,0.08)" : "white", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                                    <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{cat.emoji}</div>
                                    <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>{cat.label}</div>
                                </button>
                            ))}
                        </div>
                        {/* Mood */}
                        <div className="form-group">
                            <label className="form-label">Energía</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {[["chill", "😌 Tranquilo"], ["normal", "😊 Normal"], ["full", "🔥 Full energy"]].map(([v, l]) => (
                                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, energy_level: v }))}
                                        className={`btn btn-sm ${form.energy_level === v ? "btn-primary" : "btn-ghost"}`}>{l}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Presupuesto</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {[["$", "💸 Rasca"], ["$$", "💰 Normal"], ["$$$", "💎 Sin límite"]].map(([v, l]) => (
                                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, budget_level: v }))}
                                        className={`btn btn-sm ${form.budget_level === v ? "btn-primary" : "btn-ghost"}`}>{l}</button>
                                ))}
                            </div>
                        </div>
                        <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setStep(2)}>
                            Siguiente →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="card">
                        <h2 style={{ marginBottom: "24px" }}>Detalles del plan 📋</h2>
                        <div className="form-group">
                            <label className="form-label">Título *</label>
                            <input className="form-input" placeholder="Cena épica de cumpleaños"
                                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Grupo *</label>
                            <select className="form-input" value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))} required>
                                <option value="">Selecciona un grupo</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ubicación</label>
                            <input className="form-input" placeholder="Restaurante, ciudad..." value={form.location}
                                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fecha</label>
                            <input className="form-input" type="datetime-local" value={form.scheduled_date}
                                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea className="form-input" rows="3" placeholder="Cuéntanos más..."
                                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
                            <button className="btn btn-primary btn-lg" style={{ flex: 1 }}
                                onClick={() => setStep(3)} disabled={!form.title || !form.group_id}>Siguiente →</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="card">
                        <h2 style={{ marginBottom: "8px" }}>Reto especial 🏆</h2>
                        <p style={{ color: "var(--gray)", marginBottom: "24px" }}>Opcional — dale un twist al plan</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                            {[
                                { v: null, emoji: "🎯", label: "Sin reto" },
                                { v: "low_cost", emoji: "💸", label: "Low Cost — Tope de gasto" },
                                { v: "sorpresa", emoji: "🎁", label: "Plan Sorpresa" },
                                { v: "sin_pantallas", emoji: "📵", label: "Sin Pantallas" },
                                { v: "cultural", emoji: "🎭", label: "Cultural / Gastro" },
                            ].map(opt => (
                                <button key={opt.v ?? "none"} type="button"
                                    onClick={() => setForm(f => ({ ...f, challenge_type: opt.v }))}
                                    style={{ padding: "14px 18px", borderRadius: "12px", border: "2px solid", borderColor: form.challenge_type === opt.v ? "var(--coral)" : "var(--cream-dark)", background: form.challenge_type === opt.v ? "rgba(255,107,53,0.08)" : "white", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.2s" }}>
                                    <span style={{ fontSize: "1.4rem" }}>{opt.emoji}</span>
                                    <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {form.challenge_type === "sorpresa" && (
                            <div className="form-group">
                                <label className="form-label">Pista del día</label>
                                <input className="form-input" placeholder="Una pista para que no se desesperen..."
                                    value={form.surprise_clue} onChange={e => setForm(f => ({ ...f, surprise_clue: e.target.value, is_surprise: true }))} />
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Atrás</button>
                            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                                {loading ? "Creando..." : "🎉 Crear Plan"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
