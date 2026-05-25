import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

const AuthInput = forwardRef(({ label, error, icon: Icon, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-300 ml-1">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              "w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-sm shadow-inner",
              Icon && "pl-11",
              error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
            )
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs font-medium text-red-400 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
});

AuthInput.displayName = 'AuthInput';

export default AuthInput;
