import React, { useState } from 'react';
import { VideoFormat, DownloadProgress } from '../types';
import { Download, Video, Music, FileText, AlertTriangle, Info } from 'lucide-react';

interface FormatSelectorProps {
  formats: VideoFormat[];
  onDownload: (format: VideoFormat) => void;
  downloadProgress: DownloadProgress | null;
  isDownloading: boolean;
  isDemoMode?: boolean;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  formats,
  onDownload,
  downloadProgress,
  isDownloading,
  isDemoMode = false
}) => {
  const [selectedTab, setSelectedTab] = useState<'video' | 'audio'>('video');
  
  const videoFormats = formats.filter(f => f.type === 'video');
  const audioFormats = formats.filter(f => f.type === 'audio');
  
  const activeFormats = selectedTab === 'video' ? videoFormats : audioFormats;
  
  const getQualityColor = (quality: string) => {
    if (quality.includes('1080p') || quality.includes('720p') || quality.includes('2160p') || quality.includes('1440p')) {
      return 'text-purple-600 bg-purple-50 border-purple-200';
    }
    if (quality.includes('480p') || quality.includes('360p') || quality.includes('High')) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (formats.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No download formats available for this video.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
      {isDemoMode && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-amber-800 font-medium">Demo Mode Active</p>
              <p className="text-amber-700">
                Video information is displayed, but downloads require a working backend service. 
                Connect to a video download API to enable actual downloads.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Choose Format & Quality</h3>
        
        {videoFormats.length > 0 && audioFormats.length > 0 && (
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('video')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium transition-all ${
                selectedTab === 'video'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Video className="w-4 h-4 mr-2" />
              Video ({videoFormats.length})
            </button>
            <button
              onClick={() => setSelectedTab('audio')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium transition-all ${
                selectedTab === 'audio'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Music className="w-4 h-4 mr-2" />
              Audio ({audioFormats.length})
            </button>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="space-y-3">
          {activeFormats.map((format, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                isDemoMode 
                  ? 'border-gray-200 bg-gray-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {selectedTab === 'video' ? (
                    <Video className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Music className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getQualityColor(format.quality)}`}>
                        {format.quality}
                      </span>
                      <span className="text-sm text-gray-500">{format.resolution}</span>
                      {isDemoMode && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <FileText className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{format.format}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{format.size}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onDownload(format)}
                disabled={isDownloading}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  isDemoMode
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{isDemoMode ? 'Demo Mode' : 'Download'}</span>
              </button>
            </div>
          ))}
        </div>
        
        {downloadProgress && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Downloading...</span>
              <span className="text-sm text-blue-600">{downloadProgress.percentage}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-blue-600">
              <span>Speed: {downloadProgress.speed}</span>
              <span>ETA: {downloadProgress.eta}</span>
            </div>
          </div>
        )}

        {isDemoMode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to enable downloads:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Set up a video download backend service (like yt-dlp API)</li>
                  <li>Update the backend endpoints in the code</li>
                  <li>Ensure CORS is properly configured</li>
                  <li>Test with a working API endpoint</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormatSelector;