import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { api } from "../store";

export function Explore() {
    const { store } = useGlobalReducer();
    const navigate = useNavigate();
    const [city, setCity] = useState("Madrid");
    const [keyword, setKeyword] = useState("");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [isMock, setIsMock] = useState(false);

    const search = async (e) => {
        e.preventDefault();
        setLoading(true); setSearched(true);
        try {
            const qs = `?city=${encodeURIComponent(city)}&keyword=${encodeURIComponent(keyword)}`;
            const [tm, eb] = await Promise.all([
                api(store.token, "GET", `/events/ticketmaster${qs}`),
                api(store.token, "GET", `/events/eventbrite${qs}`),
            ]);
            setEvents([...(tm.events || []), ...(eb.events || [])]);
            setIsMock(tm.mock || eb.mock);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "calc(100vh - 128px)" }}>
            <div style={{ background: "linear-gradient(135deg, var(--purple) 0%, #9B59B6 100%)", padding: "60px 24px", color: "white", textAlign: "center" }}>
                <h1 style={{ fontSize: "2.2rem", marginBottom: "12px" }}>🔍 Descubre Eventos</h1>
                <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "32px" }}>Busca en Ticketmaster y Eventbrite y añádelos a un plan</p>
                <form onSubmit={search} style={{ display: "flex", gap: "12px", maxWidth: "580px", margin: "0 auto", flexWrap: "wrap" }}>
                    <input className="form-input" placeholder="🏙️ Ciudad" value={city} onChange={e => setCity(e.target.value)} style={{ flex: "1 1 160px" }} required />
                    <input className="form-input" placeholder="🔍 Palabras clave" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ flex: "2 1 200px" }} />
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? "Buscando..." : "Buscar →"}
                    </button>
                </form>
            </div>

            <div className="container" style={{ padding: "32px 20px" }}>
                {isMock && (
                    <div style={{ background: "#FFFBEB", border: "1px solid var(--yellow)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: "20px", fontSize: "0.85rem" }}>
                        ⚠️ Mostrando datos de demo. Configura las API keys en <code>.env</code> para eventos reales.
                    </div>
                )}

                {loading && <div className="loading-center"><div className="spinner" /></div>}

                {!loading && searched && events.length === 0 && (
                    <div style={{ textAlign: "center", padding: "60px" }}>
                        <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</p>
                        <h3>Sin resultados en {city}</h3>
                    </div>
                )}

                {!loading && events.length > 0 && (
                    <div className="grid-auto">
                        {events.map(event => (
                            <div key={event.id} className="card" style={{ overflow: "hidden", padding: 0 }}>
                                {event.image && <img src={event.image} alt={event.name} style={{ width: "100%", height: "160px", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />}
                                <div style={{ padding: "18px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <span className={`chip ${event.source === "ticketmaster" ? "chip-purple" : "chip-coral"}`}>{event.source}</span>
                                        {event.price_range && <span style={{ fontSize: "0.82rem", color: "var(--gray)" }}>{event.price_range}</span>}
                                    </div>
                                    <h3 style={{ fontSize: "1rem", marginBottom: "8px" }}>{event.name}</h3>
                                    {event.venue && <p style={{ color: "var(--gray)", fontSize: "0.82rem", marginBottom: "4px" }}>📍 {event.venue}, {event.city}</p>}
                                    {event.date && <p style={{ color: "var(--gray)", fontSize: "0.82rem", marginBottom: "14px" }}>📅 {event.date} {event.time && `· ${event.time.slice(0,5)}`}</p>}
                                    <button className="btn btn-primary btn-sm" style={{ width: "100%" }}
                                        onClick={() => navigate(`/create-plan?title=${encodeURIComponent(event.name)}&location=${encodeURIComponent(event.venue || "")}`)}>
                                        + Añadir al Plan
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!searched && (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <p style={{ fontSize: "4rem", marginBottom: "16px" }}>🌍</p>
                        <h2 style={{ marginBottom: "8px" }}>Busca en tu ciudad</h2>
                        <p style={{ color: "var(--gray)" }}>Encuentra eventos y conviértelos en planes con tu pandilla</p>
                    </div>
                )}
            </div>
        </div>
    );
}
