import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    website: '',
    bio: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must be a valid URL (include http:// or https://)';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const result = await signup({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email,
      password: formData.password,
      businessName: formData.businessName.trim(),
      website: formData.website || undefined,
      bio: formData.bio.trim()
    });
    
    if (result.success) {
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-serif font-bold gradient-text">
              Gallery Pavilion
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Join as a Photographer
          </h2>
          <p className="mt-2 text-gray-600">
            Create your premium photography gallery
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Business Information */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleChange}
                className={`input-field ${errors.businessName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Your Photography Studio"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website (Optional)
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className={`input-field ${errors.website ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="https://yourwebsite.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Professional Bio * (minimum 50 characters)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                className={`input-field resize-none ${errors.bio ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Tell us about your photography background, specialties, and experience..."
              />
              <div className="mt-1 flex justify-between">
                {errors.bio ? (
                  <p className="text-sm text-red-600">{errors.bio}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {formData.bio.length}/50 characters minimum
                  </p>
                )}
              </div>
            </div>

            {/* Terms Agreement */}
            <div>
              <div className="flex items-start">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className={`mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
                    errors.agreeToTerms ? 'border-red-500' : ''
                  }`}
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <button className="text-primary-600 hover:text-primary-500" onClick={() => console.log('Navigate to Terms of Service')}>
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button className="text-primary-600 hover:text-primary-500" onClick={() => console.log('Navigate to Privacy Policy')}>
                    Privacy Policy
                  </button>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg relative"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="absolute inset-0" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>

        {/* Approval Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> All photographer accounts require admin approval to ensure quality standards. 
            You'll receive an email notification once your account is reviewed.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;