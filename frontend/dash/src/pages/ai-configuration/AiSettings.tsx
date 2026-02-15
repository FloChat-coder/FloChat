import { useState } from 'react';
import { Box, Button, Grid, Paper, Stack, TextField, Typography, Divider } from '@mui/material';

const AiSettings = () => {
  const [prompt, setPrompt] = useState('You are a helpful assistant.');

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}><Typography variant="h4">AI Settings</Typography></Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6">System Prompt</Typography>
            <TextField 
              multiline 
              rows={8} 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              fullWidth 
            />
            <Button variant="contained">Save Prompt</Button>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
          <Typography variant="h6">Test Chat</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            Chat Widget Preview Here
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AiSettings;