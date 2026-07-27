import React from 'react';
import { Outlet } from 'react-router-dom';

const LandingLayout = () => {
  return (
    <div className="min-h-screen bg-neobrutalist bg-grid-dots flex flex-col">
      <Outlet />
    </div>
  );
};

export default LandingLayout;

