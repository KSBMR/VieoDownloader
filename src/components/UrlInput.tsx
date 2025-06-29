import React, { useState } from 'react';
import { Link, Search } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isAnalyzing: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, isAnalyzing }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <Link className="w-16 h-16 mx-auto mb-4 text-blue-600 bg-blue-50 rounded-2xl p-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Paste Your Video Link
        </h2>
        <p className="text-gray-600">
          Supports YouTube, Facebook, Instagram, TikTok, and more
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-4 pr-12 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
            disabled={isAnalyzing}
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        <button
          type="submit"
          disabled={!url.trim() || isAnalyzing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              <span>Analyzing Video... (up to 15 seconds)</span>
            </div>
          ) : (
            'Get Download Links'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Supported platforms: YouTube, Facebook, Instagram, TikTok, Twitter, Vimeo, and more</p>
        {isAnalyzing && (
          <p className="mt-2 text-blue-600">
            Please wait while we fetch the video information. This may take some time depending on the video source.
          </p>
        )}
      </div>
    </div>
  );
};

export default UrlInput;