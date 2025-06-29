import { VideoInfo, VideoFormat } from '../types';

export const analyzeVideo = async (url: string): Promise<VideoInfo> => {
  // Basic URL validation
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format');
  }
  
  if (!isSupportedPlatform(url)) {
    throw new Error('Platform not supported. We support YouTube, Instagram, TikTok, Twitter, and more.');
  }

  try {
    console.log('Sending request to backend:', url);
    
    // Call your actual backend API
    const response = await fetch('https://vieodownloader-production.up.railway.app/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);

    // Transform backend response to our VideoInfo format
    return transformBackendResponse(data, url);
    
  } catch (error) {
    console.error('API call failed:', error);
    
    // If backend fails, show helpful error message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to video analysis service. Please check your internet connection.');
    }
    
    throw error;
  }
};

const transformBackendResponse = (backendData: any, originalUrl: string): VideoInfo => {
  // Transform your backend response format to match our VideoInfo interface
  // Adjust this based on your actual backend response structure
  
  const formats: VideoFormat[] = [];
  
  // Handle video formats
  if (backendData.formats) {
    backendData.formats.forEach((format: any) => {
      formats.push({
        quality: format.quality || format.height + 'p' || 'Unknown',
        resolution: format.resolution || `${format.width}x${format.height}` || 'Unknown',
        size: format.filesize ? formatFileSize(format.filesize) : 'Unknown',
        format: format.ext?.toUpperCase() || 'MP4',
        type: format.vcodec && format.vcodec !== 'none' ? 'video' : 'audio',
        downloadUrl: format.url,
        formatId: format.format_id
      });
    });
  }

  // Handle audio-only formats
  if (backendData.audio_formats) {
    backendData.audio_formats.forEach((format: any) => {
      formats.push({
        quality: format.abr ? `${format.abr}kbps` : 'Audio',
        resolution: 'Audio Only',
        size: format.filesize ? formatFileSize(format.filesize) : 'Unknown',
        format: format.ext?.toUpperCase() || 'MP3',
        type: 'audio',
        downloadUrl: format.url,
        formatId: format.format_id
      });
    });
  }

  return {
    title: backendData.title || 'Unknown Title',
    thumbnail: backendData.thumbnail || getDefaultThumbnail(),
    duration: formatDuration(backendData.duration),
    platform: getPlatformName(originalUrl),
    formats: formats,
    apiData: backendData
  };
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDuration = (seconds: number | string): string => {
  if (!seconds) return 'Unknown';
  
  const duration = typeof seconds === 'string' ? parseInt(seconds) : seconds;
  if (isNaN(duration)) return 'Unknown';
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const secs = duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const getDefaultThumbnail = (): string => {
  return 'https://images.pexels.com/photos/1144275/pexels-photo-1144275.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1';
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isSupportedPlatform = (url: string): boolean => {
  const supportedDomains = [
    'youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 
    'twitter.com', 'x.com', 'facebook.com', 'fb.watch',
    'vimeo.com', 'dailymotion.com', 'twitch.tv'
  ];
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return supportedDomains.some(supported => domain.includes(supported));
  } catch {
    return false;
  }
};

const getPlatformName = (url: string): string => {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (domain.includes('youtube') || domain.includes('youtu.be')) return 'YouTube';
    if (domain.includes('facebook') || domain.includes('fb.watch')) return 'Facebook';
    if (domain.includes('instagram')) return 'Instagram';
    if (domain.includes('tiktok')) return 'TikTok';
    if (domain.includes('twitter') || domain.includes('x.com')) return 'Twitter/X';
    if (domain.includes('vimeo')) return 'Vimeo';
    if (domain.includes('dailymotion')) return 'Dailymotion';
    if (domain.includes('twitch')) return 'Twitch';
    return 'Unknown Platform';
  } catch {
    return 'Unknown Platform';
  }
};

// Keep the old function for backward compatibility
export const simulateVideoAnalysis = analyzeVideo;