import React, { useState } from 'react';
import RoleToggle from '../components/auth/RoleToggle';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import { Scissors } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

export default function AuthPage({ onAuthenticate }) {
  const [role, setRole] = useState('customer'); // 'customer' | 'barber'
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup

  const handleAuthSuccess = (data) => {
    toast.success("Successfully logged in!");
    onAuthenticate(data);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* 🚀 LEFT SIDE - BRAND PANEL (Hidden on very small mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-950 border-r border-white/5 overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-1/4 -left-32 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[128px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[20rem] h-[20rem] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
              <Scissors className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Timora</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-6 leading-tight">
            Skip the wait.<br />Join the flow.
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed mb-12">
            Timora is your smart queue management system. Browse salons, book appointments, and skip the wait. Join the flow today.
          </p>

          <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5 backdrop-blur-md max-w-md shadow-2xl">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex flex-shrink-0 items-center justify-center text-xs font-bold shadow-sm z-10">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-white">Trusted by locals</div>
              <div className="text-slate-400">Join thousands avoiding the queue.</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © 2026 Timora App. All rights reserved.
        </div>
      </div>


      {/* 🔐 RIGHT SIDE - AUTH PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative w-full lg:w-1/2">
        {/* Mobile-only background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 lg:hidden blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md z-10">
          
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Scissors className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Timora</h1>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.3)] ring-1 ring-white/5">
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-400 font-medium">
                {isLogin 
                  ? 'Enter your details to access your account.' 
                  : 'Start managing your time beautifully today.'}
              </p>
            </div>

            <RoleToggle role={role} setRole={setRole} />

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-800 mb-8 px-2 relative">
              <button
                onClick={() => setIsLogin(true)}
                className={twMerge(clsx(
                  "pb-4 text-sm font-semibold transition-colors relative",
                  isLogin ? "text-white" : "text-slate-500 hover:text-slate-300"
                ))}
              >
                Log In
                {isLogin && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)] animate-in fade-in" />
                )}
              </button>

              <button
                onClick={() => setIsLogin(false)}
                className={twMerge(clsx(
                  "pb-4 text-sm font-semibold transition-colors relative",
                  !isLogin ? "text-white" : "text-slate-500 hover:text-slate-300"
                ))}
              >
                Sign Up
                {!isLogin && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500 rounded-t-full shadow-[0_-2px_10px_rgba(168,85,247,0.5)] animate-in fade-in" />
                )}
              </button>
            </div>

            {/* Render Form */}
            <div className="min-h-[300px]">
              {isLogin ? (
              <LoginForm role={role} onLogin={handleAuthSuccess} />
            ) : (
              <SignupForm role={role} onSignup={handleAuthSuccess} setLoginTab={() => setIsLogin(true)} />
            )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Just for the dummy faces in the brand panel
function User({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
