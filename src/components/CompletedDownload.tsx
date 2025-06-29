import React from 'react';
import { CheckCircle, Download, RotateCcw } from 'lucide-react';

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
          Download Started!
        </h3>
        
        <p className="text-green-600 mb-6">
          Your file download has been initiated. Check your browser's download folder.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNewDownload}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Another</span>
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