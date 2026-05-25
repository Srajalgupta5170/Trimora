import { useState, useEffect } from 'react';
import CustomerDashboard from '../components/dashboards/CustomerDashboard';
import BarberDashboard from '../components/dashboards/BarberDashboard';
import OwnerDashboard from '../components/dashboards/OwnerDashboard';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [role, setRole] = useState(user?.role || 'customer');

  useEffect(() => {
    setRole(user?.role || 'customer');
  }, [user?.role]);

  // Route to appropriate dashboard based on role
  if (role === 'customer') {
    return <CustomerDashboard />;
  }

  if (role === 'barber') {
    return <BarberDashboard />;
  }

  if (role === 'salonOwner') {
    return <OwnerDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-20">
      <div className="text-center">
        <p className="text-slate-400">Unknown role: {role}</p>
      </div>
    </div>
  );
}