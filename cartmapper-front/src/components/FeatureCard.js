import React from 'react';
import { Card, CardContent, Typography, IconButton, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, action }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <IconButton 
            size="large" 
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {icon}
          </IconButton>
        </Box>
        <Typography gutterBottom variant="h5" component="h2" align="center">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          {description}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <IconButton 
          onClick={action}
          sx={{ 
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.light',
            },
          }}
        >
          arrow_forward
        </IconButton>
      </Box>
    </Card>
  );
};

export default FeatureCard;
