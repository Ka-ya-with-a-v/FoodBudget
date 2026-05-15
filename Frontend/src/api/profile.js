import request from './api';

/**
 * Profile API methods
 */
export const profileApi = {
  // Get current user's profile (requires auth)
  getMe: () => request('/profile/me', { method: 'GET' }),
  
  // Create profile (requires auth)
  create: (data) => request('/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update current user's profile (requires auth)
  updateMe: (data) => request('/profile/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Get saved meal plans (requires auth)
  getSavedMealPlans: () => request('/profile/me/meal-plans', { method: 'GET' }),

  // Save a meal plan (requires auth)
  saveMealPlan: ({ planId, customName }) => request('/profile/me/meal-plans', {
    method: 'POST',
    body: JSON.stringify({ planId, customName }),
  }),

  // Delete a saved meal plan (requires auth)
  deleteMealPlan: (planId) => request(`/profile/me/meal-plans/${planId}`, {
    method: 'DELETE',
  }),
};

