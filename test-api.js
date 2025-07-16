// Test script to check API response
const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/videos/', {
      headers: {
        'Authorization': 'Token 647ab58d1a3b37b77d70e26944da783cf94624f1'
      }
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Test with processing
    const processVideo = (video) => {
      const mediaBaseURL = 'http://localhost:8000';
      const getFullMediaURL = (relativePath) => {
        if (!relativePath) return null;
        if (relativePath.startsWith('http')) return relativePath;
        return `${mediaBaseURL}${relativePath}`;
      };
      
      return {
        ...video,
        thumbnail: getFullMediaURL(video.thumbnail),
        video_files: video.video_files?.map((file) => ({
          ...file,
          file: getFullMediaURL(file.file)
        })) || []
      };
    };
    
    console.log('Processed Videos:', data.results.map(processVideo));
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testAPI();
