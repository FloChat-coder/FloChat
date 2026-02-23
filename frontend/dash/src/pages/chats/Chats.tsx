import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Modal, CircularProgress } from '@mui/material';
import IconifyIcon from '../../components/base/IconifyIcon';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatSession {
  session_id: string;
  date: string;
  snippet: string;
  messages: ChatMessage[];
}

const modalStyle = {
  position: 'absolute' as const,
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
  const [results, setResults] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true); // Default to true so it spins on initial load
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);

  // Fetch all chats on page load
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }) 
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
      
      {/* Search Bar Area */}
      <Box display="flex" gap={2} mb={4}>
        <TextField 
          fullWidth 
          label="Search by keyword (e.g., Refund, Issue, Pricing) or leave blank for all" 
          variant="outlined" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="contained" onClick={handleSearch} disabled={loading} sx={{ minWidth: 120 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : <><IconifyIcon icon="mdi:search" fontSize={24} sx={{mr: 1}}/> Search</>}
        </Button>
      </Box>

      {/* Results Table (Matches the Leads Page UI) */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="chats table">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Session Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Session ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Conversation Snippet</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  No chat history found. Try a different keyword or check back later.
                </TableCell>
              </TableRow>
            ) : (
              results.map((session) => (
                <TableRow key={session.session_id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {session.session_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      "{session.snippet}"
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => setSelectedChat(session)}>
                      View Chat
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail View Modal */}
      <Modal open={!!selectedChat} onClose={() => setSelectedChat(null)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>Chat History</Typography>
          <Typography variant="caption" color="textSecondary" display="block" mb={2}>
            Session ID: {selectedChat?.session_id}
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={1.5}>
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
            {(!selectedChat?.messages || selectedChat.messages.length === 0) && (
              <Typography variant="body2" color="textSecondary">No messages found for this session.</Typography>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}