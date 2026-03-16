export interface FileUploadResponse {
  code: number;
  msg: string;
  data: {
    fileUrl: string;
    fileName: string;
    uploadPath: string;
    size: number;
    mimeType: string;
  };
}

export class FileUploadAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://sunoapiorg.redpandaai.co';
  }
  
  async uploadFile(file: File | Blob, uploadPath: string = '', fileName: string | null = null): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (uploadPath) formData.append('uploadPath', uploadPath);
    if (fileName) formData.append('fileName', fileName);
    
    const response = await fetch(`${this.baseUrl}/api/file-stream-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });
    
    if (response.status === 401) {
      console.error('Invalid API key, please check Authorization header');
    }
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async uploadFromUrl(fileUrl: string, uploadPath: string = '', fileName: string | null = null): Promise<FileUploadResponse> {
    const response = await fetch(`${this.baseUrl}/api/file-url-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileUrl,
        uploadPath,
        fileName
      })
    });
    
    if (response.status === 401) {
      console.error('Invalid API key, please check Authorization header');
    }
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async uploadBase64(base64Data: string, uploadPath: string = '', fileName: string | null = null): Promise<FileUploadResponse> {
    const response = await fetch(`${this.baseUrl}/api/file-base64-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64Data,
        uploadPath,
        fileName
      })
    });
    
    if (response.status === 401) {
      console.error('Invalid API key, please check Authorization header');
    }
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

/**
 * Implement retry mechanism
 */
export async function uploadWithRetry<T>(uploadFunction: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadFunction();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}

/**
 * Batch upload files
 */
export async function uploadMultipleFiles(uploader: FileUploadAPI, files: File[]): Promise<FileUploadResponse[]> {
  const results: FileUploadResponse[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploader.uploadFile(
        files[i], 
        'user-uploads', 
        `file-${i + 1}-${files[i].name}`
      );
      results.push(result);
      console.log(`File ${i + 1} uploaded successfully:`, result.data.fileUrl);
    } catch (error: any) {
      console.error(`File ${i + 1} upload failed:`, error.message);
    }
  }
  
  return results;
}

/**
 * Batch upload from URLs
 */
export async function uploadFromUrls(uploader: FileUploadAPI, urls: string[]): Promise<FileUploadResponse[]> {
  const results: FileUploadResponse[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      const result = await uploader.uploadFromUrl(
        urls[i], 
        'downloads', 
        `download-${i + 1}.jpg`
      );
      results.push(result);
      console.log(`URL ${i + 1} uploaded successfully:`, result.data.fileUrl);
    } catch (error: any) {
      console.error(`URL ${i + 1} upload failed:`, error.message);
    }
  }
  
  return results;
}
