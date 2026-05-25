import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Clock, CheckCircle2, User, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI, barberRequestAPI, barberProfileAPI } from '../../services/api';
import BarberRequestForm from '../forms/BarberRequestForm';
import EarningsChart from '../charts/EarningsChart';
import BarberProfileEditor from './BarberProfileEditor';
import ServiceManager from './ServiceManager';
import PortfolioManager from './PortfolioManager';
import BrowseSalons from './BrowseSalons';
import { THEME, CLASSES } from '../../constants/theme';

export default function BarberDashboard() {
  const { user } = useAuth();
  
  // Authentication & Profile
  const [barberProfile, setBarberProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [availableSalons, setAvailableSalons] = useState([]);

  // Queue Management
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('queue');
  const [socket, setSocket] = useState(null);

  // UI State
  const [processingAction, setProcessingAction] = useState(null);

  // Initialize
  useEffect(() => {
    fetchBarberProfile();
    initializeSocket();

    return () => {
      socket?.disconnect();
    };
  }, []);

  // Fetch barber profile
  const fetchBarberProfile = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getBarberProfile();
      setBarberProfile(response.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('notJoined');
        fetchAvailableSalons();
      } else {
        setError('error');
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch available salons
  const fetchAvailableSalons = async () => {
    try {
      const response = await bookingAPI.getAllSalons();
      setAvailableSalons(response.data || []);
    } catch (err) {
      console.error('Failed to fetch salons:', err);
    }
  };

  // Initialize Socket.IO
  const initializeSocket = () => {
    const newSocket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      if (barberProfile) {
        newSocket.emit('joinBarberRoom', { barberId: barberProfile._id });
      }
    });

    newSocket.on('queueUpdated', (data) => {
      console.log('Queue updated:', data);
      if (barberProfile) {
        fetchQueue();
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    setSocket(newSocket);
  };

  // Fetch queue when profile changes
  useEffect(() => {
    if (barberProfile) {
      fetchQueue();
    }
  }, [barberProfile]);

  // Fetch queue data
  const fetchQueue = async () => {
    if (!barberProfile) return;
    try {
      const response = await bookingAPI.getBarberQueue(barberProfile._id);
      setQueue(response.data.queue || []);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
  };

  // Handle call next customer
  const handleCallNext = async () => {
    if (!barberProfile) return;
    setProcessingAction('callNext');
    try {
      await bookingAPI.callNextCustomer(barberProfile._id);
      toast.success('Next customer called!');
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to call next customer');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle complete service
  const handleCompleteService = async () => {
    if (!barberProfile) return;
    setProcessingAction('complete');
    try {
      await bookingAPI.completeService(barberProfile._id, {
        servicePrice: 500
      });
      toast.success('Service completed! ✨');
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete service');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle call via phone
  const handleCallPhone = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  // Handle leave salon
  const handleLeaveSalon = async () => {
    if (!confirm('Are you sure you want to leave this salon? This action cannot be undone.')) {
      return;
    }
    
    setProcessingAction('leave');
    try {
      await barberProfileAPI.leaveSalon();
      toast.success('You have left the salon');
      setBarberProfile(null);
      setActiveTab('join');
      fetchAvailableSalons();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave salon');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle WhatsApp
  const handleWhatsApp = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=Hi, your turn is next at the salon!`, '_blank');
  };

  // Handle join salon
  const handleJoinSalon = async (salonId) => {
    try {
      const response = await bookingAPI.joinSalon(salonId);
      toast.success('Join request submitted! Waiting for salon owner approval.');
      // Refresh available salons list
      await fetchAvailableSalons();
      setShowRequestForm(false);
      setSelectedSalon(null);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to join salon');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${THEME.bg.primary} pt-20`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Not joined state
  if (error === 'notJoined') {
    return (
      <div className={`min-h-screen ${THEME.bg.primary} p-4 pt-20`}>
        <div className="max-w-md mx-auto mt-8">
          <div className={`${CLASSES.cardLg} text-center`}>
            <User className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className={`text-2xl font-bold ${THEME.text.primary} mb-2`}>Join a Salon</h1>
            <p className={`${THEME.text.secondary} mb-6`}>Select a salon to start managing your queue</p>

            {availableSalons.length > 0 ? (
              <div className="space-y-3">
                {availableSalons.map(salon => (
                  <div key={salon._id} className={`${THEME.card} p-4`}>
                    <h3 className={`font-semibold ${THEME.text.primary}`}>{salon.name}</h3>
                    <p className={`text-sm ${THEME.text.muted} mt-1`}>{salon.address}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleJoinSalon(salon._id)}
                        className={`flex-1 ${CLASSES.btnPrimary} min-h-[44px]`}
                      >
                        Join
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSalon(salon);
                          setShowRequestForm(true);
                        }}
                        className={`flex-1 ${CLASSES.btnSecondary} min-h-[44px]`}
                      >
                        Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={THEME.text.muted}>No salons available</p>
            )}
          </div>
        </div>

        {showRequestForm && selectedSalon && (
          <BarberRequestForm
            salonId={selectedSalon._id}
            salonName={selectedSalon.name}
            onSuccess={() => {
              setShowRequestForm(false);
              setSelectedSalon(null);
              toast.success('Request sent! Waiting for approval.');
            }}
          />
        )}
      </div>
    );
  }

  // Main dashboard
  return (
    <div className={`min-h-screen ${THEME.bg.primary} pb-32 pt-20`}>
      {/* Header */}
      <div className={`${THEME.bg.secondary} border-b ${THEME.border.primary} sticky top-16 z-40 shadow-lg`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${THEME.text.primary}`}>{barberProfile?.name}</h1>
            <p className={`${THEME.text.muted} text-sm`}>{barberProfile?.experience} years experience</p>
          </div>
          <button
            onClick={handleLeaveSalon}
            disabled={processingAction === 'leave'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processingAction === 'leave' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Leave Salon</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`${THEME.bg.secondary} border-b ${THEME.border.primary} sticky top-28 z-30`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['queue', 'earnings', 'join', 'profile', 'services', 'portfolio'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-400'
                    : `border-transparent ${THEME.text.muted} hover:${THEME.text.secondary}`
                }`}
              >
                {tab === 'queue' && `Queue (${queue.filter(q => q.status === 'waiting').length})`}
                {tab === 'earnings' && 'Earnings'}
                {tab === 'join' && 'Join Salon'}
                {tab === 'profile' && 'Profile'}
                {tab === 'services' && 'Services'}
                {tab === 'portfolio' && 'Portfolio'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'queue' && (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={CLASSES.card}>
                  <p className={THEME.text.muted}>Today's Customers</p>
                  <p className={`text-3xl font-bold ${THEME.text.accent} mt-2`}>{stats.queue?.length || 0}</p>
                </div>
                <div className={CLASSES.card}>
                  <p className={THEME.text.muted}>In Queue</p>
                  <p className={`text-3xl font-bold text-blue-400 mt-2`}>{stats.totalWaiting || 0}</p>
                </div>
                <div className={CLASSES.card}>
                  <p className={THEME.text.muted}>Est. Total Wait</p>
                  <p className={`text-3xl font-bold text-orange-400 mt-2`}>{(stats.totalWaiting || 0) * 15}m</p>
                </div>
              </div>
            )}

            {/* Current Customer */}
            {queue.find(q => q.status === 'in-progress') ? (
              <div className={`${THEME.gradient.subtle} border-2 border-emerald-500/50 rounded-lg p-6`}>
                <p className={`text-sm font-medium mb-2 text-emerald-400`}>Currently Serving</p>
                {queue.find(q => q.status === 'in-progress') && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xl font-bold ${THEME.text.primary}`}>
                        {queue.find(q => q.status === 'in-progress')?.userId?.name || 'Customer'}
                      </h3>
                      <p className={`text-sm ${THEME.text.secondary} mt-1`}>
                        Service: {queue.find(q => q.status === 'in-progress')?.service}
                      </p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                )}
              </div>
            ) : (
              <div className={`${THEME.card} p-6 text-center`}>
                <p className={THEME.text.muted}>No customer being served currently</p>
              </div>
            )}

            {/* Queue List */}
            {queue.filter(q => q.status === 'waiting').length > 0 ? (
              <div className={CLASSES.cardLg}>
                <h2 className={`font-semibold ${THEME.text.primary} mb-4`}>Waiting Queue</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {queue
                    .filter(q => q.status === 'waiting')
                    .map((customer, idx) => (
                      <div key={customer._id} className={`flex items-center justify-between p-3 ${THEME.bg.secondary} rounded-lg`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold flex-shrink-0">
                            #{customer.position}
                          </span>
                          <div className="min-w-0">
                            <p className={`font-semibold ${THEME.text.primary} truncate`}>{customer.userId?.name}</p>
                            <p className={`text-xs ${THEME.text.muted} truncate`}>{customer.service}</p>
                          </div>
                        </div>
                        <p className={`text-sm ${THEME.text.muted} flex-shrink-0 ml-2`}>{(customer.position - 1) * 15}m</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className={`${THEME.bg.secondary} rounded-lg p-6 text-center border ${THEME.border.accent}`}>
                <AlertCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className={`${THEME.text.secondary} font-medium`}>Queue is empty</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'earnings' && (
          <div>
            <EarningsChart userRole="barber" />
          </div>
        )}

        {activeTab === 'join' && (
          <div>
            <BrowseSalons />
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <BarberProfileEditor />
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <ServiceManager />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div>
            <PortfolioManager />
          </div>
        )}
      </div>

      {/* Fixed Action Panel */}
      <div className={`fixed bottom-0 left-0 right-0 ${THEME.bg.secondary} border-t ${THEME.border.primary} shadow-lg`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3">
          {queue.find(q => q.status === 'in-progress') ? (
            <>
              <button
                onClick={() => handleCallPhone(queue.find(q => q.status === 'in-progress')?.userId?.phone)}
                disabled={processingAction !== null}
                className={`flex-1 ${CLASSES.btnTouch} gap-2 disabled:opacity-50`}
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
              <button
                onClick={() => handleWhatsApp(queue.find(q => q.status === 'in-progress')?.userId?.phone)}
                disabled={processingAction !== null}
                className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={handleCompleteService}
                disabled={processingAction !== null}
                className={`flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {processingAction === 'complete' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleCallNext}
              disabled={processingAction !== null || queue.filter(q => q.status === 'waiting').length === 0}
              className={`w-full ${CLASSES.btnTouch} gap-2 disabled:opacity-50`}
            >
              {processingAction === 'callNext' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Call Next Customer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
