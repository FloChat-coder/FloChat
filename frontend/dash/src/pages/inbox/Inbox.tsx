import { useEffect, useState } from 'react';
import { 
  Grid, Card, CardContent, Typography, TextField, Button, 
  CircularProgress, Alert, Chip, Box, Stack 
} from '@mui/material';

interface HandoffCluster {
  id: number;
  question: string;
  date: string;
  users: number;
}

const Inbox = () => {
  const [clusters, setClusters] = useState<HandoffCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track inputs and loading states for individual answers
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/handoff/inbox');
      if (!res.ok) throw new Error('Failed to fetch inbox data');
      const data = await res.json();
      setClusters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (id: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [id]: text }));
  };

  const handleResolve = async (clusterId: number) => {
    const answerText = answers[clusterId]?.trim();
    if (!answerText) return;

    try {
      setSubmitting((prev) => ({ ...prev, [clusterId]: true }));
      const res = await fetch('/api/handoff/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster_id: clusterId, answer: answerText }),
      });

      if (!res.ok) throw new Error('Failed to submit answer');

      // Remove the resolved cluster from the UI
      setClusters((prev) => prev.filter((c) => c.id !== clusterId));
      
      // Clear the answer text from state
      setAnswers((prev) => {
        const newState = { ...prev };
        delete newState[clusterId];
        return newState;
      });

    } catch (err) {
      alert(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSubmitting((prev) => ({ ...prev, [clusterId]: false }));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', pt: 2 }}>
      <Typography variant="h4" mb={1} fontWeight="bold">
        Support Inbox
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Answer questions the AI couldn't resolve. Submitting an answer will automatically email all users waiting for a response to that specific question.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {clusters.length === 0 ? (
        <Alert severity="success">You're all caught up! No pending questions.</Alert>
      ) : (
        <Grid container spacing={3}>
          {clusters.map((cluster) => (
            <Grid item xs={12} key={cluster.id}>
              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {cluster.question}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        First asked: {new Date(cluster.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${cluster.users} User${cluster.users !== 1 ? 's' : ''} waiting`} 
                      color="warning" 
                      variant="outlined" 
                    />
                  </Stack>

                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Type your answer here... This will be emailed directly to the user(s)."
                    variant="outlined"
                    value={answers[cluster.id] || ''}
                    onChange={(e) => handleAnswerChange(cluster.id, e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={submitting[cluster.id]}
                  />

                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleResolve(cluster.id)}
                      disabled={!answers[cluster.id]?.trim() || submitting[cluster.id]}
                      startIcon={submitting[cluster.id] ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {submitting[cluster.id] ? 'Sending...' : 'Send Answer & Resolve'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Inbox;