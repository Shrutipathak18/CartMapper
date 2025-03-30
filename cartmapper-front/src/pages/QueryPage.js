import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Alert, 
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  AppBar,
  Toolbar,
  Link,
  Switch,
  FormControlLabel
} from '@mui/material';
import { submitQuery, checkDocuments, checkBackendStatus, uploadFile } from '../services/api';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import Close from '@mui/icons-material/Close';
import Upload from '@mui/icons-material/Upload';
import Search from '@mui/icons-material/Search';
import QrCode2 from '@mui/icons-material/QrCode2';
import VolumeUp from '@mui/icons-material/VolumeUp';
import VolumeOff from '@mui/icons-material/VolumeOff';
import { getGroceryIcon } from '../utils/groceryIcons';

const QueryPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('English');
  const [outputMethod, setOutputMethod] = useState('Text Only');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentsAvailable, setDocumentsAvailable] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const languages = ['English', 'Hindi', 'Odia', 'Bengali', 'Tamil'];
  const outputMethods = ['Text Only', 'Summary', 'Detailed'];

  // Function to get voice based on language
  const getVoiceForLanguage = (lang) => {
    const voices = speechSynthesis.getVoices();
    const languageMap = {
      'English': ['en-US', 'en-GB', 'en'],
      'Hindi': ['hi-IN', 'hi'],
      'Odia': ['or-IN', 'en-IN'],  // Fallback to Indian English for Odia
      'Bengali': ['bn-IN', 'en-IN'],  // Fallback to Indian English for Bengali
      'Tamil': ['ta-IN', 'en-IN']  // Fallback to Indian English for Tamil
    };
    
    const targetLangs = languageMap[lang] || ['en-US'];
    
    // Try to find a voice for each language code in order
    for (const targetLang of targetLangs) {
      const voice = voices.find(voice => voice.lang.startsWith(targetLang));
      if (voice) {
        return voice;
      }
    }

    // If no specific voice is found, try to find any Indian English voice
    const indianVoice = voices.find(voice => voice.lang.startsWith('en-IN'));
    if (indianVoice) {
      return indianVoice;
    }

    // If still no voice found, return the first available voice
    return voices[0];
  };

  // Function to speak text
  const speakText = (text) => {
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoiceForLanguage(language);
    
    if (voice) {
      utterance.voice = voice;
      // Adjust speech parameters based on language
      if (language === 'Hindi') {
        utterance.rate = 0.9;  // Slightly slower for Hindi
        utterance.pitch = 1;
      } else if (['Odia', 'Bengali', 'Tamil'].includes(language)) {
        utterance.rate = 0.8;  // Slower for other Indian languages
        utterance.pitch = 1;
      } else {
        utterance.rate = 1;
        utterance.pitch = 1;
      }
      utterance.volume = 1;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      // If there's an error, try with default voice
      utterance.voice = null;
      window.speechSynthesis.speak(utterance);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Initialize voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Voices are loaded
        console.log('Available voices:', voices.map(v => v.lang));
      } else {
        // Voices are not loaded yet, wait for them
        speechSynthesis.onvoiceschanged = () => {
          console.log('Available voices:', speechSynthesis.getVoices().map(v => v.lang));
        };
      }
    };

    loadVoices();
  }, []);

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Update response and start speaking when new response arrives
  useEffect(() => {
    if (response?.answer && voiceEnabled) {
      speakText(response.answer);
    }
  }, [response, voiceEnabled]);

  // Check backend status and documents when component mounts
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check backend status first
        const status = await checkBackendStatus();
        setBackendStatus(status);
        
        if (!status.isHealthy) {
          setError('Backend service is not available. Please try again later.');
          return;
        }

        // Then check for documents
        const result = await checkDocuments();
        setDocumentsAvailable(result.available);
        if (!result.available) {
          if (result.error) {
            setError(`Document check failed: ${result.error}. Please try uploading a document.`);
          } else {
            setError('No documents available. Please upload a document first.');
          }
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setError('Failed to check system status. Please try again later.');
      }
    };
    checkStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!backendStatus?.isHealthy) {
      setError('Backend service is not available. Please try again later.');
      return;
    }

    if (!documentsAvailable) {
      setError('Please upload a document before asking questions. Click the button below to go to the Upload page.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const result = await submitQuery(query, language, outputMethod);
      setResponse(result);
    } catch (err) {
      console.error('Query error:', err);
      setError(err.message || 'Failed to process query');
      
      // Show specific error messages based on the error
      if (err.message.includes('No data available')) {
        setError('Please upload a document before asking questions. Click the button below to go to the Upload page.');
      } else if (err.message.includes('Backend service')) {
        setError('The backend service is currently unavailable. Please try again in a few minutes.');
      } else if (err.message.includes('model requires terms acceptance')) {
        setError(
          <Box>
            <Typography variant="body1" gutterBottom>
              The AI model requires terms acceptance. Please contact the administrator to accept the terms.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              href="https://console.groq.com/playground?model=mistral-saba-24b"
              target="_blank"
              sx={{ mt: 2 }}
            >
              Accept Terms
            </Button>
          </Box>
        );
      } else if (err.message.includes('Server error')) {
        setError('The server encountered an error. Please try again in a few minutes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setQuery(transcript);
    // Optionally auto-submit the query
    // handleSubmit({ preventDefault: () => {} });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setError(null);

    try {
      const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'csv';
      await uploadFile(fileType, file);
      setDocumentsAvailable(true);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: '#E8F5E9',
          pt: 6,
          pb: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 600, position: 'relative', zIndex: 2 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                color: '#2E7D32',
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '1rem', md: '2rem' },
                fontFamily: "'Dancing Script', cursive"
              }}
            >
              YOUR FAVOURITE
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                color: '#2E7D32',
                fontWeight: 'bold',
                mb: 4,
                fontSize: { xs: '1.5rem', md: '2.5rem' },
                fontFamily: "'Dancing Script', cursive"
              }}
            >
              Shopping Assistant
            </Typography>
          </Box>
        </Container>
        {/* Curved bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: '100px',
            background: 'white',
            borderTopLeftRadius: '50% 100%',
            borderTopRightRadius: '50% 100%',
          }}
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: -6, mb: 8, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4} justifyContent="center">
          {/* PDF/CSV Box */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                bgcolor: '#8BC34A',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'transform 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Upload sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  PDF/CSV
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  Upload your shopping data
                </Typography>
              </Box>
              <Button
                fullWidth
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                CLICK HERE
              </Button>
              <input
                type="file"
                accept=".pdf,.csv"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </Paper>
          </Grid>

          {/* Ask Question Box */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                bgcolor: '#FFA726',
                borderRadius: 4,
                overflow: 'hidden',
                height: '100%'
              }}
            >
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Search sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  Ask Questions
                </Typography>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    placeholder="Type your question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={!documentsAvailable}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': {
                          bgcolor: 'white'
                        }
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <VoiceInput 
                            onTranscript={handleVoiceTranscript}
                            disabled={!documentsAvailable}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel 
                          sx={{ 
                            color: 'rgba(0, 0, 0, 0.7)', 
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            px: 1,
                            '&.Mui-focused': { 
                              color: '#FFA726' 
                            }
                          }}
                        >
                          
                        </InputLabel>
                        <Select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          label="Language"
                          disabled={!documentsAvailable}
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { 
                              bgcolor: 'white' 
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(0, 0, 0, 0.2)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#FFA726'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#FFA726'
                            }
                          }}
                        >
                          {languages.map((lang) => (
                            <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel 
                          sx={{ 
                            color: 'rgba(0, 0, 0, 0.7)',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            px: 1,
                            '&.Mui-focused': { 
                              color: '#FFA726' 
                            }
                          }}
                        >
                        
                        </InputLabel>
                        <Select
                          value={outputMethod}
                          onChange={(e) => setOutputMethod(e.target.value)}
                          label="Output"
                          disabled={!documentsAvailable}
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { 
                              bgcolor: 'white' 
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(0, 0, 0, 0.2)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#FFA726'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#FFA726'
                            }
                          }}
                        >
                          {outputMethods.map((method) => (
                            <MenuItem key={method} value={method}>{method}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Button
                    fullWidth
                    type="submit"
                    disabled={loading || !documentsAvailable}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)'
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255,255,255,0.5)',
                        bgcolor: 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    {loading ? 'Processing...' : 'Submit Query'}
                  </Button>
                </form>
              </Box>
            </Paper>
          </Grid>

          {/* QR Scanner Box */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                bgcolor: '#8BC34A',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'transform 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
              onClick={() => navigate('/scan')}
            >
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <QrCode2 sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  QR Scanner
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  Scan your shopping QR code
                </Typography>
              </Box>
              <Button
                fullWidth
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                CLICK HERE
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Response Section */}
        <Box sx={{ mt: 6 }}>
          <Paper
            sx={{
              bgcolor: '#8BC34A',
              borderRadius: 4,
              overflow: 'hidden',
              p: 4
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                Response
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={voiceEnabled}
                      onChange={(e) => {
                        setVoiceEnabled(e.target.checked);
                        if (!e.target.checked) {
                          stopSpeaking();
                        }
                      }}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'white',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: 'white' }}>
                      Voice {voiceEnabled ? 'On' : 'Off'}
                    </Typography>
                  }
                  sx={{ color: 'white' }}
                />
                {response && voiceEnabled && (
                  <IconButton 
                    onClick={isSpeaking ? stopSpeaking : () => speakText(response.answer)}
                    sx={{ color: 'white' }}
                  >
                    {isSpeaking ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                )}
              </Box>
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.9)', p: 3, borderRadius: 2 }}>
              {response ? (
                <Box>
                  {response.answer.split('\n').map((line, index) => {
                    // Check if the line contains a grocery item
                    const groceryMatch = line.match(/\b(apple|banana|orange|tomato|potato|onion|carrot|lettuce|cucumber|broccoli|milk|cheese|yogurt|butter|cream|chicken|beef|fish|pork|lamb|bread|cake|cookies|pastry|coffee|tea|juice|soda|water|chips|candy|chocolate|nuts|detergent|soap|paper|cleaning)\b/i);
                    
                    if (groceryMatch) {
                      const Icon = getGroceryIcon(groceryMatch[1]);
                      return (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            mb: 1,
                            '&:last-child': { mb: 0 }
                          }}
                        >
                          <Icon 
                            sx={{ 
                              color: '#8BC34A', 
                              mr: 1,
                              fontSize: '2rem',
                              flexShrink: 0
                            }} 
                          />
                          <Typography sx={{ color: '#333', flex: 1 }}>
                            {line}
                          </Typography>
                        </Box>
                      );
                    }
                    
                    return (
                      <Typography 
                        key={index} 
                        sx={{ 
                          color: '#333',
                          mb: 1,
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        {line}
                      </Typography>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ color: '#666' }}>
                  Your response will appear here after you ask a question.
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3,
          bgcolor: '#E8F5E9',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          mt: 'auto'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" align="center" sx={{ color: '#2E7D32' }}>
            © 2025 CartMapper. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default QueryPage;