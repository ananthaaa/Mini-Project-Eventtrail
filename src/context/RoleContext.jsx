import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const RoleContext = createContext();

export const ROLE_PROFILES = {
  admin: {
    id: 'admin-platform',
    email: 'admin@campus.edu',
    name: 'Campus Administrator',
    role: 'admin',
    clubId: null,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  },
  club_admin: {
    id: 'organizer-87e5b0ed-853e-4ee8-acf6-846f77abd19d',
    email: 'organizer@campus.edu',
    name: 'Club Organizer',
    role: 'club_admin',
    clubId: '87e5b0ed-853e-4ee8-acf6-846f77abd19d',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
  student: {
    id: 'student-demo',
    email: 'student@campus.edu',
    name: 'Alex Rivera',
    role: 'student',
    clubId: null,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
  }
};

function getTabRoleFromUrl() {
  const hash = window.location.hash || '';
  const pathname = window.location.pathname || '';
  if (hash.includes('/admin') || pathname.includes('/admin')) return 'admin';
  if (hash.includes('/organizer') || pathname.includes('/organizer')) return 'club_admin';
  return 'student';
}

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(() => {
    return getTabRoleFromUrl();
  });

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    const role = getTabRoleFromUrl();
    let preservedToken = null;
    try {
      const stored = JSON.parse(localStorage.getItem('cp_user') || '{}');
      preservedToken = stored.token;
    } catch (_) {}
    const profile = ROLE_PROFILES[role] || ROLE_PROFILES.student;
    return { ...profile, token: preservedToken || profile.token };
  });
  const [authLoading, setAuthLoading] = useState(false);

  // Synchronize role whenever URL changes in this tab
  useEffect(() => {
    const handleUrlChange = () => {
      const urlRole = getTabRoleFromUrl();
      setCurrentRole(urlRole);
      let preservedToken = null;
      try {
        const stored = JSON.parse(localStorage.getItem('cp_user') || '{}');
        preservedToken = stored.token;
      } catch (_) {}
      const profile = ROLE_PROFILES[urlRole] || ROLE_PROFILES.student;
      setCurrentUser({ ...profile, token: preservedToken || profile.token });
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  /**
   * Switch the active role instantly across Student, Organizer, and Admin
   */
  const switchRole = useCallback((newRole) => {
    const roleKey = newRole === 'organizer' ? 'club_admin' : newRole;
    const baseProfile = ROLE_PROFILES[roleKey] || ROLE_PROFILES.student;

    let preservedToken = null;
    try {
      const stored = JSON.parse(localStorage.getItem('cp_user') || '{}');
      preservedToken = stored.token;
    } catch (_) {}

    const updatedUser = {
      ...baseProfile,
      token: preservedToken || baseProfile.token,
    };

    setCurrentRole(roleKey);
    setCurrentUser(updatedUser);
    setIsLoggedIn(true);

    return updatedUser;
  }, []);

  // Initialize session from Cognito on mount
  const checkSession = useCallback(async () => {
    try {
      const urlRole = getTabRoleFromUrl();
      const baseProfile = ROLE_PROFILES[urlRole] || ROLE_PROFILES.student;
      const session = await authService.getCurrentSession();
      if (session && session.isValid) {
        const userData = {
          ...baseProfile,
          id: session.sub || session.email,
          email: session.email || baseProfile.email,
          name: session.name || baseProfile.name,
          role: urlRole,
          clubId: session.clubId || baseProfile.clubId,
          avatar: session.avatar || baseProfile.avatar,
          token: session.idToken,
        };
        setCurrentRole(urlRole);
        setIsLoggedIn(true);
        setCurrentUser(userData);
      } else {
        let preservedToken = null;
        try {
          const stored = JSON.parse(localStorage.getItem('cp_user') || '{}');
          preservedToken = stored.token;
        } catch (_) {}
        setCurrentRole(urlRole);
        setCurrentUser({ ...baseProfile, token: preservedToken || baseProfile.token });
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.warn('Session check fallback:', err.message);
      const urlRole = getTabRoleFromUrl();
      const profile = ROLE_PROFILES[urlRole] || ROLE_PROFILES.student;
      setCurrentRole(urlRole);
      setCurrentUser(profile);
      setIsLoggedIn(true);
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
    try {
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
    } catch (cognitoErr) {
      // Check if organizer was provisioned by administrator locally
      const savedOrganizers = JSON.parse(localStorage.getItem('cp_organizers') || '[]');
      const matched = savedOrganizers.find(o => o.email?.toLowerCase() === email?.trim().toLowerCase());
      
      if (matched) {
        const isTempMatch = matched.temporaryPassword && matched.temporaryPassword === password;
        const isPermMatch = matched.permanentPassword && matched.permanentPassword === password;

        if (isTempMatch && !matched.hasResetPassword) {
          // Trigger first-time permanent password challenge
          return {
            challengeName: 'NEW_PASSWORD_REQUIRED',
            cognitoUser: { username: matched.email, isLocalProvisioned: true },
            userAttributes: { email: matched.email, name: matched.name },
          };
        }

        if (isPermMatch || isTempMatch || (matched.hasResetPassword && password.length >= 6)) {
          const userData = {
            id: `org_${matched.email}`,
            email: matched.email,
            name: matched.name,
            role: 'club_admin',
            clubId: matched.clubId,
            avatar: '/images/avatars/male1.jpg',
            token: 'bearer-org-session',
          };
          setCurrentRole('club_admin');
          setIsLoggedIn(true);
          setCurrentUser(userData);
          localStorage.setItem('cp_role', 'club_admin');
          localStorage.setItem('cp_logged_in', 'true');
          localStorage.setItem('cp_user', JSON.stringify(userData));
          return { ...userData, isValid: true };
        }
      }

      throw cognitoErr;
    }
  };

  /**
   * Complete First-Time Login Password Change for Admin-Created Users (e.g. Club Organizers)
   */
  const completeNewPassword = async (cognitoUser, newPassword, userAttributes = {}) => {
    if (cognitoUser?.isLocalProvisioned) {
      const email = cognitoUser.username;
      const savedOrganizers = JSON.parse(localStorage.getItem('cp_organizers') || '[]');
      const matched = savedOrganizers.find(o => o.email?.toLowerCase() === email?.toLowerCase());
      if (matched) {
        matched.permanentPassword = newPassword;
        matched.hasResetPassword = true;
        if (userAttributes.name) matched.name = userAttributes.name;
        localStorage.setItem('cp_organizers', JSON.stringify(savedOrganizers));

        const userData = {
          id: `org_${matched.email}`,
          email: matched.email,
          name: matched.name,
          role: 'club_admin',
          clubId: matched.clubId,
          avatar: '/images/avatars/male1.jpg',
          token: 'bearer-org-session',
        };
        setCurrentRole('club_admin');
        setIsLoggedIn(true);
        setCurrentUser(userData);
        localStorage.setItem('cp_role', 'club_admin');
        localStorage.setItem('cp_logged_in', 'true');
        localStorage.setItem('cp_user', JSON.stringify(userData));
        return { ...userData, isValid: true };
      }
    }

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
        switchRole,
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
