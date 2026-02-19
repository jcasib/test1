import { Link } from "react-router-dom";

export function Footer() {
    return (
        <footer style={{
            background: "var(--dark)", color: "white",
            padding: "40px 24px", marginTop: "auto"
        }}>
            <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", background: "var(--coral)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>🎉</div>
                    <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>AmigoPlan</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                    © 2026 AmigoPlan — Planes épicos con tu pandilla
                </p>
            </div>
        </footer>
    );
}
