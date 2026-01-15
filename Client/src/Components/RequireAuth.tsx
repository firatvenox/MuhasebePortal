import React from 'react';
import { Navigate, Outlet } from 'react-router';

const RequireAuth: React.FC = () => {
  const token = localStorage.getItem('accessToken');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RequireAuth;
