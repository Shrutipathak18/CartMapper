import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Grid 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { checkHealth } from '../services/api';
import HeroSection from '../components/HeroSection';
import FeatureCard from '../components/FeatureCard';

const HomePage = () => {
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState(null);

  const checkBackendHealth = async () => {
    try {
      const response = await checkHealth();
      setHealthStatus(response.data.status);
    } catch (error) {
      setHealthStatus('unhealthy');
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Hero Section with Welcome Message */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to CartMapper
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Your Smart Shopping Assistant
        </Typography>
      </Box>

      {/* Main Hero Banner */}
      <HeroSection 
        title="CartMapper"
        subtitle="Your Intelligent Document Assistant"
        imageUrl="/images/vegetables-banner.jpg"
      />
      
      {/* Features Section */}
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid xs={12} md={4}>
            <FeatureCard
              icon="upload"
              title="Upload Documents"
              description="Upload PDF or CSV files to create a knowledge base"
              action={() => navigate('/upload')}
            />
          </Grid>
          <Grid xs={12} md={4}>
            <FeatureCard
              icon="qr_code"
              title="Scan QR Codes"
              description="Scan QR codes to instantly load document content"
              action={() => navigate('/upload')}
            />
          </Grid>
          <Grid xs={12} md={4}>
            <FeatureCard
              icon="search"
              title="Ask Questions"
              description="Get answers from your documents in multiple languages"
              action={() => navigate('/query')}
            />
          </Grid>
        </Grid>
      </Box>

      {/* System Status Section */}
      <Paper elevation={3} sx={{ p: 3, my: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={checkBackendHealth}
          sx={{ mr: 2 }}
        >
          Check Backend Health
        </Button>
        {healthStatus && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Backend is <strong>{healthStatus}</strong>
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default HomePage;