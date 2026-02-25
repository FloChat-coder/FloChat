import { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Chip, Stack, IconButton } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface KnowledgeBase {
  id: number;
  file_id: string;
  name: string;
  type: 'sheet' | 'pdf' | 'doc' | 'error' | 'unknown';
  details: string;
}

const AllIntegrations = () => {
  const [data, setData] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/list');
      const result = await response.json();
      if (Array.isArray(result)) setData(result);
    } catch (error) {
      console.error("Failed to load integrations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this knowledge base?")) return;
    try {
      await fetch('/api/integrations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchIntegrations(); // Refresh list
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'sheet': return <IconifyIcon icon="vscode-icons:file-type-excel" fontSize="40px" />;
      case 'pdf': return <IconifyIcon icon="vscode-icons:file-type-pdf2" fontSize="40px" />;
      case 'doc': return <IconifyIcon icon="vscode-icons:file-type-word" fontSize="40px" />;
      default: return <IconifyIcon icon="mingcute:warning-fill" fontSize="40px" color="error" />;
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">All Knowledge Bases</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Manage the files your AI currently uses to answer questions.
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        {loading ? (
          <CircularProgress />
        ) : data.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="h6" color="text.secondary">No knowledge bases connected yet.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {data.map((kb) => (
              <Grid item xs={12} md={6} lg={4} key={kb.id}>
                <Paper sx={{ p: 3, borderRadius: 4, position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton 
                    onClick={() => handleDelete(kb.id)} 
                    color="error" 
                    size="small" 
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    title="Remove Knowledge Base"
                  >
                    <IconifyIcon icon="mingcute:delete-2-fill" />
                  </IconButton>
                  
                  <Box>{getIcon(kb.type)}</Box>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden', pr: 3 }}>
                    <Typography variant="h6" noWrap title={kb.name}>{kb.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{kb.details}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip size="small" label={`ID: ${kb.file_id.substring(0, 6)}...`} variant="outlined" />
                      <Chip size="small" label="Active" color="success" />
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default AllIntegrations;