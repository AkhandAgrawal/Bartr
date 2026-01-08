import { Outlet, Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NotificationBell } from './NotificationBell';

export const Layout = () => {
  const auth = useAuth();
  const { user, clearUser } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    clearUser();
    // Clear tokens from localStorage
    authService.clearTokens();
    
    // If using react-oidc-context, sign out from there too
    if (auth.isAuthenticated) {
      // Sign out from OIDC and redirect to login
      auth.signoutRedirect({ 
        post_logout_redirect_uri: window.location.origin + '/login' 
      }).catch(() => {
        // If signoutRedirect fails, just redirect to login
        window.location.replace('/login');
      });
    } else {
      // Otherwise just redirect to login (not landing page)
      window.location.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to={auth.isAuthenticated || authService.isAuthenticated() ? "/dashboard" : "/"} className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Bartr
              </Link>
              <div className="hidden md:flex ml-10 space-x-1">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-cyan-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/matches"
                  className="text-gray-700 hover:text-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-cyan-50"
                >
                  Find Matches
                </Link>
                <Link
                  to="/past-matches"
                  className="text-gray-700 hover:text-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-cyan-50"
                >
                  Matches
                </Link>
                <Link
                  to="/chats"
                  className="text-gray-700 hover:text-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-cyan-50"
                >
                  Chats
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-11 w-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 flex items-center justify-center border-2 border-white">
                    {user?.firstName?.[0] || auth.user?.profile?.name?.[0] || 'U'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-lg border border-gray-200 shadow-xl" align="end" forceMount>
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold`}>
                      {user?.firstName?.[0] || auth.user?.profile?.name?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col space-y-0.5 leading-none flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : auth.user?.profile?.name || 'User'}
                      </p>
                      <p className="w-full truncate text-sm text-gray-500">
                        {user?.email || auth.user?.profile?.email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="p-1">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link to="/profile" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowMenu(!showMenu)}
              >
                {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {showMenu && (
            <div className="md:hidden pb-4">
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md"
                onClick={() => setShowMenu(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/matches"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md"
                onClick={() => setShowMenu(false)}
              >
                Find Matches
              </Link>
              <Link
                to="/past-matches"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md"
                onClick={() => setShowMenu(false)}
              >
                Matches
              </Link>
              <Link
                to="/chats"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md"
                onClick={() => setShowMenu(false)}
              >
                Chats
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
