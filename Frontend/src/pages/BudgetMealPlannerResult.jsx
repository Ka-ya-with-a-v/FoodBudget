import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { browseAlternatives as browseAlternativesAPI, swapMeal as swapMealAPI } from "../api/planner";
import { profileApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./BudgetMealPlannerResult.css";

export default function BudgetMealPlannerResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { request, planResponse, planName: navigationPlanName } = location.state || {};
  
  const [currentMeals, setCurrentMeals] = useState(planResponse?.meals || []);
  const [browsingAlternatives, setBrowsingAlternatives] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const resolvedInitialName = useMemo(() => {
    const requestName = request?.planName?.trim();
    const stateName = navigationPlanName?.trim();
    const responseName = typeof planResponse?.planName === "string" ? planResponse.planName.trim() : "";
    return requestName || stateName || responseName || "";
  }, [request?.planName, navigationPlanName, planResponse?.planName]);
  const [customName, setCustomName] = useState(resolvedInitialName);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");

  if (!planResponse || !planResponse.meals) {
    return (
      <div className="bp-page">
        <Navbar />
        <div className="bp-main">
          <p>No plan data available. Please go back and generate a plan.</p>
          <button onClick={() => navigate("/budget-planner")} className="return-to-setup-button">
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  const meals = currentMeals.length > 0 ? currentMeals : planResponse.meals;

  const mealsByDay = useMemo(() => {
    const grouped = {};
    meals.forEach(meal => {
      const dayIndex = typeof meal.dayIndex === "number" ? meal.dayIndex : 0;
      if (!grouped[dayIndex]) grouped[dayIndex] = [];
      grouped[dayIndex].push(meal);
    });
    return grouped;
  }, [meals]);

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const browseAlternatives = async (dayIndex, mealIndex) => {
    setBrowsingAlternatives({ dayIndex, mealIndex });
    setLoading(true);
    
    try {
      const alternativesData = await browseAlternativesAPI(
        planResponse.planId,
        dayIndex,
        mealIndex,
        10
      );
      
      setAlternatives(alternativesData);
    } catch (error) {
      console.error("Failed to browse alternatives:", error);
    } finally {
      setLoading(false);
    }
  };

  const swapMeal = async (alternative) => {
    if (!browsingAlternatives) return;

    const { dayIndex, mealIndex } = browsingAlternatives;
    setLoading(true);
    
    try {
      const swapRequest = {
        dayIndex,
        mealIndex,
        newMealId: alternative.id
      };
      
      await swapMealAPI(planResponse.planId, swapRequest);

      const mealToReplace = meals.find(meal => 
        meal.dayIndex === dayIndex && meal.mealIndex === mealIndex
      );
      
      if (mealToReplace) {
        const newMeal = {
          ...mealToReplace,
          name: alternative.name,
          price: alternative.price,
          nutrition: alternative.nutrition,
          tags: alternative.tags
        };

        const newMeals = meals.map(meal => 
          meal.dayIndex === dayIndex && meal.mealIndex === mealIndex ? newMeal : meal
        );

        setCurrentMeals(newMeals);
        
        const newTotalCost = newMeals.reduce((total, meal) => total + (meal.price || 0), 0);
        planResponse.totalCost = newTotalCost;
      }
      
      setBrowsingAlternatives(null);
      setAlternatives([]);
      
    } catch (error) {
      console.error("Failed to swap meal:", error);
    } finally {
      setLoading(false);
    }
  };

  const actualTotalCost = useMemo(() => {
    const backendTotal = typeof planResponse.totalCost === "number" && !isNaN(planResponse.totalCost)
      ? Number(planResponse.totalCost)
      : null;
    if (backendTotal !== null) return backendTotal;
    return meals.reduce((total, meal) => total + (meal.price || 0), 0);
  }, [meals, planResponse]);

  const totalCalories = useMemo(() => {
    return meals.reduce((total, meal) => total + (meal.nutrition?.calories || 0), 0);
  }, [meals]);

  const budgetInfo = useMemo(() => {
    if (!request) {
      return {
        displayBudget: 0,
        budgetPeriod: 'daily',
        isWithinBudget: true,
        overBudgetAmount: 0
      };
    }

    const budgetPeriod = request.budgetPeriod || 'daily';
    let displayBudget = 0;

    const dailyBudget = (request.dailyBudget !== undefined ? Number(request.dailyBudget) : (request.budgetPeriod === 'daily' ? Number(request.budget) : 0));
    const weeklyBudget = (request.weeklyBudget !== undefined ? Number(request.weeklyBudget) : (request.budgetPeriod === 'weekly' ? Number(request.budget) : 0));
    const planRange = request.planRange !== undefined ? Number(request.planRange) : 1;

    if (budgetPeriod === 'daily') {
      displayBudget = (isNaN(dailyBudget) ? 0 : dailyBudget) * (isNaN(planRange) ? 1 : planRange);
    } else {
      displayBudget = isNaN(weeklyBudget) ? 0 : weeklyBudget;
    }

    const isWithinBudget = actualTotalCost <= displayBudget;
    const overBudgetAmount = isWithinBudget ? 0 : actualTotalCost - displayBudget;

    return {
      displayBudget,
      budgetPeriod,
      isWithinBudget,
      overBudgetAmount
    };
  }, [request, actualTotalCost]);

  useEffect(() => {
    setCustomName(resolvedInitialName);
    setSaveStatus("idle");
    setSaveError("");
  }, [resolvedInitialName, planResponse?.planId]);

  useEffect(() => {
    if (saveStatus === "success") {
      const timer = setTimeout(() => setSaveStatus("idle"), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSavePlan = async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (!planResponse?.planId) {
      setSaveStatus("error");
      setSaveError("Unable to save this plan because it does not have an identifier.");
      return;
    }

    let trimmedName = customName.trim();
    if (!trimmedName) {
      const generatedName = `Meal Plan ${new Date().toLocaleString()}`;
      setCustomName(generatedName);
      trimmedName = generatedName;
    }

    setSaveStatus("saving");
    setSaveError("");

    try {
      await profileApi.saveMealPlan({
        planId: planResponse.planId,
        customName: trimmedName,
      });

      setSaveStatus("success");
      refreshProfile();
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error.message || "Failed to save meal plan.");
    }
  };

  const isSaving = saveStatus === "saving";
  const saveButtonLabel = saveStatus === "success"
    ? "Saved!"
    : isSaving
      ? "Saving..."
      : "Save meal plan";

  return (
    <div className="bp-page">
      <Navbar />
      
      <main className="bp-main">
        {/* Header with Back Button */}
        <div className="bp-header">
          <div className="bp-header-left">
            <h1 className="bp-title">
              Your <span>Meal Plan</span>
            </h1>
            <button 
              onClick={() => navigate("/budget-planner")}
              className="return-to-setup-button"
            >
              ← Return to Setup
            </button>
          </div>
          <div className="bp-header-right">
            <div className="bp-save-plan">
              <input
                type="text"
                className="bp-save-input"
                placeholder="Custom name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <button
                type="button"
                className="bp-save-button"
                onClick={handleSavePlan}
                disabled={isSaving || saveStatus === "success"}
              >
                {saveButtonLabel}
              </button>
              {saveStatus === "error" && (
                <p className="bp-save-status error">{saveError}</p>
              )}
              {saveStatus === "success" && (
                <p className="bp-save-status success">Meal plan saved to your profile.</p>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <section className="bp-metrics">
          <div className="bp-metric">
            <div className="bp-metric-value">${actualTotalCost.toFixed(2)}</div>
            <div className="bp-metric-label">Total Cost</div>
          </div>
          
          <div className="bp-metric">
            <div className="bp-metric-value">{totalCalories}</div>
            <div className="bp-metric-label">Total Calories</div>
          </div>
          
          <div className="bp-metric bp-metric-budget">
            <div className={`bp-budget-pill ${budgetInfo.isWithinBudget ? "ok" : "over"}`}>
              {budgetInfo.isWithinBudget ? (
                "Within budget"
              ) : (
                `Over budget by $${budgetInfo.overBudgetAmount.toFixed(2)}`
              )}
            </div>
            <div className="bp-metric-sub">
              ${budgetInfo.displayBudget} {budgetInfo.budgetPeriod} budget
            </div>
          </div>
        </section>

        {/* loading */}
        {loading && (
          <div className="bp-loading">
            Loading...
          </div>
        )}

        {/* Meal Plan Days */}
        <section className="bp-list">
          {Object.entries(mealsByDay).map(([dayIndex, dayMeals]) => (
            <div key={dayIndex} className="bp-day-card">
              <div className="bp-day-header">
                <h3 className="bp-day-title">{dayNames[parseInt(dayIndex)] || `Day ${parseInt(dayIndex) + 1}`}</h3>
                <div className="bp-day-cost">
                  Day Total: ${dayMeals.reduce((sum, meal) => sum + (meal.price || 0), 0).toFixed(2)}
                </div>
              </div>
              
              <div className="bp-meals-list">
                {dayMeals.map((meal) => (
                  <div key={`${meal.dayIndex}-${meal.mealIndex}`} className="bp-meal-card">
                    <div className="bp-meal-main">
                      <div className="bp-meal-info">
                        <div className="bp-tags">
                          <span className={`bp-tag ${meal.eatingMode?.toLowerCase()}`}>
                            {meal.eatingMode || 'Meal'}
                          </span>
                          {meal.tags?.map((tag, tagIndex) => (
                            <span key={tagIndex} className={`bp-tag ${tag?.toLowerCase().replace(/\s+/g, '').replace('-', '')}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="bp-row">
                          <div className="bp-meal-details">
                            <h4 className="bp-meal-name">{meal.name}</h4>
                            <div className="bp-meta">
                              <span className="bp-price">${meal.price}</span>
                              <span className="bp-dot">•</span>
                              <span>{meal.nutrition?.calories || 0} cal</span>
                              <span className="bp-dot">•</span>
                              <span>P: {meal.nutrition?.protein || 0}g C: {meal.nutrition?.carbs || 0}g F: {meal.nutrition?.fats || 0}g</span>
                            </div>
                            {meal.note && <div className="bp-note">{meal.note}</div>}
                          </div>
                          
                          <div className="bp-actions">
                            <button 
                              className="bp-swap"
                              onClick={() => browseAlternatives(meal.dayIndex, meal.mealIndex)}
                              disabled={loading}
                            >
                              {loading ? "Loading..." : "Swap"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alternatives Modal */}
                    {browsingAlternatives?.dayIndex === meal.dayIndex && 
                     browsingAlternatives?.mealIndex === meal.mealIndex && (
                      <div className="bp-alternatives-modal">
                        <div className="bp-alternatives-header">
                          <h4>Choose an Alternative Meal</h4>
                          <button 
                            className="bp-close-alternatives"
                            onClick={() => setBrowsingAlternatives(null)}
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="bp-alternatives-list">
                          {alternatives.map((alternative) => (
                            <div key={alternative.id} className="bp-alternative-card">
                              <div className="bp-alternative-info">
                                <div className="bp-alternative-tags">
                                  {alternative.tags?.map((tag, tagIndex) => (
                                    <span key={tagIndex} className={`bp-tag ${tag?.toLowerCase().replace(/\s+/g, '').replace('-', '')}`}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                
                                <h5 className="bp-alternative-name">{alternative.name}</h5>
                                <div className="bp-alternative-meta">
                                  <span className="bp-price">${alternative.price}</span>
                                  <span className="bp-dot">•</span>
                                  <span>{alternative.nutrition?.calories || 0} cal</span>
                                  <span className="bp-dot">•</span>
                                  <span>P: {alternative.nutrition?.protein || 0}g C: {alternative.nutrition?.carbs || 0}g F: {alternative.nutrition?.fats || 0}g</span>
                                </div>
                              </div>
                              
                              <button 
                                className="bp-select-alternative"
                                onClick={() => swapMeal(alternative)}
                                disabled={loading}
                              >
                                {loading ? "Swapping..." : "Select"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
