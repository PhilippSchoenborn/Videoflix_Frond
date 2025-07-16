import React, { useState, useRef, useEffect } from 'react';
import type { VideoWithProgress } from '../types';
import styles from './ScrollableVideoList.module.css';

interface ScrollableVideoListProps {
  videos: VideoWithProgress[];
  title: string;
  onVideoSelect: (video: VideoWithProgress) => void;
  className?: string;
}

export const ScrollableVideoList: React.FC<ScrollableVideoListProps> = ({
  videos,
  title,
  onVideoSelect,
  className = '',
}: ScrollableVideoListProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videosPerView, setVideosPerView] = useState(4);

  useEffect(() => {
    const updateVideosPerView = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const videoWidth = 300; // Approximate width of each video item
        const calculatedVideosPerView = Math.floor(containerWidth / videoWidth);
        setVideosPerView(Math.max(1, calculatedVideosPerView));
      }
    };

    updateVideosPerView();
    window.addEventListener('resize', updateVideosPerView);
    return () => window.removeEventListener('resize', updateVideosPerView);
  }, []);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < videos.length - videosPerView;

  const scrollLeft = () => {
    if (canScrollLeft && !isScrolling) {
      setIsScrolling(true);
      setCurrentIndex(Math.max(0, currentIndex - videosPerView));
      setTimeout(() => setIsScrolling(false), 300);
    }
  };

  const scrollRight = () => {
    if (canScrollRight && !isScrolling) {
      setIsScrolling(true);
      setCurrentIndex(Math.min(videos.length - videosPerView, currentIndex + videosPerView));
      setTimeout(() => setIsScrolling(false), 300);
    }
  };

  const handleVideoClick = (video: VideoWithProgress) => {
    onVideoSelect(video);
  };

  const getProgressPercentage = (video: VideoWithProgress) => {
    if (video.watch_progress && video.duration) {
      return (video.watch_progress / video.duration) * 100;
    }
    return 0;
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.scrollableVideoList} ${className}`}>
      <h2 className={styles.title}>{title}</h2>
      
      <div className={styles.scrollContainer}>
        {canScrollLeft && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            &#8249;
          </button>
        )}
        
        <div 
          ref={containerRef}
          className={styles.videoContainer}
        >
          <div
            className={styles.videoGrid}
            style={{
              transform: `translateX(-${currentIndex * (100 / videosPerView)}%)`,
              transition: isScrolling ? 'transform 0.3s ease-in-out' : 'none',
            }}
          >
            {videos.map((video: VideoWithProgress) => (
              <div
                key={video.id}
                className={styles.videoItem}
                onClick={() => handleVideoClick(video)}
              >
                <div className={styles.thumbnailContainer}>
                  <img
                    src={video.thumbnail || '/placeholder-thumbnail.jpg'}
                    alt={video.title}
                    className={styles.thumbnail}
                    loading="lazy"
                  />
                  
                  {video.watch_progress && video.watch_progress > 0 && (
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${getProgressPercentage(video)}%` }}
                      />
                    </div>
                  )}
                  
                  <div className={styles.videoOverlay}>
                    <div className={styles.playButton}>▶</div>
                  </div>
                </div>
                
                <div className={styles.videoInfo}>
                  <h3 className={styles.videoTitle}>{video.title}</h3>
                  <p className={styles.videoDescription}>
                    {video.description && video.description.length > 100
                      ? `${video.description.substring(0, 100)}...`
                      : video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {canScrollRight && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            &#8250;
          </button>
        )}
      </div>
    </div>
  );
};

export default ScrollableVideoList;
