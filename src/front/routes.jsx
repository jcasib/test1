import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { GroupDetail } from "./pages/GroupDetail";
import { CreatePlan } from "./pages/CreatePlan";
import { PlanDetail } from "./pages/PlanDetail";
import { Explore } from "./pages/Explore";
import { ExpensesPage } from "./pages/ExpensesPage";
import useGlobalReducer from "./hooks/useGlobalReducer";

function PrivateRoute({ element }) {
    const { store } = useGlobalReducer();
    return store.token ? element : <Navigate to="/login" />;
}

export const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
            <Route index element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/groups/:groupId" element={<PrivateRoute element={<GroupDetail />} />} />
            <Route path="/create-plan" element={<PrivateRoute element={<CreatePlan />} />} />
            <Route path="/plans/:planId" element={<PrivateRoute element={<PlanDetail />} />} />
            <Route path="/plans/:planId/expenses" element={<PrivateRoute element={<ExpensesPage />} />} />
            <Route path="/explore" element={<PrivateRoute element={<Explore />} />} />
        </Route>
    )
);
