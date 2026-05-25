import React, { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, Save, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { barberProfileAPI } from '../../services/api';

export default function BarberProfileEditor() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    experience: 0,
    specializations: [],
    location: '',
  });
  const [newSpecialization, setNewSpecialization] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await barberProfileAPI.getMyProfile();
      setProfile(response.data);
      setFormData({
        name: response.data?.name || '',
        bio: response.data?.bio || '',
        experience: response.data?.experience || 0,
        specializations: response.data?.specializations || [],
        location: response.data?.location || '',
      });
      if (response.data?.profileImage) {
        setPreviewImage(response.data.profileImage);
      }
    } catch (err) {
      toast.error('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSizeBytes = 10 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and WEBP images are allowed');
        e.target.value = '';
        return;
      }

      if (file.size > maxSizeBytes) {
        toast.error('Image must be 10MB or smaller');
        e.target.value = '';
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewImage(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value,
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      setFormData((prev) => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()],
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Upload profile image if selected
      if (profileImage) {
        await barberProfileAPI.uploadProfileImage(profileImage);
      }

      // Update profile data
      await barberProfileAPI.updateProfile(formData);
      
      toast.success('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Image */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          {previewImage && (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30">
              <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <label className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-5 sm:p-6 cursor-pointer hover:border-purple-500/50 transition">
            <div className="text-center">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Tap or click to choose image</p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP up to 10MB</p>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <h3 className="text-lg font-semibold text-white">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your full name"
            className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell customers about yourself and your expertise..."
            rows="4"
            className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Experience (Years)</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              min="0"
              max="60"
              className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Area"
              className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <h3 className="text-lg font-semibold text-white">Specializations</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newSpecialization}
            onChange={(e) => setNewSpecialization(e.target.value)}
            placeholder="E.g., Fade, Undercut, Design..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
            className="flex-1 px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
          <button
            type="button"
            onClick={addSpecialization}
            className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-600/30 transition"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.specializations.map((spec, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-full text-sm"
            >
              {spec}
              <button
                type="button"
                onClick={() => removeSpecialization(index)}
                className="text-purple-400 hover:text-purple-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Profile
          </>
        )}
      </button>
    </form>
  );
}
