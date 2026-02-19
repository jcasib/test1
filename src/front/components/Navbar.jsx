import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export function Navbar() {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    const logout = () => {
        dispatch({ type: "logout" });
        navigate("/");
    };

    return (
        <nav style={{
            background: "white", borderBottom: "2px solid var(--cream-dark)",
            padding: "0 24px", height: "64px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 100
        }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                    width: "36px", height: "36px", background: "var(--coral)",
                    borderRadius: "10px", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "1.2rem"
                }}>🎉</div>
                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>
                    AmigoPlan
                </span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {store.token ? (
                    <>
                        <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
                        <Link to="/explore" className="btn btn-ghost btn-sm">Explorar</Link>
                        <button onClick={logout} className="btn btn-sm" style={{ background: "var(--cream-dark)", color: "var(--dark)" }}>
                            Salir
                        </button>
                        <div className="avatar avatar-md" style={{ background: "var(--coral)" }}>
                            {store.user?.avatar_initial || "?"}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-ghost btn-sm">Iniciar Sesión</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
