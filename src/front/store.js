const BACKEND = import.meta.env.VITE_BACKEND_URL;

export const initialStore = () => ({
    user: null,
    token: localStorage.getItem("token") || null,
    groups: [],
    plans: [],
    loading: false,
    toast: null,
});

export default function storeReducer(store, action = {}) {
    switch (action.type) {
        case "set_user":
            return { ...store, user: action.payload };
        case "set_token":
            return { ...store, token: action.payload };
        case "set_groups":
            return { ...store, groups: action.payload };
        case "set_plans":
            return { ...store, plans: action.payload };
        case "set_loading":
            return { ...store, loading: action.payload };
        case "set_toast":
            return { ...store, toast: action.payload };
        case "logout":
            localStorage.removeItem("token");
            return { ...initialStore(), token: null };
        default:
            throw Error("Unknown action: " + action.type);
    }
}

// ── API helpers ───────────────────────────────────────────────────────────────

export const api = async (token, method, path, body = null) => {
    const opts = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    };
    const res = await fetch(`${BACKEND}/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error");
    return data;
};
