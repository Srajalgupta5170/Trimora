import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BarberRequestForm({ salonId, salonName, onSuccess }) {
  const [formData, setFormData] = useState({
    experience: 0,
    specializations: [],
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const specializations = [
    'Hair Cutting',
    'Beard Grooming',
    'Hair Styling',
    'Hair Coloring',
    'Head Massage',
    'Shaving',
    'Moisturizing',
    'Perming'
  ];

  const handleSpecializationChange = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.specializations.length === 0) {
      setError('Please select at least one specialization');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/barber-requests/request-salon', {
        salonId,
        experience: parseInt(formData.experience),
        specializations: formData.specializations,
        message: formData.message || 'Looking forward to working here!'
      });

      toast.success('Request sent successfully! Waiting for salon owner approval.');
      onSuccess?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send request';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2">Request to Join</h2>
        <p className="text-gray-600 mb-6">{salonName}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                experience: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specializations
            </label>
            <div className="grid grid-cols-2 gap-2">
              {specializations.map(spec => (
                <label key={spec} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(spec)}
                    onChange={() => handleSpecializationChange(spec)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{spec}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                message: e.target.value
              }))}
              placeholder="Tell us about your experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
          >
            {loading ? (
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
        </form>
      </div>
    </div>
  );
}
