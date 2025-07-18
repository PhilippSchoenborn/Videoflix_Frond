import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  PasswordResetRequest,
  PasswordReset,
  Video,
  VideoDetail,
  Genre,
  WatchProgress,
  GenreWithVideos,
  VideoStreamData,
  QualityOptions,
  VideoUploadData,
  DashboardStats,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL =
    import.meta.env.VITE_API_BASE_URL ||
    window.location.origin.replace(/:\d+$/, ':8000') + '/api'; // Dynamisch: .env oder Host
  
  private mediaBaseURL = 
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
    window.location.origin.replace(/:\d+$/, ':8000'); // Backend-URL für Media-Dateien

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper function to convert relative media URLs to absolute URLs
  private getFullMediaURL(relativePath: string | null): string | null {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.mediaBaseURL}${relativePath}`;
  }

  // Helper function to process video data and convert media URLs
  private processVideoData(video: any): any {
    const processed = {
      ...video,
      thumbnail: this.getFullMediaURL(video.thumbnail),
      // Process video files if they exist
      video_files: video.video_files?.map((file: any) => ({
        ...file,
        file: this.getFullMediaURL(file.file)
      })) || []
    };
    
    return processed;
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/login/', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/register/', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/logout/');
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    const response = await this.api.post('/password_reset/', data);
    return response.data;
  }

  async resetPassword(uidb64: string, token: string, data: PasswordReset): Promise<{ message: string }> {
    const response = await this.api.post(`/password_confirm/${uidb64}/${token}/`, data);
    return response.data;
  }

  async activateAccount(uidb64: string, token: string): Promise<{ message: string }> {
    const response = await this.api.get(`/activate/${uidb64}/${token}/`);
    return response.data;
  }

  async getUserProfile(): Promise<User> {
    const response = await this.api.get<User>('/profile/');
    return response.data;
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.patch<User>('/profile/', data);
    return response.data;
  }

  // Video Methods
  async getVideos(params?: {
    genre?: number;
    search?: string;
    page?: number;
  }): Promise<Video[]> {
    const response = await this.api.get('/videos/', { 
      params: {
        ...params,
        _t: Date.now() // Cache buster
      }
    });
    
    // Handle paginated response
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results.map((video: any) => this.processVideoData(video));
    }
    // Fallback for non-paginated response
    return response.data.map((video: any) => this.processVideoData(video));
  }

  async getVideoDetail(id: number): Promise<VideoDetail> {
    const response = await this.api.get<VideoDetail>(`/videos/${id}/`);
    return response.data;
  }

  async getFeaturedVideos(): Promise<Video[]> {
    const response = await this.api.get('/videos/featured/');
    // Handle paginated response
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results.map((video: any) => this.processVideoData(video));
    }
    // Fallback for non-paginated response
    return response.data.map((video: any) => this.processVideoData(video));
  }

  async getVideosByGenre(): Promise<GenreWithVideos[]> {
    const response = await this.api.get('/videos/by-genre/');
    return response.data.map((genreGroup: any) => ({
      ...genreGroup,
      videos: genreGroup.videos.map((video: any) => this.processVideoData(video))
    }));
  }

  async uploadVideo(data: VideoUploadData): Promise<Video> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('genre', data.genre.toString());
    formData.append('age_rating', data.age_rating);
    formData.append('video_file', data.video_file);

    const response = await this.api.post<Video>('/videos/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getVideoStream(videoId: number, quality: string): Promise<VideoStreamData> {
    const response = await this.api.get<VideoStreamData>(`/videos/${videoId}/stream/${quality}/`);
    return response.data;
  }

  async getVideoQualityOptions(videoId: number): Promise<QualityOptions> {
    const response = await this.api.get<QualityOptions>(`/videos/${videoId}/qualities/`);
    return response.data;
  }

  // Genre Methods
  async getGenres(): Promise<Genre[]> {
    // Since there's no separate genres endpoint, extract genres from videos
    const videos = await this.getVideos();
    const genreMap = new Map<number, Genre>();
    
    videos.forEach(video => {
      if (video.genre && !genreMap.has(video.genre.id)) {
        genreMap.set(video.genre.id, video.genre);
      }
    });
    
    return Array.from(genreMap.values());
  }

  // Watch Progress Methods
  async getWatchProgress(): Promise<WatchProgress[]> {
    const response = await this.api.get('/videos/progress/');
    // Handle paginated response
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results;
    }
    return response.data;
  }

  async getContinueWatching(): Promise<WatchProgress[]> {
    const response = await this.api.get<WatchProgress[]>('/videos/continue-watching/');
    return response.data;
  }

  async updateWatchProgress(
    videoId: number,
    progressSeconds: number,
    completed: boolean = false,
    resolution?: string
  ): Promise<WatchProgress> {
    const payload: any = { 
      progress_seconds: progressSeconds,
      completed: completed
    };
    
    if (resolution) {
      payload.last_resolution = resolution;
    }
    
    const response = await this.api.post<WatchProgress>(
      `/videos/${videoId}/progress/`,
      payload
    );
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [videos, genres, watchProgress] = await Promise.all([
      this.getVideos(),
      this.getGenres(),
      this.getWatchProgress(),
    ]);

    const completedVideos = watchProgress.filter(wp => wp.completed).length;

    return {
      total_videos: videos.length,
      total_genres: genres.length,
      watch_progress_count: watchProgress.length,
      completed_videos: completedVideos,
    };
  }

  // Email Verification Method
  async verifyEmail(token: string): Promise<{ message: string }> {
    // Fixed: Added /api/ prefix to match backend endpoint
    const response = await this.api.get(`/api/verify-email/${token}/`);
    return response.data;
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  clearAuth(): void {
    localStorage.removeItem('auth_token');
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
