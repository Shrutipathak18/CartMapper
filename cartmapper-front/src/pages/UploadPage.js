import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Tabs, 
  Tab, 
  Alert,
  CircularProgress
} from '@mui/material';
import FileUploadSection from '../components/FileUploadSection';
import QRUploadSection from '../components/QRUploadSection';
import { uploadFile, processQR } from '../services/api';

const UploadPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState({ message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (fileType, file) => {
    try {
      setLoading(true);
      const response = await uploadFile(fileType, file);
      setStatus({ 
        message: response.message || 'File processed successfully!', 
        severity: 'success' 
      });
    } catch (error) {
      setStatus({ 
        message: error.message || 'Failed to process file', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRUpload = async (imageData, isUrl) => {
    try {
      setLoading(true);
      const response = await processQR(imageData, isUrl);
      setStatus({ 
        message: response.message || 'QR processed successfully!', 
        severity: 'success' 
      });
    } catch (error) {
      setStatus({ 
        message: error.message || 'Failed to process QR code', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Added header section from simple version */}
      <Box sx={{ mt: 4, mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Upload Your Data
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Upload your shopping data to get started
        </Typography>
      </Box>

      {/* Main upload functionality from complex version */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          centered
        >
          <Tab label="File Upload" />
          <Tab label="QR Code" />
        </Tabs>
      </Paper>

      {status.message && (
        <Alert 
          severity={status.severity} 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => setStatus({ message: '', severity: 'info' })}
            >
              Dismiss
            </Button>
          }
        >
          {status.message}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {activeTab === 0 ? (
        <FileUploadSection onUpload={handleFileUpload} />
      ) : (
        <QRUploadSection onUpload={handleQRUpload} />
      )}
    </Container>
  );
};

export default UploadPage;

