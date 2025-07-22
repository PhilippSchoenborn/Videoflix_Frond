import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import VideoGrid from '../components/VideoGrid';
import SearchBar from '../components/SearchBar';
import VideoDetailModal from '../components/VideoDetailModal';
import VideoPlayer from '../components/VideoPlayerNew';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import type { Video, SearchFilters, Genre, WatchProgress, GenreWithVideos } from '../types';
import apiService from '../services/api';
import { Play, Clock, Star, TrendingUp, Video as VideoIcon, VolumeX, Volume2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  
  // State
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreVideos, setGenreVideos] = useState<GenreWithVideos[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<{ video: Video; quality: string; resumeTime?: number } | null>(null);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const currentHeroVideo = featuredVideos[currentHeroIndex];

  // Hero video rotation
  useEffect(() => {
    if (featuredVideos.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredVideos.length);
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [featuredVideos.length]);

  // Auto-preview logic
  useEffect(() => {
    if (currentHeroVideo && currentHeroVideo.video_files && currentHeroVideo.video_files.length > 0) {
      // Start preview after 2 seconds
      const previewTimer = setTimeout(() => {
        setShowPreviewVideo(true);
      }, 2000);

      return () => clearTimeout(previewTimer);
    }
  }, [currentHeroVideo]);

  // Handle video preview
  useEffect(() => {
    const video = previewVideoRef.current;
    if (video && showPreviewVideo && currentHeroVideo) {
      const handleLoadedData = () => {
        video.currentTime = 0;
        video.muted = previewMuted;
        video.play().catch(console.error);
      };

      const handleTimeUpdate = () => {
        // Stop after 6 seconds and loop
        if (video.currentTime >= 6) {
          video.currentTime = 0;
          video.play().catch(console.error);
        }
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [showPreviewVideo, currentHeroVideo, previewMuted]);

  // Reset preview when hero changes
  useEffect(() => {
    setShowPreviewVideo(false);
  }, [currentHeroIndex]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [videos, featured, genreList, watchProgress, genreWithVideos] = await Promise.all([
          apiService.getVideos().catch(() => []),
          apiService.getFeaturedVideos().catch(() => []),
          apiService.getGenres().catch(() => []),
          apiService.getContinueWatching().catch(() => []),
          apiService.getVideosByGenre().catch(() => []),
        ]);
        
        setAllVideos(videos);
        setFilteredVideos(videos);
        setFeaturedVideos(featured);
        setGenres(genreList);
        setContinueWatching(watchProgress);
        setGenreVideos(genreWithVideos);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, [showToast]);

  // Handle search and filtering
  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    console.log('Dashboard received filters:', filters);
    console.log('All videos count:', allVideos.length);
    
    let filtered = [...allVideos];
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm) ||
        video.description.toLowerCase().includes(searchTerm) ||
        video.genre?.name.toLowerCase().includes(searchTerm)
      );
      console.log('After search filter:', filtered.length);
    }
    
    if (filters.genre) {
      filtered = filtered.filter(video => video.genre?.id === filters.genre);
      console.log('After genre filter:', filtered.length);
    }
    
    if (filters.age_rating) {
      filtered = filtered.filter(video => video.age_rating === filters.age_rating);
      console.log('After age rating filter:', filtered.length);
    }
    
    if (filters.featured) {
      filtered = filtered.filter(video => video.is_featured);
      console.log('After featured filter:', filtered.length);
    }
    
    console.log('Final filtered videos count:', filtered.length);
    setFilteredVideos(filtered);
  }, [allVideos]);

  // Check if any filters are active
  const hasActiveFilters = useCallback((filters: SearchFilters) => {
    return !!(filters.search || filters.genre || filters.age_rating || filters.featured);
  }, []);

  // Store current filters
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

  // Enhanced filter handler
  const handleFiltersChangeEnhanced = useCallback((filters: SearchFilters) => {
    setCurrentFilters(filters);
    handleFiltersChange(filters);
  }, [handleFiltersChange]);

  // Handle video actions
  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleResumeClick = async (video: Video, progress: WatchProgress) => {
    try {
      // Debug: Check what video files are available
      console.log('Video files:', video.video_files);
      
      // Get default quality for resume - prefer highest quality but avoid "original"
      const validQualities: ('1080p' | '720p' | '480p' | '360p' | '120p')[] = ['1080p', '720p', '480p', '360p', '120p'];
      const availableQualities = video.video_files?.map(vf => vf.quality).filter(q => validQualities.includes(q as any)) || [];
      const defaultQuality = availableQualities.length > 0 ? availableQualities[0] : '720p';
      
      console.log('Resume click - Video:', video.title, 'Progress:', progress.progress_seconds, 'Quality:', defaultQuality);
      
      // Start playing video directly with resume time
      setPlayingVideo({ 
        video: video, 
        quality: defaultQuality,
        resumeTime: progress.progress_seconds
      });
      
      showToast(`Resuming "${video.title}" from ${Math.round(progress.progress_percentage || 0)}%`, 'success');
    } catch (error) {
      console.error('Failed to resume video:', error);
      showToast('Failed to resume video', 'error');
    }
  };

  // Function to refresh continue watching data
  const refreshContinueWatching = async () => {
    try {
      const watchProgress = await apiService.getContinueWatching();
      setContinueWatching(watchProgress);
    } catch (error) {
      console.error('Failed to refresh continue watching:', error);
    }
  };

  // Handle progress update from video player
  const handleProgressUpdate = (_videoId: number, _progressSeconds: number, _completed: boolean) => {
    // Refresh continue watching data when progress is updated
    refreshContinueWatching();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Full-width Hero Background */}
      {currentHeroVideo && (
        <div className="fixed inset-0 w-full h-screen overflow-hidden z-0">
          {/* Background Image - shown initially */}
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              showPreviewVideo ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${currentHeroVideo.thumbnail || '/placeholder.jpg'})`
            }}
          />
          
          {/* Video Preview - shown after delay */}
          {showPreviewVideo && currentHeroVideo.video_files && currentHeroVideo.video_files.length > 0 && (
            <video
              ref={previewVideoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              src={currentHeroVideo.video_files[0].file}
              muted={previewMuted}
              playsInline
              preload="metadata"
              style={{ filter: 'brightness(0.7)' }}
            />
          )}
          
          {/* Bottom fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>
        </div>
      )}

      {/* Header - positioned over background */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Header />
      </div>

      {/* Hero Content - positioned over background */}
      {currentHeroVideo && (
        <section className="relative z-10 h-screen flex items-center justify-center">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              {currentHeroVideo.title}
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 drop-shadow-md">
              {currentHeroVideo.description}
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleVideoClick(currentHeroVideo)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg flex items-center space-x-3 transition-colors text-lg font-semibold shadow-lg"
              >
                <Play className="w-6 h-6" />
                <span>Play Now</span>
              </button>
              
              {/* Mute/Unmute Button for Preview */}
              {showPreviewVideo && (
                <button
                  onClick={() => setPreviewMuted(!previewMuted)}
                  className="bg-gray-800/80 hover:bg-gray-700/80 text-white px-4 py-4 rounded-lg flex items-center transition-colors shadow-lg"
                  title={previewMuted ? 'Unmute Preview' : 'Mute Preview'}
                >
                  {previewMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Hero Navigation Dots */}
          {featuredVideos.length > 1 && (
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-3">
              {featuredVideos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentHeroIndex(index)}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    index === currentHeroIndex ? 'bg-purple-500' : 'bg-gray-400/60'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Main Content - positioned above background */}
      <main className="relative z-10 bg-gradient-to-b from-transparent to-black pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters - Better positioned */}
          <div className="mb-8">
            <SearchBar
              genres={genres}
              onFiltersChange={handleFiltersChangeEnhanced}
            />
          </div>

          {/* Show filtered results when filters are active, otherwise show all sections */}
          {hasActiveFilters(currentFilters) ? (
            // Show only filtered results
            <VideoGrid
              title="Search Results"
              videos={filteredVideos}
              icon={VideoIcon}
              onVideoClick={handleVideoClick}
              emptyMessage="No videos found matching your criteria"
            />
          ) : (
            // Show all sections when no filters are active
            <>
              {/* Continue Watching */}
              {continueWatching.length > 0 && (
                <VideoGrid
                  title="Continue Watching"
                  videos={continueWatching.map(wp => wp.video)}
                  watchProgress={continueWatching}
                  showProgress={true}
                  icon={Clock}
                  onVideoClick={handleVideoClick}
                  onResumeClick={handleResumeClick}
                  maxItems={8}
                />
              )}

              {/* Featured Videos */}
              <VideoGrid
                title="Featured Content"
                videos={featuredVideos}
                icon={Star}
                onVideoClick={handleVideoClick}
                maxItems={10}
              />

              {/* All Videos / Search Results */}
              <VideoGrid
                title="All Movies & Shows"
                videos={allVideos}
                icon={VideoIcon}
                onVideoClick={handleVideoClick}
                emptyMessage="No videos available"
              />

              {/* Videos by Genre */}
              {genreVideos.map((genreGroup) => (
                <VideoGrid
                  key={genreGroup.id}
                  title={genreGroup.name}
                  videos={genreGroup.videos}
                  onVideoClick={handleVideoClick}
                  maxItems={8}
                />
              ))}
            </>
          )}

          {/* Quick Stats */}
          <section className="mt-16 mb-8">
            <div className="bg-gray-900 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-purple-400" />
                Video Library
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {allVideos.length}
                  </div>
                  <div className="text-gray-400">Total Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {featuredVideos.length}
                  </div>
                  <div className="text-gray-400">Featured</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {genres.length}
                  </div>
                  <div className="text-gray-400">Genres</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Custom Dashboard Footer - Positioned on the right */}
      <footer className="relative z-10 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-end items-center space-x-8">
            <Link 
              to="/datenschutz" 
              className="text-white hover:text-purple-400 transition-colors duration-300 font-medium text-lg"
            >
              Datenschutz
            </Link>
            <Link 
              to="/impressum" 
              className="text-white hover:text-purple-400 transition-colors duration-300 font-medium text-lg"
            >
              Impressum
            </Link>
          </div>
        </div>
      </footer>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onPlayVideo={async (video, resolution) => {
            try {
              // Set the playing video to open the VideoPlayer
              setPlayingVideo({ video, quality: resolution });
              setSelectedVideo(null);
              showToast(`Starting "${video.title}" in ${resolution}`, 'success');
            } catch (error) {
              console.error('Failed to start video:', error);
              showToast('Failed to start video', 'error');
            }
          }}
        />
      )}

      {/* Video Player */}
      {playingVideo && (
        <VideoPlayer
          video={playingVideo.video}
          resolution={playingVideo.quality as '120p' | '360p' | '480p' | '720p' | '1080p'}
          isOpen={!!playingVideo}
          onClose={() => setPlayingVideo(null)}
          onProgressUpdate={handleProgressUpdate}
          resumeTime={playingVideo.resumeTime || 0}
        />
      )}
    </div>
  );
};

// Export der Komponente
export default Dashboard;