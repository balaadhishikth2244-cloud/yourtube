export interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoUrl: string;
  views: number;
  duration: string;
  description: string;
}

export const videos: Video[] = [];