import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingRequestsList({ refreshTrigger }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [expandedRequest, setExpandedRequest] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, [refreshTrigger]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/barber-requests/pending');
      setRequests(response.data.requests || []);
    } catch (err) {
      toast.error('Failed to load pending requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, barberName) => {
    setProcessingId(requestId);
    try {
      await axios.post(`/api/barber-requests/${requestId}/approve`);
      toast.success(`${barberName} approved successfully!`);
      setRequests(requests.filter(r => r._id !== requestId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId, barberName) => {
    const reason = rejectReason[requestId] || 'Not a good fit for our salon';
    setProcessingId(requestId);
    try {
      await axios.post(`/api/barber-requests/${requestId}/reject`, {
        reason
      });
      toast.success(`${barberName} rejected`);
      setRequests(requests.filter(r => r._id !== requestId));
      setRejectReason(prev => {
        delete prev[requestId];
        return prev;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No pending requests at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(request => (
        <div
          key={request._id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          {/* Header */}
          <div
            className="flex items-start justify-between cursor-pointer"
            onClick={() => setExpandedRequest(expandedRequest === request._id ? null : request._id)}
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">
                {request.barberId.name}
              </h3>
              <p className="text-sm text-gray-600">{request.barberId.email}</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-sm font-medium text-blue-600">
                {request.experience} yrs exp.
              </p>
              <p className="text-xs text-gray-500">
                {new Date(request.requestedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedRequest === request._id && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {/* Specializations */}
              {request.specializations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Specializations:</p>
                  <div className="flex flex-wrap gap-2">
                    {request.specializations.map(spec => (
                      <span
                        key={spec}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              {request.requestMessage && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
                  <p className="text-sm text-gray-600 italic">{request.requestMessage}</p>
                </div>
              )}

              {/* Contact */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Contact:</p>
                <p className="text-sm text-gray-600">{request.barberId.phone || 'N/A'}</p>
              </div>

              {/* Reject Reason Input */}
              <div className="bg-red-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting):
                </label>
                <textarea
                  value={rejectReason[request._id] || ''}
                  onChange={(e) => setRejectReason(prev => ({
                    ...prev,
                    [request._id]: e.target.value
                  }))}
                  placeholder="Optional - barber won't see this"
                  className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="2"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApprove(request._id, request.barberId.name)}
                  disabled={processingId === request._id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                >
                  {processingId === request._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(request._id, request.barberId.name)}
                  disabled={processingId === request._id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                >
                  {processingId === request._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
