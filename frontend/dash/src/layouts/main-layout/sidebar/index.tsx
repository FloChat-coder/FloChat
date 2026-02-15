import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import DrawerItems from './DrawerItems';

const drawerWidth = 300;
const collapsedWidth = 90;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: collapsedWidth,
});

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsClosing: React.Dispatch<React.SetStateAction<boolean>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ mobileOpen, setMobileOpen, setIsClosing, open, setOpen }: SidebarProps) => {
  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  return (
    <Box
      component="nav"
      width={{ lg: open ? drawerWidth : collapsedWidth }}
      flexShrink={{ lg: 0 }}
      display={{ xs: 'none', lg: 'block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      sx={{ 
        transition: 'width 0.3s',
        zIndex: 1200 
      }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' } }}
      >
        {/* Mobile is always "open" (expanded) */}
        <DrawerItems open={true} />
      </Drawer>

      <StyledDrawer 
        variant="permanent" 
        open={open} 
        sx={{ display: { xs: 'none', lg: 'block' } }}
      >
        {/* Pass the dynamic open state */}
        <DrawerItems open={open} />
      </StyledDrawer>
    </Box>
  );
};

export default Sidebar;