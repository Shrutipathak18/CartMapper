import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import components directly
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import QueryPage from './pages/QueryPage';
import ScanPage from './pages/ScanPage';
import AboutPage from './pages/AboutPage';
import NavBar from './components/Navbar';
// Removed unused FileUploadSection import
import Footer from './components/Footer';
console.log('NavBar component type:', typeof NavBar);
const theme = createTheme({
  palette: {
    primary: { main: '#4CAF50' },
    secondary: { main: '#FF9800' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* Added React.Fragment to ensure single root element */}
        <>
          <NavBar />
          <main>
            <Routes>
              <Route path="/" element={<QueryPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Redirect /upload to home since upload is now integrated */}
              <Route path="/upload" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </>
      </Router>
    </ThemeProvider>
  );
}

export default App;