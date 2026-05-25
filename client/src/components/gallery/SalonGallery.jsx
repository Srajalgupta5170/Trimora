import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Upload, Trash2, Star, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SalonGallery({ salonId, isOwner = false, onImageUpload }) {
  const [gallery, setGallery] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, [salonId]);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/images/${salonId}/gallery`);
      setGallery(response.data.gallery || []);
      setMainImage(response.data.mainImage);
    } catch (err) {
      toast.error('Failed to load gallery');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    if (files.length === 1) {
      formData.append('image', files[0]);
    } else {
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
    }

    try {
      const endpoint = files.length === 1
        ? `/api/images/${salonId}/upload`
        : `/api/images/${salonId}/upload-multiple`;

      const response = await axios.post(endpoint, formData);
      toast.success(response.data.message);

      await fetchGallery();
      onImageUpload?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (index) => {
    if (!window.confirm('Delete this image?')) return;

    try {
      await axios.delete(`/api/images/${salonId}/gallery/${index}`);
      toast.success('Image deleted');
      await fetchGallery();
    } catch (err) {
      toast.error('Failed to delete image');
    }
  };

  const handleSetMainImage = async (index) => {
    try {
      await axios.put(`/api/images/${salonId}/gallery/${index}/set-main`);
      toast.success('Main image updated');
      await fetchGallery();
    } catch (err) {
      toast.error('Failed to update main image');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Image */}
      {mainImage && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="aspect-video w-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={mainImage.startsWith('http') ? mainImage : mainImage}
              alt="Main salon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">Main Salon Image</p>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {isOwner && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Drag and drop images here
          </p>
          <p className="text-xs text-gray-600 mb-3">or</p>
          <label className="inline-block">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={uploading}
              className="hidden"
            />
            <span className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium cursor-pointer transition">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Select Images'
              )}
            </span>
          </label>
          <p className="text-xs text-gray-600 mt-3">JPG, PNG, GIF (Max 5MB each)</p>
        </div>
      )}

      {/* Gallery Grid */}
      {gallery && gallery.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map((image, index) => (
            <div key={index} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Image */}
              <div className="aspect-square w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={image.url.startsWith('http') ? image.url : image.url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay Actions */}
              {isOwner && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleSetMainImage(index)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition"
                    title="Set as main image"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(index)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                    title="Delete image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Upload Date */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 text-white text-xs p-2">
                {new Date(image.uploadedAt).toLocaleDateString()}
              </div>

              {/* Main Image Badge */}
              {mainImage === image.url && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {isOwner ? 'No images yet. Upload some to get started!' : 'No images available'}
          </p>
        </div>
      )}
    </div>
  );
}
