import { useState, useEffect } from 'react';
import { Button, Grid, Paper, Stack, Typography, Alert, CircularProgress } from '@mui/material';

interface PickerData {
  action: string;
  docs: { id: string }[];
}

interface PickerBuilderInstance {
  addView: (view: unknown) => PickerBuilderInstance;
  setOAuthToken: (token: string) => PickerBuilderInstance;
  setDeveloperKey: (key: string) => PickerBuilderInstance;
  setCallback: (cb: (data: PickerData) => void) => PickerBuilderInstance;
  build: () => { setVisible: (visible: boolean) => void };
  setAppId: (appId: string) => PickerBuilderInstance;
}

declare global {
  interface Window {
    gapi: {
      load: (apiName: string, options: { callback: () => void }) => void;
    };
    google: {
      picker: {
        DocsView: new (viewId: string) => {
          setMimeTypes: (types: string) => void;
        };
        ViewId: { DOCS: string };
        PickerBuilder: new () => PickerBuilderInstance;
        Action: { PICKED: string };
      };
    };
  }
}

const API_KEY = 'AIzaSyCHYKgQxCvqpUr8E3pXi01iz3vunjj32Qs'; // Replace this
const APP_ID = '912740302014-jussrcee80qluv3j2ucku8jju4amllun'; // Replace this with your actual app ID
const DriveDocs = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  

  useEffect(() => {
    // Load the Google Picker script dynamically
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
      // 1. Fetch the user's OAuth token from your backend
      const tokenResponse = await fetch('/api/auth/token');
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.token) {
        throw new Error("Could not retrieve Google access token. Please log in again.");
      }

      // 2. Configure the Picker view to only show PDFs and Docs
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
      view.setMimeTypes('application/pdf,application/vnd.google-apps.document');

      // 3. Build and render the Picker
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
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(String(err));
      }
    }
  };

  const pickerCallback = async (data: PickerData) => {
    if (data.action === window.google.picker.Action.PICKED) {
      setStatus('loading');
      const fileId = data.docs[0].id;
      
      try {
        // Send the file ID to the backend for processing
        const response = await fetch('/api/drive/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId })
        });
        
        const result = await response.json();
        
        if (result.success) {
          setStatus('success');
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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">Drive & Docs Integration</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Select a PDF or Google Doc from your Drive to serve as your chatbot's knowledge base.
        </Typography>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Stack spacing={3} alignItems="flex-start">
            <Button 
              variant="contained" 
              onClick={handleOpenPicker}
              disabled={!pickerApiLoaded || status === 'loading'}
            >
              {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : "Select File from Drive"}
            </Button>
            
            {status === 'success' && <Alert severity="success" sx={{ width: '100%' }}>Document successfully processed and saved to Knowledge Base!</Alert>}
            {status === 'error' && <Alert severity="error" sx={{ width: '100%' }}>{errorMessage}</Alert>}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DriveDocs;