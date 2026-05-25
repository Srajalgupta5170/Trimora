import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function HomePage({ onSelectSalon }) {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/booking/salons');
      setSalons(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salons:', error);
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-20 pb-12 px-6 text-center"
      >
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4">
          QueueFlow
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Skip the line, book your barber. Browse nearby salons and join the queue in seconds.
        </p>
      </motion.div>

      {/* Salons Grid */}
      <div className="px-6 pb-20 max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {salons.map((salon) => (
            <Link key={salon._id} to={`/salon/${salon._id}`}>
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="h-full cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300 h-full flex flex-col shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 group"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-white">{salon.rating}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                      {salon.name}
                    </h3>

                    <div className="flex items-start gap-2 text-sm text-slate-400 mb-4 flex-1">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" />
                      <span className="line-clamp-2">{salon.address}</span>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Reviews</span>
                        <span className="text-indigo-400 font-semibold">{salon.reviewCount}+</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Hours</span>
                        <span className="text-slate-300">{salon.openingTime} - {salon.closingTime}</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30"
                    >
                      View Barbers
                    </motion.button>
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
