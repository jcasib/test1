import useGlobalReducer from "../hooks/useGlobalReducer";
import { useEffect } from "react";

export function Toast() {
    const { store, dispatch } = useGlobalReducer();

    useEffect(() => {
        if (store.toast) {
            const t = setTimeout(() => dispatch({ type: "set_toast", payload: null }), 3000);
            return () => clearTimeout(t);
        }
    }, [store.toast]);

    if (!store.toast) return null;
    return <div className="toast">{store.toast}</div>;
}
