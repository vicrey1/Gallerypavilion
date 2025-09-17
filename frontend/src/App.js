import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import GalleryPage from './pages/GalleryPage';
import GalleriesPage from './pages/GalleriesPage';
import CreateGalleryPage from './pages/CreateGalleryPage';
import ShareGalleryPage from './pages/ShareGalleryPage';
import PhotoDetailPage from './pages/PhotoDetailPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';


// Styles
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/portfolio" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route path="/gallery/:token" element={<ShareGalleryPage />} />
            <Route path="/gallery/:token/photo/:photoId" element={<PhotoDetailPage />} />
            {/* Protected Routes - Photographers */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/galleries" element={
              <ProtectedRoute>
                <GalleriesPage />
              </ProtectedRoute>
            } />
            <Route path="/galleries/create" element={
              <ProtectedRoute>
                <CreateGalleryPage />
              </ProtectedRoute>
            } />
            <Route path="/gallery/:id/edit" element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;