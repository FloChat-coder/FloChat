import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
// Removing TopCards and WebsiteVisitors imports per your requirement
import TopCard from 'components/sections/dashboard/top-cards/TopCard';
import TestChatWidget from 'components/common/TestChatWidget';

interface MetricsData {
  total_sessions: number;
  total_messages: number;
  avg_messages_per_session: number;
  total_tokens: number;
  total_cost: number;
  top_model: string;
  resolution_rate: number;
  handoff_rate: number;
  lead_capture_count: number;
  client_id?: string; // Add this
  error?: string;
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/metrics')
      .then((res) => res.json())
      .then((data: MetricsData) => {
        if (!data.error) setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box p={1}>
      <Typography variant="h5" mb={3} fontWeight="bold">
        FloChat Performance Summary
      </Typography>

      <Grid container spacing={{ xs: 2.5, sm: 3, lg: 3.75 }} mb={4}>
        {loading ? (
          <Box display="flex" width="100%" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : metrics ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <TopCard title="Total Sessions" value={metrics.total_sessions.toString()} icon="mdi:chat" rate="0" isUp={true} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TopCard title="API Spend" value={`$${metrics.total_cost.toFixed(4)}`} icon="mdi:currency-usd" rate="0" isUp={true} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TopCard title="AI Resolution Rate" value={`${metrics.resolution_rate}%`} icon="mdi:robot-outline" rate="0" isUp={true} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TopCard title="Leads Captured" value={metrics.lead_capture_count.toString()} icon="mdi:email-fast-outline" rate="0" isUp={true} />
            </Grid>
          </>
        ) : (
          <Typography color="textSecondary" sx={{ ml: 3 }}>
            Failed to load analytics data.
          </Typography>
        )}
      </Grid>

      {/* Replaced Existing Dashboard Content with Test Chat Widget */}
      <Grid container spacing={{ xs: 2.5, sm: 3, lg: 3.75 }}>
        <Grid item xs={12} md={8} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.default' }}>
            <TestChatWidget clientId={metrics?.client_id} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;