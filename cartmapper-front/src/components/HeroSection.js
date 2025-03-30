import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const HeroSection = ({ title, subtitle, imageUrl }) => {
  return (
    <Box
      sx={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            {title}
          </Typography>
          <Typography variant="h5" component="h2" sx={{ mb: 4 }}>
            {subtitle}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
