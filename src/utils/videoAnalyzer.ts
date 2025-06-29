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
    
    // Primary backend - your Railway service
    const railwayBackend = 'https://vieodownloader-production.up.railway.app/download';
    
    let railwayError: Error | null = null;
    let backendAvailable = false;
    
    try {
      console.log('Calling Railway backend:', railwayBackend);
      
      // First, test if the backend is reachable with a simple health check
      try {
        const healthResponse = await fetch(railwayBackend.replace('/download', '/health'), {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log('Health check response:', healthResponse.status);
      } catch (healthError) {
        console.warn('Health check failed, proceeding with main request:', healthError);
      }
      
      const response = await fetch(railwayBackend, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'User-Agent': 'VideoGrab-WebApp/1.0'
        },
        body: JSON.stringify({ 
          url: url,
          format: 'best',
          quality: 'best'
        }),
        signal: AbortSignal.timeout(30000) // Increased timeout for video processing
      });

      console.log('Railway response status:', response.status);
      console.log('Railway response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Railway backend error:', response.status, errorText);
        
        // Handle specific HTTP errors
        if (response.status === 404) {
          throw new Error('Backend endpoint not found - check if the service is properly deployed');
        } else if (response.status === 500) {
          throw new Error('Backend server error - the service may be experiencing issues');
        } else if (response.status === 403) {
          throw new Error('Access forbidden - CORS or authentication issue');
        } else {
          throw new Error(`Backend service returned error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Railway backend response:', data);
      
      // Check if we got valid data
      if (data && (data.title || data.info || data.formats || data.download_url)) {
        backendAvailable = true;
        return transformRailwayResponse(data, url);
      } else {
        throw new Error('Invalid response format from backend - no video data received');
      }
      
    } catch (error) {
      railwayError = error instanceof Error ? error : new Error('Railway backend failed');
      console.error('Railway backend failed:', railwayError);
      
      // Provide specific error messages based on error type
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('Network error detected - likely CORS, network, or backend unavailable');
        railwayError = new Error('Cannot connect to backend service. This could be due to:\n• CORS configuration issues\n• Backend service is down or sleeping\n• Network connectivity problems\n• Firewall blocking the request');
      } else if (error instanceof Error && error.name === 'AbortError') {
        railwayError = new Error('Request timed out - the backend service is taking too long to respond');
      }
    }

    // Try alternative backends as fallback
    console.log('Attempting fallback backends...');
    const fallbackEndpoints = [
      {
        url: 'https://api.cobalt.tools/api/json',
        type: 'cobalt'
      }
    ];

    for (const backend of fallbackEndpoints) {
      try {
        console.log(`Trying fallback backend: ${backend.url}`);
        
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
        }

        if (response && response.ok) {
          const data = await response.json();
          console.log('Fallback backend response:', data);
          backendAvailable = true;
          return transformBackendResponse(data, url, backend.type);
        }
        
      } catch (fallbackError) {
        console.warn(`Fallback backend ${backend.url} failed:`, fallbackError);
        continue;
      }
    }

    // If all backends fail, provide demo mode with helpful error message
    console.log('All backends failed, entering demo mode');
    
    // Try to extract basic video info for demo mode
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      try {
        const demoInfo = await extractYouTubeInfo(url);
        // Add error context to demo info
        demoInfo.apiData = {
          ...demoInfo.apiData,
          backendError: railwayError?.message || 'Backend services unavailable',
          demoMode: true,
          errorDetails: 'Backend service connection failed. Video information is shown in demo mode.',
          troubleshooting: {
            railwayUrl: railwayBackend,
            errorType: railwayError?.name || 'Unknown',
            suggestions: [
              'Check if the Railway service is running and deployed',
              'Verify CORS settings allow requests from this domain',
              'Ensure the backend endpoint URL is correct',
              'Check network connectivity and firewall settings'
            ]
          }
        };
        return demoInfo;
      } catch (demoError) {
        console.error('Demo mode extraction failed:', demoError);
      }
    }
    
    // Final fallback - create basic demo info with detailed error
    return createFallbackVideoInfo(url, railwayError?.message || 'All backend services are currently unavailable');
    
  } catch (error) {
    console.error('Video analysis failed:', error);
    
    // If it's a validation error, throw it directly
    if (error instanceof Error && (error.message.includes('Invalid URL') || error.message.includes('Platform not supported'))) {
      throw error;
    }
    
    // For other errors, try to provide a fallback
    try {
      return createFallbackVideoInfo(url, error instanceof Error ? error.message : 'Unknown error occurred');
    } catch (fallbackError) {
      // If even fallback fails, throw a user-friendly error
      throw new Error('Unable to analyze video. Please check the URL and try again.');
    }
  }
};

const createFallbackVideoInfo = (url: string, errorMessage: string): VideoInfo => {
  const platform = getPlatformName(url);
  const videoId = extractYouTubeVideoId(url) || 'unknown';
  
  return {
    title: `${platform} Video`,
    thumbnail: url.includes('youtube') ? getYouTubeThumbnail(url) : getDefaultThumbnail(),
    duration: 'Unknown',
    platform: platform,
    formats: generateDemoFormats(videoId, url),
    apiData: {
      source: 'fallback-demo',
      originalUrl: url,
      demoMode: true,
      backendError: errorMessage,
      errorDetails: 'Backend service is currently unavailable. Video information is displayed in demo mode only.',
      troubleshooting: {
        message: 'To enable downloads, ensure your backend service is running and accessible',
        commonIssues: [
          'Backend service not deployed or crashed',
          'CORS not configured for this domain',
          'Network connectivity issues',
          'Incorrect backend URL'
        ]
      }
    }
  };
};

const transformRailwayResponse = (data: any, originalUrl: string): VideoInfo => {
  console.log('Transforming Railway response:', data);
  
  const formats: VideoFormat[] = [];
  
  // Handle different possible response formats from your Railway backend
  let videoInfo = data.info || data;
  let videoFormats = data.formats || videoInfo.formats || [];
  
  // If formats is not an array, try to extract from different structures
  if (!Array.isArray(videoFormats)) {
    if (data.download_url || data.url) {
      // Single download URL format
      formats.push({
        quality: 'Best Available',
        resolution: 'Original',
        size: 'Unknown',
        format: 'MP4',
        type: 'video',
        downloadUrl: data.download_url || data.url,
        formatId: 'railway-video'
      });
    } else if (data.video_url) {
      formats.push({
        quality: 'Video',
        resolution: 'Original',
        size: 'Unknown',
        format: 'MP4',
        type: 'video',
        downloadUrl: data.video_url,
        formatId: 'railway-video'
      });
    }
    
    if (data.audio_url) {
      formats.push({
        quality: 'Audio',
        resolution: 'Audio Only',
        size: 'Unknown',
        format: 'MP3',
        type: 'audio',
        downloadUrl: data.audio_url,
        formatId: 'railway-audio'
      });
    }
  } else {
    // Handle array of formats
    videoFormats.forEach((format: any, index: number) => {
      if (format.url || format.download_url) {
        formats.push({
          quality: format.quality || format.format_note || (format.height ? format.height + 'p' : 'Unknown'),
          resolution: format.resolution || (format.width && format.height ? `${format.width}x${format.height}` : 'Unknown'),
          size: format.filesize ? formatFileSize(format.filesize) : 'Unknown',
          format: (format.ext || format.format || 'mp4').toUpperCase(),
          type: format.vcodec && format.vcodec !== 'none' ? 'video' : 'audio',
          downloadUrl: format.url || format.download_url,
          formatId: format.format_id || `railway-${index}`
        });
      }
    });
  }

  // If no formats found, create demo formats but with actual video info
  if (formats.length === 0) {
    console.warn('No download formats found in Railway response, creating demo formats');
    const videoId = extractYouTubeVideoId(originalUrl);
    formats.push(...generateDemoFormats(videoId || 'unknown', originalUrl));
  }

  return {
    title: videoInfo.title || data.title || extractTitleFromUrl(originalUrl),
    thumbnail: videoInfo.thumbnail || data.thumbnail || getYouTubeThumbnail(originalUrl),
    duration: formatDuration(videoInfo.duration || data.duration),
    platform: getPlatformName(originalUrl),
    formats: formats,
    apiData: {
      source: 'railway',
      originalData: data,
      hasRealDownloads: formats.some(f => f.downloadUrl && !f.demoMode),
      backendConnected: true
    }
  };
};

const getYouTubeThumbnail = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return getDefaultThumbnail();
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
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
        signal: AbortSignal.timeout(5000)
      });
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