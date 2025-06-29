import React from 'react';
import { VideoInfo as VideoInfoType } from '../types';
import { Clock, Eye, Tag } from 'lucide-react';

interface VideoInfoProps {
  videoInfo: VideoInfoType;
}

const VideoInfo: React.FC<VideoInfoProps> = ({ videoInfo }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-full h-48 object-cover rounded-xl shadow-lg"
          />
        </div>
        
        <div className="md:w-2/3 space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {videoInfo.title}
            </h3>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                <span>{videoInfo.platform}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{videoInfo.duration}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center text-green-700">
              <Eye className="w-5 h-5 mr-2" />
              <span className="font-semibold">Video analyzed successfully!</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              Choose your preferred format and quality below
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInfo;