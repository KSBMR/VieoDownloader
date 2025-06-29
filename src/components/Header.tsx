import React from 'react';
import { Download, Shield, Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Download className="w-12 h-12 mr-3" />
            <h1 className="text-4xl font-bold">VideoGrab</h1>
          </div>
          <p className="text-xl text-blue-100 mb-6">
            Download videos and audio from your favorite platforms
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              <span>Multiple Formats</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;