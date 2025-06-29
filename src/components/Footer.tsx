import React from 'react';
import { Heart, Github, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-600 mb-4">
            <span>Made with</span>
            <Heart className="w-4 h-4 mx-2 text-red-500 fill-current" />
            <span>for content creators</span>
          </div>
          
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
          
          <p className="text-sm text-gray-500">
            Please respect content creators' rights and platform terms of service.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;