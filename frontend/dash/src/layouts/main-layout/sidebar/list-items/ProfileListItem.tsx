import { MenuItem } from 'routes/sitemap';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';
import AvatarImage from 'assets/images/avater.png';

interface ProfileListItemProps extends MenuItem {
  open: boolean;
}

const ProfileListItem = ({ subheader, path, open }: ProfileListItemProps) => {
  return (
    <ListItemButton 
      component={Link} 
      href={path}
      sx={{
        justifyContent: open ? 'initial' : 'center',
        px: 2.5,
      }}
    >
      <Stack spacing={2} alignItems="center" direction="row" justifyContent={open ? 'flex-start' : 'center'} width={1}>
        <Avatar src={AvatarImage} sx={{ height: 36, width: 36, bgcolor: 'primary.main' }} />
        
        {/* Hide Text Details if Closed */}
        {open && (
          <Stack direction="column">
            <Typography variant="subtitle2" color="text.primary" letterSpacing={0.5}>
              {subheader}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={400}>
              Account Settings
            </Typography>
          </Stack>
        )}
      </Stack>
    </ListItemButton>
  );
};

export default ProfileListItem;