import React from 'react';
import { AppBar, Toolbar, Typography, Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NavBar = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: 0 }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/" 
          sx={{ 
            color: '#4CAF50',
            textDecoration: 'none',
            fontWeight: 'bold',
            flexGrow: 1,
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box 
            component="img" 
            src="/cart-logo.png.gif" 
            alt="CartMapper" 
            sx={{ 
              height: 45,
              width: 'auto',
              marginRight: 1
            }}
          />
          CartMapper
        </Typography>
        <Box>
          <Link
            component={RouterLink}
            to="/about"
            sx={{ 
              color: '#4CAF50',
              textDecoration: 'none',
              '&:hover': { color: '#2E7D32' }
            }}
          >
            About
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;