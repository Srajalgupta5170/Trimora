import React, { useState } from 'react';
import { BarChart3, Users, TrendingUp, Image } from 'lucide-react';
import PendingRequestsList from '../lists/PendingRequestsList';
import EarningsChart from '../charts/EarningsChart';
import SalonGallery from '../gallery/SalonGallery';

export default function SalonOwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'requests', label: 'Barber Requests', icon: Users },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp },
    { id: 'gallery', label: 'Gallery', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-20 selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Salon Owner Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your salon, barbers, and earnings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 sticky top-[100px] z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-400 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6 hover:border-indigo-500/30 transition-colors">
                <p className="text-sm text-slate-400 font-medium">Active Barbers</p>
                <p className="text-3xl font-bold text-white mt-2">-</p>
                <p className="text-xs text-slate-500 mt-2">Click to view details</p>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6 hover:border-yellow-500/30 transition-colors">
                <p className="text-sm text-slate-400 font-medium">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">-</p>
                <p className="text-xs text-slate-500 mt-2">Awaiting approval</p>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6 hover:border-emerald-500/30 transition-colors">
                <p className="text-sm text-slate-400 font-medium">This Month</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2">₹-</p>
                <p className="text-xs text-slate-500 mt-2">Total earnings</p>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('requests')}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-lg p-4 text-left transition transform hover:-translate-y-0.5"
                >
                  <p className="font-semibold text-indigo-300">View Barber Requests</p>
                  <p className="text-sm text-indigo-400/70 mt-1">Review and approve new barbers</p>
                </button>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded-lg p-4 text-left transition transform hover:-translate-y-0.5"
                >
                  <p className="font-semibold text-purple-300">Update Gallery</p>
                  <p className="text-sm text-purple-400/70 mt-1">Add and manage salon images</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barber Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-4">
              <h2 className="text-xl font-bold text-white mb-1">Barber Requests</h2>
              <p className="text-sm text-slate-400">Review and manage barber join requests</p>
            </div>
            <PendingRequestsList refreshTrigger={refreshTrigger} />
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-4">
              <h2 className="text-xl font-bold text-white mb-1">Earnings & Analytics</h2>
              <p className="text-sm text-slate-400">Track revenue and barber performance</p>
            </div>
            <EarningsChart userRole="salonOwner" />
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-4">
              <h2 className="text-xl font-bold text-white mb-1">Salon Gallery</h2>
              <p className="text-sm text-slate-400">Upload and manage your salon images</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
              <SalonGallery
                salonId={localStorage.getItem('userSalonId')}
                isOwner={true}
                onImageUpload={() => setRefreshTrigger(r => r + 1)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
