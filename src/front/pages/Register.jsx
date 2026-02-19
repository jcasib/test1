import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { api } from "../store";

export function Register() {
    const { dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const data = await api(null, "POST", "/auth/register", form);
            localStorage.setItem("token", data.token);
            dispatch({ type: "set_token", payload: data.token });
            dispatch({ type: "set_user", payload: data.user });
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "calc(100vh - 128px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
            <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
                <h1 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>Crear cuenta 🎉</h1>
                <p style={{ color: "var(--gray)", marginBottom: "28px" }}>Únete y empieza a planear</p>

                {error && <div style={{ background: "#FEF2F2", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--radius)", marginBottom: "16px", fontSize: "0.9rem" }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" placeholder="tu@email.com"
                            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nombre de usuario</label>
                        <input className="form-input" type="text" placeholder="ej: Marta"
                            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input className="form-input" type="password" placeholder="••••••••"
                            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
                        {loading ? "Creando cuenta..." : "Crear cuenta →"}
                    </button>
                </form>

                <p style={{ color: "var(--gray)", fontSize: "0.9rem", textAlign: "center", marginTop: "20px" }}>
                    ¿Ya tienes cuenta? <Link to="/login" style={{ color: "var(--coral)", fontWeight: 700 }}>Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}
