import { Box } from '@mui/material';
import React from 'react';
import Header from '../../components/Home/Header';
import FloatingChatHelper from '../../components/Home/Helper';
import Footer from '../../components/Footer';

interface HomeProps {
  children?: React.ReactNode;
  isMobile: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

/** Public layout: fixed header, page content, Dentabot helper, footer. */
const Home: React.FC<HomeProps> = ({ children, isMobile, darkMode, toggleDarkMode }) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: '60px', md: '68px' },
          minHeight: '70vh',
        }}
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} isMobile={isMobile} />
        {children}
        <FloatingChatHelper darkMode={darkMode} toggleDarkMode={toggleDarkMode} isMobile={isMobile} />
      </Box>
      <Footer />
    </>
  );
};

export default Home;
