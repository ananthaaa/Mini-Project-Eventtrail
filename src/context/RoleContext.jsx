import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('cp_role') || 'student'; // 'student' | 'admin'
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
        localStorage.setItem('cp_role', session.role);
        localStorage.setItem('cp_logged_in', 'true');
        localStorage.setItem('cp_user', JSON.stringify(userData));
      } else if (import.meta.env.DEV && sessionStorage.getItem('cp_dev_mock_user')) {
        try {
          const devUser = JSON.parse(sessionStorage.getItem('cp_dev_mock_user'));
          setCurrentRole(devUser.role);
          setIsLoggedIn(true);
          setCurrentUser(devUser);
        } catch (_) {}
      } else {
        // Expired or invalid session: actively clear any stale cached state
        setIsLoggedIn(false);
        setCurrentUser(null);
        localStorage.removeItem('cp_logged_in');
        localStorage.removeItem('cp_user');
      }
    } catch (err) {
      console.warn('Session verification cleared:', err.message);
      setIsLoggedIn(false);
      setCurrentUser(null);
      localStorage.removeItem('cp_logged_in');
      localStorage.removeItem('cp_user');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Real Cognito Sign In — requires email and password
   */
  const login = async (email, password) => {
    const res = await authService.signIn(email, password);
    if (res && res.challengeName === 'NEW_PASSWORD_REQUIRED') {
      return res; // Return challenge directly so UI can prompt organizer to set their new password
    }
    const session = res;
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
    localStorage.setItem('cp_role', session.role);
    localStorage.setItem('cp_logged_in', 'true');
    localStorage.setItem('cp_user', JSON.stringify(userData));
    return session;
  };

  /**
   * Complete First-Time Login Password Change for Admin-Created Users (e.g. Club Organizers)
   */
  const completeNewPassword = async (cognitoUser, newPassword, userAttributes = {}) => {
    const session = await authService.completeNewPasswordChallenge(cognitoUser, newPassword, userAttributes);
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
    localStorage.setItem('cp_role', session.role);
    localStorage.setItem('cp_logged_in', 'true');
    localStorage.setItem('cp_user', JSON.stringify(userData));
    return session;
  };

  /**
   * Real Cognito Sign Up
   */
  const signup = async ({ name, email, password, role = 'student', clubId, studentId, gender = 'unspecified' }) => {
    const result = await authService.signUp(email, password, name, role, clubId, gender);
    // Persist safe pending confirmation state across page refreshes (no password stored!)
    try {
      sessionStorage.setItem('cp_pending_confirmation', JSON.stringify({
        username: result.username,
        email,
        studentId: studentId || '',
        name
      }));
    } catch (_) {}

    return {
      needsConfirmation: !result.userConfirmed,
      email,
      sub: result.sub,
      username: result.username,
    };
  };

  /**
   * Confirm email verification code
   */
  const confirmSignup = async (username, code) => {
    const res = await authService.confirmSignUp(username, code);
    try {
      sessionStorage.removeItem('cp_pending_confirmation');
    } catch (_) {}
    return res;
  };

  /**
   * Resend confirmation verification code
   */
  const resendConfirmationCode = async (username) => {
    return await authService.resendConfirmationCode(username);
  };

  /**
   * Request password reset code
   */
  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  /**
   * Confirm password reset
   */
  const confirmPassword = async (email, code, newPassword) => {
    return await authService.confirmPassword(email, code, newPassword);
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
    localStorage.removeItem('cp_logged_in');
    localStorage.removeItem('cp_user');
    localStorage.removeItem('cp_events');
    localStorage.removeItem('cp_venues');
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
        user: currentUser, // Alias for seamless compatibility across components
        authLoading,
        login,
        completeNewPassword,
        signup,
        confirmSignup,
        resendConfirmationCode,
        forgotPassword,
        confirmPassword,
        logout,
        testWhoAmI,
        checkSession,
        isClubAdmin: currentRole === 'club_admin',
        isPlatformAdmin: currentRole === 'admin',
        isStudent: currentRole === 'student',
        clubId: currentUser?.clubId || null,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};
