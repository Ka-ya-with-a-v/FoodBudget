import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
import logo from "../assets/logo.jpg";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, loading } = useAuth();

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    const profileTarget = !loading && user ? "/profile" : "/login";
    const profileLabel = !loading && user ? (user.displayName || "Profile") : "Login";

    return (
        <header className="navbar">
            {/* Logo */}
            <div className="navbar-logo-container" onClick={() => navigate("/")}>
                <img src={logo} alt="FoodBudget Logo" className="navbar-logo" />
                <span className="navbar-logo-text">FoodBudget.sg</span>
            </div>

            {/* Hamburger menu for mobile */}
            <div className="navbar-toggle" onClick={toggleMenu}>
                {menuOpen ? <FaTimes /> : <FaBars />}
            </div>

            {/* Nav links */}
            <nav className={`navbar-links ${menuOpen ? "active" : ""}`}>
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    onClick={closeMenu}
                >
                    Inflation Dashboard
                </NavLink>

                <NavLink
                    to="/budget-planner"
                    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    onClick={closeMenu}
                >
                    Budget Meal Planner
                </NavLink>

                <NavLink
                    to="/basket-setup"
                    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    onClick={closeMenu}
                >
                    Grocery Basket Planner
                </NavLink>

                <NavLink
                    to="/hawker-swap"
                    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    onClick={closeMenu}
                >
                    Smart Hawker Swap
                </NavLink>

                {/* Profile icon */}
                <NavLink
                    to={profileTarget}
                    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    onClick={closeMenu}
                >
                    <FaUser />
                    <span className="nav-user-label">{profileLabel}</span>
                </NavLink>
            </nav>
        </header>
    );
};

export default Navbar;
