import React, { useState } from 'react';
import { AppState, VideoInfo as VideoInfoType, VideoFormat, DownloadProgress } from './types';
import { analyzeVideo } from './utils/videoAnalyzer';

import Header from './components/Header';
import UrlInput from './components/UrlInput';
import VideoInfo from './components/VideoInfo';
import FormatSelector from './components/FormatSelector';
import ErrorDisplay from './components/ErrorDisplay';
import CompletedDownload from './components/CompletedDownload';
import Footer from './components/Footer';

function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [videoInfo, setVideoInfo] = useState<VideoInfoType | null>(null);
  const [error, setError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const handleUrlSubmit = async (url: string) => {
    setCurrentUrl(url);
    setAppState('analyzing');
    setError('');
    setVideoInfo(null);

    try {
      console.log('Starting video analysis for URL:', url);
      const info = await analyzeVideo(url);
      console.log('Video analysis completed:', info);
      setVideoInfo(info);
      setAppState('ready');
    } catch (err) {
      console.error('Video analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setAppState('error');
    }
  };

  const handleDownload = async (format: VideoFormat) => {
    if (!format.downloadUrl || format.downloadUrl === '#demo') {
      // Handle demo mode
      setError('This is a demo. In a real implementation, the file would be downloaded from: ' + (format.downloadUrl || 'N/A'));
      setAppState('error');
      return;
    }

    setAppState('downloading');
    setDownloadProgress({ percentage: 0, speed: '0 MB/s', eta: 'Preparing...' });

    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = format.downloadUrl;
      link.download = `${videoInfo?.title || 'video'}.${format.format.toLowerCase()}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Simulate download progress for better UX
      const updateProgress = (percentage: number) => {
        const speed = `${(Math.random() * 5 + 1).toFixed(1)} MB/s`;
        const eta = percentage < 90 ? `${Math.floor((100 - percentage) / 10)}m ${Math.floor(Math.random() * 60)}s` : 'Almost done...';
        setDownloadProgress({ percentage, speed, eta });
      };

      // Simulate progressive download
      for (let i = 0; i <= 100; i += Math.floor(Math.random() * 15 + 5)) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
        updateProgress(Math.min(i, 100));
      }

      // Trigger the actual download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Complete download
      setDownloadProgress({ percentage: 100, speed: '0 MB/s', eta: 'Complete!' });
      setTimeout(() => {
        setAppState('completed');
        setDownloadProgress(null);
      }, 1000);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download the file. Please try again.');
      setAppState('error');
      setDownloadProgress(null);
    }
  };

  const handleRetry = () => {
    if (currentUrl) {
      handleUrlSubmit(currentUrl);
    } else {
      setAppState('idle');
    }
  };

  const handleNewDownload = () => {
    setAppState('idle');
    setVideoInfo(null);
    setError('');
    setDownloadProgress(null);
    setCurrentUrl('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {(appState === 'idle' || appState === 'analyzing') && (
            <UrlInput onSubmit={handleUrlSubmit} isAnalyzing={appState === 'analyzing'} />
          )}
          
          {appState === 'error' && (
            <ErrorDisplay error={error} onRetry={handleRetry} />
          )}
          
          {videoInfo && (appState === 'ready' || appState === 'downloading') && (
            <>
              <VideoInfo videoInfo={videoInfo} />
              <FormatSelector
                formats={videoInfo.formats}
                onDownload={handleDownload}
                downloadProgress={downloadProgress}
                isDownloading={appState === 'downloading'}
              />
            </>
          )}
          
          {appState === 'completed' && (
            <CompletedDownload onNewDownload={handleNewDownload} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;