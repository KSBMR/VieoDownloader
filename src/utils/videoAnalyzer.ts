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
    console.log('Analyzing video URL:', url);
    
    // Try to call the actual backend API first
    try {
      const response = await fetch('https://vieodownloader-production.up.railway.app/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      return transformBackendResponse(data, url);
      
    } catch (backendError) {
      console.warn('Backend unavailable, using mock data:', backendError);
      
      // Fall back to mock implementation for development
      return await simulateVideoAnalysis(url);
    }
    
  } catch (error) {
    console.error('Video analysis failed:', error);
    throw error;
  }
};

const simulateVideoAnalysis = async (url: string): Promise<VideoInfo> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  const platform = getPlatformName(url);
  const mockTitle = generateMockTitle(platform);
  
  // Generate realistic mock formats based on platform
  const formats = generateMockFormats(platform);
  
  return {
    title: mockTitle,
    thumbnail: getMockThumbnail(platform),
    duration: generateMockDuration(),
    platform: platform,
    formats: formats,
    apiData: {
      mock: true,
      originalUrl: url,
      timestamp: new Date().toISOString()
    }
  };
};

const generateMockTitle = (platform: string): string => {
  const titles = {
    'YouTube': [
      'Amazing Tutorial: Learn Something New Today',
      'Top 10 Tips for Better Productivity',
      'Relaxing Music for Study and Work',
      'How to Build Amazing Projects',
      'The Ultimate Guide to Success'
    ],
    'Instagram': [
      'Beautiful Sunset Timelapse',
      'Behind the Scenes Content',
      'Daily Life Moments',
      'Creative Art Process',
      'Travel Adventure Highlights'
    ],
    'TikTok': [
      'Viral Dance Challenge',
      'Quick Life Hack',
      'Funny Pet Moments',
      'DIY Project Tutorial',
      'Trending Comedy Skit'
    ],
    'Twitter/X': [
      'Breaking News Update',
      'Interesting Thread Discussion',
      'Live Event Coverage',
      'Quick Announcement',
      'Community Highlights'
    ]
  };
  
  const platformTitles = titles[platform as keyof typeof titles] || titles['YouTube'];
  return platformTitles[Math.floor(Math.random() * platformTitles.length)];
};

const getMockThumbnail = (platform: string): string => {
  const thumbnails = {
    'YouTube': 'https://images.pexels.com/photos/1144275/pexels-photo-1144275.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1',
    'Instagram': 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1',
    'TikTok': 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1',
    'Twitter/X': 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=480&h=270&dpr=1'
  };
  
  return thumbnails[platform as keyof typeof thumbnails] || thumbnails['YouTube'];
};

const generateMockDuration = (): string => {
  const durations = ['0:30', '1:45', '3:22', '5:17', '8:43', '12:05', '15:30'];
  return durations[Math.floor(Math.random() * durations.length)];
};

const generateMockFormats = (platform: string): VideoFormat[] => {
  const baseFormats: VideoFormat[] = [
    {
      quality: '1080p',
      resolution: '1920x1080',
      size: '45.2 MB',
      format: 'MP4',
      type: 'video',
      downloadUrl: createMockDownloadUrl('1080p', 'mp4'),
      formatId: 'mock-1080p'
    },
    {
      quality: '720p',
      resolution: '1280x720',
      size: '28.7 MB',
      format: 'MP4',
      type: 'video',
      downloadUrl: createMockDownloadUrl('720p', 'mp4'),
      formatId: 'mock-720p'
    },
    {
      quality: '480p',
      resolution: '854x480',
      size: '18.3 MB',
      format: 'MP4',
      type: 'video',
      downloadUrl: createMockDownloadUrl('480p', 'mp4'),
      formatId: 'mock-480p'
    },
    {
      quality: '128kbps',
      resolution: 'Audio Only',
      size: '3.2 MB',
      format: 'MP3',
      type: 'audio',
      downloadUrl: createMockDownloadUrl('audio', 'mp3'),
      formatId: 'mock-audio'
    }
  ];

  // Adjust formats based on platform
  if (platform === 'TikTok' || platform === 'Instagram') {
    // Mobile-first platforms typically have different aspect ratios
    return baseFormats.map(format => ({
      ...format,
      resolution: format.type === 'video' ? 
        format.quality === '1080p' ? '1080x1920' :
        format.quality === '720p' ? '720x1280' :
        '480x854' : format.resolution
    }));
  }

  return baseFormats;
};

const createMockDownloadUrl = (quality: string, format: string): string => {
  // Create a data URL that will trigger a download of a small text file
  // This simulates the download functionality for development purposes
  const content = `Mock ${quality} ${format.toUpperCase()} file\nGenerated for development testing\nTimestamp: ${new Date().toISOString()}`;
  const blob = new Blob([content], { type: 'text/plain' });
  return URL.createObjectURL(blob);
};

const transformBackendResponse = (backendData: any, originalUrl: string): VideoInfo => {
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