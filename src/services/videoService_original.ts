import { apiService } from './api';
import type { Video, VideoWithProgress, Genre } from '../types';

class VideoService {
  private useMockData = true; // Standardmäßig Mock-Daten verwenden
  private backendChecked = false;

  constructor() {
    // Nicht im Constructor prüfen, sondern bei der ersten Verwendung
  }

  private async checkBackendAvailability(): Promise<void> {
    if (this.backendChecked) return;
    
    try {
      await apiService.getVideos();
      this.useMockData = false;
      console.log('Backend verfügbar, verwende echte API');
    } catch (error) {
      console.warn('Backend nicht verfügbar, verwende Mock-Daten');
      this.useMockData = true;
    } finally {
      this.backendChecked = true;
    }
  }

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

  private mockGenres: Genre[] = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Drama' },
    { id: 3, name: 'Komödie' }
  ];

  async getAllVideos(): Promise<Video[]> {
    await this.checkBackendAvailability();
    
    if (this.useMockData) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.mockVideos), 500);
      });
    }
    
    try {
      return await apiService.getVideos();
    } catch (error) {
      console.warn('API error, falling back to mock data:', error);
      this.useMockData = true;
      return this.mockVideos;
    }
  }

  async getFeaturedVideos(): Promise<Video[]> {
    await this.checkBackendAvailability();
    
    if (this.useMockData) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const featured = this.mockVideos.filter(video => video.is_featured);
          resolve(featured);
        }, 500);
      });
    }
    
    try {
      return await apiService.getFeaturedVideos();
    } catch (error) {
      console.warn('API error, falling back to mock data:', error);
      this.useMockData = true;
      return this.mockVideos.filter(video => video.is_featured);
    }
  }

  async getGenres(): Promise<Genre[]> {
    if (this.useMockData) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.mockGenres), 300);
      });
    }
    
    try {
      return await apiService.getGenres();
    } catch (error) {
      console.warn('API error, falling back to mock data:', error);
      this.useMockData = true;
      return this.mockGenres;
    }
  }

  async searchVideos(query: string): Promise<Video[]> {
    await this.checkBackendAvailability();
    
    if (this.useMockData) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const filtered = this.mockVideos.filter(video =>
            video.title.toLowerCase().includes(query.toLowerCase()) ||
            video.description.toLowerCase().includes(query.toLowerCase()) ||
            video.genre.name.toLowerCase().includes(query.toLowerCase())
          );
          resolve(filtered);
        }, 300);
      });
    }
    
    try {
      return await apiService.getVideos({ search: query });
    } catch (error) {
      console.warn('API error, falling back to mock data:', error);
      this.useMockData = true;
      return this.mockVideos.filter(video =>
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        video.genre.name.toLowerCase().includes(query.toLowerCase())
      );
    }
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
    return this.useMockData;
  }

  // Backend-Status aktualisieren
  async refreshBackendStatus(): Promise<void> {
    await this.checkBackendAvailability();
  }
}

// Exportiere Singleton-Instanz
export const videoService = new VideoService();
export default videoService;
