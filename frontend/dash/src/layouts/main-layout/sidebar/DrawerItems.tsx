import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Image from 'components/base/Image';
import IconifyIcon from 'components/base/IconifyIcon';
import CollapseListItem from './list-items/CollapseListItem';
import ProfileListItem from './list-items/ProfileListItem';
import ListItem from './list-items/ListItem';
import LogoImg from 'assets/images/Logo.png';
import { topListData, bottomListData, profileListData } from 'data/sidebarListData';

interface DrawerItemsProps {
  open: boolean;
}

const DrawerItems = ({ open }: DrawerItemsProps) => {
  return (
    <>
      <Stack
        pt={5}
        pb={4}
        px={3.5}
        position={'sticky'}
        top={0}
        bgcolor="background.default"
        alignItems={open ? "flex-start" : "center"} // Center logo when collapsed
        justifyContent="center"
        zIndex={1000}
      >
        <ButtonBase component={Link} href="/" disableRipple>
          <Image src={LogoImg} alt="logo" height={32} width={32} sx={{ mr: open ? 1 : 0 }} />
          {/* Hide Text if closed */}
          {open && (
            <Typography variant="h5" color="text.primary" fontWeight={600} letterSpacing={1}>
              FloChat
            </Typography>
          )}
        </ButtonBase>
      </Stack>

      {/* Hide Search Bar if closed to avoid ugly clipping */}
      {open && (
        <Box px={3.5} pb={3} pt={1}>
          <TextField
            variant="filled"
            placeholder="Search..."
            sx={{ width: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={'mingcute:search-line'} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      <List component="nav" sx={{ px: 2.5 }}>
        {topListData.map((route, index) => {
          if (route.items && route.items.length > 0) {
            return <CollapseListItem key={route.id || index} {...route} open={open} />;
          }
          return <ListItem key={route.id || index} {...route} open={open} />;
        })}
      </List>

      <Divider />

      <List component="nav" sx={{ px: 2.5 }}>
        {bottomListData.map((route, index) => {
          if (route.items && route.items.length > 0) {
            return <CollapseListItem key={route.id || index} {...route} open={open} />;
          }
          return <ListItem key={route.id || index} {...route} open={open} />;
        })}
      </List>

      <List component="nav" sx={{ px: 2.5 }}>
        {profileListData && <ProfileListItem {...profileListData} open={open} />}
      </List>

      {/* Hide Documentation Button if closed */}
      {open && (
        <Box px={3.5} py={6} width={1}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            href="https://flochat.com/docs" 
            target="_blank"
            endIcon={<IconifyIcon icon="mingcute:arrow-right-line" />}
            sx={{ width: 1 }}
          >
            Documentation
          </Button>
        </Box>
      )}
    </>
  );
};

export default DrawerItems;