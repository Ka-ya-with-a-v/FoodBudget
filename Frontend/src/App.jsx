import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import BudgetMealPlannerSetup from "./pages/BudgetMealPlannerSetup.jsx";
import BudgetMealPlannerResult from "./pages/BudgetMealPlannerResult.jsx";
import Dashboard from "./pages/Dashboard";
import Error from "./pages/Error";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import BasketSetup from "./pages/BasketSetup.jsx";
import HawkerSwapSetup from "./pages/HawkerSwapSetup.jsx";
import HawkerSwapResult from "./pages/HawkerSwapResult.jsx";
import Signup from "./pages/Signup.jsx";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/basket-setup" element={<BasketSetup />} />
                <Route path="/budget-planner" element={<BudgetMealPlannerSetup />} />
                <Route path="/budget-planner/result" element={<BudgetMealPlannerResult />} />
                <Route path="/hawker-swap" element={<HawkerSwapSetup />} />
                <Route path="/hawker-swap/result" element={<HawkerSwapResult />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="*" element={<Error />} />
            </Routes>
        </Router>
    );
};

export default App;
