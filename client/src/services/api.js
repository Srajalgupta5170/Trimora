import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    api.post('/auth/login', credentials),
  signup: (data) =>
    api.post('/auth/signup', data),
  registerSalon: (data) =>
    api.post('/auth/register-salon', data),
  getProfile: () =>
    api.get('/auth/profile'),
  getAvailableSalons: () =>
    api.get('/auth/available-salons'),
};

// ============== BOOKING ENDPOINTS ==============
export const bookingAPI = {
  // Salons
  getAllSalons: () =>
    api.get('/booking/salons'),
  getMySalons: () =>
    api.get('/booking/my-salons'),
  getSalonDetails: (salonId) =>
    api.get(`/booking/salons/${salonId}`),
  getSalonBarbers: (salonId) =>
    api.get(`/booking/salons/${salonId}/barbers`),
  getSalonStats: (salonId) =>
    api.get(`/booking/salon/${salonId}/stats`),
  getSalonQueues: (salonId) =>
    api.get(`/booking/salon/${salonId}/queues`),

  // Barber Profile
  getBarberProfile: () =>
    api.get('/booking/barber/my-profile'),
  getBarberDetails: (barberId) =>
    api.get(`/booking/barber/${barberId}`),
  joinSalon: (salonId) =>
    api.post('/booking/join-salon', { salonId }),

  // Queue Operations (use /queue routes, NOT /booking/queue)
  joinQueue: (data) =>
    api.post('/queue/join', data),
  
  leaveQueue: () =>
    api.post('/queue/leave', {}),
  
  getMyQueuePosition: () =>
    api.get('/queue/my-position'),
  
  getMyQueueStatus: (barberId) =>
    api.get(`/queue/my-status/${barberId}`),
  
  getPublicBarberQueue: (barberId) =>
    api.get(`/queue/barber/${barberId}/public`),
  
  getBarberQueue: (barberId) =>
    api.get(`/queue/barber/${barberId}`),
  
  callNextCustomer: (barberId) =>
    api.post(`/queue/barber/${barberId}/next`, {}),
  
  completeService: (barberId, data = {}) =>
    api.post(`/queue/barber/${barberId}/complete`, data),
  
  getQueueStats: (barberId) =>
    api.get(`/queue/barber/${barberId}/stats`),
};

// ============== EARNINGS ENDPOINTS ==============
export const earningsAPI = {
  getBarberOverview: () =>
    api.get('/earnings/barber/overview'),
  getBarberBreakdown: (barberId) =>
    api.get(`/earnings/barber/${barberId}/breakdown`),
  getSalonOverview: () =>
    api.get('/earnings/salon/overview'),
};

// ============== BARBER REQUEST ENDPOINTS ==============
export const barberRequestAPI = {
  requestSalon: (data) =>
    api.post('/barber-requests/request-salon', data),
  getMyRequests: () =>
    api.get('/barber-requests/my-requests'),
  getPendingRequests: () =>
    api.get('/barber-requests/pending'),
  approveRequest: (requestId) =>
    api.post(`/barber-requests/${requestId}/approve`, {}),
  rejectRequest: (requestId, reason) =>
    api.post(`/barber-requests/${requestId}/reject`, { reason }),
};

