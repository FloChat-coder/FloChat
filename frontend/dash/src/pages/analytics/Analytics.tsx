import { useEffect, useState } from 'react';
import { Box, Grid, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, Stack } from '@mui/material';
import TopCard from '../../components/sections/dashboard/top-cards/TopCard';
import ReactEchart from '../../components/base/ReactEchart';
import * as echarts from 'echarts';

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

interface TimeSeriesData {
  date: string;
  sessions: number;
  avg_messages: number;
  tokens: number;
  cost: number;
  handoff_rate: number;
  resolution_rate: number;
  leads: number;
}

export default function Analytics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesData[]>([]);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  
  // New state to select which metric to display on the chart
  const [selectedMetric, setSelectedMetric] = useState<keyof TimeSeriesData>('sessions'); 
  const [loading, setLoading] = useState(true);

  // Fetch Aggregate Metrics
  useEffect(() => {
    fetch('/api/analytics/metrics')
      .then((res) => res.json())
      .then((data: MetricsData) => {
        if (!data.error) setMetrics(data);
      })
      .catch(console.error);
  }, []);

  // Fetch Time-Series Data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/timeseries?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setTimeseries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (!metrics) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

  // Mapping to make chart labels pretty
  const metricLabels: Record<string, string> = {
    sessions: 'Total Sessions',
    avg_messages: 'Avg Messages per Session',
    tokens: 'Tokens Used',
    cost: 'Estimated Cost ($)',
    handoff_rate: 'Handoff Rate (%)',
    resolution_rate: 'Resolution Rate (%)',
    leads: 'Leads Captured'
  };

  const chartOptions = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: timeseries.map(item => item.date),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: metricLabels[selectedMetric as string],
        data: timeseries.map(item => item[selectedMetric]),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#007FFF' }, // Customize color as needed
        areaStyle: { opacity: 0.1, color: '#007FFF' }
      }
    ]
  };

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

      {/* Chart Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} mb={2}>
        <Typography variant="h6">Performance Over Time</Typography>
        
        <Stack direction="row" spacing={2}>
          {/* Chart Metric Selector */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Metric to Graph</InputLabel>
            <Select
              value={selectedMetric as string}
              label="Metric to Graph"
              onChange={(e) => setSelectedMetric(e.target.value as keyof TimeSeriesData)}
            >
              {Object.entries(metricLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Time Period Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value as 'day' | 'month' | 'year')}
            >
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="year">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
      
      <Box height={400} width="100%" bgcolor="background.paper" p={2} borderRadius={2}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : timeseries.length === 0 ? (
           <Typography align="center" mt={10}>No data available for this period.</Typography>
        ) : (
          <ReactEchart echarts={echarts} option={chartOptions} style={{ height: '100%', width: '100%' }} />
        )}
      </Box>
    </Box>
  );
}