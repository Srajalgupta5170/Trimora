import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Loader2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { barberProfileAPI } from '../../services/api';

export default function PortfolioManager() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'haircut',
  });

  useEffect(() => {
    fetchPortfolio();
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

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await barberProfileAPI.getMyPortfolio();
      const portfolio = Array.isArray(response.data) ? response.data : (response.data?.portfolio || []);
      setPortfolio(portfolio);
    } catch (err) {
      toast.error('Failed to load portfolio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedFile(file)) {
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please choose an image first');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title for this image');
      return;
    }

    setUploading(true);
    try {
      await barberProfileAPI.uploadPortfolioImage(
        selectedFile,
        formData.title,
        formData.description,
        formData.category
      );
      
      toast.success('Image uploaded successfully!');
      setFormData({ title: '', description: '', category: 'haircut' });
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl('');
      fetchPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to upload image');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Delete this image from your portfolio?')) return;

    try {
      await barberProfileAPI.deletePortfolioImage(imageId);
      toast.success('Image deleted!');
      fetchPortfolio();
    } catch (err) {
      toast.error('Failed to delete image');
      console.error(err);
    }
  };

  const handleReorder = async (images) => {
    try {
      await barberProfileAPI.updatePortfolioOrder(images);
      toast.success('Order updated!');
    } catch (err) {
      toast.error('Failed to update order');
      console.error(err);
    }
  };

  const moveImage = (index, direction) => {
    const newPortfolio = [...portfolio];
    if (direction === 'up' && index > 0) {
      [newPortfolio[index], newPortfolio[index - 1]] = [newPortfolio[index - 1], newPortfolio[index]];
    } else if (direction === 'down' && index < newPortfolio.length - 1) {
      [newPortfolio[index], newPortfolio[index + 1]] = [newPortfolio[index + 1], newPortfolio[index]];
    }
    setPortfolio(newPortfolio);
    handleReorder(newPortfolio.map((img) => img._id));
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Portfolio Image</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Image Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.g., Fade with Design"
              className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the style, techniques used, etc."
              rows="2"
              className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="haircut">Haircut</option>
              <option value="beard">Beard Design</option>
              <option value="fade">Fade</option>
              <option value="design">Design</option>
              <option value="other">Other</option>
            </select>
          </div>

          <label className="flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-6 cursor-pointer hover:border-purple-500/50 transition">
            <div className="text-center">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Tap or click to choose image</p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP up to 10MB</p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {previewUrl && (
            <div className="space-y-3">
              <img src={previewUrl} alt="Portfolio preview" className="w-full max-w-sm h-40 object-cover rounded-lg border border-slate-700" />
              <button
                type="button"
                onClick={handleFileUpload}
                disabled={uploading}
                className="w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload Portfolio Image'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Grid */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Your Portfolio</h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : portfolio.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8 text-center">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No portfolio images yet. Upload your first work!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {portfolio.map((image, index) => (
              <div
                key={image._id}
                className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 backdrop-blur-xl hover:border-slate-700 transition"
              >
                <div className="flex gap-4">
                  {/* Image Thumbnail */}
                  {image.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{image.title}</h4>
                    {image.description && (
                      <p className="text-sm text-slate-400 mt-1">{image.description}</p>
                    )}
                    {image.category && (
                      <p className="text-xs text-purple-400 mt-2">
                        Category: <span className="capitalize">{image.category}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => moveImage(index, 'up')}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    )}
                    {index < portfolio.length - 1 && (
                      <button
                        onClick={() => moveImage(index, 'down')}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
