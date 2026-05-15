// Export all API modules from a central location
export { authApi } from '../api/auth';
export { profileApi } from '../api/profile';

// Grocery Lists API (for liked recipes / saved grocery lists)
import request from '../api/api';

export const groceryListsApi = {
  // Get saved grocery lists (liked recipes)
  getSavedGroceryLists: () => request('/profile/me/grocery-lists', { method: 'GET' }),
  
  // Like a recipe (save as grocery list)
  likeRecipe: (recipeName) => request('/profile/me/grocery-lists', {
    method: 'POST',
    body: JSON.stringify({ recipeName }),
  }),
  
  // Unlike a recipe (remove from saved grocery lists)
  unlikeRecipe: (recipeName) => request(`/profile/me/grocery-lists/${encodeURIComponent(recipeName)}`, {
    method: 'DELETE',
  }),
};

