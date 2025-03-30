import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Button,
  Alert,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Close from '@mui/icons-material/Close';
import { processQR } from '../services/api';

const qrcodeId = 'html5-qrcode-scanner';

const ScanPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    // Create QR Scanner
    const scanner = new Html5QrcodeScanner(qrcodeId, {
      fps: 10,
      qrbox: 250,
      rememberLastUsedCamera: true,
    });

    // Success Handler
    const handleScanSuccess = async (decodedText) => {
      try {
        setScanning(false);
        // Stop scanner
        await scanner.clear();
        // Process QR code
        await processQR(decodedText, true);
        // Navigate back to main page after successful scan
        navigate('/');
      } catch (err) {
        console.error('QR processing error:', err);
        setError(err.message || 'Failed to process QR code');
        setScanning(true);
      }
    };

    // Error Handler
    const handleScanError = (err) => {
      // We don't want to show errors for normal scanning process
      if (err?.name === 'NotFoundError') return;
      console.error('QR scan error:', err);
      setError('Failed to access camera. Please make sure you have given camera permissions.');
    };

    // Start scanner
    scanner.render(handleScanSuccess, handleScanError);

    // Cleanup
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [navigate]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Home
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Scan QR Code
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Position the QR code within the frame to scan
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setError(null)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      <Paper 
        sx={{ 
          p: 2,
          border: '1px solid #000',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box 
          id={qrcodeId} 
          sx={{ 
            '& video': { 
              width: '100% !important',
              borderRadius: 1,
            },
            '& img': {
              display: 'none'
            },
            // Style the scan region
            '& .qrcode-stream__camera-select': {
              mb: 2,
              width: '100%',
              p: 1,
              borderRadius: 1,
              border: '1px solid #ddd'
            },
            // Style buttons
            '& button': {
              mt: 2,
              mx: 1,
              px: 3,
              py: 1,
              borderRadius: 1,
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#1976D2'
              }
            }
          }}
        />
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        {scanning ? 'Scanning for QR code...' : 'Processing QR code...'}
      </Typography>
    </Container>
  );
};

export default ScanPage; 