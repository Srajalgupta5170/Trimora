import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Request interceptor - add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('id');
      // Redirect to auth page will be handled by App.jsx
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ============== AUTH ENDPOINTS ==============
export const authAPI = {
  login: (credentials) =>
    api.post('/api/auth/login', credentials),
  signup: (data) =>
    api.post('/api/auth/signup', data),
  registerSalon: (data) =>
    api.post('/api/auth/register-salon', data),
  getProfile: () =>
    api.get('/api/auth/profile'),
  getAvailableSalons: () =>
    api.get('/api/auth/available-salons'),
};

// ============== BOOKING ENDPOINTS ==============
export const bookingAPI = {
  // Salons
  getAllSalons: () =>
    api.get('/api/booking/salons'),
  getMySalons: () =>
    api.get('/api/booking/my-salons'),
  getSalonDetails: (salonId) =>
    api.get(`/api/booking/salons/${salonId}`),
  getSalonBarbers: (salonId) =>
    api.get(`/api/booking/salons/${salonId}/barbers`),
  getSalonStats: (salonId) =>
    api.get(`/api/booking/salon/${salonId}/stats`),
  getSalonQueues: (salonId) =>
    api.get(`/api/booking/salon/${salonId}/queues`),

  // Barber Profile
  getBarberProfile: () =>
    api.get('/api/booking/barber/my-profile'),
  getBarberDetails: (barberId) =>
    api.get(`/api/booking/barber/${barberId}`),
  joinSalon: (salonId) =>
    api.post('/api/booking/join-salon', { salonId }),

  // Queue Operations (use /queue routes, NOT /booking/queue)
  joinQueue: (data) =>
    api.post('/api/queue/join', data),
  
  leaveQueue: () =>
    api.post('/api/queue/leave', {}),
  
  getMyQueuePosition: () =>
    api.get('/api/queue/my-position'),
  
  getMyQueueStatus: (barberId) =>
    api.get(`/api/queue/my-status/${barberId}`),
  
  getPublicBarberQueue: (barberId) =>
    api.get(`/api/queue/barber/${barberId}/public`),
  
  getBarberQueue: (barberId) =>
    api.get(`/api/queue/barber/${barberId}`),
  
  callNextCustomer: (barberId) =>
    api.post(`/api/queue/barber/${barberId}/next`, {}),
  
  completeService: (barberId, data = {}) =>
    api.post(`/api/queue/barber/${barberId}/complete`, data),
  
  getQueueStats: (barberId) =>
    api.get(`/api/queue/barber/${barberId}/stats`),
};

// ============== EARNINGS ENDPOINTS ==============
export const earningsAPI = {
  getBarberOverview: () =>
    api.get('/api/earnings/barber/overview'),
  getBarberBreakdown: (barberId) =>
    api.get(`/api/earnings/barber/${barberId}/breakdown`),
  getSalonOverview: () =>
    api.get('/api/earnings/salon/overview'),
};

// ============== BARBER REQUEST ENDPOINTS ==============
export const barberRequestAPI = {
  requestSalon: (data) =>
    api.post('/api/barber-requests/request-salon', data),
  getMyRequests: () =>
    api.get('/api/barber-requests/my-requests'),
  getPendingRequests: () =>
    api.get('/api/barber-requests/pending'),
  approveRequest: (requestId) =>
    api.post(`/api/barber-requests/${requestId}/approve`, {}),
  rejectRequest: (requestId, reason) =>
    api.post(`/api/barber-requests/${requestId}/reject`, { reason }),
};

