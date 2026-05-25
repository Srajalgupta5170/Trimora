import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Users, IndianRupee } from 'lucide-react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function SalonDetailsPage() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalonDetails();
    fetchBarbers();
  }, [salonId]);

  const fetchSalonDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/booking/salons/${salonId}`);
      setSalon(response.data);
    } catch (error) {
      console.error('Error fetching salon:', error);
    }
  };

  const fetchBarbers = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/booking/salons/${salonId}/barbers`);
      setBarbers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching barbers:', error);
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (!salon) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-60 overflow-hidden"
      >
        <img
          src={salon.image}
          alt={salon.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/40 to-slate-950" />

        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2 rounded-full bg-slate-900/80 backdrop-blur-xl hover:bg-slate-800 text-white border border-white/20"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Salon Info */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">{salon.name}</h1>
          <p className="text-slate-400 mb-4">{salon.address}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-indigo-400">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-semibold">{salon.rating} ({salon.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{barbers.length} Barbers</span>
            </div>
          </div>
        </motion.div>

        {/* Barbers Grid */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-6">Our Barbers</h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20"
        >
          {barbers.map((barber) => (
            <Link key={barber._id} to={`/barber/${barber._id}`}>
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="h-full cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300 h-full flex flex-col shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 group"
                >
                  {/* Profile Image */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
                    <img
                      src={barber.profileImage}
                      alt={barber.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-white">{barber.rating}</span>
                    </div>

                    {/* Queue Badge */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl px-3 py-1 rounded-full border border-indigo-500/30">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-400">{barber.queueLength} waiting</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-1">{barber.name}</h3>

                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                        {barber.experience} yrs exp
                      </span>
                    </div>

                    {/* Specializations */}
                    <div className="mb-4 flex-1">
                      <p className="text-xs text-slate-500 font-semibold mb-2">Specializations</p>
                      <div className="flex flex-wrap gap-1">
                        {barber.specializations?.slice(0, 2).map((spec, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full"
                          >
                            {spec}
                          </span>
                        ))}
                        {barber.specializations?.length > 2 && (
                          <span className="text-xs px-2 py-1 text-slate-400">
                            +{barber.specializations.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-indigo-400 font-bold">
                        <IndianRupee className="w-4 h-4" />
                        <span>From ₹{barber.basePrice}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all"
                      >
                        View
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
