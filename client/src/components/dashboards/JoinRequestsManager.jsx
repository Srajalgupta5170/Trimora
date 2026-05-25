import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { joinRequestAPI, barberProfileAPI } from '../../services/api';

export default function JoinRequestsManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filter, setFilter] = useState('pending'); // pending, accepted, rejected, all

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await joinRequestAPI.getPendingRequests();
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setProcessing((prev) => ({ ...prev, [requestId]: true }));
    try {
      await joinRequestAPI.acceptRequest(requestId);
      toast.success('Request accepted! Barber profile created.');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId) => {
    setProcessing((prev) => ({ ...prev, [requestId]: true }));
    try {
      await joinRequestAPI.rejectRequest(requestId);
      toast.success('Request rejected.');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRemoveBarber = async (barberId, barberName) => {
    if (!confirm(`Are you sure you want to remove ${barberName} from your salon? This action cannot be undone.`)) {
      return;
    }

    setProcessing((prev) => ({ ...prev, [barberId]: true }));
    try {
      await barberProfileAPI.removeBarber(barberId);
      toast.success(`${barberName} has been removed from your salon`);
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [barberId]: false }));
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const acceptedCount = requests.filter((r) => r.status === 'accepted').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-500/30" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Accepted</p>
              <p className="text-3xl font-bold text-green-400">{acceptedCount}</p>
            </div>
            <Check className="w-10 h-10 text-green-500/30" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-400">{rejectedCount}</p>
            </div>
            <X className="w-10 h-10 text-red-500/30" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {[
          { value: 'pending', label: 'Pending', color: 'text-yellow-400' },
          { value: 'accepted', label: 'Accepted', color: 'text-green-400' },
          { value: 'rejected', label: 'Rejected', color: 'text-red-400' },
          { value: 'all', label: 'All', color: 'text-purple-400' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              filter === tab.value
                ? `border-${tab.color.split('-')[1]}-400 ${tab.color}`
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8 backdrop-blur-xl text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {filter === 'pending'
                ? 'No pending requests at the moment'
                : `No ${filter} requests`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-700/60 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{request.barberName}</h4>
                  <p className="text-slate-400 text-sm">{request.barberEmail}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    request.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : request.status === 'accepted'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {request.status === 'pending'
                    ? '⏳ Pending'
                    : request.status === 'accepted'
                    ? '✅ Accepted'
                    : '❌ Rejected'}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Experience</p>
                  <p className="text-white font-semibold">{request.experience} years</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Base Price</p>
                  <p className="text-white font-semibold">${request.basePrice}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Specializations</p>
                  <p className="text-white font-semibold">
                    {request.specializations?.length || 0} services
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Requested</p>
                  <p className="text-white font-semibold">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {request.bio && (
                <div className="mb-4 bg-slate-800/20 border border-slate-700/30 rounded-lg p-3">
                  <p className="text-slate-400 text-sm font-medium mb-1">Bio</p>
                  <p className="text-slate-300">{request.bio}</p>
                </div>
              )}

              {/* Specializations */}
              {request.specializations?.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-sm font-medium mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {request.specializations.map((spec, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions - Only for Pending Requests */}
              {request.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => handleReject(request._id)}
                    disabled={processing[request._id]}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    {processing[request._id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAccept(request._id)}
                    disabled={processing[request._id]}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    {processing[request._id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Accept
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Info for Processed Requests */}
              {request.status !== 'pending' && request.respondedAt && (
                <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {request.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'} on{' '}
                    {new Date(request.respondedAt).toLocaleDateString()}
                  </div>
                  
                  {request.status === 'accepted' && (
                    <button
                      onClick={() => handleRemoveBarber(request.barberUserId || request.userId, request.barberName)}
                      disabled={processing[request.barberUserId || request.userId]}
                      className="flex items-center gap-2 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing[request.barberUserId || request.userId] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
