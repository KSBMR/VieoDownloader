import { VideoInfo, VideoFormat } from '../types';

const RAILWAY_API_URL = 'https://videodownloader-production.up.railway.app/download';

export const analyzeVideo = async (url: string): Promise<VideoInfo> => {
  // Basic URL validation
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format');
  }
  
  if (!isSupportedPlatform(url)) {
    throw new Error('Platform not supported. We support YouTube, Instagram, TikTok, Twitter, and more.');
  }

  try {
    console.log('Sending request to Railway API:', RAILWAY_API_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('Railway API response:', data);

    if (data.error) {
      throw new Error(data.error);
    }

    return transformRailwayResponse(data, url);
  } catch (error) {
    console.error('Railway API failed:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
    
    throw new Error('Failed to analyze video. Please try again.');
  }
};

const transformRailwayResponse = (data: any, originalUrl: string): VideoInfo => {
  const formats: VideoFormat[] = [];
  
  // Handle the response structure from your Railway backend
  if (data.formats && Array.isArray(data.formats)) {
    data.formats.forEach((format: any) => {
      formats.push({
        quality: format.quality || format.height ? `${format.height}p` : 'Unknown',
        resolution: format.resolution || (format.width && format.height ? `${format.width}x${format.height}` : 'Unknown'),
        size: formatFileSize(format.filesize) || 'Unknown',
        format: format.ext?.toUpperCase() || 'MP4',
        type: format.vcodec && format.vcodec !== 'none' ? 'video' : 'audio',
        downloadUrl: format.url,
        formatId: format.format_id
      });
    });
  } else if (data.url) {
    // Handle single download URL
    formats.push({
      quality: 'Best Available',
      resolution: 'Unknown',
      size: 'Unknown',
      format: 'MP4',
      type: 'video',
      downloadUrl: data.url,
      formatId: 'single'
    });
  }

  // Sort formats by quality (video first, then audio)
  formats.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'video' ? -1 : 1;
    }
    
    const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', 'High', 'Medium', 'Low'];
    const aIndex = qualityOrder.indexOf(a.quality);
    const bIndex = qualityOrder.indexOf(b.quality);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    return 0;
  });

  return {
    title: data.title || extractTitleFromUrl(originalUrl),
    thumbnail: data.thumbnail || getDefaultThumbnail(),
    duration: formatDuration(data.duration) || 'Unknown',
    platform: getPlatformName(originalUrl),
    formats: formats,
    apiData: data
  };
};

const formatFileSize = (bytes: number | string): string => {
  if (!bytes || bytes === 'Unknown') return 'Unknown';
  
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (isNaN(size)) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let fileSize = size;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
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

const extractTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || 'Video';
  } catch {
    return 'Video';
  }
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