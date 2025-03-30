import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper,
  TextField,
  IconButton
} from '@mui/material';
import { QrCodeScanner as QrCodeScannerIcon, Link as LinkIcon } from '@mui/icons-material';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRUploadSection = ({ onUpload }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const readerRef = useRef(null);
  const [status, setStatus] = useState({ message: '', severity: 'success' });

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (qrUrl) {
      try {
        // Validate URL format
        const url = new URL(qrUrl);
        console.log('Submitting URL:', url.toString());
        onUpload(url.toString(), true);
        setQrUrl('');
      } catch (error) {
        console.error('Invalid URL:', error);
        setStatus({ 
          message: 'Please enter a valid URL', 
          severity: 'error' 
        });
      }
    }
  };

  const handleScan = (decodedText, result) => {
    if (decodedText) {
      try {
        // Validate the QR code content
        if (!decodedText || typeof decodedText !== 'string' || decodedText.trim() === '') {
          throw new Error('Invalid QR code content');
        }

        // Check if the content is a valid URL or base64 data
        const trimmedResult = decodedText.trim();
        const isUrl = trimmedResult.startsWith('http://') || trimmedResult.startsWith('https://');
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(trimmedResult);
        
        if (!isUrl && !isBase64) {
          throw new Error('Invalid QR code format. Please scan a valid QR code containing a URL or encoded data.');
        }
        
        // Log the scanned result
        console.log('Scanned QR code:', trimmedResult);
        
        // Send the decoded text content
        onUpload(trimmedResult, isUrl);
        
        setIsScanning(false);
        if (scanner) {
          scanner.clear();
        }
      } catch (error) {
        console.error('Error processing QR code:', error);
        // Show error to user
        setStatus({ 
          message: error.message || 'Failed to process QR code', 
          severity: 'error' 
        });
      }
    }
  };

  const startScanning = () => {
    // Create scanner container if it doesn't exist
    let scannerContainer = document.getElementById('scanner-container');
    if (!scannerContainer) {
      scannerContainer = document.createElement('div');
      scannerContainer.id = 'scanner-container';
      document.body.appendChild(scannerContainer);
    }

    // Create a div element for the scanner if it doesn't exist
    if (!readerRef.current) {
      const readerDiv = document.createElement('div');
      readerDiv.id = 'reader';
      scannerContainer.appendChild(readerDiv);
      readerRef.current = readerDiv;
    }

    const newScanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          Html5QrcodeScanType.SCAN_TYPE_FILE
        ],
        rememberLastUsedCamera: true,
        showZoomSliderIfSupported: true,
        showFullBleedScanner: true,
        verbose: true,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.AZTEC,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.PDF_417
        ]
      },
      false
    );

    newScanner.render(
      handleScan,
      (error) => {
        // Only log errors that are not related to QR code detection
        if (!error.toString().includes("NotFoundException")) {
          console.warn("Scanner error:", error);
        }
      }
    );

    setScanner(newScanner);
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    if (readerRef.current) {
      readerRef.current.remove();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Scan QR Code or Enter URL
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload a QR code image or enter a URL containing QR code data
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleUrlSubmit} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="QR Code URL"
          variant="outlined"
          value={qrUrl}
          onChange={(e) => setQrUrl(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton type="submit" color="primary">
                <LinkIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          startIcon={<QrCodeScannerIcon />}
          onClick={isScanning ? stopScanning : startScanning}
          sx={{ mb: 2 }}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>

        {isScanning && (
          <Box sx={{ mt: 2 }}>
            <div id="scanner-container"></div>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Position the QR code within the camera view
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default QRUploadSection;
