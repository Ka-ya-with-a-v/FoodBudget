export const BASE_URL = '/api'; // Use relative URL - Vite proxy will handle routing to backend

const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'X-Auth-Token': token }),
        ...options.headers,
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (!res.ok) {
        // Handle 401 Unauthorized - token might be expired
        if (res.status === 401) {
            if (token) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.href = '/login';
            }
            throw new Error('Unauthorized - please login again');
        }

        let errorMsg = 'API request failed';
        try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
        } catch (_) {
            const errorText = await res.text();
            errorMsg = errorText || `HTTP ${res.status}`;
        }
        throw new Error(errorMsg);
    }

    // Handle empty responses
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await res.json();
    }
    
    return null;
};

export default request;
