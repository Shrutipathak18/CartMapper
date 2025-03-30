import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Button,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Description from '@mui/icons-material/Description';
import Help from '@mui/icons-material/Help';

const AboutPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ShoppingCart sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Smart Shopping Analysis',
      description: 'Upload your shopping receipts and get detailed insights about your purchases.'
    },
    {
      icon: <Description sx={{ fontSize: 40, color: '#2196F3' }} />,
      title: 'Multiple File Formats',
      description: 'Support for PDF, CSV files, and QR codes to accommodate different receipt formats.'
    },
    {
      icon: <Help sx={{ fontSize: 40, color: '#FF5722' }} />,
      title: 'Natural Language Queries',
      description: 'Ask questions about your shopping data in plain language and get instant answers.'
    }
  ];

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
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          About CartMapper
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your Smart Shopping Assistant
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 4, border: '1px solid #000', borderRadius: 2 }}>
        <Typography variant="body1" paragraph>
          CartMapper is an innovative solution designed to help you understand and analyze your shopping patterns.
          By leveraging advanced AI technology, we transform your shopping receipts into actionable insights.
        </Typography>
        <Typography variant="body1" paragraph>
          Whether you want to track your spending, analyze purchase patterns, or find the best deals,
          CartMapper makes it easy to get answers to your shopping-related questions.
        </Typography>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 4 }}>
        Key Features
      </Typography>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                border: '1px solid #000',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Box sx={{ mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 4, mt: 6, border: '1px solid #000', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Getting Started
        </Typography>
        <Typography variant="body1" paragraph>
          1. Upload your shopping receipt (PDF/CSV) or scan a QR code
        </Typography>
        <Typography variant="body1" paragraph>
          2. Wait for the document to be processed
        </Typography>
        <Typography variant="body1" paragraph>
          3. Ask questions about your shopping data
        </Typography>
        <Typography variant="body1">
          4. Get instant insights and answers
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage; 