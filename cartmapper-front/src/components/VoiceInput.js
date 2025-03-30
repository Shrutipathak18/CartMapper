import React, { useState, useEffect, useRef } from 'react';
import { 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

const VoiceInput = ({ onTranscript, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window)) {
      setError('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    // Store the recognition instance in the ref
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not initialized');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={isListening ? "Click to stop" : "Click to speak"}>
        <IconButton
          onClick={toggleListening}
          disabled={disabled || !window.webkitSpeechRecognition}
          color={isListening ? "error" : "primary"}
          sx={{
            backgroundColor: isListening ? 'rgba(211, 47, 47, 0.1)' : 'rgba(25, 118, 210, 0.1)',
            '&:hover': {
              backgroundColor: isListening ? 'rgba(211, 47, 47, 0.2)' : 'rgba(25, 118, 210, 0.2)',
            },
          }}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>
      {isListening && (
        <CircularProgress size={20} sx={{ color: 'error.main' }} />
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default VoiceInput; 