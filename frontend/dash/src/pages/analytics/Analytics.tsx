import { useEffect, useState } from 'react';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import TopCard from '../../components/sections/dashboard/top-cards/TopCard';

// 1. Define the expected API data structure
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
  error?: string;
}

export default function Analytics() {
  // 2. Use the interface instead of 'any'
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

  if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (!metrics) return <Typography>Error loading analytics.</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h4" mb={4}>FloChat Analytics</Typography>
      
      <Typography variant="h6" mb={2}>Engagement Metrics</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}><TopCard title="Total Sessions" value={metrics.total_sessions.toString()} icon="mdi:chat" rate="0" isUp={true}/></Grid>
        <Grid item xs={12} sm={4}><TopCard title="Total Messages" value={metrics.total_messages.toString()} icon="mdi:message-reply-text" rate="0" isUp={true} /></Grid>
        <Grid item xs={12} sm={4}><TopCard title="Avg Messages/Session" value={metrics.avg_messages_per_session.toString()} icon="mdi:chart-line" rate="0" isUp={true}/></Grid>
      </Grid>

      <Typography variant="h6" mb={2}>Cost & AI Metrics</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}><TopCard title="Estimated API Cost" value={`$${metrics.total_cost.toFixed(4)}`} icon="mdi:currency-usd" rate="0" isUp={true}/></Grid>
        <Grid item xs={12} sm={4}><TopCard title="Total Tokens Used" value={metrics.total_tokens.toLocaleString()} icon="mdi:database" rate="0" isUp={true}/></Grid>
        <Grid item xs={12} sm={4}><TopCard title="Top Model Used" value={metrics.top_model} icon="mdi:robot" rate="0" isUp={true}/></Grid>
      </Grid>

      <Typography variant="h6" mb={2}>Quality & Resolution</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}><TopCard title="AI Resolution Rate" value={`${metrics.resolution_rate}%`} icon="mdi:check-circle" rate="0" isUp={true}/></Grid>
        <Grid item xs={12} sm={4}><TopCard title="Human Handoff Rate" value={`${metrics.handoff_rate}%`} icon="mdi:account-alert" rate="0" isUp={true}/></Grid>
        <Grid item xs={12} sm={4}><TopCard title="Leads Captured" value={metrics.lead_capture_count.toString()} icon="mdi:email-check" rate="0" isUp={true}/></Grid>
      </Grid>
    </Box>
  );
}