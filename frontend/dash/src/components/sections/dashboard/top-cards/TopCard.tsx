import { fontFamily } from 'theme/typography';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import IconifyIcon from 'components/base/IconifyIcon';
import RateChip from 'components/chips/RateChip';

interface TopCardProps {
  icon: string;
  title: string;
  value: string;
  rate: string;
  isUp: boolean;
}

const TopCard = (props: TopCardProps) => {
  const { icon, title, value, rate, isUp } = props;

  return (
    <Grid item xs={12} sm={6} xl={3}>
      <Stack
        p={2.25}
        pl={2.5}
        direction="column"
        component={Paper}
        gap={1.5}
        minHeight={116} // Changed from fixed height to minHeight to prevent overflow
        width={1}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" alignItems="center" gap={1}>
            <IconifyIcon icon={icon} color="primary.main" fontSize="h5.fontSize" />
            <Typography variant="subtitle2" color="text.secondary" fontFamily={fontFamily.workSans}>
              {title}
            </Typography>
          </Stack>

          <IconButton
            aria-label="menu"
            size="small"
            sx={{ color: 'neutral.light', fontSize: 'h5.fontSize', p: 0 }}
          >
            <IconifyIcon icon="solar:menu-dots-bold" />
          </IconButton>
        </Stack>

        <Stack 
          direction="row" 
          alignItems="center" 
          flexWrap="wrap" 
          gap={1.5}
        >
          <Typography 
            variant="h4" // Slightly scaled down from h3 to fit longer numbers better
            fontWeight={600} 
            letterSpacing={1}
            sx={{ wordBreak: 'break-word' }} // Ensures long token numbers wrap instead of breaking out
          >
            {value}
          </Typography>
          <RateChip rate={rate} isUp={isUp} />
        </Stack>
      </Stack>
    </Grid>
  );
};

export default TopCard;