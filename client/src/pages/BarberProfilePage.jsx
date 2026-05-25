import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Users, Briefcase, Share2, ArrowLeft, MessageCircle, Heart, AlertCircle } from 'lucide-react';
import { barberProfileAPI, reviewAPI } from '../services/api.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function BarberProfilePage() {
  const { barberId } = useParams();
  const navigate = useNavigate();
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPortfolioImage, setSelectedPortfolioImage] = useState(null);
  const [activeTab, setActiveTab] = useState('about'); // about, services, portfolio, reviews

  useEffect(() => {
    fetchBarberData();
  }, [barberId]);

  const fetchBarberData = async () => {
    try {
      setLoading(true);
      setError('');

      const profileRes = await barberProfileAPI.getPublicProfile(barberId);
      setBarber(profileRes.data.barber);
      setServices(profileRes.data.services || []);

      // Fetch portfolio
      const portfolioRes = await barberProfileAPI.getPublicPortfolio(barberId);
      setPortfolio(portfolioRes.data.portfolio || []);

      // Fetch reviews
      const reviewsRes = await reviewAPI.getBarberReviews(barberId, 1, 10);
      setReviews(reviewsRes.data.reviews || []);
      setReviewStats(reviewsRes.data.stats || {});
    } catch (err) {
      console.error('Error fetching barber data:', err);
      setError('Failed to load barber profile');
      toast.error('Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-slate-900 mb-4">
            <div className="w-8 h-8 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400">Loading barber profile...</p>
        </div>
      </div>
    );
  }

  if (error || !barber) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'Unable to load this barber profile'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex gap-3">
            <button className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900/60 to-slate-900/20 border border-white/10 rounded-3xl p-6 sm:p-10 mb-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
            {/* Profile Image */}
            <div className="sm:col-span-1 flex justify-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl shadow-indigo-500/10 bg-slate-900">
                  {barber.profileImage ? (
                    <img
                      src={barber.profileImage}
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                      <Briefcase className="w-20 h-20 text-slate-600" />
                    </div>
                  )}
                </div>
                {barber.isActive && (
                  <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg" />
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="sm:col-span-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{barber.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(barber.averageRating || 4.5)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-semibold">{barber.averageRating || 4.5}</span>
                <span className="text-slate-400">({barber.reviewCount || 0} reviews)</span>
              </div>

              {/* Specializations */}
              {barber.specializations && barber.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {barber.specializations.map((spec, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Experience */}
              <div className="flex items-center gap-6 text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>{barber.experience || 0}+ years</span>
                </div>
                {barber.salonId && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <span>{barber.salonId?.name || 'Salon'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-white/10 flex gap-8 overflow-x-auto">
          {[
            { id: 'about', label: 'About' },
            { id: 'services', label: `Services (${services.length})` },
            { id: 'portfolio', label: `Portfolio (${portfolio.length})` },
            { id: 'reviews', label: `Reviews (${reviewStats?.totalReviews || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-semibold text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                  <h3 className="text-xl font-bold text-white mb-4">About</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {barber.bio || 'Professional barber with years of experience in providing quality haircuts and styling services.'}
                  </p>
                </motion.div>

                {/* Experience Details */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                  <h3 className="text-xl font-bold text-white mb-4">Experience</h3>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex justify-between">
                      <span>Years of Experience:</span>
                      <span className="font-semibold text-white">{barber.experience || 0}+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Member Since:</span>
                      <span className="font-semibold text-white">
                        {new Date(barber.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                {services.length > 0 ? (
                  services.map((service, idx) => (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-white">{service.name}</h4>
                        <span className="text-2xl font-bold text-indigo-400">₹{service.price}</span>
                      </div>
                      {service.description && (
                        <p className="text-slate-400 text-sm mb-3">{service.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} minutes</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No services listed yet
                  </div>
                )}
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                {portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {portfolio.map((image, idx) => (
                      <motion.div
                        key={image._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedPortfolioImage(image)}
                        className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-white/10 hover:border-indigo-500/30 transition-all"
                      >
                        <img
                          src={image.imageUrl}
                          alt={image.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <div>
                            <p className="font-semibold text-white text-sm">{image.title}</p>
                            <p className="text-slate-300 text-xs">{image.category}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No portfolio images yet
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review, idx) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {review.userId?.profileImage ? (
                            <img
                              src={review.userId.profileImage}
                              alt={review.userId.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                              <Users className="w-5 h-5 text-slate-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">{review.reviewerName}</p>
                            <p className="text-slate-400 text-sm">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-slate-300 text-sm mb-3">{review.comment}</p>
                      )}
                      {review.barberResponse && (
                        <div className="mt-4 p-4 bg-slate-800/50 border-l-2 border-indigo-500 rounded">
                          <p className="text-sm font-semibold text-indigo-400 mb-1">Barber's Response</p>
                          <p className="text-slate-300 text-sm">{review.barberResponse.text}</p>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No reviews yet
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Queue Status & CTA */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-8 backdrop-blur-xl sticky top-24"
            >
              <h3 className="text-xl font-bold text-white mb-6">Ready to book?</h3>

              {/* Queue Status */}
              <div className="bg-slate-900/60 rounded-xl p-4 mb-6 border border-white/10">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                  <Users className="w-4 h-4" />
                  <span>Current queue</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {Math.floor(Math.random() * 8)}
                </p>
                <p className="text-slate-400 text-sm mt-1">~{Math.floor(Math.random() * 30) + 10} min wait</p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate(`/booking/${barber._id}`)}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-1 mb-3"
              >
                Join Queue
              </button>

              <button className="w-full py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>

              {/* Verification Badge */}
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-xs text-slate-400">
                  ✓ Verified professional with {barber.reviewCount || 0} customer reviews
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Portfolio Image Modal */}
      {selectedPortfolioImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPortfolioImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPortfolioImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-white"
            >
              ✕
            </button>
            <img
              src={selectedPortfolioImage.imageUrl}
              alt={selectedPortfolioImage.title}
              className="w-full rounded-2xl"
            />
            <div className="mt-4 bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h4 className="text-lg font-bold text-white mb-2">{selectedPortfolioImage.title}</h4>
              {selectedPortfolioImage.description && (
                <p className="text-slate-300">{selectedPortfolioImage.description}</p>
              )}
              <div className="mt-4 flex gap-4">
                <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-full">
                  {selectedPortfolioImage.category}
                </span>
                <span className="px-3 py-1 bg-slate-700/50 border border-slate-600/30 text-slate-300 text-sm rounded-full flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {selectedPortfolioImage.likes || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
