import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Loader2, ImageIcon, Store, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { salonMediaAPI } from '../../services/api';

export default function SalonMediaManager() {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({ logo: null, banner: null, gallery: null });
  const [previews, setPreviews] = useState({ logo: '', banner: '', gallery: '' });
  const [expandInfo, setExpandInfo] = useState(false);
  const [salonInfo, setSalonInfo] = useState({
    name: '',
    description: '',
    ambiance: '',
    colors: '',
  });

  useEffect(() => {
    fetchMedia();
  }, []);

  const isAllowedFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are allowed');
      return false;
    }
    if (file.size > maxSizeBytes) {
      toast.error('Image must be 10MB or smaller');
      return false;
    }
    return true;
  };

  const handleFileSelect = (file, type) => {
    if (!file) return;
    if (!isAllowedFile(file)) return;

    setSelectedFiles((prev) => ({ ...prev, [type]: file }));
    const objectUrl = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [type]: objectUrl }));
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await salonMediaAPI.getMySalonMedia();
      console.log('Salon media response:', response);
      setMedia(response.data?.media || response.data);
      setSalonInfo({
        name: response.data?.media?.salonName || response.data?.salonName || '',
        description: response.data?.media?.description || response.data?.description || '',
        ambiance: response.data?.media?.ambiance || response.data?.ambiance || '',
        colors: response.data?.media?.colors || response.data?.colors || '',
      });
    } catch (err) {
      console.error('Error loading salon media:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to load salon media';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file, type) => {
    if (!file) return;

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      if (type === 'logo') {
        await salonMediaAPI.uploadLogo(file);
        toast.success('Logo uploaded successfully!');
      } else if (type === 'banner') {
        await salonMediaAPI.uploadBanner(file);
        toast.success('Banner uploaded successfully!');
      } else if (type === 'gallery') {
        await salonMediaAPI.addGalleryImage(file, `Gallery Image ${new Date().toLocaleDateString()}`);
        toast.success('Gallery image added!');
      }
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.response?.data?.details || `Failed to upload ${type}`);
      console.error(err);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
      setSelectedFiles((prev) => ({ ...prev, [type]: null }));
      if (previews[type]) {
        URL.revokeObjectURL(previews[type]);
      }
      setPreviews((prev) => ({ ...prev, [type]: '' }));
    }
  };

  const handleDeleteGallery = async (index) => {
    if (!confirm('Delete this image?')) return;

    try {
      await salonMediaAPI.removeGalleryImage(index);
      toast.success('Image deleted!');
      fetchMedia();
    } catch (err) {
      toast.error('Failed to delete image');
      console.error(err);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      await salonMediaAPI.updateSalonInfo({
        description: salonInfo.description,
        ambiance: salonInfo.ambiance,
        brandColor: { 
          primary: salonInfo.colors.split('&')[0]?.trim() || '',
          accent: salonInfo.colors.split('&')[1]?.trim() || ''
        }
      });
      toast.success('Salon information updated!');
    } catch (err) {
      toast.error('Failed to update salon info');
      console.error(err);
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
    <div className="space-y-6">
      {/* Media Upload Section - No Form Required */}
      <div className="space-y-4">
        {/* Salon Logo Upload */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Salon Logo</h3>
          </div>
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-5 sm:p-8 text-center hover:border-purple-500 transition">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files?.[0], 'logo')}
              disabled={uploading.logo}
              className="hidden"
              id="logo-input"
            />
            <label htmlFor="logo-input" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-2">
                {uploading.logo ? (
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400" />
                )}
                <p className="text-slate-300 font-medium">
                  {uploading.logo ? 'Uploading...' : 'Tap or click to choose logo'}
                </p>
                <p className="text-slate-500 text-sm">JPG, PNG, WEBP up to 10MB</p>
              </div>
            </label>
            {previews.logo && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <img src={previews.logo} alt="Logo preview" className="h-24 w-24 rounded-lg object-cover border border-slate-700" />
                <button
                  type="button"
                  onClick={() => handleUpload(selectedFiles.logo, 'logo')}
                  disabled={uploading.logo}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-70"
                >
                  Upload Logo
                </button>
              </div>
            )}
          </div>
          {media?.logo?.url && (
            <div className="mt-4 flex justify-center">
              <img
                src={media.logo.url}
                alt="Salon Logo"
                className="h-20 w-20 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Salon Banner Upload */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Salon Banner</h3>
          </div>
          <p className="text-slate-400 text-sm mb-4">Recommended: 1200x400px</p>
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-5 sm:p-8 text-center hover:border-purple-500 transition">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files?.[0], 'banner')}
              disabled={uploading.banner}
              className="hidden"
              id="banner-input"
            />
            <label htmlFor="banner-input" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-2">
                {uploading.banner ? (
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400" />
                )}
                <p className="text-slate-300 font-medium">
                  {uploading.banner ? 'Uploading...' : 'Tap or click to choose banner'}
                </p>
                <p className="text-slate-500 text-sm">JPG, PNG, WEBP up to 10MB</p>
              </div>
            </label>
            {previews.banner && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <img src={previews.banner} alt="Banner preview" className="w-full max-w-md h-28 rounded-lg object-cover border border-slate-700" />
                <button
                  type="button"
                  onClick={() => handleUpload(selectedFiles.banner, 'banner')}
                  disabled={uploading.banner}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-70"
                >
                  Upload Banner
                </button>
              </div>
            )}
          </div>
          {media?.banner?.url && (
            <div className="mt-4">
              <img
                src={media.banner.url}
                alt="Salon Banner"
                className="w-full h-40 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Salon Gallery Upload */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Salon Gallery</h3>
          </div>
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-5 sm:p-8 text-center hover:border-purple-500 transition mb-6">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files?.[0], 'gallery')}
              disabled={uploading.gallery}
              className="hidden"
              id="gallery-input"
            />
            <label htmlFor="gallery-input" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-2">
                {uploading.gallery ? (
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400" />
                )}
                <p className="text-slate-300 font-medium">
                  {uploading.gallery ? 'Uploading...' : 'Tap or click to choose gallery image'}
                </p>
                <p className="text-slate-500 text-sm">JPG, PNG, WEBP up to 10MB</p>
              </div>
            </label>
            {previews.gallery && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <img src={previews.gallery} alt="Gallery preview" className="w-full max-w-sm h-28 rounded-lg object-cover border border-slate-700" />
                <button
                  type="button"
                  onClick={() => handleUpload(selectedFiles.gallery, 'gallery')}
                  disabled={uploading.gallery}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-70"
                >
                  Add to Gallery
                </button>
              </div>
            )}
          </div>

          {/* Gallery Preview Grid */}
          {media?.gallery && media.gallery.length > 0 && (
            <div>
              <p className="text-slate-300 font-medium mb-3">
                Gallery Images ({media.gallery.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {media.gallery.map((image, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeleteGallery(idx)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Salon Information Section */}
      <button
        onClick={() => setExpandInfo(!expandInfo)}
        className="w-full bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl hover:border-purple-500 transition flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-purple-400" />
          <span className="text-lg font-semibold text-white">Edit Salon Information</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition ${
            expandInfo ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expandInfo && (
        <form onSubmit={handleUpdateInfo} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={salonInfo.description}
              onChange={(e) =>
                setSalonInfo({ ...salonInfo, description: e.target.value })
              }
              placeholder="Tell customers about your salon..."
              rows="3"
              className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ambiance
              </label>
              <input
                type="text"
                value={salonInfo.ambiance}
                onChange={(e) =>
                  setSalonInfo({ ...salonInfo, ambiance: e.target.value })
                }
                placeholder="E.g., Modern, Vintage, Luxury"
                className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color Theme
              </label>
              <input
                type="text"
                value={salonInfo.colors}
                onChange={(e) =>
                  setSalonInfo({ ...salonInfo, colors: e.target.value })
                }
                placeholder="E.g., Black & Gold"
                className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition"
          >
            Save Information
          </button>
        </form>
      )}
    </div>
  );
}
