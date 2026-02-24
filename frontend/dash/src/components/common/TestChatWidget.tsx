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
    <Stack spacing={2.5} sx={{ height: '100%', width: '100%' }}>
      
      {/* 1. Header Area - Robust Flexbox for Centering & Spacing */}
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Left empty block to balance the right block */}
        <Box sx={{ flex: 1 }} />
        
        {/* Centered Title */}
        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
          Test Chat
        </Typography>
        
        {/* Right aligned Button */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
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
                boxShadow: copied ? 2 : 0,
                whiteSpace: 'nowrap'
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
        <Box sx={{ px: 2.5, py: 2, bgcolor: 'primary.main', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.2rem' }}>🤖</Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2, color: '#ffffff' }}>FloChat AI</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, color: '#ffffff' }}>Typically replies instantly</Typography>
          </Box>
        </Box>

        {/* 3. Messages Area - Forced hardcoded text colors to prevent dark-mode blending */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5, bgcolor: '#F4F6F8' }}>
          
          {/* Disclaimer text as a distinct system message */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Typography sx={{ 
              fontSize: '0.75rem', 
              color: '#475569', // Hardcoded dark slate color
              bgcolor: 'rgba(0,0,0,0.06)', 
              px: 2.5, 
              py: 1.5, 
              borderRadius: 2.5, 
              textAlign: 'center',
              maxWidth: '90%',
              lineHeight: 1.4
            }}>
              Use this window to chat with your configured bot. This is for test purposes only so anything you say here will not be updated anywhere in your Dashboard.
            </Typography>
          </Box>

          {/* Bubbles */}
          {messages.map((msg, idx) => (
            <Box key={idx} sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: msg.role === 'user' ? 'primary.main' : '#ffffff',
              // Force dark text (#1e293b) on the white bot bubble, force white on user bubble
              color: msg.role === 'user' ? '#ffffff' : '#1e293b', 
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
              px: 2.5, py: 1.5, 
              borderRadius: 3, 
              borderBottomLeftRadius: 4,
              boxShadow: '0px 2px 8px rgba(0,0,0,0.06)'
            }}>
              <CircularProgress size={18} thickness={5} sx={{ color: '#1e293b' }} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* 4. Modern Input Area */}
        <Box sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid', borderColor: 'rgba(0,0,0,0.08)', display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
                color: '#1e293b', // Force input text to be dark
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: '1px solid', borderColor: 'primary.main' }
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#94a3b8',
                opacity: 1
              }
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            sx={{ 
              bgcolor: input.trim() ? 'primary.main' : '#e2e8f0', 
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