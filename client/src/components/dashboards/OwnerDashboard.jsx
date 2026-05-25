import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Building2 } from 'lucide-react';
import { bookingAPI } from '../../services/api';
import { toast } from 'sonner';
import SalonMediaManager from './SalonMediaManager';
import JoinRequestsManager from './JoinRequestsManager';

export default function OwnerDashboard({ user }) {
  const [salons, setSalons] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [salonStats, setSalonStats] = useState(null);
  const [queuesByBarber, setQueuesByBarber] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOwnedSalons();
  }, []);

  const fetchOwnedSalons = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token found');
        return;
      }
      
      console.log('📤 Fetching owned salons...');
      const response = await bookingAPI.getMySalons();

      console.log('✅ Salons fetched:', response.data);
      setSalons(response.data);
      
      if (response.data.length > 0) {
        await handleSelectSalon(response.data[0]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch salons:', err.response?.data || err.message);
      toast.error('Failed to load salons: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSalon = async (salon) => {
    try {
      setSelectedSalon(salon);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token found');
        return;
      }

      // Fetch salon stats
      console.log('📤 Fetching stats for salon:', salon._id);
      const statsRes = await bookingAPI.getSalonStats(salon._id);
      console.log('✅ Salon stats:', statsRes.data);
      setSalonStats(statsRes.data);

      // Fetch queues by barber
      const queuesRes = await bookingAPI.getSalonQueues(salon._id);
      console.log('✅ Barber queues:', queuesRes.data);
      setQueuesByBarber(queuesRes.data.queuesByBarber || []);
    } catch (err) {
      console.error('❌ Failed to fetch salon details:', err.response?.data || err.message);
      toast.error('Failed to load salon details: ' + (err.response?.data?.message || err.message));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 w-full">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
      </div>

      <main className="relative z-10 pt-28 pb-12 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Salon Owner Dashboard</h1>
          <p className="text-slate-400">Manage your salons and track performance</p>
        </div>

        {salons.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">No salons found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Salon List */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Your Salons</h3>
              <div className="space-y-3">
                {salons.map((salon) => (
                  <button
                    key={salon._id}
                    onClick={() => handleSelectSalon(salon)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedSalon?._id === salon._id
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                        : 'bg-slate-900/50 border-white/5 text-slate-300 hover:border-white/10'
                    }`}
                  >
                    <p className="font-semibold text-sm">{salon?.name || 'Unnamed Salon'}</p>
                    <p className="text-xs mt-1 opacity-70">{salon?.address || 'Address not available'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            {selectedSalon && (
              <div className="lg:col-span-3">
                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b border-white/10">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 font-medium border-b-2 transition ${
                      activeTab === 'overview'
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('join-requests')}
                    className={`px-4 py-3 font-medium border-b-2 transition ${
                      activeTab === 'join-requests'
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Join Requests
                  </button>
                  <button
                    onClick={() => setActiveTab('media')}
                    className={`px-4 py-3 font-medium border-b-2 transition ${
                      activeTab === 'media'
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Media & Branding
                  </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                <div>
                {/* Stats Cards */}
                {salonStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 text-sm">Today's Served</p>
                        <Users className="w-5 h-5 text-indigo-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{salonStats?.today?.totalServed || 0}</p>
                      <p className="text-xs text-slate-500 mt-2">{salonStats?.today?.totalCustomers || 0} total</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 text-sm">Active Queues</p>
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{salonStats?.today?.activeQueues || 0}</p>
                      <p className="text-xs text-slate-500 mt-2">Barbers busy</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 text-sm">Team Size</p>
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{salonStats?.barbers || 0}</p>
                      <p className="text-xs text-slate-500 mt-2">Total barbers</p>
                    </div>
                  </div>
                )}

                {/* Barber Queues */}
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-white/10 rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Barbers & Queues</h2>

                  {(queuesByBarber && queuesByBarber.length > 0) ? (
                    <div className="space-y-6">
                      {queuesByBarber.map((barberQueue) => (
                        <div
                          key={barberQueue?.barberId || Math.random()}
                          className="bg-slate-900/30 border border-white/5 rounded-lg p-6"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{barberQueue?.barberName || 'Unknown Barber'}</h3>
                            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold">
                              {(barberQueue?.waiting || []).length} waiting
                            </span>
                          </div>

                          {/* Current Customer */}
                          {(barberQueue?.inProgress || []).length > 0 ? (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <p className="text-xs text-green-400 font-semibold mb-1">NOW SERVING</p>
                              <p className="text-sm text-white font-semibold">
                                {barberQueue?.inProgress[0]?.userId?.name || 'Customer'}
                              </p>
                            </div>
                          ) : (
                            <div className="mb-4 p-3 bg-slate-700/20 border border-slate-600/30 rounded-lg">
                              <p className="text-xs text-slate-400">Waiting for next customer</p>
                            </div>
                          )}

                          {/* Waiting Queue */}
                          {(barberQueue?.waiting || []).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(barberQueue.waiting || []).slice(0, 5).map((customer, idx) => (
                                <div
                                  key={customer?._id || idx}
                                  className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2"
                                >
                                  <p className="text-xs text-slate-300">
                                    <span className="font-bold text-indigo-400">#{customer?.position || idx + 1}</span>{' '}
                                    {customer?.userId?.name || 'Customer'}
                                  </p>
                                </div>
                              ))}
                              {(barberQueue?.waiting || []).length > 5 && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2">
                                  <p className="text-xs text-slate-400">
                                    +{(barberQueue.waiting || []).length - 5} more
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No one waiting</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No barbers or active queues</p>
                    </div>
                  )}
                </div>
                </div>
                )}

                {/* Join Requests Tab */}
                {activeTab === 'join-requests' && (
                  <div>
                    <JoinRequestsManager />
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                  <div>
                    <SalonMediaManager />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
