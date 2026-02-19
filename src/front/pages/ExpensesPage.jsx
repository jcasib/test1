import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { api } from "../store";

export function ExpensesPage() {
    const { planId } = useParams();
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({ transactions: [] });
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ description: "", total_amount: "", split_type: "igual" });

    useEffect(() => { loadData(); }, [planId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, exp, sum] = await Promise.all([
                api(store.token, "GET", `/plans/${planId}`),
                api(store.token, "GET", `/plans/${planId}/expenses`),
                api(store.token, "GET", `/plans/${planId}/expenses/summary`),
            ]);
            setPlan(p); setExpenses(exp); setSummary(sum);
        } catch (e) { navigate("/dashboard"); }
        setLoading(false);
    };

    const addExpense = async (e) => {
        e.preventDefault();
        try {
            await api(store.token, "POST", `/plans/${planId}/expenses`, {
                description: form.description,
                total_amount: parseFloat(form.total_amount),
                split_type: form.split_type,
            });
            setForm({ description: "", total_amount: "", split_type: "igual" });
            setShowAdd(false);
            loadData();
            dispatch({ type: "set_toast", payload: "Gasto añadido 💰" });
        } catch (err) { alert(err.message); }
    };

    const markPaid = async (expenseId, splitId) => {
        try {
            await api(store.token, "POST", `/expenses/${expenseId}/splits/${splitId}/pay`);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const total = expenses.reduce((s, e) => s + e.total_amount, 0);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div className="container">
                    <button onClick={() => navigate(`/plans/${planId}`)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "8px 16px", borderRadius: "100px", cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.82rem", marginBottom: "16px" }}>← Volver al plan</button>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1>💰 Cuentas</h1>
                            <p style={{ color: "rgba(255,255,255,0.6)" }}>{plan?.title}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>TOTAL</p>
                            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "2.5rem", color: "var(--coral)" }}>{total.toFixed(2)}€</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: "32px 20px" }}>
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                    <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Añadir Gasto</button>
                </div>

                {/* Add form */}
                {showAdd && (
                    <div className="card" style={{ marginBottom: "24px" }}>
                        <h3 style={{ marginBottom: "16px" }}>Nuevo gasto</h3>
                        <form onSubmit={addExpense}>
                            <div className="form-group">
                                <label className="form-label">Descripción *</label>
                                <input className="form-input" placeholder="Cena en el restaurante"
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Importe (€) *</label>
                                <input type="number" step="0.01" min="0" className="form-input" placeholder="85.50"
                                    value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cómo dividir</label>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {[["igual", "⚖️ Igual"], ["por_porcentaje", "📊 %"], ["uno_paga", "💳 Uno paga"]].map(([v, l]) => (
                                        <button key={v} type="button" className={`btn btn-sm ${form.split_type === v ? "btn-primary" : "btn-ghost"}`}
                                            onClick={() => setForm(f => ({ ...f, split_type: v }))}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Añadir</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Summary */}
                {summary.transactions.length > 0 && (
                    <div className="card" style={{ marginBottom: "24px", borderLeft: "4px solid var(--coral)" }}>
                        <h3 style={{ marginBottom: "16px" }}>🧮 Deudas (neteadas)</h3>
                        {summary.transactions.map((t, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--cream-dark)" }}>
                                <div className="avatar avatar-sm" style={{ background: "var(--red)", color: "white" }}>{t.from_username[0]}</div>
                                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{t.from_username}</span>
                                <span style={{ color: "var(--gray)", fontSize: "0.85rem" }}>debe</span>
                                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: "var(--coral)" }}>{t.amount.toFixed(2)}€</span>
                                <span style={{ color: "var(--gray)", fontSize: "0.85rem" }}>a</span>
                                <div className="avatar avatar-sm" style={{ background: "var(--green)", color: "white" }}>{t.to_username[0]}</div>
                                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{t.to_username}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Expense list */}
                {expenses.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                        <p style={{ fontSize: "2rem", marginBottom: "8px" }}>💸</p>
                        <p style={{ color: "var(--gray)" }}>Sin gastos registrados</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {expenses.map(expense => (
                            <div key={expense.id} className="card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div>
                                        <h4 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>{expense.description}</h4>
                                        <p style={{ color: "var(--gray)", fontSize: "0.82rem" }}>Pagado por {expense.paid_by_username} · {expense.split_type}</p>
                                    </div>
                                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>{expense.total_amount.toFixed(2)}€</p>
                                </div>
                                {expense.splits.map(split => (
                                    <div key={split.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--cream-dark)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div className="avatar avatar-sm" style={{ background: "var(--coral)", color: "white" }}>{split.username?.[0]}</div>
                                            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{split.username}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>{split.amount.toFixed(2)}€</span>
                                            {split.is_paid ? (
                                                <span style={{ color: "var(--green)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>✅ Pagado</span>
                                            ) : split.user_id === store.user?.id ? (
                                                <button className="btn btn-sm" style={{ background: "var(--green)", color: "white" }}
                                                    onClick={() => markPaid(expense.id, split.id)}>Marcar pagado</button>
                                            ) : (
                                                <span style={{ color: "var(--red)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>⏳ Pendiente</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}