import React from 'react';
import { User, Scissors, Store } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export default function RoleToggle({ role, setRole }) {
  const roles = [
    { id: 'customer', label: 'Customer', icon: User, color: 'indigo' },
    { id: 'barber', label: 'Barber', icon: Scissors, color: 'purple' },
    { id: 'salonOwner', label: 'Salon Owner', icon: Store, color: 'amber' },
  ];

  return (
    <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md mb-8 gap-1">
      {roles.map(({ id, label, icon: Icon, color }) => (
        <button
          key={id}
          onClick={() => setRole(id)}
          className={twMerge(
            clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden",
              role === id 
                ? "text-white shadow-lg bg-white/10 border border-white/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )
          )}
        >
          <Icon className={clsx("w-4 h-4", role === id ? `text-${color}-400` : "")} />
          {label}
        </button>
      ))}
    </div>
  );
}
