import { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { 
  Box, Button, Grid, Paper, Stack, TextField, Typography, Divider, MenuItem, Select, FormControl, InputLabel, InputAdornment, IconButton, CircularProgress, SelectChangeEvent
} from '@mui/material';


// Litellm Model Mapping
const PROVIDER_MODELS: Record<string, { label: string, value: string }[]> = {
  'google': [
    { label: 'Gemini 2.5 Flash', value: 'gemini/gemini-2.5-flash' },
    { label: 'Gemini 1.5 Pro', value: 'gemini/gemini-1.5-pro' }
  ],
  'openai': [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
  ],
  'anthropic': [
    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20240620' },
    { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
  ],
  'deepseek': [
    { label: 'DeepSeek Chat', value: 'deepseek/deepseek-chat' },
    { label: 'DeepSeek Coder', value: 'deepseek/deepseek-coder' }
  ],
  'groq': [
    { label: 'Llama 3 (8B)', value: 'groq/llama3-8b-8192' },
    { label: 'Mixtral 8x7B', value: 'groq/mixtral-8x7b-32768' }
  ]
};

const AiSettings = () => {
  const [prompt, setPrompt] = useState('You are a helpful assistant.');
  const [provider, setProvider] = useState('google');
  const [model, setModel] = useState('gemini/gemini-2.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle'|'testing'|'success'|'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial settings
  useEffect(() => {
    fetch('/api/ai/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setProvider(data.provider);
          setModel(data.model);
          setPrompt(data.system_instruction);
          // We don't fetch the actual key for security, just let user know if it exists
          if (data.has_key) setApiKey('••••••••••••••••');
        }
      });
  }, []);

  const handleProviderChange = (e: SelectChangeEvent) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    // Auto-select first model of new provider
    setModel(PROVIDER_MODELS[newProvider][0].value);
    setTestStatus('idle');
  };

  const handleTestConnection = async () => {
    if (!apiKey || apiKey === '••••••••••••••••') {
      setTestMessage('Please enter your actual API key to test.');
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, api_key: apiKey })
      });
      const data = await response.json();
      
      if (data.success) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Connection failed');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Network error occurred.');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const payload = {
      provider,
      model,
      system_instruction: prompt,
      // Only send API key if it was modified
      api_key: apiKey === '••••••••••••••••' ? '' : apiKey
    };

    try {
      const response = await fetch('/api/ai/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        alert('Settings saved successfully!');
      }
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Button is enabled if they've typed a real key and selected a model
  const isTestReady = apiKey.length > 0 && apiKey !== '••••••••••••••••' && model.length > 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}><Typography variant="h4">AI Provider & Settings</Typography></Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
          <Stack spacing={3}>
            <Typography variant="h6">1. Select AI Model</Typography>
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select value={provider} label="Provider" onChange={handleProviderChange}>
                  <MenuItem value="google">Google Gemini</MenuItem>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
                  <MenuItem value="deepseek">DeepSeek</MenuItem>
                  <MenuItem value="groq">Groq</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select value={model} label="Model" onChange={(e) => setModel(e.target.value)}>
                  {PROVIDER_MODELS[provider]?.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Typography variant="h6">2. API Credentials</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField 
  label={`${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`}
  type={showApiKey ? 'text' : 'password'}
  value={apiKey} 
  onChange={(e) => {
    setApiKey(e.target.value);
    setTestStatus('idle');
  }} 
  fullWidth 
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={() => setShowApiKey(!showApiKey)}
          edge="end"
        >
          {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/>
              <Button 
                variant="outlined" 
                onClick={handleTestConnection}
                disabled={!isTestReady || testStatus === 'testing'}
                sx={{ minWidth: 140, height: 56 }}
              >
                {testStatus === 'testing' ? <CircularProgress size={24} /> : 'Test Connection'}
              </Button>
              
              {testStatus === 'success' && <CheckCircleIcon color="success" />}
              {testStatus === 'error' && <ErrorIcon color="error" />}
            </Stack>
            {testMessage && (
              <Typography variant="caption" color={testStatus === 'success' ? 'success.main' : 'error.main'}>
                {testMessage}
              </Typography>
            )}

            <Typography variant="h6">3. System Prompt</Typography>
            <TextField 
              multiline 
              rows={5} 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              fullWidth 
              helperText="Instructions on how the AI should behave."
            />

            <Button 
              variant="contained" 
              size="large"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save AI Settings'}
            </Button>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
          <Typography variant="h6">Test Chat</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Remember to click "Save AI Settings" before testing the widget.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', border: '1px dashed grey', borderRadius: 2 }}>
            Widget Preview Placeholder
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AiSettings;