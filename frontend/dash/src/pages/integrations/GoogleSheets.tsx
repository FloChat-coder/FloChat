import { useState, useEffect } from 'react';
import { Button, Grid, Paper, Stack, TextField, Typography, Alert, CircularProgress, Box, Chip, IconButton, Divider } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface KnowledgeBase {
  id: number;
  file_id: string;
  name: string;
  type: string;
  details: string;
}

const GoogleSheets = () => {
  // 1. Single set of input states
  const [url, setUrl] = useState('');
  const [tabName, setTabName] = useState('');
  const [range, setRange] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // 2. State for previously connected sheets
  const [connectedSheets, setConnectedSheets] = useState<KnowledgeBase[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(true);

  // --- Fetch Connected Sheets ---
  const fetchSheets = async () => {
    try {
      const response = await fetch('/api/integrations/list');
      const result = await response.json();
      if (Array.isArray(result)) {
        // Filter out PDFs/Docs to only show Sheets on this page
        setConnectedSheets(result.filter(kb => kb.type === 'sheet'));
      }
    } catch (error) {
      console.error("Failed to load sheets", error);
    } finally {
      setLoadingSheets(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  // --- Handle Connecting ---
  const handleConnect = async () => {
    if (!url) {
      setStatus('error');
      setErrorMessage("Please enter a valid Google Sheets URL");
      return;
    }
    if (!tabName || !range) {
      setStatus('error');
      setErrorMessage("Tab Name and Range are required");
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Concatenate the inputs securely for the backend
      const combinedRange = `${tabName}!${range}`;
      
      const response = await fetch('/api/sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: url, range: combinedRange }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Clear form and show success
        setStatus('success');
        setUrl('');
        setTabName('Sheet1');
        setRange('A1:Z100');
        
        fetchSheets(); // Refresh the table below
      } else {
        setStatus('error');
        setErrorMessage(data.error || "Failed to connect sheet.");
      }
    } catch (error: unknown) { 
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "A network error occurred.");
    }
  };

  // --- Delete Connected Sheet ---
  const handleDeleteSheet = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this sheet from your knowledge base?")) return;
    try {
      await fetch('/api/integrations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchSheets();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <Grid container spacing={4}>
      
      {/* HEADER */}
      <Grid item xs={12}>
        <Typography variant="h4">Google Sheets Integration</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Connect Google Sheets to serve as your chatbot's dynamic knowledge base. Add them below.
        </Typography>
      </Grid>
      
      {/* CONNECTION FORM */}
      <Grid item xs={12}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h6" mb={3}>Add New Sheet</Typography>
          
          <Stack spacing={2}>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2} 
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
            >
              <TextField 
                placeholder="Sheet URL (https://docs.google.com/...)" 
                value={url} 
                onChange={(e) => { setUrl(e.target.value); setStatus('idle'); }} 
                sx={{ flexGrow: 1, width: { xs: '100%', md: '400px' } }}
                disabled={status === 'loading'}
                InputProps={{ sx: { height: 56 } }}
              />
              <TextField 
                placeholder="Tab Name (e.g. Sheet1)"
                value={tabName} 
                onChange={(e) => { setTabName(e.target.value); setStatus('idle'); }} 
                sx={{ width: { xs: '100%', md: '200px' } }}
                disabled={status === 'loading'}
                InputProps={{ sx: { height: 56 } }}
              />
              <TextField 
                placeholder="Range (e.g. A1:Z100)"
                value={range} 
                onChange={(e) => { setRange(e.target.value); setStatus('idle'); }} 
                sx={{ width: { xs: '100%', md: '150px' } }}
                disabled={status === 'loading'}
                InputProps={{ sx: { height: 56 } }}
              />
              
              <Button 
                variant="contained" 
                onClick={handleConnect}
                disabled={status === 'loading'}
                sx={{ height: 56, minWidth: 120 }}
              >
                {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : "Connect"}
              </Button>
            </Stack>

            {status === 'success' && (
              <Alert severity="success" sx={{ mt: 2 }}>Sheet successfully connected!</Alert>
            )}
            {status === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>
            )}
          </Stack>
        </Paper>
      </Grid>

      {/* CONNECTED SHEETS TABLE/LIST */}
      <Grid item xs={12}>
        <Typography variant="h5" mb={2}>Currently Connected Sheets</Typography>
        
        {loadingSheets ? (
          <CircularProgress />
        ) : connectedSheets.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="h6" color="text.secondary">No Google Sheets connected yet.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {connectedSheets.map((sheet) => (
              <Paper key={sheet.id} sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <IconifyIcon icon="vscode-icons:file-type-excel" fontSize="40px" />
                </Box>
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Typography variant="h6" noWrap>{sheet.name}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Chip size="small" label={sheet.details} color="primary" variant="outlined" />
                    <Chip size="small" label={`ID: ${sheet.file_id.substring(0, 8)}...`} variant="outlined" />
                    <Chip size="small" label="Active Sync" color="success" />
                  </Stack>
                </Box>
                
                <Divider orientation="vertical" flexItem />
                
                <IconButton 
                  onClick={() => handleDeleteSheet(sheet.id)} 
                  color="error" 
                  title="Remove Sheet"
                  sx={{ ml: 1 }}
                >
                  <IconifyIcon icon="mingcute:delete-2-fill" />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Grid>

    </Grid>
  );
};

export default GoogleSheets;