import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const Paper: Components<Omit<Theme, 'components'>>['MuiPaper'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3.5),
      // FIX: Changed from theme.palette.info.main to theme.palette.background.paper
      backgroundColor: theme.palette.background.paper, 
      boxShadow: theme.shadows[0], // Optional: Removes shadow for a flat look
      borderRadius: 16, // Keeps the nice rounded corners
      '&.MuiPaper-elevation0': {
        boxShadow: 'none',
      },
    }),
  },
};

export default Paper;