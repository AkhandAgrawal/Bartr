import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../services/userService';
import type { SignupRequest } from '../types/user';
import { FiX, FiUser, FiMail, FiLock, FiEdit3 } from 'react-icons/fi';

export const Signup = () => {
  const [formData, setFormData] = useState<SignupRequest>({
    firstName: '',
    lastName: '',
    gender: '',
    userName: '',
    bio: '',
    password: '',
    email: '',
    skillsOffered: [],
    skillsWanted: [],
  });
  const [currentSkill, setCurrentSkill] = useState({ offered: '', wanted: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = (type: 'offered' | 'wanted') => {
    const skill = type === 'offered' ? currentSkill.offered : currentSkill.wanted;
    if (skill.trim()) {
      setFormData({
        ...formData,
        [type === 'offered' ? 'skillsOffered' : 'skillsWanted']: [
          ...(formData[type === 'offered' ? 'skillsOffered' : 'skillsWanted'] || []),
          skill.trim(),
        ],
      });
      setCurrentSkill({ ...currentSkill, [type]: '' });
    }
  };

  const removeSkill = (type: 'offered' | 'wanted', index: number) => {
    const skills = formData[type === 'offered' ? 'skillsOffered' : 'skillsWanted'] || [];
    setFormData({
      ...formData,
      [type === 'offered' ? 'skillsOffered' : 'skillsWanted']: skills.filter((_, i) => i !== index),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    // Clear password error when user starts typing
    if (passwordError) {
      setPasswordError('');
    }
    // Check if passwords match if confirm password is already filled
    if (confirmPassword && confirmPassword !== newPassword) {
      setPasswordError('Passwords do not match');
    } else if (confirmPassword && confirmPassword === newPassword) {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    // Check if passwords match
    if (formData.password && newConfirmPassword !== formData.password) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    
    // Validate passwords match
    if (formData.password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await userService.signup(formData);
      navigate('/login', { state: { message: 'Account created successfully! Please login.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Bartr Logo - Link to Landing */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-6 left-6 z-50"
      >
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <span className="text-3xl font-extrabold">Bartr</span>
            </div>
          </motion.div>
        </Link>
      </motion.div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
        />
        <motion.div
          className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
        />
        <motion.div
          className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white/90 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-white/20 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-center text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Create your account
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-blue-600 hover:text-indigo-600 transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-md"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiUser className="w-4 h-4 text-blue-600" />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiUser className="w-4 h-4 text-blue-600" />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiUser className="w-4 h-4 text-indigo-600" />
                Username
              </label>
              <input
                type="text"
                name="userName"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300"
                value={formData.userName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <select
                name="gender"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiMail className="w-4 h-4 text-purple-600" />
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
              value={formData.email}
              onChange={handleChange}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiLock className="w-4 h-4 text-blue-600" />
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 ${
                passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
              value={formData.password}
              onChange={handlePasswordChange}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.55 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiLock className="w-4 h-4 text-blue-600" />
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 ${
                passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
            {passwordError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600"
              >
                {passwordError}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiEdit3 className="w-4 h-4 text-indigo-600" />
              Bio
            </label>
            <textarea
              name="bio"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300 resize-none"
              value={formData.bio}
              onChange={handleChange}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">Skills Offered</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                placeholder="Add a skill"
                value={currentSkill.offered}
                onChange={(e) => setCurrentSkill({ ...currentSkill, offered: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill('offered');
                  }
                }}
              />
              <motion.button
                type="button"
                onClick={() => addSkill('offered')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {formData.skillsOffered?.map((skill, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 shadow-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('offered', index)}
                      className="ml-2 hover:text-blue-600 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">Skills Wanted</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                placeholder="Add a skill"
                value={currentSkill.wanted}
                onChange={(e) => setCurrentSkill({ ...currentSkill, wanted: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill('wanted');
                  }
                }}
              />
              <motion.button
                type="button"
                onClick={() => addSkill('wanted')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {formData.skillsWanted?.map((skill, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200 shadow-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('wanted', index)}
                      className="ml-2 hover:text-purple-600 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="group relative w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

