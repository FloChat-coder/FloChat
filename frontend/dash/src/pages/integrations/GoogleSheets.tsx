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
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean | null>(null);
  
  const [url, setUrl] = useState('');
  const [tabName, setTabName] = useState('Sheet1');
  const [range, setRange] = useState('A1:Z100');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [connectedSheets, setConnectedSheets] = useState<KnowledgeBase[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(true);

  const checkStatusAndFetchSheets = async () => {
    try {
      // 1. Check if Google is Linked
      const statusRes = await fetch('/api/google/status');
      const statusData = await statusRes.json();
      setIsGoogleLinked(statusData.linked);

      // 2. Only fetch sheets if they are actually linked
      if (statusData.linked) {
        const response = await fetch('/api/integrations/list');
        const result = await response.json();
        if (Array.isArray(result)) {
          setConnectedSheets(result.filter(kb => kb.type === 'sheet'));
        }
      }
    } catch (error) {
      console.error("Failed to load status/sheets", error);
    } finally {
      setLoadingSheets(false);
    }
  };

  useEffect(() => {
    checkStatusAndFetchSheets();
  }, []);

  const handleConnect = async () => {
    if (!url) { setStatus('error'); setErrorMessage("Please enter a valid Google Sheets URL"); return; }
    if (!tabName || !range) { setStatus('error'); setErrorMessage("Tab Name and Range are required"); return; }

    setStatus('loading');
    setErrorMessage('');

    try {
      const combinedRange = `${tabName}!${range}`;
      const response = await fetch('/api/sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: url, range: combinedRange }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus('success');
        setUrl(''); setTabName('Sheet1'); setRange('A1:Z100');
        checkStatusAndFetchSheets(); 
      } else {
        setStatus('error'); setErrorMessage(data.error || "Failed to connect sheet.");
      }
    } catch (error: unknown) { 
      setStatus('error'); setErrorMessage(error instanceof Error ? error.message : "A network error occurred.");
    }
  };

  const handleDeleteSheet = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this sheet from your knowledge base?")) return;
    try {
      await fetch('/api/integrations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      checkStatusAndFetchSheets();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // --- RENDERING STATE 1: LOADING ---
  if (isGoogleLinked === null) {
    return <CircularProgress />;
  }

  // --- RENDERING STATE 2: NOT LINKED YET ---
  if (isGoogleLinked === false) {
    return (
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant="h4">Google Sheets Integration</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Connect Google Sheets to serve as your chatbot's dynamic knowledge base.
          </Typography>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 5, borderRadius: 4, textAlign: 'center', backgroundColor: 'background.paper' }}>
            <Box mb={2}>
              <IconifyIcon icon="vscode-icons:file-type-excel" fontSize="72px" />
            </Box>
            <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Google Workspace Not Connected</Typography>
            <Typography variant="body1" color="text.secondary" mb={4} maxWidth={500} mx="auto">
              You signed up using an email and password. To pull data directly from your Google Sheets, you need to securely link your Google account to FloChat.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              component="a" 
              href="/login" 
              startIcon={<IconifyIcon icon="logos:google-icon" />}
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              Connect Google Account
            </Button>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  // --- RENDERING STATE 3: FULLY LINKED (Normal View) ---
  return (
    <Grid container spacing={4}>
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
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
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

            {status === 'success' && <Alert severity="success" sx={{ mt: 2 }}>Sheet successfully connected!</Alert>}
            {status === 'error' && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>}
          </Stack>
        </Paper>
      </Grid>

      {/* CONNECTED SHEETS LIST */}
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
                <Box><IconifyIcon icon="vscode-icons:file-type-excel" fontSize="40px" /></Box>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Typography variant="h6" noWrap>{sheet.name}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Chip size="small" label={sheet.details} color="primary" variant="outlined" />
                    <Chip size="small" label={`ID: ${sheet.file_id.substring(0, 8)}...`} variant="outlined" />
                    <Chip size="small" label="Active Sync" color="success" />
                  </Stack>
                </Box>
                <Divider orientation="vertical" flexItem />
                <IconButton onClick={() => handleDeleteSheet(sheet.id)} color="error" title="Remove Sheet" sx={{ ml: 1 }}>
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