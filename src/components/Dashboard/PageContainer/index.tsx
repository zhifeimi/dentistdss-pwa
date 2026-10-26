import React from 'react';
import { Box, Toolbar } from '@mui/material';

interface PageContainerProps {
  children: React.ReactNode;
  drawerWidth?: number;
}

/**
 * PageContainer — the dashboard's content column: clears the fixed header,
 * sits beside the permanent drawer, and owns the only page gutter.
 */
const PageContainer: React.FC<PageContainerProps> = ({ children, drawerWidth = 240 }) => (
  <Box
    component="main"
    sx={{
      flexGrow: 1,
      width: { sm: `calc(100% - ${drawerWidth}px)` },
      minWidth: 0,
      minHeight: '100vh',
      overflow: 'auto',
      bgcolor: 'background.default',
    }}
  >
    <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 4 }, maxWidth: 1360 }}>
      {children}
    </Box>
  </Box>
);

export default PageContainer;
