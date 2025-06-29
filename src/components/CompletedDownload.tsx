import React from 'react';
import { CheckCircle, Download, RotateCcw, Info } from 'lucide-react';

interface CompletedDownloadProps {
  onNewDownload: () => void;
}

const CompletedDownload: React.FC<CompletedDownloadProps> = ({ onNewDownload }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-200">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Download Simulation Complete!
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-blue-800 font-medium text-sm">Demo Mode</p>
              <p className="text-blue-700 text-sm">
                This is a demonstration. In a real application, your file would be downloaded to your device. 
                To make this functional, connect it to a real video download backend service.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNewDownload}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Try Another Video</span>
          </button>
          
          <button
            onClick={onNewDownload}
            className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletedDownload;