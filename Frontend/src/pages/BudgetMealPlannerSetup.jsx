// src/pages/BudgetMealPlannerSetup.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./BudgetMealPlannerSetup.css";
import { generatePlan } from "../api/planner";

export default function BudgetMealPlannerSetup() {
  const navigate = useNavigate();

  // form state
  const [budget, setBudget] = useState("15");
  const [budgetPeriod, setBudgetPeriod] = useState("daily"); // "daily" | "weekly"
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [planDays, setPlanDays] = useState(7); // editable when daily
  const [cooking, setCooking] = useState("Mixed");
  const [minCal, setMinCal] = useState(1500);
  const [maxCal, setMaxCal] = useState(2000);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [planName, setPlanName] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // calorie options
  const calories = useMemo(() => Array.from({ length: 21 }, (_, i) => 1000 + i * 50), []);

  const tagsPool = [
    "Halal",
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Low-Carb",
    "High-Protein",
  ];
  const allergensPool = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Soy", "Seafood"];

  // when switching to weekly, fix planDays = 7; when switching back to daily keep current value
  useEffect(() => {
    if (budgetPeriod === "weekly") {
      setPlanDays(7);
    }
  }, [budgetPeriod]);

  // validation: if daily then planDays must be >= 1; weekly doesn't need planDays check
  const isValid =
    Number(budget) > 0 &&
    Number(minCal) > 0 &&
    Number(minCal) <= Number(maxCal) &&
    (budgetPeriod === "weekly" ? true : Number(planDays) >= 1);

  function toggleTag(tag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function toggleAllergen(allergen) {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!isValid) return;

    setError("");
    setLoading(true);

    const effectivePlanDays = budgetPeriod === "daily" ? Number(planDays) : 7;

    const payload = {
      dailyBudget: budgetPeriod === "daily" ? Number(budget) : 0,
      weeklyBudget: budgetPeriod === "weekly" ? Number(budget) : 0,
      cookingMode: cooking,
      calorieRange: `${Number(minCal)}-${Number(maxCal)}`,
      dietaryRules: selectedTags.length ? selectedTags.join(",") : "None",
      allergy: selectedAllergens.length ? selectedAllergens.join(",") : "",
      numberOfMeals: Number(mealsPerDay),
      planRange: effectivePlanDays,
    };

    try {
      const planResponse = await generatePlan(payload);

      const frontendRequest = {
        budget: Number(budget),
        budgetPeriod,
        ...payload,
        planName: planName.trim(),
      };

      navigate("/budget-planner/result", {
        state: {
          request: frontendRequest,
          planResponse,
          planName: planName.trim(),
        },
      });
    } catch (err) {
      console.error("Plan generation failed:", err);
      setError(err?.message || "Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup-page large">
      <Navbar />

      <div className="setup-container">
        <h1 className="setup-title">
          Budget <span>Meal Planner</span>
        </h1>
        <p className="setup-subtitle">Affordable, personalised plans within your budget.</p>

        <section className="setup-card">
          <form onSubmit={onSubmit} className="setup-form">
            {/* Budget Setup */}
            <fieldset className="form-block">
              <legend>Budget Setup</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="budgetPeriod">Budget Period</label>
                  <select
                    id="budgetPeriod"
                    className="form-select"
                    value={budgetPeriod}
                    onChange={(e) => setBudgetPeriod(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="budget">
                    {budgetPeriod === "daily" ? "Daily Budget (SGD)" : "Weekly Budget (SGD)"}
                  </label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      id="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="form-input"
                      placeholder={budgetPeriod === "daily" ? "15" : "105"}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="planName">
                    Meal Plan Name (optional)
                  </label>
                  <input
                    id="planName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Weekday Lunch Boost"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    maxLength={80}
                  />
                  <small className="muted">Pick a name to recognise this plan later.</small>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mealsPerDay">Meals Per Day</label>
                  <select
                    id="mealsPerDay"
                    className="form-select"
                    value={mealsPerDay}
                    onChange={(e) => setMealsPerDay(Number(e.target.value))}
                  >
                    <option value={1}>1 meal</option>
                    <option value={2}>2 meals</option>
                    <option value={3}>3 meals</option>
                    <option value={4}>4 meals</option>
                  </select>
                </div>

                {/* Plan Days: editable for daily; fixed display for weekly */}
                {budgetPeriod === "daily" ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="planDays">Plan Days</label>
                    <input
                      id="planDays"
                      type="number"
                      min="1"
                      step="1"
                      value={planDays}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v >= 1) setPlanDays(v);
                        else setPlanDays("");
                      }}
                      className="form-input"
                      placeholder="e.g. 7"
                    />
                    <small className="muted">Enter number of days for the plan</small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Plan Days</label>
                    <div className="form-input" style={{ padding: "10px 12px" }}>
                      7 days (fixed for weekly budget)
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="cook">Cooking Preference</label>
                  <select
                    id="cook"
                    className="form-select"
                    value={cooking}
                    onChange={(e) => setCooking(e.target.value)}
                  >
                    <option>Mixed</option>
                    <option>Cooked at Home</option>
                    <option>No-Cook / Microwave</option>
                    <option>Mostly Eating Out</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Calories Range */}
            <fieldset className="form-block">
              <legend>Calories Range</legend>
              <div className="calories-row">
                <div className="calories-group">
                  <label className="form-label" htmlFor="minCal">Min Calories</label>
                  <select
                    id="minCal"
                    className="form-select"
                    value={minCal}
                    onChange={(e) => setMinCal(Number(e.target.value))}
                  >
                    {calories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="calories-separator">to</div>
                <div className="calories-group">
                  <label className="form-label" htmlFor="maxCal">Max Calories</label>
                  <select
                    id="maxCal"
                    className="form-select"
                    value={maxCal}
                    onChange={(e) => setMaxCal(Number(e.target.value))}
                  >
                    {calories.filter((c) => c >= minCal).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Dietary Tags */}
            <fieldset className="form-block compact">
              <legend>Dietary Tags (optional)</legend>
              <div className="tags-row">
                {tagsPool.map((tag) => (
                  <label key={tag} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Allergens */}
            <fieldset className="form-block compact">
              <legend>Allergens to Avoid (optional)</legend>
              <div className="tags-row">
                {allergensPool.map((allergen) => (
                  <label key={allergen} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAllergens.includes(allergen)}
                      onChange={() => toggleAllergen(allergen)}
                    />
                    <span>{allergen}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={!isValid || loading}>
                {loading ? "Generating…" : "Generate Meal Plan"}
              </button>
              {error && <small className="error-message">{error}</small>}
              {!isValid && (
                <small className="error-message">
                  Ensure budget &gt; 0 and Min Calories ≤ Max Calories{budgetPeriod === "daily" ? " and Plan Days ≥ 1." : "."}
                </small>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

