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

interface SheetInputRow {
  id: string;
  url: string;
  tabName: string;
  range: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string;
}

const GoogleSheets = () => {
  // 1. State for dynamic input rows
  const [inputs, setInputs] = useState<SheetInputRow[]>([
    { id: 'initial-row', url: '', tabName: 'Sheet1', range: 'A1:Z100', status: 'idle', errorMessage: '' }
  ]);
  
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

  // --- Input Row Handlers ---
  const updateInput = (index: number, updates: Partial<SheetInputRow>) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], ...updates };
    setInputs(newInputs);
  };

  const handleAddMore = () => {
    setInputs([
      ...inputs, 
      { id: Math.random().toString(), url: '', tabName: 'Sheet1', range: 'A1:Z100', status: 'idle', errorMessage: '' }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    const newInputs = [...inputs];
    newInputs.splice(index, 1);
    setInputs(newInputs);
  };

  const handleConnect = async (index: number) => {
    const row = inputs[index];
    
    if (!row.url) {
      updateInput(index, { status: 'error', errorMessage: "Please enter a valid Google Sheets URL" });
      return;
    }
    if (!row.tabName || !row.range) {
      updateInput(index, { status: 'error', errorMessage: "Tab Name and Range are required" });
      return;
    }

    updateInput(index, { status: 'loading', errorMessage: '' });

    try {
      // Concatenate the inputs securely for the backend
      const combinedRange = `${row.tabName}!${row.range}`;
      
      const response = await fetch('/api/sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: row.url, range: combinedRange }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        updateInput(index, { status: 'success', url: '' }); // Clear URL on success
        fetchSheets(); // Refresh the table below
      } else {
        updateInput(index, { status: 'error', errorMessage: data.error || "Failed to connect sheet." });
      }
    } catch (error: any) {
      updateInput(index, { status: 'error', errorMessage: error.message || "A network error occurred." });
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
          Connect Google Sheets to serve as your chatbot's dynamic knowledge base. Add them one by one below.
        </Typography>
      </Grid>
      
      {/* CONNECTION FORM */}
      <Grid item xs={12}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h6" mb={3}>Add New Sheets</Typography>
          
          <Stack spacing={4}>
            {inputs.map((row, index) => (
              <Box key={row.id}>
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={2} 
                  alignItems={{ xs: 'stretch', md: 'flex-start' }}
                >
                  <TextField 
                    label="Sheet URL" 
                    placeholder="https://docs.google.com/spreadsheets/d/..." 
                    value={row.url} 
                    onChange={(e) => updateInput(index, { url: e.target.value, status: 'idle' })} 
                    sx={{ flexGrow: 1 }}
                    disabled={row.status === 'loading'}
                  />
                  <TextField 
                    label="Tab Name" 
                    placeholder="Sheet1"
                    value={row.tabName} 
                    onChange={(e) => updateInput(index, { tabName: e.target.value, status: 'idle' })} 
                    sx={{ width: { xs: '100%', md: '180px' } }}
                    disabled={row.status === 'loading'}
                  />
                  <TextField 
                    label="Data Range" 
                    placeholder="A1:Z100"
                    value={row.range} 
                    onChange={(e) => updateInput(index, { range: e.target.value, status: 'idle' })} 
                    sx={{ width: { xs: '100%', md: '140px' } }}
                    disabled={row.status === 'loading'}
                  />
                  
                  <Button 
                    variant="contained" 
                    onClick={() => handleConnect(index)}
                    disabled={row.status === 'loading'}
                    sx={{ height: 56, minWidth: 120 }}
                  >
                    {row.status === 'loading' ? <CircularProgress size={24} color="inherit" /> : "Connect"}
                  </Button>

                  {inputs.length > 1 && (
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveRow(index)}
                      sx={{ height: 56, width: 56 }}
                      disabled={row.status === 'loading'}
                    >
                      <IconifyIcon icon="mingcute:delete-2-fill" />
                    </IconButton>
                  )}
                </Stack>

                {row.status === 'success' && (
                  <Alert severity="success" sx={{ mt: 2 }}>Sheet successfully connected!</Alert>
                )}
                {row.status === 'error' && (
                  <Alert severity="error" sx={{ mt: 2 }}>{row.errorMessage}</Alert>
                )}
              </Box>
            ))}

            <Button 
              variant="text" 
              startIcon={<IconifyIcon icon="mingcute:add-fill" />} 
              onClick={handleAddMore}
              sx={{ width: 'fit-content' }}
            >
              Add More
            </Button>
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
                    {/* Displaying details string which already contains the full Range info */}
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