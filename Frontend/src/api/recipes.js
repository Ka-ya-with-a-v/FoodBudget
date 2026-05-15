import request from './api';

// GET all recipes
export const getRecipes = () => request('/grocery/recipes');

// GET a specific recipe by name
export const getRecipeByName = (recipeName) =>
    request(`/grocery/recipes/${encodeURIComponent(recipeName)}`);
