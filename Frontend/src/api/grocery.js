import request from './api';

// GET all grocery items
export const getGroceryItems = () => request('/grocery/items');

// POST optimise basket / list
export const optimiseBasket = (payload) =>
    request('/grocery/list', { method: 'POST', body: JSON.stringify(payload) });
