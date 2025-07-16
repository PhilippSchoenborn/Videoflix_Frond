import type { Video, VideoWithProgress } from '../types';

class VideoService {
  // Mock-Daten für die Entwicklung
  private mockVideos: Video[] = [
    {
      id: 1,
      title: 'Beispiel Video 1',
      description: 'Ein tolles Video für die Demonstration',
      thumbnail: '/placeholder-thumbnail.jpg',
      genre: { id: 1, name: 'Action' },
      duration: '3600',
      age_rating: 'FSK 12' as const,
      created_at: new Date().toISOString(),
      is_featured: true,
      video_files: []
    },
    {
      id: 2,
      title: 'Beispiel Video 2',
      description: 'Ein weiteres tolles Video',
      thumbnail: '/placeholder-thumbnail.jpg',
      genre: { id: 2, name: 'Drama' },
      duration: '2400',
      age_rating: 'FSK 16' as const,
      created_at: new Date().toISOString(),
      is_featured: false,
      video_files: []
    },
    {
      id: 3,
      title: 'Komödie Special',
      description: 'Ein lustiges Video zum Entspannen',
      thumbnail: '/placeholder-thumbnail.jpg',
      genre: { id: 3, name: 'Komödie' },
      duration: '1800',
      age_rating: 'FSK 0' as const,
      created_at: new Date().toISOString(),
      is_featured: true,
      video_files: []
    }
  ];

  async getAllVideos(): Promise<Video[]> {
    console.log('VideoService: getAllVideos called');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('VideoService: getAllVideos resolving with', this.mockVideos.length, 'videos');
        resolve(this.mockVideos);
      }, 100);
    });
  }

  async getFeaturedVideos(): Promise<Video[]> {
    console.log('VideoService: getFeaturedVideos called');
    return new Promise((resolve) => {
      setTimeout(() => {
        const featured = this.mockVideos.filter(video => video.is_featured);
        console.log('VideoService: getFeaturedVideos resolving with', featured.length, 'featured videos');
        resolve(featured);
      }, 100);
    });
  }

  async searchVideos(query: string): Promise<Video[]> {
    console.log('VideoService: searchVideos called with query:', query);
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = this.mockVideos.filter(video =>
          video.title.toLowerCase().includes(query.toLowerCase()) ||
          video.description.toLowerCase().includes(query.toLowerCase()) ||
          video.genre.name.toLowerCase().includes(query.toLowerCase())
        );
        console.log('VideoService: searchVideos resolving with', filtered.length, 'results');
        resolve(filtered);
      }, 100);
    });
  }

  // Konvertierungsfunktion für VideoWithProgress
  convertToVideoWithProgress(videos: Video[]): VideoWithProgress[] {
    return videos.map(video => ({
      ...video,
      duration: parseInt(video.duration) || 0
    }));
  }

  // Status-Checker
  isUsingMockData(): boolean {
    return true;
  }
}

// Exportiere Singleton-Instanz
export const videoService = new VideoService();
export default videoService;
