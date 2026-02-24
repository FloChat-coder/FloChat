import { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, Paper, Button, Stack, CircularProgress, IconButton, Tooltip, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

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
    <Stack spacing={2} sx={{ height: '100%', position: 'relative' }}>
      
      {/* 1. Header Area - Centered Title & Positioned Copy Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', mb: 1 }}>
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          Test Chat
        </Typography>
        
        <Box sx={{ position: 'absolute', right: 0 }}>
          <Tooltip title={copied ? "Copied!" : "Copy Widget Code"}>
            <Button
              variant={copied ? "contained" : "outlined"}
              color={copied ? "success" : "primary"}
              size="small"
              onClick={handleCopy}
              startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 600,
                boxShadow: copied ? 2 : 0
              }}
            >
              {copied ? 'Copied' : 'Copy Code'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* 2. Chat Window Container */}
      <Paper elevation={4} sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 0, 
        overflow: 'hidden', 
        height: 500, 
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        
        {/* Chat Header inside widget */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1rem' }}>🤖</Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>FloChat AI</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Typically replies instantly</Typography>
          </Box>
        </Box>

        {/* 3. Messages Area with improved contrast */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#F4F6F8' }}>
          
          {/* Disclaimer text as a distinct system message */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Typography sx={{ 
              fontSize: '0.75rem', 
              color: 'text.secondary', 
              bgcolor: 'rgba(0,0,0,0.05)', 
              px: 2, 
              py: 1, 
              borderRadius: 2, 
              textAlign: 'center',
              maxWidth: '90%'
            }}>
              Use this window to chat with your configured bot. This is for test purposes only so anything you say here will not be updated anywhere in your Dashboard.
            </Typography>
          </Box>

          {/* Bubbles */}
          {messages.map((msg, idx) => (
            <Box key={idx} sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: msg.role === 'user' ? 'primary.main' : '#ffffff',
              color: msg.role === 'user' ? '#ffffff' : 'text.primary',
              px: 2, py: 1.5,
              borderRadius: 3,
              borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
              borderBottomLeftRadius: msg.role === 'bot' ? 4 : 20,
              maxWidth: '85%',
              wordBreak: 'break-word',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.06)'
            }}>
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{msg.content}</Typography>
            </Box>
          ))}
          
          {isLoading && (
            <Box sx={{ 
              alignSelf: 'flex-start', 
              bgcolor: '#ffffff', 
              px: 2, py: 1.5, 
              borderRadius: 3, 
              borderBottomLeftRadius: 4,
              boxShadow: '0px 2px 8px rgba(0,0,0,0.06)'
            }}>
              <CircularProgress size={18} thickness={5} sx={{ color: 'text.secondary' }} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* 4. Modern Input Area */}
        <Box sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Write a reply..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 50, 
                bgcolor: '#F4F6F8',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: '1px solid', borderColor: 'primary.main' }
              } 
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            sx={{ 
              bgcolor: input.trim() ? 'primary.main' : '#e0e0e0', 
              color: '#ffffff', 
              '&:hover': { bgcolor: 'primary.dark' }, 
              width: 42, 
              height: 42,
              transition: 'all 0.2s ease'
            }}
          >
            <SendIcon fontSize="small" sx={{ ml: 0.5 }} />
          </IconButton>
        </Box>
      </Paper>
    </Stack>
  );
};

export default TestChatWidget;