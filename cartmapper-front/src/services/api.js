import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (fileType, file) => {
  try {
    // Validate file type
    if (!fileType || !['pdf', 'csv'].includes(fileType.toLowerCase())) {
      throw new Error('Invalid file type. Only PDF and CSV files are supported.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    // Log upload attempt
    console.log('Uploading file:', {
      fileName: file.name,
      fileType,
      fileSize: file.size,
      mimeType: file.type
    });

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Log successful response
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error.response) {
      const errorData = error.response.data?.detail || '';
      
      // Handle specific error cases
      if (errorData.includes("'utf-8' codec can't decode")) {
        throw new Error('The CSV file contains characters that cannot be read. Please ensure the file is saved with UTF-8 encoding.');
      } else if (errorData.includes('invalid start byte')) {
        throw new Error('The file contains invalid characters. Please check the file encoding and try again.');
      }
      
      throw new Error(errorData || 'Failed to upload file');
    }
    throw new Error('Network error while uploading file');
  }
};

export const processQR = async (qrData, isUrl) => {
  try {
    // Validate and clean the QR code data
    if (!qrData || typeof qrData !== 'string' || qrData.trim() === '') {
      throw new Error('Invalid QR code data');
    }

    const cleanedData = qrData.trim();
    
    // Validate URL format if it's supposed to be a URL
    if (isUrl) {
      try {
        new URL(cleanedData);
      } catch (e) {
        throw new Error('Invalid URL format in QR code');
      }
    }
    
    // Log the data being sent
    console.log('Sending QR data:', { 
      dataLength: cleanedData.length,
      isUrl,
      dataType: isUrl ? 'URL' : 'Text',
      urlType: isUrl ? (cleanedData.endsWith('.pdf') ? 'PDF' : 'Other') : 'N/A'
    });

    // For PDF URLs, we need to handle them differently
    if (isUrl && cleanedData.endsWith('.pdf')) {
      // First, try to download and process the PDF
      const response = await api.post('/process-pdf-url', {
        pdf_url: cleanedData
      });
      return response.data;
    }

    // For other types of data, use the regular process-qr endpoint
    const response = await api.post('/process-qr', {
      qr_data: cleanedData,
      is_url: isUrl,
      data_type: isUrl ? 'url' : 'text',
      url_type: isUrl ? (cleanedData.endsWith('.pdf') ? 'pdf' : 'other') : null
    });

    // Log successful response
    console.log('QR processing response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing QR code:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      
      // Handle specific error cases
      if (error.response.status === 500) {
        const errorData = error.response.data?.detail || '';
        if (errorData.includes('model_terms_required')) {
          throw new Error('The AI model requires terms acceptance. Please contact the administrator to accept the terms at https://console.groq.com/playground?model=mistral-saba-24b');
        } else if (errorData.includes('cannot identify image file')) {
          throw new Error('The QR code contains a PDF URL. Please try uploading the PDF directly instead.');
        }
        throw new Error(`Server error while processing QR code: ${errorData}`);
      } else if (error.response.status === 400) {
        throw new Error(error.response.data.detail || 'Invalid QR code format');
      }
      
      throw new Error(error.response.data.detail || 'Failed to process QR code');
    }
    throw new Error('Network error while processing QR code');
  }
};

export const checkDocuments = async () => {
  try {
    // Try to get the list of uploaded documents
    const response = await api.get('/upload/list');
    return {
      available: response.data && response.data.documents && response.data.documents.length > 0,
      documents: response.data?.documents || []
    };
  } catch (error) {
    console.error('Error checking documents:', error);
    // If the endpoint doesn't exist, try a simpler check
    try {
      const response = await api.get('/health');
      return {
        available: response.data && response.data.status === 'healthy',
        error: 'Could not verify documents'
      };
    } catch (healthError) {
      return {
        available: false,
        error: 'Failed to connect to backend'
      };
    }
  }
};

export const checkBackendStatus = async () => {
  try {
    const response = await api.get('/health');
    return {
      isHealthy: response.data?.status === 'healthy',
      details: response.data
    };
  } catch (error) {
    console.error('Backend health check failed:', error);
    return {
      isHealthy: false,
      error: 'Failed to connect to backend'
    };
  }
};

export const submitQuery = async (query, language, outputMethod) => {
  try {
    // Validate input parameters
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    if (!language || typeof language !== 'string') {
      throw new Error('Language must be specified');
    }

    if (!outputMethod || typeof outputMethod !== 'string') {
      throw new Error('Output method must be specified');
    }

    // Check backend status first
    const status = await checkBackendStatus();
    if (!status.isHealthy) {
      throw new Error('Backend service is not available. Please try again later.');
    }

    // Log the request data
    console.log('Submitting query:', {
      query: query.trim(),
      language,
      outputMethod,
      timestamp: new Date().toISOString()
    });

    const response = await api.post('/query', {
      query: query.trim(),
      language,
      output_method: outputMethod,
    });

    // Log successful response
    console.log('Query response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting query:', error);
    if (error.response) {
      // Log detailed error information
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Handle specific error cases
      if (error.response.status === 500) {
        const errorData = error.response.data?.detail || '';
        if (errorData.includes('model_terms_required')) {
          throw new Error('The AI model requires terms acceptance. Please contact the administrator to accept the terms at https://console.groq.com/playground?model=mistral-saba-24b');
        }
        throw new Error(`Server error: ${errorData}. Please try again later.`);
      } else if (error.response.status === 404) {
        throw new Error('No data available. Please upload a document first.');
      } else if (error.response.status === 400) {
        throw new Error(error.response.data.detail || 'Invalid query format');
      }
      
      throw new Error(error.response.data.detail || 'Failed to process query');
    }
    throw new Error('Network error while processing query');
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking health:', error);
    return { status: 'unhealthy', error: 'Failed to connect to backend' };
  }
};

export default api;
