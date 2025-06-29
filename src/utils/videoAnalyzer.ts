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
    
    // Try working backend services
    const backendEndpoints = [
      {
        url: 'https://api.cobalt.tools/api/json',
        type: 'cobalt'
      },
      {
        url: 'https://vieodownloader-production.up.railway.app/download',
        type: 'standard'
      },
      // Add your own backend URL here:
      // {
      //   url: 'YOUR_BACKEND_URL/download',
      //   type: 'standard'
      // }
    ];

    for (const backend of backendEndpoints) {
      try {
        console.log(`Trying backend: ${backend.url}`);
        
        let response;
        if (backend.type === 'cobalt') {
          response = await fetch(backend.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ 
              url: url,
              vCodec: 'h264',
              vQuality: '720',
              aFormat: 'mp3',
              filenamePattern: 'classic',
              isAudioOnly: false
            }),
            signal: AbortSignal.timeout(15000)
          });
        } else {
          response = await fetch(backend.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ url }),
            signal: AbortSignal.timeout(15000)
          });
        }

        if (!response.ok) {
          console.warn(`Backend ${backend.url} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log('Backend response:', data);
        
        // Check if we got valid download data
        if (data && (data.url || data.formats || data.title)) {
          return transformBackendResponse(data, url, backend.type);
        }
        
      } catch (backendError) {
        console.warn(`Backend ${backend.url} failed:`, backendError);
        continue;
      }
    }

    // If all backends fail, extract basic info but show demo mode
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return await extractYouTubeInfo(url);
    }
    
    throw new Error('Unable to connect to video download services. Please try again later.');
    
  } catch (error) {
    console.error('Video analysis failed:', error);
    throw error;
  }
};

const extractYouTubeInfo = async (url: string): Promise<VideoInfo> => {
  try {
    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Try to get basic info using YouTube oEmbed API
    try {
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        
        return {
          title: oembedData.title || 'YouTube Video',
          thumbnail: oembedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          duration: 'Unknown',
          platform: 'YouTube',
          formats: generateDemoFormats(videoId, url),
          apiData: {
            source: 'demo-mode',
            videoId: videoId,
            originalUrl: url,
            oembedData: oembedData,
            demoMode: true
          }
        };
      }
    } catch (oembedError) {
      console.warn('YouTube oEmbed failed:', oembedError);
    }

    // Fallback: Create basic info with video ID
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 'Unknown',
      platform: 'YouTube',
      formats: generateDemoFormats(videoId, url),
      apiData: {
        source: 'demo-mode',
        videoId: videoId,
        originalUrl: url,
        demoMode: true
      }
    };

  } catch (error) {
    throw new Error('Failed to extract YouTube video information');
  }
};

const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

const generateDemoFormats = (videoId: string, originalUrl: string): VideoFormat[] => {
  // Generate demo formats that will show a message instead of downloading
  return [
    {
      quality: '1080p',
      resolution: '1920x1080',
      size: 'Unknown',
      format: 'MP4',
      type: 'video',
      downloadUrl: null, // No download URL available
      formatId: 'demo-1080p',
      demoMode: true,
      originalUrl: originalUrl
    },
    {
      quality: '720p',
      resolution: '1280x720',
      size: 'Unknown',
      format: 'MP4',
      type: 'video',
      downloadUrl: null,
      formatId: 'demo-720p',
      demoMode: true,
      originalUrl: originalUrl
    },
    {
      quality: '480p',
      resolution: '854x480',
      size: 'Unknown',
      format: 'MP4',
      type: 'video',
      downloadUrl: null,
      formatId: 'demo-480p',
      demoMode: true,
      originalUrl: originalUrl
    },
    {
      quality: '128kbps',
      resolution: 'Audio Only',
      size: 'Unknown',
      format: 'MP3',
      type: 'audio',
      downloadUrl: null,
      formatId: 'demo-audio',
      demoMode: true,
      originalUrl: originalUrl
    }
  ];
};

const transformBackendResponse = (backendData: any, originalUrl: string, backendType: string): VideoInfo => {
  const formats: VideoFormat[] = [];
  
  // Handle Cobalt API response
  if (backendType === 'cobalt') {
    if (backendData.status === 'success' || backendData.status === 'redirect') {
      formats.push({
        quality: 'Best Available',
        resolution: 'Original',
        size: 'Unknown',
        format: getFormatFromUrl(backendData.url) || 'MP4',
        type: 'video',
        downloadUrl: backendData.url,
        formatId: 'cobalt-video'
      });
    } else if (backendData.status === 'error') {
      throw new Error(backendData.text || 'Video processing failed');
    }
    
    return {
      title: backendData.filename || extractTitleFromUrl(originalUrl),
      thumbnail: backendData.thumbnail || getDefaultThumbnail(),
      duration: 'Unknown',
      platform: getPlatformName(originalUrl),
      formats: formats,
      apiData: { source: 'cobalt', ...backendData }
    };
  }

  // Handle standard backend response
  if (backendData.formats && Array.isArray(backendData.formats)) {
    backendData.formats.forEach((format: any) => {
      if (format.url) {
        formats.push({
          quality: format.quality || (format.height ? format.height + 'p' : 'Unknown'),
          resolution: format.resolution || (format.width && format.height ? `${format.width}x${format.height}` : 'Unknown'),
          size: format.filesize ? formatFileSize(format.filesize) : 'Unknown',
          format: format.ext?.toUpperCase() || 'MP4',
          type: format.vcodec && format.vcodec !== 'none' ? 'video' : 'audio',
          downloadUrl: format.url,
          formatId: format.format_id || `format-${formats.length}`
        });
      }
    });
  }

  // If no formats found, return demo mode
  if (formats.length === 0) {
    const videoId = extractYouTubeVideoId(originalUrl);
    return {
      title: backendData.title || extractTitleFromUrl(originalUrl),
      thumbnail: backendData.thumbnail || getDefaultThumbnail(),
      duration: formatDuration(backendData.duration),
      platform: getPlatformName(originalUrl),
      formats: generateDemoFormats(videoId || 'unknown', originalUrl),
      apiData: { ...backendData, demoMode: true }
    };
  }

  return {
    title: backendData.title || extractTitleFromUrl(originalUrl),
    thumbnail: backendData.thumbnail || getDefaultThumbnail(),
    duration: formatDuration(backendData.duration),
    platform: getPlatformName(originalUrl),
    formats: formats,
    apiData: backendData
  };
};

const getFormatFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    if (pathname.includes('.mp4')) return 'MP4';
    if (pathname.includes('.mp3')) return 'MP3';
    if (pathname.includes('.webm')) return 'WEBM';
    if (pathname.includes('.m4a')) return 'M4A';
    return null;
  } catch {
    return null;
  }
};

const extractTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube')) {
      return 'YouTube Video';
    }
    if (urlObj.hostname.includes('instagram')) {
      return 'Instagram Video';
    }
    if (urlObj.hostname.includes('tiktok')) {
      return 'TikTok Video';
    }
    return 'Video';
  } catch {
    return 'Video';
  }
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