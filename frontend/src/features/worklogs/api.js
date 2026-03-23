import apiClient from '../../services/apiClient';

export const worklogsApi = {
  // GET /api/v1/worklogs/project/:projectId - Get work logs by project
  getWorklogsByProject: async (projectId) => {
    const response = await apiClient.get(`/worklogs/project/${projectId}`);
    return response.data;
  },

  // POST /api/v1/worklogs - Create work log
  createWorklog: async (worklogData) => {
    const response = await apiClient.post('/worklogs', worklogData);
    return response.data;
  },

  // POST /api/v1/worklogs/:id/images - Add images/videos/audio to work log
  addWorklogImages: async (worklogId, images) => {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      const uri = image.uri;
      const ext = uri.split('.').pop().toLowerCase();
      const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext) || image.type === 'video';
      const isAudio = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus'].includes(ext) || image.type === 'audio';
      let mimeType;
      if (isAudio) {
        mimeType = ext === 'm4a' ? 'audio/mp4' : `audio/${ext}`;
      } else if (isVideo) {
        mimeType = `video/${ext === 'mov' ? 'quicktime' : ext}`;
      } else {
        mimeType = `image/${ext}`;
      }
      const fileName = image.name || `worklog-media-${Date.now()}-${index}.${ext}`;
      formData.append('images', { uri, name: fileName, type: mimeType });
    });

    console.log('Sending FormData to backend...');
    
    // Use a special config to signal this is FormData
    const config = {
      headers: {
        'Accept': 'application/json',
        // Special marker to tell interceptor this is FormData
        'X-FormData-Request': 'true',
      },
      timeout: 60000, // 60 seconds for image uploads
    };
    
    const response = await apiClient.post(`/worklogs/${worklogId}/images`, formData, config);
    return response.data;
  },

  // DELETE /api/v1/worklogs/:id/images - Remove image from work log
  removeWorklogImage: async (worklogId, imagePath) => {
    const response = await apiClient.delete(`/worklogs/${worklogId}/images`, {
      data: { imagePath }
    });
    return response.data;
  },
};
