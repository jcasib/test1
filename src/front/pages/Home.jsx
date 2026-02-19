import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export function Home() {
    const { store } = useGlobalReducer();

    return (
        <div>
            {/* Hero */}
            <div style={{ padding: "24px" }}>
                <div style={{
                    background: "linear-gradient(135deg, #FF6B35 0%, #FF9A5C 50%, #FFB800 100%)",
                    borderRadius: "24px", padding: "60px 48px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "40px", flexWrap: "wrap", minHeight: "420px"
                }}>
                    <div style={{ flex: 1, minWidth: "280px" }}>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            background: "rgba(255,255,255,0.2)", borderRadius: "100px",
                            padding: "6px 16px", marginBottom: "24px"
                        }}>
                            <span>🎉</span>
                            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "white" }}>
                                ¡HAZ PLANES ÉPICOS!
                            </span>
                        </div>
                        <h1 style={{ fontSize: "3rem", color: "white", lineHeight: 1.1, marginBottom: "16px" }}>
                            Organiza tus salidas<br />
                            <span style={{ color: "#FFE566" }}>sin complicaciones.</span>
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.05rem", marginBottom: "36px", maxWidth: "480px" }}>
                            Crea grupos, asigna un administrador y deja que el azar reparta los roles. El organizador tiene 48h para proponer el plan perfecto.
                        </p>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                            <Link to={store.token ? "/create-plan" : "/register"}>
                                <button className="btn btn-lg" style={{ background: "white", color: "var(--coral)" }}>
                                    ✦ Lanzar Nuevo Plan
                                </button>
                            </Link>
                            <Link to={store.token ? "/dashboard" : "/register"}>
                                <button className="btn btn-lg" style={{ background: "var(--coral)", color: "white", border: "2px solid rgba(255,255,255,0.4)" }}>
                                    ⊞ Crear Grupo
                                </button>
                            </Link>
                        </div>
                    </div>
                    <div style={{
                        width: "220px", height: "220px", flexShrink: 0,
                        background: "rgba(255,255,255,0.15)", borderRadius: "28px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "6rem", backdropFilter: "blur(10px)"
                    }}>
                        🤍
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="container" style={{ padding: "60px 20px" }}>
                <h2 style={{ textAlign: "center", fontSize: "1.8rem", marginBottom: "40px" }}>
                    ¿Cómo funciona?
                </h2>
                <div className="grid-auto">
                    {[
                        { emoji: "🎰", title: "Ruleta del Plan Master", desc: "El azar decide quién organiza. Sin excusas, sin dramas." },
                        { emoji: "🗳️", title: "Votaciones rápidas", desc: "Sí, No, o Me da igual. Con veto disponible para situaciones extremas." },
                        { emoji: "💰", title: "Cuentas claras", desc: "Divide gastos al instante. El algoritmo netea deudas automáticamente." },
                        { emoji: "🏆", title: "Hall of Fame", desc: "Los mejores planes quedan para la historia del grupo." },
                        { emoji: "🔍", title: "Descubre eventos", desc: "Integración con Ticketmaster y Eventbrite para inspirarte." },
                        { emoji: "📸", title: "Recuerdos", desc: "Guarda frases y momentos épicos de cada plan." },
                    ].map(f => (
                        <div key={f.title} className="card" style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{f.emoji}</div>
                            <h3 style={{ fontSize: "1rem", marginBottom: "8px" }}>{f.title}</h3>
                            <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            {!store.token && (
                <div style={{ background: "var(--dark)", padding: "60px 24px", textAlign: "center" }}>
                    <h2 style={{ color: "white", fontSize: "2rem", marginBottom: "12px" }}>
                        ¿Listo para el primer plan?
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "28px" }}>
                        Gratis. Sin instalaciones. Solo tú y tu pandilla.
                    </p>
                    <Link to="/register">
                        <button className="btn btn-primary btn-lg">Empezar gratis →</button>
                    </Link>
                </div>
            )}
        </div>
    );
}
