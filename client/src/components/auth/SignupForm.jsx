import React, { useState } from 'react';
import { User, Mail, Lock, Loader2, Scissors, Store } from 'lucide-react';
import AuthInput from './AuthInput';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

export default function SignupForm({ role = 'customer', setLoginTab, onSignup }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '', // For barbers
    salonName: '', // For salon owners
    salonLocation: '', // For salon owners
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate role
    if (!role) {
      setError('Please select a role before signing up');
      return;
    }

    // Validations
    if (!formData.name) return setError('Name is required');
    if (role === 'barber' && !formData.shopName) return setError('Shop name is required (you can join a salon later)');
    if (role === 'salonOwner' && !formData.salonName) return setError('Salon name is required');
    if (role === 'salonOwner' && !formData.salonLocation) return setError('Salon location is required');
    if (!formData.email.includes('@')) return setError('Valid email is required');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');

    setIsLoading(true);
    
    // API Call
    try {
      let response;

      if (role === 'salonOwner') {
        // Salon owner registration with salon creation
        response = await authAPI.registerSalon({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          salonName: formData.salonName,
          salonLocation: formData.salonLocation,
        });
      } else {
        // Regular signup for customer/barber
        response = await authAPI.signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: role
        });
      }
      
      toast.success(response.data?.message || 'Account created successfully!');
      
      // If response includes token and user, auto-login
      if (response.data?.token && response.data?.user && onSignup) {
        onSignup({ token: response.data.token, user: response.data.user });
      } else {
        // Otherwise, switch back to login tab to let user login
        setLoginTab();
      }
      
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Something went wrong';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
           {error}
        </div>
      )}

      <AuthInput
        label="Full Name"
        name="name"
        type="text"
        placeholder="John Doe"
        icon={User}
        value={formData.name}
        onChange={handleChange}
      />

      {role === 'barber' && (
        <AuthInput
          label="Shop Name"
          name="shopName"
          type="text"
          placeholder="QueueFlow Barber Shop"
          icon={Scissors}
          value={formData.shopName}
          onChange={handleChange}
        />
      )}

      {role === 'salonOwner' && (
        <>
          <AuthInput
            label="Salon Name"
            name="salonName"
            type="text"
            placeholder="Premium Hair Salon"
            icon={Store}
            value={formData.salonName}
            onChange={handleChange}
          />
          <AuthInput
            label="Salon Location"
            name="salonLocation"
            type="text"
            placeholder="123 Main St, New York, NY 10001"
            icon={Store}
            value={formData.salonLocation}
            onChange={handleChange}
          />
        </>
      )}

      <AuthInput
        label="Email Address"
        name="email"
        type="email"
        placeholder="john@example.com"
        icon={Mail}
        value={formData.email}
        onChange={handleChange}
      />

      <AuthInput
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        icon={Lock}
        value={formData.password}
        onChange={handleChange}
      />

      <AuthInput
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        placeholder="••••••••"
        icon={Lock}
        value={formData.confirmPassword}
        onChange={handleChange}
      />

      <button
        type="submit"
        disabled={isLoading || !role}
        className="w-full py-3.5 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center border border-white/10"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          `Create ${(role || 'customer').charAt(0).toUpperCase() + (role || 'customer').slice(1)} Account`
        )}
      </button>

      <p className="text-xs text-center text-slate-500 mt-2">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
