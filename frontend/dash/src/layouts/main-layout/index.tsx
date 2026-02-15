import { useState, PropsWithChildren } from 'react';
import Stack from '@mui/material/Stack';
import Sidebar from 'layouts/main-layout/sidebar';
import Topbar from 'layouts/main-layout/topbar';
import Footer from './Footer';

const MainLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [open, setOpen] = useState(true);

  return (
    <Stack width={1} minHeight={'100vh'}>
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        setIsClosing={setIsClosing} 
        open={open}
        setOpen={setOpen}
      />
      <Stack
        component="main"
        direction="column"
        p={{ xs: 2, sm: 3, lg: 5 }}
        spacing={{ xs: 2.5, sm: 3, lg: 3.75 }}
        // Width calculation ensures sidebar doesn't overlap
        width={{ xs: 1, lg: open ? `calc(100% - 300px)` : `calc(100% - 90px)` }}
        flexGrow={1}
        sx={{
          transition: 'width 0.3s',
        }}
        // Click content to collapse sidebar
        onClick={() => setOpen(false)}
      >
        <Topbar isClosing={isClosing} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        {children}
        <Footer />
      </Stack>
    </Stack>
  );
};

export default MainLayout;