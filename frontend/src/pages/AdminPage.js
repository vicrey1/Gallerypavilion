import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminPanel from '../components/Admin/AdminPanel';

const AdminPage = () => {
  return <AdminPanel />;
};

export default AdminPage;