import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import AuthInput from './AuthInput';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

export default function LoginForm({ role = 'customer', onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate role is set
    if (!role) {
      setError('Please select a role before logging in');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.login({
        email,
        password,
      });

      const { token, user } = response.data;

      const userRole = user?.role;

      if (!userRole) {
        throw new Error('Invalid response: user role not found');
      }
      
      // Ensure the role they are logging in as matches what the database says they are
      if (userRole !== role) {
        throw new Error(`Account exists, but it is registered as a ${userRole}, not a ${role}.`);
      }
      
      // Pass data up to App.jsx handler
      onLogin({ token, user });
      
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {error}
        </div>
      )}

      <AuthInput
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        icon={Mail}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <AuthInput
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-between items-center mt-1 px-1">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
            <input type="checkbox" className="rounded border-slate-700 bg-slate-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900" />
            Remember me
          </label>
          <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Forgot password?
          </a>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !role}
        className="w-full py-3.5 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center border border-white/10"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          `Login as ${(role || 'customer').charAt(0).toUpperCase() + (role || 'customer').slice(1)}`
        )}
      </button>
    </form>
  );
}
