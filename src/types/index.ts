export interface VideoFormat {
  quality: string;
  resolution: string;
  size: string;
  format: string;
  type: 'video' | 'audio';
  downloadUrl?: string | null;
  formatId?: string;
  demoMode?: boolean;
  originalUrl?: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  formats: VideoFormat[];
  apiData?: any; // Store original API response
}

export interface DownloadProgress {
  percentage: number;
  speed: string;
  eta: string;
}

export type AppState = 'idle' | 'analyzing' | 'ready' | 'downloading' | 'completed' | 'error';