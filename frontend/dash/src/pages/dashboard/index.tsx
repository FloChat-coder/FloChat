import Grid from '@mui/material/Grid';
import TopCards from 'components/sections/dashboard/top-cards';
import WebsiteVisitors from 'components/sections/dashboard/website-visitors';

const Dashboard = () => {
  return (
    <Grid container spacing={{ xs: 2.5, sm: 3, lg: 3.75 }}>
      <Grid item xs={12}>
        <TopCards />
      </Grid>
      <Grid item xs={12}>
        <WebsiteVisitors />
      </Grid>
    </Grid>
  );
};

export default Dashboard;