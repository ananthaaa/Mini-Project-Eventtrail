import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('cp_role') || 'student'; // 'student' | 'admin'
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('cp_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cp_user');
    if (!saved) return null;
    try {
      const user = JSON.parse(saved);
      if (user && user.avatar && user.avatar.includes('pravatar.cc')) {
        const gender = user.gender || 'male';
        const rand = (user.email ? user.email.length : 1) % 3 + 1;
        user.avatar = `images/avatars/${gender}${rand}.jpg`;
        user.avatar = import.meta.env.BASE_URL + user.avatar; 
      }
      return user;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);

  // Initialize session from Cognito on mount
  const checkSession = useCallback(async () => {
    try {
      setAuthLoading(true);
      const session = await authService.getCurrentSession();
      if (session && session.isValid) {
        const userData = {
          id: session.sub || session.email,
          email: session.email,
          name: session.name,
          role: session.role,
          clubId: session.clubId,
          avatar: session.avatar,
          token: session.idToken,
        };
        setCurrentRole(session.role);
        setIsLoggedIn(true);
        setCurrentUser(userData);
      }
    } catch (err) {
      console.warn('No active Cognito session found:', err.message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    localStorage.setItem('cp_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('cp_logged_in', isLoggedIn);
    if (currentUser) {
      localStorage.setItem('cp_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cp_user');
    }
  }, [isLoggedIn, currentUser]);

  /**
   * Real Cognito Sign In — requires email and password
   */
  const login = async (email, password) => {
    const session = await authService.signIn(email, password);
    const userData = {
      id: session.sub || session.email,
      email: session.email,
      name: session.name,
      role: session.role,
      clubId: session.clubId,
      avatar: session.avatar,
      token: session.idToken,
    };
    setCurrentRole(session.role);
    setIsLoggedIn(true);
    setCurrentUser(userData);
    return session;
  };

  /**
   * Real Cognito Sign Up — always requires password
   */
  const signup = async ({ name, email, password, role = 'student', clubId, gender }) => {
    const result = await authService.signUp(email, password, name, role, clubId, gender);
    return {
      needsConfirmation: !result.userConfirmed,
      email,
      sub: result.sub,
      username: result.username, // generated username (not email) — needed for confirmSignUp
    };
  };

  /**
   * Confirm email verification code
   * @param {string} username - The generated username from signUp result (NOT email)
   * @param {string} code - 6-digit OTP
   */
  const confirmSignup = async (username, code) => {
    const res = await authService.confirmSignUp(username, code);
    return res;
  };

  /**
   * Sign out from Cognito and clear state
   */
  const logout = () => {
    try {
      authService.signOut();
    } catch (err) {
      console.warn('Cognito signOut error:', err);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentRole('student');
  };

  /**
   * Test JWT Authorizer against API Gateway /whoami
   */
  const testWhoAmI = async () => {
    return await authService.testWhoAmI();
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        isLoggedIn,
        currentUser,
        authLoading,
        login,
        signup,
        confirmSignup,
        logout,
        testWhoAmI,
        checkSession,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};
