import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Toast } from "../components/Toast";

export function Layout() {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            <Footer />
            <Toast />
        </div>
    );
}
