import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import type { Video } from '../types';
import styles from './VideoPlayerNew.module.css';
import apiService from '../services/api';

interface VideoPlayerProps {
  video: Video;
  resolution: string;
  isOpen: boolean;
  onClose: () => void;
  resumeTime?: number;
  onProgressUpdate?: (videoId: number, progressSeconds: number, completed: boolean) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  resolution, 
  isOpen, 
  onClose, 
  resumeTime = 0,
  onProgressUpdate 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      console.log('VideoPlayer initialized with:', { videoTitle: video.title, resolution, resumeTime, isOpen });
      setIsInitialized(true);
    }
  }, [isInitialized, video.title, resolution, resumeTime, isOpen]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentResolution, setCurrentResolution] = useState(resolution);
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  // Get video URL for current resolution
  const getVideoUrl = useCallback(() => {
    const videoFile = video.video_files?.find(vf => vf.quality === currentResolution);
    const url = videoFile?.file || '';
    console.log('Getting video URL for resolution:', currentResolution, 'URL:', url);
    return url;
  }, [video.video_files, currentResolution]);

  // Get available qualities
  const getAvailableQualities = () => {
    return video.video_files?.map(vf => vf.quality) || [];
  };

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialisiere Video-URL nur einmal beim Komponenten-Mount
  useEffect(() => {
    const initialUrl = getVideoUrl();
    if (initialUrl) {
      console.log('Setting initial video URL:', initialUrl);
      setVideoUrl(initialUrl);
    }
  }, [video.id, currentResolution]); // Abhängig von video.id und currentResolution

  // Setze Video-src direkt beim ersten Laden
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && videoUrl) {
      console.log('Setting video src to:', videoUrl);
      videoElement.src = videoUrl;
    }
  }, [videoUrl]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      console.log('Video loaded metadata, duration:', video.duration, 'currentTime:', video.currentTime);
      setDuration(video.duration);
      if (resumeTime > 0) {
        console.log('Setting resume time to:', resumeTime);
        video.currentTime = resumeTime;
      }
      setIsLoading(false);
      // Auto-play when video is loaded
      video.play().catch((error) => {
        console.log('Auto-play failed:', error);
        // Auto-play might be blocked by browser policy
      });
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && !isSeeking) {
      // Aktualisiere nur die Zeit, wenn nicht gerade geseekt wird
      if (Math.abs(video.currentTime - currentTime) > 0.5) {
        console.log('Time update: currentTime changed from', currentTime, 'to', video.currentTime);
      }
      setCurrentTime(video.currentTime);
      
      // Save watch progress every 5 seconds
      if (Math.floor(video.currentTime) % 5 === 0 && Math.floor(video.currentTime) !== lastProgressUpdate) {
        setLastProgressUpdate(Math.floor(video.currentTime));
        updateWatchProgress(video.currentTime);
      }
    }
  };

  // Function to update watch progress
  const updateWatchProgress = async (progressSeconds: number) => {
    try {
      const isCompleted = duration > 0 && (progressSeconds / duration) >= 0.9;
      
      console.log('Updating watch progress:', {
        videoId: video.id,
        progressSeconds,
        isCompleted,
        resolution: currentResolution
      });
      
      // Update via API
      const result = await apiService.updateWatchProgress(
        video.id,
        progressSeconds,
        isCompleted,
        currentResolution
      );
      
      console.log('Watch progress updated successfully:', result);
      
      // Call callback if provided
      if (onProgressUpdate) {
        onProgressUpdate(video.id, progressSeconds, isCompleted);
      }
    } catch (error) {
      console.error('Failed to update watch progress:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('API Error response:', (error as any).response?.data);
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => {
    setIsPlaying(false);
    // Save progress when pausing
    const video = videoRef.current;
    if (video) {
      updateWatchProgress(video.currentTime);
    }
  };

  const handleSeeked = () => {
    // Wird aufgerufen, wenn das Seeking abgeschlossen ist
    const video = videoRef.current;
    if (video) {
      console.log('Seeking completed - video currentTime:', video.currentTime, 'duration:', video.duration, 'readyState:', video.readyState);
      
      // Aktualisiere die aktuelle Zeit nur, wenn wir nicht gerade am Seeken sind
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    const video = videoRef.current;
    if (video && !video.paused) {
      setIsPlaying(true);
    }
  };

  // Control functions
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newTime = parseFloat(e.target.value);
      
      console.log('Seeking to:', newTime, 'Duration:', duration, 'ReadyState:', video.readyState, 'Video duration:', video.duration);
      
      // Check seekable ranges
      const seekableRanges = video.seekable;
      console.log('Seekable ranges:', seekableRanges.length);
      for (let i = 0; i < seekableRanges.length; i++) {
        console.log(`Range ${i}: ${seekableRanges.start(i)} - ${seekableRanges.end(i)}`);
      }
      
      // Check buffered ranges
      const bufferedRanges = video.buffered;
      console.log('Buffered ranges:', bufferedRanges.length);
      for (let i = 0; i < bufferedRanges.length; i++) {
        console.log(`Buffered ${i}: ${bufferedRanges.start(i)} - ${bufferedRanges.end(i)}`);
      }
      
      // Prüfe, ob das Video bereit für Seek ist
      if (video.readyState >= 1) { // HAVE_METADATA
        try {
          const oldTime = video.currentTime;
          
          // For longer videos with HTTP Range Request support, allow seeking even with limited seekable ranges
          if (video.duration > 30) {
            const targetTime = newTime;
            const wasPlaying = !video.paused;
            
            // Check if the target time is within seekable ranges
            let canSeek = false;
            for (let i = 0; i < seekableRanges.length; i++) {
              if (targetTime >= seekableRanges.start(i) && targetTime <= seekableRanges.end(i)) {
                canSeek = true;
                break;
              }
            }
            
            // With HTTP Range Request support, we can seek even if seekable range is 0-0
            // The server will handle partial content requests
            if (!canSeek && seekableRanges.length > 0) {
              const firstRange = seekableRanges;
              const rangeStart = firstRange.start(0);
              const rangeEnd = firstRange.end(0);
              
              // If we have a very small seekable range (like 0-0), but the video has duration,
              // we can still try to seek with HTTP Range Request support
              if (rangeEnd - rangeStart < 1 && video.duration > 1) {
                console.log(`Attempting seek with HTTP Range Request support to ${targetTime}`);
                canSeek = true;
              }
            }
            
            if (!canSeek) {
              console.log(`Cannot seek to ${targetTime}, not in seekable ranges`);
              // Try to load more data by setting currentTime to a small value first
              video.currentTime = Math.min(1, video.duration * 0.01);
              
              // Wait a bit for buffering
              setTimeout(() => {
                console.log('Retrying seek after buffer attempt');
                video.currentTime = targetTime;
                setCurrentTime(targetTime);
              }, 500);
              
              return;
            }
            
            console.log(`Can seek to ${targetTime}, proceeding...`);
            
            // Pause the video
            video.pause();
            
            // Try multiple approaches in sequence
            let attempts = 0;
            const maxAttempts = 3;
            
            const attemptSeek = () => {
              attempts++;
              console.log(`Seek attempt ${attempts} to position ${targetTime}`);
              
              // First attempt: try fastSeek if available
              if (attempts === 1 && 'fastSeek' in video && typeof video.fastSeek === 'function') {
                console.log('Using fastSeek for position:', targetTime);
                (video as any).fastSeek(targetTime);
              } else {
                // Regular seek
                console.log('Using regular seek for position:', targetTime);
                video.currentTime = targetTime;
              }
              
              setCurrentTime(targetTime);
              
              // Check after a short delay
              setTimeout(() => {
                const actualTime = video.currentTime;
                const timeDiff = Math.abs(actualTime - targetTime);
                console.log(`After seek attempt ${attempts}: target=${targetTime}, actual=${actualTime}, diff=${timeDiff}`);
                
                if (timeDiff > 1 && attempts < maxAttempts) {
                  console.log(`Seek unsuccessful, trying again...`);
                  attemptSeek();
                } else {
                  console.log(`Seek ${timeDiff <= 1 ? 'successful' : 'failed'} after ${attempts} attempts`);
                  
                  // Final position update
                  setCurrentTime(video.currentTime);
                  
                  // Resume playing if it was playing before
                  if (wasPlaying && !isSeeking) {
                    video.play().catch(err => console.error('Play error after seek:', err));
                  }
                }
              }, 300);
            };
            
            attemptSeek();
            
          } else {
            // For short videos, use the original method
            video.currentTime = newTime;
            setCurrentTime(newTime);
          }
          
          console.log('Seek executed: from', oldTime, 'to', newTime, 'actual currentTime:', video.currentTime);
        } catch (error) {
          console.error('Seek error:', error);
        }
      }
    }
  };

  const handleSeekStart = () => {
    const video = videoRef.current;
    if (video) {
      setIsSeeking(true);
      setWasPlayingBeforeSeek(isPlaying);
      // Pausiere das Video während des Seek-Vorgangs für bessere Performance
      if (isPlaying) {
        video.pause();
      }
    }
  };

  const handleSeekEnd = () => {
    const video = videoRef.current;
    if (video) {
      setIsSeeking(false);
      if (wasPlayingBeforeSeek) {
        video.play().catch(console.error);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newVolume = parseFloat(e.target.value);
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      if (isMuted) {
        video.volume = volume;
        setIsMuted(false);
      } else {
        video.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Function to handle closing with progress save
  const handleClose = () => {
    // Save progress when closing
    const video = videoRef.current;
    if (video) {
      updateWatchProgress(video.currentTime);
    }
    onClose();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changeResolution = (newResolution: string) => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const currentTime = videoElement.currentTime;
      const wasPlaying = isPlaying;
      
      setCurrentResolution(newResolution);
      setIsLoading(true);
      
      // Neue Video-URL aus den verfügbaren Dateien finden
      const videoFile = video.video_files?.find(vf => vf.quality === newResolution);
      if (videoFile) {
        videoElement.src = videoFile.file;
        
        // Event-Handler für das neue Video
        const handleNewVideoCanPlay = () => {
          videoElement.currentTime = currentTime;
          setIsLoading(false);
          if (wasPlaying) {
            videoElement.play().catch(console.error);
          }
          videoElement.removeEventListener('canplay', handleNewVideoCanPlay);
        };
        
        videoElement.addEventListener('canplay', handleNewVideoCanPlay);
      }
    }
    setShowQualityMenu(false);
  };

  // Auto-hide controls
  useEffect(() => {
    let timeoutId: number;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      setShowControls(true);
      if (isPlaying) {
        timeoutId = window.setTimeout(() => setShowControls(false), 3000);
      }
    };

    if (isOpen) {
      resetTimer();
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          const video = videoRef.current;
          if (video) {
            video.currentTime = Math.max(0, video.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          const video2 = videoRef.current;
          if (video2) {
            video2.currentTime = Math.min(duration, video2.currentTime + 10);
          }
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isPlaying, duration]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${styles.videoPlayer}`}>
      <div className="relative w-full h-full">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onCanPlay={handleCanPlay}
          onSeeked={handleSeeked}
          onClick={togglePlayPause}
          onMouseMove={() => setShowControls(true)}
          autoPlay
          preload="auto"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Video Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseEnter={() => setShowControls(true)}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              className={`w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer ${styles.progressBar}`}
              style={{
                '--progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
              } as React.CSSProperties}
            />
            <div className="flex justify-between text-sm text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-gray-300 p-2"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 p-2"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                {currentResolution} • {video.title}
              </div>
              
              {/* Quality Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="text-white hover:text-gray-300 p-2"
                  title="Quality"
                >
                  <Settings className="w-6 h-6" />
                </button>
                
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg p-2 min-w-24">
                    {getAvailableQualities().map((quality) => (
                      <button
                        key={quality}
                        onClick={() => changeResolution(quality)}
                        className={`block w-full text-left px-3 py-1 rounded text-sm ${
                          quality === currentResolution
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 p-2"
                title="Fullscreen"
              >
                <Maximize className="w-6 h-6" />
              </button>
              
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-300 p-2"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
