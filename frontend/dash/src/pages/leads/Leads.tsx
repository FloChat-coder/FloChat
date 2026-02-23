import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Modal, Button } from '@mui/material';

interface ChatMessage {
  role: string;
  content: string;
}

interface Lead {
  id: number;
  email: string;
  session_id: string;
  created_at: string;
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

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetch('/api/leads/list')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setLeads(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch leads", err);
        setLoading(false);
      });
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Captured Leads</Typography>
      <Typography variant="body1" mb={3} color="textSecondary">
        These are users who showed purchasing intent but found an item out of stock.
      </Typography>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="leads table">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Date Captured</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Last User Message</TableCell>
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
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  No leads captured yet.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {lead.email}
                  </TableCell>
                  <TableCell>{lead.created_at}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      "{lead.snippet}"
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => setSelectedLead(lead)}>
                      View Chat
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Chat History Modal */}
      <Modal open={!!selectedLead} onClose={() => setSelectedLead(null)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={1}>Chat History</Typography>
          <Typography variant="caption" color="textSecondary" display="block" mb={3}>
            Captured Email: <strong style={{ color: 'black' }}>{selectedLead?.email}</strong>
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={1.5}>
            {selectedLead?.messages?.map((msg: ChatMessage, i: number) => {
              const isBot = msg.role === 'model' || msg.role === 'assistant';
              return (
                <Box 
                  key={i} alignSelf={isBot ? 'flex-start' : 'flex-end'}
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
            {(!selectedLead?.messages || selectedLead.messages.length === 0) && (
              <Typography variant="body2" color="textSecondary">No messages found for this session.</Typography>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}