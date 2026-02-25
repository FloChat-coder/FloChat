import { useState, useEffect } from 'react';
import { Button, Grid, Paper, Stack, Typography, Alert, CircularProgress, Box, Chip, IconButton, Divider } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

// --- Proper TypeScript Interfaces ---
interface PickerData {
  action: string;
  docs: { id: string }[];
}

interface PickerBuilderInstance {
  addView: (view: unknown) => PickerBuilderInstance;
  setOAuthToken: (token: string) => PickerBuilderInstance;
  setDeveloperKey: (key: string) => PickerBuilderInstance;
  setAppId: (appId: string) => PickerBuilderInstance; 
  setCallback: (cb: (data: PickerData) => void) => PickerBuilderInstance;
  build: () => { setVisible: (visible: boolean) => void };
}

declare global {
  interface Window {
    gapi: { load: (apiName: string, options: { callback: () => void }) => void; };
    google: {
      picker: {
        DocsView: new (viewId: string) => { setMimeTypes: (types: string) => void; };
        ViewId: { DOCS: string };
        PickerBuilder: new () => PickerBuilderInstance;
        Action: { PICKED: string };
      };
    };
  }
}

interface KnowledgeBase {
  id: number;
  file_id: string;
  name: string;
  type: string;
  details: string;
}
// ------------------------------------

const API_KEY = 'YOUR_GOOGLE_CLOUD_API_KEY';
const APP_ID = 'YOUR_PROJECT_NUMBER'; 

const DriveDocs = () => {
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  
  // States for the connected files list
  const [connectedFiles, setConnectedFiles] = useState<KnowledgeBase[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // 1. Check Linked Status & Fetch Files
  const checkStatusAndFetchFiles = async () => {
    try {
      const statusRes = await fetch('/api/google/status');
      const statusData = await statusRes.json();
      setIsGoogleLinked(statusData.linked);

      if (statusData.linked) {
        const response = await fetch('/api/integrations/list');
        const result = await response.json();
        if (Array.isArray(result)) {
          // Filter to show ONLY docs and pdfs on this page
          setConnectedFiles(result.filter(kb => kb.type === 'pdf' || kb.type === 'doc'));
        }
      }
    } catch (err) {
      console.error("Status check or fetch failed", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    checkStatusAndFetchFiles();

    // 2. Load the Google Picker script dynamically
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', { callback: () => setPickerApiLoaded(true) });
      };
      document.body.appendChild(script);
    };
    loadScript();
  }, []);

  const handleOpenPicker = async () => {
    if (!pickerApiLoaded) return;
    setStatus('idle');
    
    try {
      const tokenResponse = await fetch('/api/auth/token');
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.token) {
        throw new Error("Could not retrieve Google access token. Please reconnect your account.");
      }

      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
      view.setMimeTypes('application/pdf,application/vnd.google-apps.document');

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(tokenData.token)
        .setDeveloperKey(API_KEY)
        .setAppId(APP_ID)
        .setCallback(pickerCallback)
        .build();
        
      picker.setVisible(true);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const pickerCallback = async (data: PickerData) => {
    if (data.action === window.google.picker.Action.PICKED) {
      setStatus('loading');
      const fileId = data.docs[0].id;
      
      try {
        const response = await fetch('/api/drive/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId })
        });
        const result = await response.json();
        
        if (result.success) {
          setStatus('success');
          checkStatusAndFetchFiles(); // Refresh the table below after a new file is added!
        } else {
          setStatus('error');
          setErrorMessage(result.error || "Failed to process document");
        }
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage("Network error processing document");
      }
    }
  };

  // --- Delete Connected File ---
  const handleDeleteFile = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this file from your knowledge base?")) return;
    try {
      await fetch('/api/integrations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      checkStatusAndFetchFiles();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // Helper to render correct icon
  const getIcon = (type: string) => {
    if (type === 'pdf') return 'vscode-icons:file-type-pdf2';
    if (type === 'doc') return 'vscode-icons:file-type-word';
    return 'mingcute:document-fill';
  };

  // --- RENDERING STATE 1: LOADING ---
  if (isGoogleLinked === null) return <CircularProgress />;

  // --- RENDERING STATE 2: NOT LINKED YET ---
  if (isGoogleLinked === false) {
    return (
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant="h4">Drive & Docs Integration</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Select a PDF or Google Doc from your Drive to serve as your knowledge base.
          </Typography>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 5, borderRadius: 4, textAlign: 'center', backgroundColor: 'background.paper' }}>
            <Box mb={2}>
              <IconifyIcon icon="logos:google-drive" fontSize="72px" />
            </Box>
            <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Google Workspace Not Connected</Typography>
            <Typography variant="body1" color="text.secondary" mb={4} maxWidth={500} mx="auto">
              You signed up using an email and password. To access and extract text from your Google Drive files, you need to securely link your Google account to FloChat.
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
        <Typography variant="h4">Drive & Docs Integration</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Select a PDF or Google Doc from your Drive to serve as your chatbot's knowledge base.
        </Typography>
      </Grid>
      
      {/* CONNECTION FORM */}
      <Grid item xs={12}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Stack spacing={3} alignItems="flex-start">
            <Typography variant="h6" mb={1}>Select a New File</Typography>
            <Button 
              variant="contained" 
              onClick={handleOpenPicker}
              disabled={!pickerApiLoaded || status === 'loading'}
              sx={{ height: 56, px: 4 }}
            >
              {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : "Select File from Drive"}
            </Button>
            
            {status === 'success' && <Alert severity="success" sx={{ width: '100%' }}>Document successfully processed and saved!</Alert>}
            {status === 'error' && <Alert severity="error" sx={{ width: '100%' }}>{errorMessage}</Alert>}
          </Stack>
        </Paper>
      </Grid>

      {/* CONNECTED FILES LIST */}
      <Grid item xs={12}>
        <Typography variant="h5" mb={2}>Currently Connected Files</Typography>
        
        {loadingFiles ? (
          <CircularProgress />
        ) : connectedFiles.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="h6" color="text.secondary">No Drive files connected yet.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {connectedFiles.map((file) => (
              <Paper key={file.id} sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <IconifyIcon icon={getIcon(file.type)} fontSize="40px" />
                </Box>
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Typography variant="h6" noWrap>{file.name}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Chip size="small" label={file.details} color="primary" variant="outlined" />
                    <Chip size="small" label={`ID: ${file.file_id.substring(0, 8)}...`} variant="outlined" />
                    <Chip size="small" label="Active" color="success" />
                  </Stack>
                </Box>
                
                <Divider orientation="vertical" flexItem />
                
                <IconButton 
                  onClick={() => handleDeleteFile(file.id)} 
                  color="error" 
                  title="Remove File"
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

export default DriveDocs;