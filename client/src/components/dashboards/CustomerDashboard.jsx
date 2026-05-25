import { useState, useEffect } from 'react';
import { MapPin, Search, ArrowRight, Clock } from 'lucide-react';
import { bookingAPI } from '../../services/api';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

export default function CustomerDashboard({ user }) {
  const [step, setStep] = useState('selectSalon'); // selectSalon -> selectBarber -> viewQueue
  const [salons, setSalons] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [queue, setQueue] = useState([]);
  const [myQueuePosition, setMyQueuePosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all salons
  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setIsLoading(true);
      console.log('📤 Fetching all salons...');
      const response = await bookingAPI.getAllSalons();
      console.log('✅ Salons fetched:', response.data);
      setSalons(response.data);
    } catch (err) {
      console.error('❌ Failed to fetch salons:', err.response?.data || err.message);
      toast.error('Failed to load salons: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSalon = async (salon) => {
    try {
      setIsLoading(true);
      setSelectedSalon(salon);
      
      // Fetch barbers for this salon
      const response = await bookingAPI.getSalonBarbers(salon._id);
      console.log('✅ Barbers fetched:', response.data);
      setBarbers(response.data);
      
      setStep('selectBarber');
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Failed to fetch barbers:', err.response?.data || err.message);
      toast.error('Failed to load barbers: ' + (err.response?.data?.message || err.message));
      setIsLoading(false);
    }
  };

  const handleSelectBarber = async (barber) => {
    try {
      setIsLoading(true);
      setSelectedBarber(barber);
      
      // Fetch queue for this barber
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      const response = await bookingAPI.getPublicBarberQueue(barber._id);

      console.log('✅ Queue fetched:', response.data);

      // The public endpoint returns: { barberId, queueLength, totalWaiting, currentServing }
      setQueue({
        length: response.data.queueLength,
        totalWaiting: response.data.totalWaiting,
        currentServing: response.data.currentServing
      });
      
      setMyQueuePosition(null); // Reset position since we don't have full queue data

      setStep('viewQueue');
      
      // Setup Socket.IO for real-time updates
      const socket = io('http://localhost:5000');
      
      // Join queue watcher room
      socket.emit('watchBarberQueue', { barberId: barber._id });
      console.log('📡 Socket.IO: Watching barber queue', barber._id);

      // Join user room for personal notifications
      socket.emit('joinUserRoom', { userId: user.id });
      console.log('📡 Socket.IO: Joined user room', user.id);
      
      // Listen for queue updates
      socket.on('queueUpdated', (data) => {
        console.log('📡 Queue updated event:', data);
        if (data.barberId === barber._id) {
          // Refetch queue
          bookingAPI.getPublicBarberQueue(barber._id).then(res => {
            setQueue({
              length: res.data.queueLength,
              totalWaiting: res.data.totalWaiting,
              currentServing: res.data.currentServing
            });
          });
        }
      });

      // 🔔 FEATURE 2: Listen for "You are next!" notification
      socket.on('yourTurn', (data) => {
        console.log('🔔 Your turn notification:', data);
        
        // Show toast notification
        toast.success('🔔 ' + data.message, {
          duration: 5000,
          description: `Barber: ${data.barberName}`
        });

        // Request browser notification permission if not already granted
        if (Notification.permission === 'granted') {
          new Notification('Queue Alert! 🔔', {
            body: data.message,
            icon: '/favicon.svg',
            tag: 'queue-notification',
            requireInteraction: true
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification('Queue Alert! 🔔', {
                body: data.message,
                icon: '/favicon.svg',
                tag: 'queue-notification',
                requireInteraction: true
              });
            }
          });
        }

        // Optional: Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
          console.log('Notification sound not available');
        }
      });

      return () => {
        socket.emit('leaveQueueRoom', { barberId: barber._id });
        socket.emit('leaveUserRoom', { userId: user.id });
        socket.disconnect();
      };
    } catch (err) {
      console.error('❌ Failed to fetch queue:', err.response?.data || err.message);
      toast.error('Failed to load queue: ' + (err.response?.data?.message || err.message));
      setIsLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!selectedBarber) {
      toast.error('No barber selected');
      return;
    }

    if (!selectedSalon) {
      toast.error('No salon selected');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      console.log('📤 Joining queue - Salon:', selectedSalon._id, 'Barber:', selectedBarber._id);
      const response = await bookingAPI.joinQueue({ 
        salonId: selectedSalon._id,
        barberId: selectedBarber._id,
        service: 'Haircut' 
      });
      
      console.log('✅ Successfully joined queue:', response.data);
      toast.success('✅ Joined the queue! Refreshing...');
      
      // Refresh queue data
      await handleSelectBarber(selectedBarber);
    } catch (err) {
      console.error('❌ Failed to join queue:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to join queue');
    }
  };

  const handleBackToSalons = () => {
    setStep('selectSalon');
    setSelectedSalon(null);
    setSelectedBarber(null);
    setBarbers([]);
    setQueue([]);
  };

  const handleBackToBarbers = () => {
    setStep('selectBarber');
    setSelectedBarber(null);
    setQueue([]);
  };

  const filteredSalons = salons.filter(salon =>
    (salon?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (salon?.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // STEP 1: SELECT SALON
  if (step === 'selectSalon') {
    return (
      <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 w-full">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        </div>

        <main className="relative z-10 pt-20 md:pt-28 pb-12 px-4 md:px-6 max-w-6xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Find Your Barber</h1>
            <p className="text-sm md:text-base text-slate-400">Browse salons and book your appointment</p>
          </div>

          {/* Search Bar - Mobile First */}
          <div className="mb-6 md:mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search salons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 md:py-4 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Salons Grid - Mobile First */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-56 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredSalons.length > 0 ? (
                filteredSalons.map((salon) => (
                  <div
                    key={salon._id}
                    onClick={() => handleSelectSalon(salon)}
                    className="group bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-white/5 hover:border-indigo-500/30 rounded-xl p-4 md:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {salon?.name || 'Unnamed Salon'}
                      </h3>
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs md:text-sm line-clamp-1">{salon?.address || 'Address not available'}</span>
                    </div>

                    <div className="text-sm text-slate-500">
                      {salon?.barbers?.length || 0} barbers available
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400 text-lg">No salons found matching your search</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // STEP 2: SELECT BARBER
  if (step === 'selectBarber' && selectedSalon) {
    return (
      <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 w-full pb-20 md:pb-0">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        </div>

        <main className="relative z-10 pt-20 md:pt-28 pb-12 px-4 md:px-6 max-w-6xl mx-auto">
          <button
            onClick={handleBackToSalons}
            className="mb-6 text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors text-sm md:text-base"
          >
            ← Back to Salons
          </button>

          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Choose Your Barber</h1>
            <p className="text-sm md:text-base text-slate-400">{selectedSalon?.name || 'Salon'} • {selectedSalon?.address || 'Unknown location'}</p>
          </div>

          {/* Barbers Grid - Mobile First */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {barbers.length > 0 ? (
                barbers.map((barber) => (
                  <div
                    key={barber._id}
                    onClick={() => handleSelectBarber(barber)}
                    className="group bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-white/5 hover:border-purple-500/30 rounded-xl p-4 md:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                        {barber?.name || 'Barber'}
                      </h3>
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>

                    <div className="mb-4">
                      <div className="text-xs md:text-sm text-slate-400 mb-2">Specializations:</div>
                      <div className="flex flex-wrap gap-2">
                        {(barber?.specializations || []).length > 0 ? (
                          (barber.specializations || []).slice(0, 3).map((spec, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-purple-500/20 text-purple-300 px-2 md:px-3 py-1 rounded-full border border-purple-500/30"
                            >
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No specializations listed</span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {barber?.currentQueueCount || 0} people waiting
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400 text-lg">No barbers available in this salon</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // STEP 3: VIEW QUEUE & JOIN
  if (step === 'viewQueue' && selectedBarber) {
    return (
      <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 w-full pb-40 md:pb-0">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        </div>

        <main className="relative z-10 pt-20 md:pt-28 pb-12 px-4 md:px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left: Queue List - Mobile First */}
          <div className="lg:col-span-2">
            <button
              onClick={handleBackToBarbers}
              className="mb-6 text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors text-sm md:text-base"
            >
              ← Back to Barbers
            </button>

            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-white/10 rounded-2xl p-4 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{selectedBarber?.name || 'Barber'}</h2>
                  <p className="text-slate-400 mt-1 text-sm md:text-base">{selectedSalon?.name || 'Salon'}</p>
                </div>
                <div className="text-right bg-slate-900/50 border border-white/5 rounded-lg p-3 md:p-4 w-full md:w-auto">
                  <div className="text-xs md:text-sm text-slate-400">Est. Wait Time</div>
                  <div className="text-xl md:text-2xl font-bold text-indigo-400">
                    {(queue?.length || 0) * 15} mins
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-white/10 rounded-lg p-4 md:p-6">
                <div className="grid grid-cols-3 gap-3 md:gap-4 text-center">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 md:p-4">
                    <p className="text-2xl md:text-3xl font-bold text-indigo-400">{queue?.totalWaiting || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">People Waiting</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <p className="text-3xl font-bold text-amber-400">{queue?.currentServing || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Being Served</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-3xl font-bold text-purple-400">{queue?.length || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Total in Queue</p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  {(queue?.length || 0) === 0 ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <p className="text-green-400 font-semibold">✨ Queue is empty!</p>
                      <p className="text-sm text-green-300 mt-1">Be the first to join</p>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">
                      <p>Average wait time: <span className="text-indigo-400 font-semibold">{(queue?.length || 0) * 15} minutes</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Join Panel - Fixed Bottom on Mobile */}
          <div className="fixed bottom-0 left-0 right-0 md:fixed md:bottom-auto md:left-auto md:right-auto md:relative lg:sticky lg:top-28 lg:col-span-1 bg-slate-950/95 lg:bg-transparent border-t md:border-t-0 lg:border-t-0 border-white/10 p-4 md:p-4 lg:p-0 md:bg-gradient-to-br md:from-slate-900/50 md:to-slate-800/30 md:border md:border-white/10 md:rounded-2xl md:p-8 lg:bg-gradient-to-br lg:from-slate-900/50 lg:to-slate-800/30 lg:border lg:border-white/10 lg:rounded-2xl lg:p-8">
            <div className="max-w-2xl mx-auto lg:max-w-none">
              {/* Mobile Info - Show on mobile below main content */}
              <div className="md:hidden mb-4 space-y-2 text-xs pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">📍</span>
                  <p className="text-white text-xs truncate">{selectedSalon?.address || 'Address'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">💇</span>
                  <p className="text-white text-xs truncate">{selectedBarber?.name || 'Barber'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">⏱️</span>
                  <p className="text-white text-xs">{(queue?.length || 0) * 15} mins wait</p>
                </div>
              </div>

              {/* Join Button - Always visible */}
              {myQueuePosition ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-400 font-semibold text-center">
                    ✅ You're in the queue!
                  </p>
                  <p className="text-center text-sm text-green-300 mt-2">
                    Position #{myQueuePosition}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleJoinQueue}
                  className="w-full py-4 md:py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-base md:text-sm"
                >
                  🔔 Join Queue Now
                </button>
              )}

              {/* Desktop Info - Hide on mobile */}
              <div className="hidden md:block space-y-3 text-sm mt-6">
                <div className="flex items-start gap-3">
                  <span className="text-indigo-400 font-bold text-lg">📍</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedSalon?.address || 'Address not available'}</p>
                    <p className="text-xs text-slate-500">Exact location</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold text-lg">💇</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedBarber?.name || 'Barber'}</p>
                    <p className="text-xs text-slate-500">Your barber</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 font-bold text-lg">⏱️</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{(queue?.length || 0) * 15} minutes</p>
                    <p className="text-xs text-slate-500">Estimated wait</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
