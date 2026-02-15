import { useState } from 'react';
import { MenuItem } from 'routes/sitemap';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Collapse from '@mui/material/Collapse';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconifyIcon from 'components/base/IconifyIcon';

interface CollapseListItemProps extends MenuItem {
  open: boolean;
}

const CollapseListItem = ({ subheader, active, items, icon, open }: CollapseListItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    setExpanded(!expanded);
  };

  return (
    <>
      <ListItemButton 
        onClick={handleClick}
        sx={{
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          {icon && (
            <IconifyIcon
              icon={icon}
              sx={{
                color: active ? 'primary.main' : null,
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
              color: active ? 'primary.main' : null,
            },
          }}
        />
        
        {/* Hide Arrow if Closed */}
        {open && (
          <IconifyIcon
            icon="iconamoon:arrow-right-2-duotone"
            color="neutral.dark"
            sx={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          />
        )}
      </ListItemButton>

      {/* Only render sub-menu if Sidebar is Open AND Item is Expanded */}
      <Collapse in={open && expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {items?.map((route) => {
            return (
              <ListItemButton
                key={route.pathName}
                component={Link}
                href={route.path}
                sx={{
                  pl: 9, // Indent for sub-items
                  borderLeft: 4,
                  borderStyle: 'solid',
                  borderColor: route.active ? 'primary.main' : 'transparent !important',
                  bgcolor: route.active ? 'info.dark' : 'info.darker',
                }}
              >
                <ListItemText
                  primary={route.name}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: route.active ? 'text.primary' : 'text.secondary',
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Collapse>
    </>
  );
};

export default CollapseListItem;