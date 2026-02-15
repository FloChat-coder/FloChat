// import { useState } from 'react';
import { MenuItem } from 'routes/sitemap';
import Link from '@mui/material/Link';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconifyIcon from 'components/base/IconifyIcon';

interface ListItemProps extends MenuItem {
  open: boolean;
}

const ListItem = ({ subheader, icon, path, active, open }: ListItemProps) => {
  return (
    <ListItemButton
      component={Link}
      href={path}
      sx={{ 
        opacity: active ? 1 : 0.3,
        justifyContent: open ? 'initial' : 'center', // Center icon if closed
        px: 2.5,
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: open ? 3 : 'auto', // Add margin only if open
          justifyContent: 'center',
        }}
      >
        {icon && (
          <IconifyIcon
            icon={icon}
            sx={{
              color: active && path === '/' ? 'primary.main' : null,
              fontSize: 24
            }}
          />
        )}
      </ListItemIcon>
      
      {/* Hide Text if Closed */}
      <ListItemText
        primary={subheader}
        sx={{
          opacity: open ? 1 : 0,
          display: open ? 'block' : 'none',
          '& .MuiListItemText-primary': {
            color: active && path === '/' ? 'primary.main' : null,
          },
        }}
      />
    </ListItemButton>
  );
};

export default ListItem;