// ============== IMAGE ENDPOINTS ==============
export const imageAPI = {
  uploadImage: (salonId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/images/${salonId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultipleImages: (salonId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post(`/api/images/${salonId}/upload-multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSalonGallery: (salonId) =>
    api.get(`/api/images/${salonId}/gallery`),
  deleteImage: (salonId, imageIndex) =>
    api.delete(`/api/images/${salonId}/gallery/${imageIndex}`),
  setMainImage: (salonId, imageIndex) =>
    api.put(`/api/images/${salonId}/gallery/${imageIndex}/set-main`, {}),
};

// ============== BARBER PROFILE ENDPOINTS ==============
export const barberProfileAPI = {
  // Public profile
  getPublicProfile: (barberId) =>
    api.get(`/api/barber/profile/${barberId}`),

  // My profile (authenticated barber)
  getMyProfile: () =>
    api.get('/api/barber/me/profile'),

  updateProfile: (data) =>
    api.put('/api/barber/me/profile', data),

  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/api/barber/me/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Services
  createService: (data) =>
    api.post('/api/barber/me/services', data),

  getMyServices: () =>
    api.get('/api/barber/me/services'),

  updateService: (serviceId, data) =>
    api.put(`/api/barber/me/services/${serviceId}`, data),

  deleteService: (serviceId) =>
    api.delete(`/api/barber/me/services/${serviceId}`),

  // Portfolio
  uploadPortfolioImage: (file, title, description, category) => {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (category) formData.append('category', category);
    return api.post('/api/barber/me/portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getPublicPortfolio: (barberId) =>
    api.get(`/api/barber/portfolio/${barberId}`),

  getMyPortfolio: () =>
    api.get('/api/barber/me/portfolio'),

  deletePortfolioImage: (imageId) =>
    api.delete(`/api/barber/me/portfolio/${imageId}`),

  updatePortfolioOrder: (images) =>
    api.put('/api/barber/me/portfolio/order', { images }),

  // Reviews
  getBarberReviews: (barberId, page = 1, limit = 10) =>
    api.get(`/api/barber/reviews/${barberId}`, { params: { page, limit } }),

  // Salon Media
  getSalonMedia: () =>
    api.get('/api/barber/me/salon-media'),

  // Stats
  getBarberStats: () =>
    api.get('/api/barber/me/stats'),

  // Leave/Remove Salon
  leaveSalon: () =>
    api.post('/api/barber/me/leave-salon', {}),

  removeBarber: (barberId) =>
    api.delete(`/api/barber/${barberId}/remove`),
};

// ============== REVIEW ENDPOINTS ==============
export const reviewAPI = {
  // Submit review (customer)
  submitReview: (barberId, data) =>
    api.post(`/api/reviews/barber/${barberId}/reviews`, data),

  // Get barber reviews (public)
  getBarberReviews: (barberId, page = 1, limit = 10) =>
    api.get(`/api/reviews/barber/${barberId}/reviews`, { params: { page, limit } }),

  // Mark as helpful
  markHelpful: (reviewId) =>
    api.post(`/api/reviews/reviews/${reviewId}/helpful`, {}),

  // Barber responses
  respondToReview: (reviewId, text) =>
    api.post(`/api/reviews/reviews/${reviewId}/respond`, { text }),

  // Get pending reviews (barber)
  getPendingReviews: () =>
    api.get('/api/reviews/me/reviews/pending'),

  // Moderate review
  moderateReview: (reviewId, action) =>
    api.put(`/api/reviews/reviews/${reviewId}/moderate`, { action }),
};

// ============== SALON MEDIA ENDPOINTS ==============
export const salonMediaAPI = {
  // Public
  getSalonMedia: (salonId) =>
    api.get(`/api/salon/salon/${salonId}/media`),

  getGallery: (salonId) =>
    api.get(`/api/salon/salon/${salonId}/gallery`),

  // Salon owner
  getMySalonMedia: () =>
    api.get('/api/salon/me/media'),

  updateSalonInfo: (data) =>
    api.put('/api/salon/me/info', data),

  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/api/salon/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadBanner: (file) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post('/api/salon/me/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  addGalleryImage: (file, title) => {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    return api.post('/api/salon/me/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeGalleryImage: (imageIndex) =>
    api.delete(`/api/salon/me/gallery/${imageIndex}`),

  updateGalleryOrder: (images) =>
    api.put('/api/salon/me/gallery/order', { images }),
};

export const joinRequestAPI = {
  // Barber endpoints
  requestJoinSalon: (data) =>
    api.post('/api/join-requests/request', data),

  getMyRequests: () =>
    api.get('/api/join-requests/my-requests'),

  cancelRequest: (requestId) =>
    api.delete(`/api/join-requests/${requestId}/cancel`),

  // Salon owner endpoints
  getPendingRequests: () =>
    api.get('/api/join-requests/pending'),

  acceptRequest: (requestId) =>
    api.post(`/api/join-requests/${requestId}/accept`, {}),

  rejectRequest: (requestId, data = {}) =>
    api.post(`/api/join-requests/${requestId}/reject`, data),
};

export default api;
