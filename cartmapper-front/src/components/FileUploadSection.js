import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert
} from '@mui/material';
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';

const FileUploadSection = ({ onUpload }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    const validTypes = ['application/pdf', 'text/csv'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PDF and CSV files are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    return true;
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setError(null);

    try {
      selectedFiles.forEach(file => {
        validateFile(file);
      });
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setError(null);
    for (const file of files) {
      try {
        const fileType = file.type === 'application/pdf' ? 'pdf' : 'csv';
        await onUpload(fileType, file);
      } catch (err) {
        setError(err.message);
        break;
      }
    }
    if (!error) {
      setFiles([]);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <input
          accept=".pdf,.csv"
          style={{ display: 'none' }}
          id="file-upload"
          multiple
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadIcon />}
            sx={{ mb: 2 }}
          >
            Select Files
          </Button>
          <Typography variant="body2" color="text.secondary">
            Supported formats: PDF, CSV (Max size: 10MB)
          </Typography>
        </label>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <>
          <List>
            {files.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={files.length === 0}
            >
              Upload Files
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default FileUploadSection;
