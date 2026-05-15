import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi, profileApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setProfile(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setProfile(null);
      return null;
    }

    try {
      const userProfile = await profileApi.getMe();
      if (userProfile && (userProfile.displayName || userProfile.id)) {
        setProfile(userProfile);
        return userProfile;
      }
      setProfile(null);
    } catch (error) {
      if (!error.message.includes('Unauthorized')) {
        console.log('Profile not found or error fetching:', error.message);
      }
      setProfile(null);
    }
    return null;
  }, []);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (active) {
              setUser(parsedUser);
              await fetchProfile();
            }
          } catch (parseError) {
            console.error('Error parsing stored user session:', parseError);
            if (active) {
              clearSession();
            }
          }
        } else if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [fetchProfile, clearSession]);

  const persistSession = useCallback((token, nextUser) => {
    if (!token || !nextUser) {
      return;
    }
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      const token = data?.token;
      const nextUser = {
        authUserId: data?.authUserId,
        email: data?.email,
        displayName: data?.displayName,
      };

      persistSession(token, nextUser);

      if (data?.profile) {
        setProfile(data.profile);
      } else {
        await fetchProfile();
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [fetchProfile, persistSession]);

  const signUp = useCallback(async (email, password, displayName) => {
    try {
      const data = await authApi.signup({ email, password, displayName });
      const token = data?.token;
      const nextUser = {
        authUserId: data?.authUserId,
        email: data?.email,
        displayName: data?.displayName,
      };

      persistSession(token, nextUser);

      if (data?.profile) {
        setProfile(data.profile);
      } else {
        await fetchProfile();
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [fetchProfile, persistSession]);

  const signOut = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    try {
      await authApi.logout(token);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const updatedProfile = await profileApi.updateMe(profileData);
      setProfile(updatedProfile);
      return { success: true, data: updatedProfile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const refreshProfile = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }), [user, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

