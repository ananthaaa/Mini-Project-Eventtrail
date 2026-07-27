import React, { createContext, useState, useEffect } from 'react';

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
    return saved ? JSON.parse(saved) : null;
  });

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

  const login = (role, userData) => {
    setCurrentRole(role);
    setIsLoggedIn(true);
    setCurrentUser(userData);
  };

  const signup = (userData) => {
    // Student self-registration — always sets role to student
    const newUser = {
      ...userData,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.email,
    };
    setCurrentRole('student');
    setIsLoggedIn(true);
    setCurrentUser(newUser);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentRole('student'); // default back to student view logic maybe, or guest
  };

  return (
    <RoleContext.Provider value={{ currentRole, isLoggedIn, currentUser, login, signup, logout }}>
      {children}
    </RoleContext.Provider>
  );
};
