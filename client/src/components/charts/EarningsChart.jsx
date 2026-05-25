import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, TrendingUp, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function EarningsChart({ userRole = 'barber' }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, week, month

  useEffect(() => {
    fetchEarnings();
  }, [timeRange, userRole]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const endpoint = userRole === 'barber' 
        ? '/api/earnings/barber/overview'
        : '/api/earnings/salon/overview';

      const response = await axios.get(endpoint);
      setEarnings(response.data);
    } catch (err) {
      toast.error('Failed to load earnings data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">No earnings data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Earnings</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                ₹{earnings.totalEarnings?.toLocaleString() || '0'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        {/* Today's Earnings */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Today's Earnings</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                ₹{earnings.todayEarnings?.toLocaleString() || '0'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        {/* Services/Customers */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">
                {userRole === 'barber' ? 'Customers Served' : 'Total Services'}
              </p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {earnings.customersServed || earnings.stats?.servicesCompleted || '0'}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Earnings Breakdown Table */}
      {earnings.earningsBreakdown?.byDate && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {earnings.earningsBreakdown.byDate.slice(0, 7).map((day, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">{day._id}</td>
                    <td className="px-4 py-2 text-right font-semibold text-green-600">
                      ₹{day.total?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{day.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekly Stats (for salon owner) */}
      {userRole === 'salonOwner' && earnings.weekEarnings && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm text-gray-600">Week's Earnings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{earnings.weekEarnings?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm text-gray-600">Week's Services</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {earnings.stats?.weekServices || '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Per-Barber Earnings (for salon owner) */}
      {userRole === 'salonOwner' && earnings.earningsPerBarber && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Earnings by Barber</h3>
          <div className="space-y-3">
            {earnings.earningsPerBarber.map((barber, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {barber.barber?.[0]?.name || 'Unnamed Barber'}
                  </p>
                  <p className="text-xs text-gray-600">{barber.count} services</p>
                </div>
                <p className="font-semibold text-green-600">
                  ₹{barber.total?.toLocaleString() || '0'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchEarnings}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
      >
        Refresh Data
      </button>
    </div>
  );
}
