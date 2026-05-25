import React, { useState, useEffect } from 'react';
import { MapPin, Users, Star, Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api, { joinRequestAPI } from '../../services/api';

export default function BrowseSalons() {
  const [salons, setSalons] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [formData, setFormData] = useState({
    experience: 0,
    basePrice: 150,
    bio: '',
    specializations: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get available salons
      const salonsRes = await api.get('/auth/available-salons');
      setSalons(salonsRes.data.salons || salonsRes.data);

      // Get my requests
      const requestsRes = await joinRequestAPI.getMyRequests();
      setMyRequests(requestsRes.data.requests || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load salons');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (salonId) => {
    setSubmitting((prev) => ({ ...prev, [salonId]: true }));
    try {
      await joinRequestAPI.requestJoinSalon({
        salonId,
        experience: formData.experience,
        basePrice: formData.basePrice,
        bio: formData.bio,
        specializations: formData.specializations
      });
      toast.success('Join request sent!');
      setSelectedSalon(null);
      setFormData({ experience: 0, basePrice: 150, bio: '', specializations: [] });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(errorMsg);
      console.error('Error requesting join:', error);
    } finally {
      setSubmitting((prev) => ({ ...prev, [salonId]: false }));
    }
  };

  const getRequestStatus = (salonId) => {
    const request = myRequests.find((r) => r.salonId === salonId);
    if (!request) return null;
    return request.status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Requests Section */}
      {myRequests.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4">My Join Requests</h3>
          <div className="space-y-3">
            {myRequests.map((req) => (
              <div
                key={req._id}
                className="flex items-center justify-between bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
              >
                <div>
                  <p className="text-white font-medium">{req.salonName}</p>
                  <p className="text-slate-400 text-sm">
                    Status:{' '}
                    <span
                      className={`font-semibold ${
                        req.status === 'pending'
                          ? 'text-yellow-400'
                          : req.status === 'accepted'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                {req.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSubmitting((prev) => ({ ...prev, [req._id]: true }));
                      joinRequestAPI.cancelRequest(req._id).then(() => {
                        toast.success('Request cancelled');
                        fetchData();
                      }).finally(() => {
                        setSubmitting((prev) => ({ ...prev, [req._id]: false }));
                      });
                    }}
                    disabled={submitting[req._id]}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Salons */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Available Salons</h3>
        {salons.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No salons available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salons.map((salon) => {
              const requestStatus = getRequestStatus(salon._id);
              const canRequest = !requestStatus && !salon.barbers?.length;

              return (
                <div
                  key={salon._id}
                  className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/50 transition"
                >
                  {/* Salon Header */}
                  <div className="mb-3">
                    <h4 className="text-white font-semibold text-lg">{salon.name}</h4>
                    <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{salon.address}</span>
                    </div>
                  </div>

                  {/* Barbers Count */}
                  <div className="flex items-center gap-1 text-slate-400 text-sm mb-4">
                    <Users className="w-4 h-4" />
                    <span>{salon.barbers?.length || 0} barbers</span>
                  </div>

                  {/* Status Badge */}
                  {requestStatus && (
                    <div
                      className={`text-sm font-semibold py-1 px-2 rounded text-center mb-3 ${
                        requestStatus === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : requestStatus === 'accepted'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {requestStatus === 'pending'
                        ? '⏳ Pending'
                        : requestStatus === 'accepted'
                        ? '✅ Accepted'
                        : '❌ Rejected'}
                    </div>
                  )}

                  {/* Action Button */}
                  {!requestStatus ? (
                    <button
                      onClick={() => setSelectedSalon(salon._id)}
                      disabled={submitting[salon._id]}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      {submitting[salon._id] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Request to Join
                        </>
                      )}
                    </button>
                  ) : requestStatus === 'accepted' ? (
                    <button disabled className="w-full bg-green-600/30 text-green-300 py-2 px-3 rounded-lg font-semibold">
                      ✅ Joined
                    </button>
                  ) : (
                    <button disabled className="w-full bg-red-600/30 text-red-300 py-2 px-3 rounded-lg font-semibold">
                      ❌ Rejected
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Join Request Modal */}
      {selectedSalon && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">Request to Join Salon</h3>

            {/* Experience */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Experience (years)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Base Price ($)
              </label>
              <input
                type="number"
                min="0"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: parseInt(e.target.value) || 150 })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">Specializations</label>
              <div className="space-y-2">
                {['Hair Cutting', 'Beard Grooming', 'Hair Styling', 'Hair Coloring', 'Head Massage', 'Shaving', 'Moisturizing', 'Perming'].map((spec) => (
                  <label key={spec} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(spec)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            specializations: [...formData.specializations, spec]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            specializations: formData.specializations.filter((s) => s !== spec)
                          });
                        }
                      }}
                      className="rounded border-slate-600"
                    />
                    <span className="text-slate-300 text-sm">{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none h-24 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setSelectedSalon(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestJoin(selectedSalon)}
                disabled={submitting[selectedSalon]}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {submitting[selectedSalon] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
