import { VideoInfo, VideoFormat } from '../types';

// Mock implementation to avoid external API dependency
export const analyzeVideo = async (url: string): Promise<VideoInfo> => {
  // Basic URL validation
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format');
  }
  
  if (!isSupportedPlatform(url)) {
    throw new Error('Platform not supported. We support YouTube, Instagram, TikTok, Twitter, and more.');
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Generate mock video data based on platform
  const platform = getPlatformName(url);
  const mockData = generateMockVideoData(url, platform);

  return mockData;
};

const generateMockVideoData = (url: string, platform: string): VideoInfo => {
  const videoTitles = [
    "Amazing Nature Documentary - Wildlife in 4K",
    "How to Build a Modern Web Application",
    "Top 10 Travel Destinations 2024",
    "Cooking Masterclass: Italian Cuisine",
    "Tech Review: Latest Smartphone Features",
    "Fitness Workout: 30-Minute Full Body",
    "Music Video: Indie Rock Compilation",
    "Tutorial: Advanced Photography Tips"
  ];

  const randomTitle = videoTitles[Math.floor(Math.random() * videoTitles.length)];
  const duration = Math.floor(Math.random() * 1800) + 120; // 2-32 minutes

  const formats: VideoFormat[] = [
    {
      quality: '1080p',
      resolution: '1920x1080',
      size: `${(Math.random() * 500 + 100).toFixed(1)} MB`,
      format: 'MP4',
      type: 'video',
      downloadUrl: generateMockDownloadUrl('1080p', 'mp4'),
      formatId: '1080p-mp4'
    },
    {
      quality: '720p',
      resolution: '1280x720',
      size: `${(Math.random() * 300 + 50).toFixed(1)} MB`,
      format: 'MP4',
      type: 'video',
      downloadUrl: generateMockDownloadUrl('720p', 'mp4'),
      formatId: '720p-mp4'
    },
    {
      quality: '480p',
      resolution: '854x480',
      size: `${(Math.random() * 150 + 25).toFixed(1)} MB`,
      format: 'MP4',
      type: 'video',
      downloadUrl: generateMockDownloadUrl('480p', 'mp4'),
      formatId: '480p-mp4'
    },
    {
      quality: 'High',
      resolution: 'Audio Only',
      size: `${(Math.random() * 50 + 5).toFixed(1)} MB`,
      format: 'MP3',
      type: 'audio',
      downloadUrl: generateMockDownloadUrl('high', 'mp3'),
      formatId: 'audio-mp3'
    }
  ];

  return {
    title: randomTitle,
    thumbnail: getMockThumbnail(),
    duration: formatDuration(duration),
    platform: platform,
    formats: formats,
    apiData: {
      mock: true,
      originalUrl: url,
      generatedAt: new Date().toISOString()
    }
  };
};

const generateMockDownloadUrl = (quality: string, format: string): string => {
  // Generate a mock download URL that would work in a real scenario
  // In a real app, this would be the actual download URL from the video service
  const baseUrl = 'https://sample-videos.com/zip/10/mp4/';
  const filename = `sample-${quality}.${format}`;
  return `${baseUrl}${filename}`;
};

const getMockThumbnail = (): string => {
  const thumbnails = [
    'https://images.pexels.com/photos/1144275/pexels-photo-1144275.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1',
    'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1',
    'https://images.pexels.com/photos/1308624/pexels-photo-1308624.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1',
    'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1'
  ];
  
  return thumbnails[Math.floor(Math.random() * thumbnails.length)];
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