import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiLogIn, FiArrowRight } from 'react-icons/fi';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setLoading, clearUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (has valid, non-expired token)
    // This will also clear expired tokens automatically
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        // Verify token is actually valid by trying to get user profile
        // This prevents redirecting with expired tokens
        const token = authService.getAccessToken();
        if (token) {
          try {
            // Decode token to get keycloak ID
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const keycloakId = payload.sub;
              
              if (keycloakId) {
                // Try to load user profile to verify token is valid
                await userService.getUserByKeycloakId(keycloakId);
                // Token is valid, redirect to dashboard
                navigate('/dashboard', { replace: true });
                return;
              }
            }
          } catch (error: any) {
            // Token might be invalid or expired, clear it and stay on login
            const status = error.response?.status;
            if (status === 401) {
              authService.clearTokens();
              clearUser();
            }
          }
        }
      }
      
      setCheckingAuth(false);
      
      // Check for success message from signup
      if (location.state?.message) {
        setSuccessMessage(location.state.message);
      }
    };
    
    checkAuth();
  }, [navigate, location, clearUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend login endpoint (which calls Keycloak internally)
      const response = await authService.login(username.trim(), password);

      if (response.error) {
        setError(response.errorDescription || response.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      if (!response.accessToken) {
        setError('No access token received from server');
        setIsLoading(false);
        return;
      }

      // Store tokens
      authService.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        authService.setRefreshToken(response.refreshToken);
      }

      // Load user profile
      try {
        setLoading(true);
        // Decode JWT to get keycloak ID (sub claim)
        const tokenParts = response.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const keycloakId = payload.sub;
          
          if (keycloakId) {
            const userProfile = await userService.getUserByKeycloakId(keycloakId);
            setUser(userProfile);
          }
        }
      } catch (profileError: any) {
        // User profile might not exist yet - that's okay
        // User can complete profile setup later
        console.log('User profile not found - user may need to complete profile setup');
      } finally {
        setLoading(false);
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.errorDescription || 
                          err.response?.data?.error || 
                          err.message || 
                          'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      setIsLoading(false);
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
      
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, 80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 70, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
          className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25"
        />
      </div>

      {/* Show loading while checking auth */}
      {checkingAuth && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Main content */}
      {!checkingAuth && (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/90 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/20 relative overflow-hidden"
        >
          {/* Shine effect on card */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-8"
          >
            <motion.h1
              className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Welcome Back!
            </motion.h1>
            <p className="text-gray-600 mt-2">
              Sign in to continue your skill exchange journey
            </p>
          </motion.div>

          {/* Messages */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 rounded-xl shadow-md"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <FiArrowRight className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">{successMessage}</span>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 rounded-xl shadow-md"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ x: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <FiLock className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-2"
            >
              <label 
                htmlFor="username" 
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FiUser className="w-4 h-4 text-blue-600" />
                Username
              </label>
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.div>

            {/* Password field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-2"
            >
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FiLock className="w-4 h-4 text-indigo-600" />
                Password
              </label>
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="group relative w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <motion.svg
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </motion.svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <FiLogIn className="w-5 h-5" />
                    Sign in
                  </>
                )}
              </span>
              {/* Animated gradient overlay on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </form>

          {/* Sign up link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center gap-1 group"
              >
                Sign up
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="inline-block"
                >
                  <FiArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
      )}
    </div>
  );
};