// ============== IMAGE ENDPOINTS ==============
export const imageAPI = {
  uploadImage: (salonId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/images/${salonId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultipleImages: (salonId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post(`/images/${salonId}/upload-multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSalonGallery: (salonId) =>
    api.get(`/images/${salonId}/gallery`),
  deleteImage: (salonId, imageIndex) =>
    api.delete(`/images/${salonId}/gallery/${imageIndex}`),
  setMainImage: (salonId, imageIndex) =>
    api.put(`/images/${salonId}/gallery/${imageIndex}/set-main`, {}),
};

// ============== BARBER PROFILE ENDPOINTS ==============
export const barberProfileAPI = {
  // Public profile
  getPublicProfile: (barberId) =>
    api.get(`/barber/profile/${barberId}`),

  // My profile (authenticated barber)
  getMyProfile: () =>
    api.get('/barber/me/profile'),

  updateProfile: (data) =>
    api.put('/barber/me/profile', data),

  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/barber/me/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Services
  createService: (data) =>
    api.post('/barber/me/services', data),

  getMyServices: () =>
    api.get('/barber/me/services'),

  updateService: (serviceId, data) =>
    api.put(`/barber/me/services/${serviceId}`, data),

  deleteService: (serviceId) =>
    api.delete(`/barber/me/services/${serviceId}`),

  // Portfolio
  uploadPortfolioImage: (file, title, description, category) => {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (category) formData.append('category', category);
    return api.post('/barber/me/portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getPublicPortfolio: (barberId) =>
    api.get(`/barber/portfolio/${barberId}`),

  getMyPortfolio: () =>
    api.get('/barber/me/portfolio'),

  deletePortfolioImage: (imageId) =>
    api.delete(`/barber/me/portfolio/${imageId}`),

  updatePortfolioOrder: (images) =>
    api.put('/barber/me/portfolio/order', { images }),

  // Reviews
  getBarberReviews: (barberId, page = 1, limit = 10) =>
    api.get(`/barber/reviews/${barberId}`, { params: { page, limit } }),

  // Salon Media
  getSalonMedia: () =>
    api.get('/barber/me/salon-media'),

  // Stats
  getBarberStats: () =>
    api.get('/barber/me/stats'),

  // Leave/Remove Salon
  leaveSalon: () =>
    api.post('/barber/me/leave-salon', {}),

  removeBarber: (barberId) =>
    api.delete(`/barber/${barberId}/remove`),
};

// ============== REVIEW ENDPOINTS ==============
export const reviewAPI = {
  // Submit review (customer)
  submitReview: (barberId, data) =>
    api.post(`/reviews/barber/${barberId}/reviews`, data),

  // Get barber reviews (public)
  getBarberReviews: (barberId, page = 1, limit = 10) =>
    api.get(`/reviews/barber/${barberId}/reviews`, { params: { page, limit } }),

  // Mark as helpful
  markHelpful: (reviewId) =>
    api.post(`/reviews/reviews/${reviewId}/helpful`, {}),

  // Barber responses
  respondToReview: (reviewId, text) =>
    api.post(`/reviews/reviews/${reviewId}/respond`, { text }),

  // Get pending reviews (barber)
  getPendingReviews: () =>
    api.get('/reviews/me/reviews/pending'),

  // Moderate review
  moderateReview: (reviewId, action) =>
    api.put(`/reviews/reviews/${reviewId}/moderate`, { action }),
};

// ============== SALON MEDIA ENDPOINTS ==============
export const salonMediaAPI = {
  // Public
  getSalonMedia: (salonId) =>
    api.get(`/salon/salon/${salonId}/media`),

  getGallery: (salonId) =>
    api.get(`/salon/salon/${salonId}/gallery`),

  // Salon owner
  getMySalonMedia: () =>
    api.get('/salon/me/media'),

  updateSalonInfo: (data) =>
    api.put('/salon/me/info', data),

  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/salon/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadBanner: (file) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post('/salon/me/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  addGalleryImage: (file, title) => {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    return api.post('/salon/me/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeGalleryImage: (imageIndex) =>
    api.delete(`/salon/me/gallery/${imageIndex}`),

  updateGalleryOrder: (images) =>
    api.put('/salon/me/gallery/order', { images }),
};

export const joinRequestAPI = {
  // Barber endpoints
  requestJoinSalon: (data) =>
    api.post('/join-requests/request', data),

  getMyRequests: () =>
    api.get('/join-requests/my-requests'),

  cancelRequest: (requestId) =>
    api.delete(`/join-requests/${requestId}/cancel`),

  // Salon owner endpoints
  getPendingRequests: () =>
    api.get('/join-requests/pending'),

  acceptRequest: (requestId) =>
    api.post(`/join-requests/${requestId}/accept`),

  rejectRequest: (requestId, data = {}) =>
    api.post(`/join-requests/${requestId}/reject`, data),
};

export default api;
