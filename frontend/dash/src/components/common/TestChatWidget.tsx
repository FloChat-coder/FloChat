import { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, Paper, Button, Stack, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const TestChatWidget = ({ clientId }: { clientId?: string }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !clientId) return;
    const userText = input.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      // Intentionally omitting session_id so the backend won't save it
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, client_id: clientId }) 
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply || "No response." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', content: "Error connecting to server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const code = `<script src="https://flochat-ocya.onrender.com/static/widget.js" id="flochat-script" data-client-id="${clientId}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!clientId) {
    return <Box p={3} textAlign="center"><CircularProgress size={24} /></Box>;
  }

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Test Chat</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCopy}
          startIcon={<ContentCopyIcon fontSize="small" />}
        >
          {copied ? 'Copied to Clipboard!' : 'Copy Widget Code'}
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden', height: 450, borderRadius: 3 }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="subtitle1" fontWeight="bold">FloChat Bot</Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#f9fafb' }}>
          <Typography sx={{ opacity: 0.5, textAlign: 'center', fontSize: '0.8rem', mb: 2, px: 2 }}>
            Use this window to chat with your configured bot. This is for test purpose only so anything you say here will not be updated anywhere in your Dashboard.
          </Typography>

          {messages.map((msg, idx) => (
            <Box key={idx} sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: msg.role === 'user' ? 'primary.main' : '#e5e7eb',
              color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
              px: 2, py: 1.2,
              borderRadius: 2,
              borderBottomRightRadius: msg.role === 'user' ? 2 : 16,
              borderBottomLeftRadius: msg.role === 'bot' ? 2 : 16,
              maxWidth: '85%',
              wordBreak: 'break-word',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <Typography variant="body2">{msg.content}</Typography>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ alignSelf: 'flex-start', bgcolor: '#e5e7eb', px: 2, py: 1.2, borderRadius: 2, borderBottomLeftRadius: 2 }}>
              <CircularProgress size={16} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, bgcolor: 'background.paper' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            sx={{ minWidth: 45, width: 45, height: 40, borderRadius: 8, px: 0 }}
          >
            <SendIcon fontSize="small" />
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
};

export default TestChatWidget;