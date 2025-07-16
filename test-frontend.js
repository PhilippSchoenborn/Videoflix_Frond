// Direct test of the API service
import { apiService } from './src/services/api.js';

// Test token
localStorage.setItem('auth_token', '647ab58d1a3b37b77d70e26944da783cf94624f1');

// Test API call
apiService.getVideos().then(videos => {
    console.log('Videos from API service:', videos);
    videos.forEach(video => {
        console.log(`${video.title}: ${video.thumbnail}`);
    });
}).catch(error => {
    console.error('Error:', error);
});
