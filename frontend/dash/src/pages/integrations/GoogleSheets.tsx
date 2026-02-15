import { useState } from 'react';
import {  Button, Grid, Paper, Stack, TextField, Typography, Alert } from '@mui/material';

const GoogleSheets = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [range, setRange] = useState('A1:Z100');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}><Typography variant="h4">Google Sheets Integration</Typography></Grid>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Stack spacing={3}>
            <TextField 
              label="Sheet URL" 
              placeholder="https://docs.google.com/..." 
              value={sheetUrl} 
              onChange={(e) => setSheetUrl(e.target.value)} 
              fullWidth 
            />
            <TextField 
              label="Data Range" 
              value={range} 
              onChange={(e) => setRange(e.target.value)} 
            />
            <Button variant="contained" onClick={() => setStatus('success')}>
              Connect Sheet
            </Button>
            {status === 'success' && <Alert severity="success">Connected!</Alert>}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default GoogleSheets;