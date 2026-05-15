import React, { useMemo, useState, useEffect } from "react";
import { Download, Search, Heart, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { groceryListsApi } from "../services/api";
import "./BasketSetup.css";

const RECIPES_PER_PAGE = 12;

export default function GroceryMealPlanner() {
    const [recipes, setRecipes] = useState([]);
    const [recipeServings, setRecipeServings] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [allRecipes, setAllRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likedRecipes, setLikedRecipes] = useState(new Set());
    const { user, loading: authLoading } = useAuth();

    // Fetch data from APIs
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log("Fetching recipes...");
                const recipesResponse = await fetch(
                    "/api/grocery/items"
                );
                console.log("Recipes response status:", recipesResponse.status);

                if (!recipesResponse.ok) throw new Error("Failed to fetch recipes");
                const recipesData = await recipesResponse.json();
                console.log("Recipes data:", recipesData);

                console.log("Fetching ingredient prices...");
                const ingredientsResponse = await fetch(
                    "/api/grocery/ingredients"
                );
                console.log("Ingredients response status:", ingredientsResponse.status);

                let ingredientPrices = {};
                if (ingredientsResponse.ok) {
                    const ingredientsData = await ingredientsResponse.json();
                    console.log("Ingredients data:", ingredientsData);

                    // Create a map of ingredient names to prices
                    // Prices are stored in cents, so divide by 100
                    ingredientPrices = ingredientsData.reduce((acc, item) => {
                        let price = parseFloat(item.price) / 100;
                        console.log(`${item.itemName}: ${item.price} cents -> ${price.toFixed(2)}`);
                        acc[item.itemName.toLowerCase()] = price;
                        return acc;
                    }, {});
                    console.log("Final ingredient prices map:", ingredientPrices);
                }
                const processedRecipes = processRecipesDataWithPrices(recipesData, ingredientPrices);
                setAllRecipes(processedRecipes);
            } catch (err) {
                setError(
                    err.message || "Sorry, we are unable to provide any info now"
                );
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            setLikedRecipes(new Set());
            return;
        }

        let cancelled = false;

        const loadLikedRecipes = async () => {
            try {
                const data = await groceryListsApi.getSavedGroceryLists();
                if (!cancelled) {
                    const liked = (data?.likedRecipes ?? []).map((item) => item.recipeName);
                    setLikedRecipes(new Set(liked));
                }
            } catch (apiError) {
                if (!cancelled) {
                    console.error("Error loading liked recipes:", apiError);
                }
            }
        };

        loadLikedRecipes();

        return () => {
            cancelled = true;
        };
    }, [authLoading, user]);

    // Process recipes data into grouped format with prices
    const processRecipesDataWithPrices = (data, prices) => {
        if (!Array.isArray(data)) {
            console.error("Data is not an array:", data);
            return [];
        }

        const recipeMap = new Map();

        data.forEach((item) => {
            const recipeName = item.recipeName || "Unknown";
            const itemName = item.itemName || "Unknown";
            const quantity = item.quantity || 0;
            const unit = item.unit || "unit";
            const servings = item.servings || 1;

            if (!recipeMap.has(recipeName)) {
                recipeMap.set(recipeName, {
                    recipe_id: recipeName,
                    recipe_name: recipeName,
                    default_servings: servings,
                    items: [],
                });
            }

            const recipe = recipeMap.get(recipeName);

            const existingItem = recipe.items.find(
                (i) => i.item_name === itemName && i.unit === unit
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                // Get price for this item, fallback to random 2-5 SGD if not found
                const priceKey = itemName.toLowerCase();
                let price = prices[priceKey];

                if (!price) {
                    price = Math.random() * 3 + 2;
                    console.log(`Price not found for "${itemName}", using random: ${price.toFixed(2)}`);
                }

                console.log(`Item: ${itemName}, Price: ${price.toFixed(2)}`);

                recipe.items.push({
                    item_id: `${recipeName}-${itemName}`,
                    item_name: itemName,
                    quantity: quantity,
                    unit: unit,
                    category: "Groceries",
                    price_per_unit: price,
                });
            }
        });

        return Array.from(recipeMap.values());
    };

    // Filter recipes based on search
    const filteredRecipes = useMemo(() => {
        return allRecipes.filter((recipe) =>
            recipe.recipe_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allRecipes, searchQuery]);

    const toggleRecipe = (recipe) => {
        setRecipes((prev) => {
            const exists = prev.find((r) => r.recipe_id === recipe.recipe_id);
            if (exists) {
                return prev.filter((r) => r.recipe_id !== recipe.recipe_id);
            } else {
                setRecipeServings((s) => ({
                    ...s,
                    [recipe.recipe_id]: recipe.default_servings,
                }));
                return [...prev, recipe];
            }
        });
    };

    const deleteRecipe = (recipeId) => {
        setRecipes((prev) => prev.filter((r) => r.recipe_id !== recipeId));
        setRecipeServings((s) => {
            const newServings = { ...s };
            delete newServings[recipeId];
            return newServings;
        });
    };

    const getRecipePrice = (recipe) => {
        return recipe.items.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0);
    };

    const toggleLike = async (e, recipeId) => {
        e.stopPropagation();

        if (authLoading) {
            return;
        }

        if (!user) {
            alert("Please sign in to like recipes.");
            return;
        }

        const recipe = allRecipes.find((r) => r.recipe_id === recipeId);
        if (!recipe) {
            return;
        }

        try {
            let response;
            if (likedRecipes.has(recipe.recipe_name)) {
                response = await groceryListsApi.unlikeRecipe(recipe.recipe_name);
            } else {
                response = await groceryListsApi.likeRecipe(recipe.recipe_name);
            }

            const updated = (response?.likedRecipes ?? []).map((item) => item.recipeName);
            setLikedRecipes(new Set(updated));
        } catch (apiError) {
            console.error("Error updating liked recipes:", apiError);
            alert(apiError.message || "Failed to update liked recipes. Please try again.");
        }
    };

    // Consolidate ingredients and scale by servings
    const shoppingList = useMemo(() => {
        const itemMap = new Map();

        for (const recipe of recipes) {
            const servings = recipeServings[recipe.recipe_id] || recipe.default_servings;
            const scale = servings / recipe.default_servings;

            for (const item of recipe.items) {
                const key = `${item.item_id}-${item.unit}`;
                const existing = itemMap.get(key) || {
                    item_id: item.item_id,
                    item_name: item.item_name,
                    unit: item.unit,
                    category: item.category,
                    quantity: 0,
                    price_per_unit: item.price_per_unit,
                    recipes: [],
                };

                existing.quantity += item.quantity * scale;
                if (!existing.recipes.includes(recipe.recipe_name)) {
                    existing.recipes.push(recipe.recipe_name);
                }
                itemMap.set(key, existing);
            }
        }

        return Array.from(itemMap.values()).sort((a, b) =>
            a.category.localeCompare(b.category)
        );
    }, [recipes, recipeServings]);

    // Group by category
    const grouped = useMemo(() => {
        const map = new Map();
        for (const item of shoppingList) {
            const arr = map.get(item.category) ?? [];
            arr.push(item);
            map.set(item.category, arr);
        }
        return Array.from(map.entries());
    }, [shoppingList]);

    const totalCost = shoppingList.reduce(
        (sum, item) => sum + item.quantity * item.price_per_unit,
        0
    );

    const downloadList = () => {
        let text = "Grocery Shopping List\n";
        text += "=".repeat(40) + "\n\n";

        for (const [category, items] of grouped) {
            text += `${category.toUpperCase()}\n`;
            text += "-".repeat(40) + "\n";
            for (const item of items) {
                text += `${item.item_name.padEnd(30)} ${item.quantity
                    .toFixed(1)
                    .padStart(8)} ${item.unit.padEnd(6)} $${(
                    item.quantity * item.price_per_unit
                )
                    .toFixed(2)
                    .padStart(8)}\n`;
            }
            text += "\n";
        }

        text += "=".repeat(40) + "\n";
        text += `TOTAL: $${totalCost.toFixed(2)}\n`;
        text += `Generated: ${new Date().toLocaleDateString()}\n`;

        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(text)
        );
        element.setAttribute("download", `shopping_list_${Date.now()}.txt`);
        element.click();
    };

    const selectedCount = recipes.length;

    const RecipeCard = ({ recipe, isSelected, isLiked }) => (
        <button
            onClick={() => toggleRecipe(recipe)}
            className={`recipe-card ${isSelected ? "selected" : ""}`}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div className="recipe-card-title">{recipe.recipe_name}</div>
                    <div className="recipe-card-subtitle">
                        Default: {recipe.default_servings} servings
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-green)", fontWeight: "700", marginTop: "4px" }}>
                        ${getRecipePrice(recipe).toFixed(2)}
                    </div>
                </div>
                <button
                    onClick={(e) => toggleLike(e, recipe.recipe_id)}
                    className={`recipe-like-btn ${isLiked ? "liked" : ""}`}
                    title={isLiked ? "Unlike recipe" : "Like recipe"}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0", display: "flex" }}
                >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} color={isLiked ? "#ef4444" : "var(--color-muted)"} />
                </button>
            </div>
            {isSelected && (
                <div className="recipe-card-badge">✓ Selected</div>
            )}
        </button>
    );

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
                <header className="header">
                    <div className="header-content">
                        <h1>
                            Grocery <span className="header-gradient">Meal Planner</span>
                        </h1>
                    </div>
                </header>
                <div className="loading">
                    <div className="spinner"></div>
                    <p style={{ marginTop: "16px" }}>Loading recipes...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
            <Navbar />

            <main>
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {/* Liked Recipes Section */}
                {likedRecipes.size > 0 && (
                    <section className="section">
                        <h2>Liked Recipes</h2>
                        <div className="recipe-grid">
                            {allRecipes.map((recipe) => {
                                if (!likedRecipes.has(recipe.recipe_name)) return null;
                                const isSelected = recipes.some(
                                    (r) => r.recipe_id === recipe.recipe_id
                                );
                                const isLiked = likedRecipes.has(recipe.recipe_name);
                                return (
                                    <RecipeCard
                                        key={recipe.recipe_id}
                                        recipe={recipe}
                                        isSelected={isSelected}
                                        isLiked={isLiked}
                                    />
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Recipe Selection */}
                <section className="section">
                    <h2>Step 1: Select Recipes</h2>

                    {/* Search Bar */}
                    <div className="search-container">
                        <div
                            style={{
                                position: "relative",
                                display: "inline-block",
                                width: "100%",
                                maxWidth: "500px",
                            }}
                        >
                            <Search
                                size={18}
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--color-muted)",
                                    pointerEvents: "none",
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                                style={{ paddingLeft: "40px" }}
                            />
                        </div>
                    </div>

                    {/* Recipe Cards */}
                    <div className="recipe-grid">
                        {filteredRecipes.length > 0 ? (
                            filteredRecipes.map((recipe) => {
                                const isSelected = recipes.some(
                                    (r) => r.recipe_id === recipe.recipe_id
                                );
                                const isLiked = likedRecipes.has(recipe.recipe_name);
                                return (
                                    <RecipeCard
                                        key={recipe.recipe_id}
                                        recipe={recipe}
                                        isSelected={isSelected}
                                        isLiked={isLiked}
                                    />
                                );
                            })
                        ) : (
                            <p style={{ color: "var(--color-muted)" }}>
                                No recipes found matching "{searchQuery}"
                            </p>
                        )}
                    </div>
                </section>

                {/* Serving Adjustments */}
                {selectedCount > 0 && (
                    <section className="section">
                        <h2>Step 2: Adjust Servings</h2>
                        <div className="servings-grid">
                            {recipes.map((recipe) => (
                                <div key={recipe.recipe_id} className="servings-card">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <div className="servings-card-title">{recipe.recipe_name}</div>
                                        <button
                                            onClick={() => deleteRecipe(recipe.recipe_id)}
                                            className="delete-recipe-btn"
                                            title="Delete recipe"
                                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0", display: "flex", color: "#ef4444" }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="servings-input-group">
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={
                                                recipeServings[recipe.recipe_id] ||
                                                recipe.default_servings
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "") {
                                                    setRecipeServings((s) => ({
                                                        ...s,
                                                        [recipe.recipe_id]: "",
                                                    }));
                                                } else {
                                                    const num = parseInt(value);
                                                    if (!isNaN(num) && num >= 1) {
                                                        setRecipeServings((s) => ({
                                                            ...s,
                                                            [recipe.recipe_id]: num,
                                                        }));
                                                    }
                                                }
                                            }}
                                            onBlur={(e) => {
                                                if (e.target.value === "" || parseInt(e.target.value) < 1) {
                                                    setRecipeServings((s) => ({
                                                        ...s,
                                                        [recipe.recipe_id]: recipe.default_servings,
                                                    }));
                                                }
                                            }}
                                            className="servings-input"
                                        />
                                        <span className="servings-label">servings</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Shopping List */}
                {selectedCount > 0 && (
                    <section>
                        <div className="shopping-list-header">
                            <h2 className="shopping-list-title">Your Shopping List</h2>
                            <button onClick={downloadList} className="download-btn">
                                <Download size={16} /> Download
                            </button>
                        </div>

                        {/* Cost Summary */}
                        <div className="cost-summary">
                            <div className="cost-label">Estimated Total Cost</div>
                            <div className="cost-amount">${totalCost.toFixed(2)}</div>
                            <div className="cost-note">Based on current average prices</div>
                        </div>

                        {/* Shopping List Container */}
                        <div className="shopping-list-container">
                            {grouped.length > 0 ? (
                                grouped.map(([category, items]) => (
                                    <div key={category} className="category-section">
                                        <div className="category-header">
                                            <span className="category-badge">{category}</span>
                                            <span className="category-count">
                                                {items.length} item{items.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>

                                        <div className="shopping-items">
                                            {items.map((item) => (
                                                <div
                                                    key={`${item.item_id}-${item.unit}`}
                                                    className="shopping-item"
                                                >
                                                    <div className="item-info">
                                                        <div className="item-name">{item.item_name}</div>
                                                        <div className="item-recipes">
                                                            Used in: {item.recipes.join(", ")}
                                                        </div>
                                                    </div>
                                                    <div className="item-details">
                                                        <div className="item-quantity">
                                                            {item.quantity.toFixed(1)} {item.unit}
                                                        </div>
                                                        <div className="item-price">
                                                            ${(item.quantity * item.price_per_unit).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: "var(--color-muted)", textAlign: "center" }}>
                                    No items in your shopping list
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {selectedCount === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🛒</div>
                        <p className="empty-state-text">
                            Select recipes to create your shopping list
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}