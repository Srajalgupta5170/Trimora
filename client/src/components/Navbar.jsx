import { LogOut, Scissors, Home, User, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 z-50 px-4 md:px-6 flex items-center justify-between">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Scissors className="text-white w-5 h-5" />
        </div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-white hidden sm:block">Trimora</h1>
      </Link>

      {/* Center Navigation - Desktop */}
      <div className="hidden md:flex items-center gap-1">
        <Link to="/">
          <motion.div
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              isActive('/')
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Browse</span>
          </motion.div>
        </Link>

        <Link to="/dashboard">
          <motion.div
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              isActive('/dashboard')
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">
              {user?.role === 'barber' ? 'My Queue' : 'Dashboard'}
            </span>
          </motion.div>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-slate-300 truncate max-w-xs">
            {user?.name || 'User'}
          </span>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg min-h-[44px] flex items-center justify-center"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg min-h-[44px] flex items-center justify-center"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-white/10 p-4 md:hidden space-y-2"
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2 rounded-lg transition-all ${
              isActive('/')
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            Browse
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2 rounded-lg transition-all ${
              isActive('/dashboard')
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            {user?.role === 'barber' ? 'My Queue' : 'Dashboard'}
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
