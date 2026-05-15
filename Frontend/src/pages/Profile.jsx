import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { profileApi, groceryListsApi } from "../services/api";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, signOut, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [displayName, setDisplayName] = useState("");
  
  // Preference state
  const [defaultBudget, setDefaultBudget] = useState("");
  const [cookingMode, setCookingMode] = useState("");
  const [caloriePreference, setCaloriePreference] = useState("");
  const [dietaryRules, setDietaryRules] = useState("");
  const [locationRadius, setLocationRadius] = useState(3);

  // Meal plans and grocery lists state
  const [mealPlans, setMealPlans] = useState([]);
  const [groceryLists, setGroceryLists] = useState([]);
  const [loadingMealPlans, setLoadingMealPlans] = useState(false);
  const [loadingGroceryLists, setLoadingGroceryLists] = useState(false);
  const [mealPlansError, setMealPlansError] = useState("");
  const [groceryListsError, setGroceryListsError] = useState("");
  const [expandedPlans, setExpandedPlans] = useState(new Set());

  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      
      if (profile.preference) {
        setDefaultBudget(profile.preference.defaultBudget?.toString() || "");
        setCookingMode(profile.preference.cookingMode || "");
        setCaloriePreference(profile.preference.caloriePreference || "");
        setDietaryRules(profile.preference.dietaryRules || "");
        setLocationRadius(profile.preference.locationRadius || 3);
      }
    }
  }, [profile]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);


  // Fetch meal plans and grocery lists when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // Fetch saved meal plans
      setLoadingMealPlans(true);
      setMealPlansError("");
      profileApi.getSavedMealPlans()
        .then((data) => {
          if (data && data.savedMealPlans) {
            setMealPlans(data.savedMealPlans);
            setExpandedPlans((prev) => {
              const next = new Set();
              data.savedMealPlans.forEach((plan) => {
                if (prev.has(plan.planId)) {
                  next.add(plan.planId);
                }
              });
              return next;
            });
          } else {
            setMealPlans([]);
            setExpandedPlans(new Set());
          }
        })
        .catch((err) => {
          console.error("Error fetching saved meal plans:", err);
          console.error("Error details:", {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
          
          // Extract error message, handling various error types
          let errorMsg = "Unknown error";
          if (err.message) {
            errorMsg = err.message;
          } else if (err.toString && err.toString() !== "[object Object]") {
            errorMsg = err.toString();
          } else if (err.name) {
            errorMsg = err.name;
          }
          
          setMealPlansError(`Failed to load saved meal plans: ${errorMsg}`);
          setMealPlans([]);
        })
        .finally(() => {
          setLoadingMealPlans(false);
        });

      // Fetch saved grocery lists (liked recipes)
      setLoadingGroceryLists(true);
      setGroceryListsError("");
      groceryListsApi.getSavedGroceryLists()
        .then((data) => {
          if (data && data.likedRecipes) {
            setGroceryLists(data.likedRecipes);
          } else {
            setGroceryLists([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching saved grocery lists:", err);
          console.error("Error details:", {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
          
          // Extract error message, handling various error types
          let errorMsg = "Unknown error";
          if (err.message) {
            errorMsg = err.message;
          } else if (err.toString && err.toString() !== "[object Object]") {
            errorMsg = err.toString();
          } else if (err.name) {
            errorMsg = err.name;
          }
          
          setGroceryListsError(`Failed to load saved grocery lists: ${errorMsg}`);
          setGroceryLists([]);
        })
        .finally(() => {
          setLoadingGroceryLists(false);
        });
    }
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit called");
    setError("");
    setSuccess("");
    setSaving(true);

    if (!displayName.trim()) {
      setError("Display name is required.");
      setSaving(false);
      return;
    }

    try {
      // Parse defaultBudget properly - handle empty strings and invalid values
      let parsedBudget = null;
      if (defaultBudget && defaultBudget.trim() !== "") {
        const parsed = parseFloat(defaultBudget);
        if (!isNaN(parsed) && parsed >= 0) {
          parsedBudget = parsed;
        }
      }

      // Convert empty strings to null for optional fields
      const profileData = {
        displayName: displayName.trim(),
        preference: {
          defaultBudget: parsedBudget,
          cookingMode: cookingMode && cookingMode.trim() !== "" ? cookingMode.trim() : null,
          caloriePreference: caloriePreference && caloriePreference.trim() !== "" ? caloriePreference.trim() : null,
          dietaryRules: dietaryRules && dietaryRules.trim() !== "" ? dietaryRules.trim() : null,
          locationRadius: locationRadius != null ? Number(locationRadius) : null,
        },
      };

      console.log("Updating profile with data:", profileData);
      const result = await updateProfile(profileData);
      console.log("Update profile result:", result);
      
      if (result.success) {
        setSuccess(profile ? "Profile updated successfully!" : "Profile created successfully!");
        setTimeout(() => setSuccess(""), 3000);
        // Refresh profile to get updated data
        await refreshProfile();
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleRemoveMealPlan = async (planId) => {
    if (!planId) {
      return;
    }
    try {
      const updated = await profileApi.deleteMealPlan(planId);
      if (updated && Array.isArray(updated.savedMealPlans)) {
        setMealPlans(updated.savedMealPlans);
        setExpandedPlans((prev) => {
          const next = new Set(prev);
          next.delete(planId);
          return next;
        });
      } else {
        setMealPlans((prev) => prev.filter((plan) => plan.planId !== planId));
        setExpandedPlans((prev) => {
          const next = new Set(prev);
          next.delete(planId);
          return next;
        });
      }
    } catch (err) {
      console.error("Error removing saved meal plan:", err);
      alert("Failed to remove saved meal plan: " + (err.message || "Unknown error"));
    }
  };

  const togglePlanDetails = (planId) => {
    if (!planId) {
      return;
    }
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  };

  if (authLoading) {
    return (
      <div className="page">
        <Navbar />
        <main className="container">
          <div className="loading">Loading...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <header className="header">
          <h1 className="title">
            User <span>Profile</span>
          </h1>
          <p className="subtitle">
            Manage your account settings and preferences
          </p>
        </header>

        <section className="profile-card">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-content">
              {/* User Info Section */}
              <fieldset className="block">
                <legend>Account Information</legend>
                
                <div className="field-grid">
                  <div className="field">
                    <label className="label" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="input"
                      value={user.email || ""}
                      disabled
                      readOnly
                    />
                    <small className="help">Email cannot be changed</small>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="displayName">
                      Display Name *
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      className="input"
                      placeholder="Your display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              {/* Preferences Section */}
              <fieldset className="block">
                <legend>Meal Planning Preferences</legend>

                <div className="field-grid">
                  <div className="field">
                    <label className="label" htmlFor="defaultBudget">
                      Default Daily Budget (SGD)
                    </label>
                    <input
                      id="defaultBudget"
                      type="number"
                      className="input"
                      placeholder="15.00"
                      min="0"
                      step="0.01"
                      value={defaultBudget}
                      onChange={(e) => setDefaultBudget(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="cookingMode">
                      Cooking Preference
                    </label>
                    <select
                      id="cookingMode"
                      className="select"
                      value={cookingMode}
                      onChange={(e) => setCookingMode(e.target.value)}
                    >
                      <option value="">Not specified</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Cooked at Home">Cooked at Home</option>
                      <option value="No-Cook / Microwave">No-Cook / Microwave</option>
                      <option value="Mostly Eating Out">Mostly Eating Out</option>
                    </select>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="caloriePreference">
                      Calorie Preference
                    </label>
                    <input
                      id="caloriePreference"
                      type="text"
                      className="input"
                      placeholder="e.g., 1500-2000"
                      value={caloriePreference}
                      onChange={(e) => setCaloriePreference(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="locationRadius">
                      Location Search Radius (km)
                    </label>
                    <input
                      id="locationRadius"
                      type="range"
                      className="slider"
                      min="1"
                      max="50"
                      value={locationRadius}
                      onChange={(e) => setLocationRadius(Number(e.target.value))}
                    />
                    <div className="slider-value">{locationRadius} km</div>
                  </div>

                  <div className="field field-full">
                    <label className="label" htmlFor="dietaryRules">
                      Dietary Rules/Requirements
                    </label>
                    <textarea
                      id="dietaryRules"
                      className="textarea"
                      placeholder="e.g., Halal, Vegetarian, Allergies..."
                      value={dietaryRules}
                      onChange={(e) => setDietaryRules(e.target.value)}
                      rows="2"
                    />
                  </div>
                </div>
              </fieldset>

            {/* Saved Meal Plans Section */}
            <fieldset className="block">
              <legend>Saved Meal Plans</legend>
              
              {loadingMealPlans ? (
                <div className="loading-text">Loading meal plans...</div>
              ) : mealPlansError ? (
                <div className="error-small">{mealPlansError}</div>
              ) : mealPlans.length === 0 ? (
                <div className="empty-state">No saved meal plans yet.</div>
              ) : (
                <div className="saved-items-list">
                  {mealPlans.map((plan) => (
                    <div key={plan.planId} className="saved-item">
                      <div className="saved-item-header">
                        <div className="saved-item-heading">
                          <h3 className="saved-item-title">{plan.customName || "Untitled Plan"}</h3>
                          {plan.planId && (
                            <p className="saved-item-subtitle">Plan ID: {plan.planId}</p>
                          )}
                        </div>
                        <div className="saved-item-header-actions">
                          <span className={`status-badge ${plan.status || "draft"}`}>
                            {plan.status || "draft"}
                          </span>
                          <button
                            className="btn-small"
                            onClick={() => togglePlanDetails(plan.planId)}
                          >
                            {expandedPlans.has(plan.planId) ? "Hide details" : "View details"}
                          </button>
                          <button
                            className="btn-small secondary"
                            onClick={() => handleRemoveMealPlan(plan.planId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="saved-item-details">
                        {plan.totalCost !== null && plan.totalCost !== undefined && (
                          <span className="detail-item">Cost: SGD {plan.totalCost.toFixed(2)}</span>
                        )}
                        {plan.totalCalories !== null && plan.totalCalories !== undefined && (
                          <span className="detail-item">Calories: {plan.totalCalories}</span>
                        )}
                        {plan.meals && plan.meals.length > 0 && (
                          <span className="detail-item">{plan.meals.length} meals</span>
                        )}
                      </div>
                      {expandedPlans.has(plan.planId) && (
                        <div className="meal-plan-details">
                          {plan.meals && plan.meals.length > 0 ? (
                            <ul className="meal-plan-meals">
                              {plan.meals.map((meal, idx) => {
                                const label = dayLabels[meal.dayIndex] || `Day ${meal.dayIndex + 1}`;
                                return (
                                  <li key={`${plan.planId}-${meal.dayIndex}-${meal.mealIndex}-${idx}`} className="meal-plan-meal">
                                    <div className="meal-plan-meal-header">
                                      <span className="meal-plan-day">{label}</span>
                                      <span className="meal-plan-name">{meal.name || "Unnamed meal"}</span>
                                    </div>
                                    <div className="meal-plan-meal-body">
                                      {meal.price !== undefined && meal.price !== null && (
                                        <span className="meal-plan-meta">Price: SGD {Number(meal.price).toFixed(2)}</span>
                                      )}
                                      {meal.nutrition && (
                                        <span className="meal-plan-meta">
                                          Calories: {meal.nutrition.calories ?? "N/A"} kcal
                                        </span>
                                      )}
                                      {Array.isArray(meal.tags) && meal.tags.length > 0 && (
                                        <span className="meal-plan-meta">
                                          Tags: {meal.tags.join(", ")}
                                        </span>
                                      )}
                                      {meal.note && meal.note.trim() && (
                                        <span className="meal-plan-note">Note: {meal.note}</span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="meal-plan-empty">No meal details available for this plan.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </fieldset>

            {/* Saved Grocery Lists Section (Liked Recipes) */}
            <fieldset className="block">
              <legend>Liked Recipes (Saved Grocery Lists)</legend>
              
              {loadingGroceryLists ? (
                <div className="loading-text">Loading liked recipes...</div>
              ) : groceryListsError ? (
                <div className="error-small">{groceryListsError}</div>
              ) : groceryLists.length === 0 ? (
                <div className="empty-state">No liked recipes yet.</div>
              ) : (
                <div className="saved-items-list">
                  {groceryLists.map((recipe, index) => {
                    const groceryItems = Array.isArray(recipe.groceryItems) ? recipe.groceryItems : [];
                    // const totalCost = groceryItems.reduce((sum, item) => {
                    //   if (item.pricePerUnit && item.quantity) {
                    //     return sum + item.pricePerUnit * item.quantity;
                    //   }
                    //   return sum;
                    // }, 0);

                    return (
                    <div key={recipe.recipeName || index} className="saved-item">
                      <div className="saved-item-header">
                        <h3 className="saved-item-title">{recipe.recipeName || "Untitled Recipe"}</h3>
                        
                        <button
                          className="btn-small"
                          onClick={async () => {
                            try {
                              const updated = await groceryListsApi.unlikeRecipe(recipe.recipeName);
                              if (updated && updated.likedRecipes) {
                                setGroceryLists(updated.likedRecipes);
                              } else {
                                setGroceryLists([]);
                              }
                            } catch (err) {
                              console.error("Error unliking recipe:", err);
                              alert("Failed to unlike recipe: " + (err.message || "Unknown error"));
                            }
                          }}
                          title="Unlike this recipe"
                        >
                          Unlike
                        </button>
                      </div>
                      {groceryItems.length > 0 && (
                        <div className="grocery-items-list">
                          <div className="grocery-items-header">
                            <strong>Grocery Items ({groceryItems.length}):</strong>
                          </div>
                          <ul className="grocery-items">
                            {groceryItems.map((item, itemIndex) => (
                              <li key={item.itemId || itemIndex} className="grocery-item">
                                <span className="item-name">{item.itemName}</span>
                                {item.quantity && item.unit && (
                                  <span className="item-quantity">
                                    {item.quantity} {item.unit}
                                  </span>
                                )}
                                {item.pricePerUnit && item.pricePerUnit > 0 && (
                                  <span className="item-price">
                                    ${item.pricePerUnit.toFixed(2)}/{item.unit || "unit"}
                                  </span>
                                )}
                                {item.category && (
                                  <span className="item-category">{item.category}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </fieldset>

            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <div className="actions">
              <button 
                type="submit" 
                className="btn" 
                disabled={saving}
                onClick={(e) => {
                  console.log("Save button clicked", { saving, disabled: e.currentTarget.disabled });
                  // Ensure the form submits even if default behavior is prevented
                  if (saving) {
                    e.preventDefault();
                    return;
                  }
                }}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
