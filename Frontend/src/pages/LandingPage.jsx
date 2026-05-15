import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LandingPage.css";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  useNavigate();
  return (
    <div className="landing-page">
      <Navbar />

      <header className="hero">
        <div className="hero-content">
          <h1>
            Turning <span className="green">Inflation</span> into{" "}
            <span className="orange">Smart Choices</span>
          </h1>

          <p>
            Stop guessing what you can eat within your budget. Get ready-to-use
            meal plans, smart ingredient swaps, and stretch your food dollar
            with real-time Singapore price data.
          </p>

          <div className="features">
            <Link className="feature red" to="/dashboard">
              Inflation Dashboard
            </Link>
            <Link className="feature green" to="/budget-planner">
              Budget Meal Planner
            </Link>
            <Link className="feature orange" to="/basket-setup">
              Grocery Basket Planner
            </Link>
            <Link className="feature blue" to="/hawker-swap">
              Smart Hawker Swap
            </Link>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1600&h=1000&fit=crop"
            alt="Healthy breakfast bowls"
          />
        </div>
      </header>
    </div>
  );
}


