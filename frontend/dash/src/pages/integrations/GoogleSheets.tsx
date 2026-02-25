import { useState } from 'react';
import { Button, Grid, Paper, Stack, TextField, Typography, Alert, CircularProgress } from '@mui/material';

const GoogleSheets = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [range, setRange] = useState('Sheet1!A1:Z100'); // Better default to specify the tab
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleConnect = async () => {
    if (!sheetUrl) {
      setStatus('error');
      setErrorMessage("Please enter a valid Google Sheets URL");
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl, range }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus('success');
        setSheetUrl(''); // Clear the input after success
      } else {
        setStatus('error');
        setErrorMessage(data.error || "Failed to connect sheet.");
      }
    } catch (error: unknown) {
      setStatus('error');
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("A network error occurred.");
      }
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">Google Sheets Integration</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Connect a Google Sheet to serve as your chatbot's dynamic knowledge base.
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Stack spacing={3}>
            <TextField 
              label="Sheet URL" 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
              value={sheetUrl} 
              onChange={(e) => setSheetUrl(e.target.value)} 
              fullWidth 
            />
            <TextField 
              label="Data Range" 
              placeholder="Sheet1!A1:Z100"
              value={range} 
              onChange={(e) => setRange(e.target.value)} 
              helperText="Tip: Include the sheet tab name (e.g., Inventory!A1:D500)"
            />
            
            <Button 
              variant="contained" 
              onClick={handleConnect}
              disabled={status === 'loading'}
              sx={{ width: 'fit-content' }}
            >
              {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : "Connect Sheet"}
            </Button>
            
            {status === 'success' && (
              <Alert severity="success">
                Sheet successfully connected and added to your knowledge base! You can view it in the "All" tab.
              </Alert>
            )}
            {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default GoogleSheets;