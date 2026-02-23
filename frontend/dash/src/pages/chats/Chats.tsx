import { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText, Modal, Divider } from '@mui/material';
import IconifyIcon from '../../components/base/IconifyIcon';

// 1. Define Message Structure
interface ChatMessage {
  role: string;
  content: string;
}

// 2. Define Session Structure
interface ChatSession {
  session_id: string;
  date: string;
  snippet: string;
  messages: ChatMessage[];
}

const modalStyle = {
  position: 'absolute' as const, // FIXED: as const instead of string literal
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxHeight: '80vh',
  overflowY: 'auto',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2
};

export default function Chats() {
  const [keyword, setKeyword] = useState('');
  
  // 3. Remove 'any' types
  const [results, setResults] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chats/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Global Chat Search</Typography>
      <Box display="flex" gap={2} mb={4}>
        <TextField 
          fullWidth 
          label="Search by keyword (e.g., Refund, Issue, Pricing)" 
          variant="outlined" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="contained" onClick={handleSearch} disabled={loading}>
          <IconifyIcon icon="mdi:search" fontSize={24} /> Search
        </Button>
      </Box>

      <Paper>
        <List>
          {results.length === 0 && !loading && (
            <ListItem><ListItemText primary="No results found." /></ListItem>
          )}
          {results.map((session, idx) => (
            <div key={session.session_id}>
              <ListItem 
                button 
                onClick={() => setSelectedChat(session)}
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemText 
                  primary={`Session Date: ${session.date}`} 
                  secondary={session.snippet} 
                />
              </ListItem>
              {idx < results.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </Paper>

      {/* Detail View Modal */}
      <Modal open={!!selectedChat} onClose={() => setSelectedChat(null)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>Chat History</Typography>
          <Typography variant="caption" color="textSecondary" display="block" mb={2}>
            Session ID: {selectedChat?.session_id}
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={1.5}>
            {/* 4. Type the msg variable */}
            {selectedChat?.messages.map((msg: ChatMessage, i: number) => {
              const isBot = msg.role === 'model' || msg.role === 'assistant';
              return (
                <Box 
                  key={i} 
                  alignSelf={isBot ? 'flex-start' : 'flex-end'}
                  bgcolor={isBot ? 'grey.200' : 'primary.main'}
                  color={isBot ? 'text.primary' : 'primary.contrastText'}
                  px={2} py={1} borderRadius={2} maxWidth="80%"
                >
                  <Typography variant="caption" display="block" mb={0.5} sx={{ opacity: 0.7, fontWeight: 'bold' }}>
                    {isBot ? 'FloChat' : 'User'}
                  </Typography>
                  <Typography variant="body2">{msg.content}</Typography>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}