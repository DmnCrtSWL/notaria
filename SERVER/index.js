const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_WEBHOOK_URL = 'https://dmncrt.app.n8n.cloud/webhook/notaria-asistente';

app.use(cors());
app.use(bodyParser.json());

// Session Management
let currentSessionID = '';
let lastSessionGeneration = 0;

const generateSessionID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getSessionID = () => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (!currentSessionID || (now - lastSessionGeneration) > twentyFourHours) {
    currentSessionID = generateSessionID();
    lastSessionGeneration = now;
    console.log(`Nueva SessionID generada: ${currentSessionID}`);
  }
  return currentSessionID;
};

// In-memory message store for testing
let messages = [];

// Get all messages
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// Reset session and messages (for testing)
app.post('/api/reset', (req, res) => {
  messages = [];
  currentSessionID = '';
  lastSessionGeneration = 0;
  console.log('Sistema reiniciado: Mensajes y SessionID borrados.');
  res.json({ message: 'Chat y sesión reiniciados correctamente' });
});

// Receive message FROM n8n (n8n -> WhatsApp UI)
app.post('/api/webhook', (req, res) => {
  const { text, sender } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const newMessage = {
    id: messages.length + 1,
    sender: sender || 'Asistente AI',
    text,
    timestamp: new Date(),
    incoming: true
  };

  messages.push(newMessage);
  console.log('Mensaje recibido desde n8n:', newMessage);
  
  res.status(201).json(newMessage);
});

// Send message TO n8n (WhatsApp UI -> n8n)
app.post('/api/messages', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const newMessage = {
    id: messages.length + 1,
    sender: 'Me',
    text,
    timestamp: new Date(),
    incoming: false
  };

  messages.push(newMessage);
  
  // Forward to n8n
  try {
    console.log('Enviando mensaje a n8n...');
    const response = await axios.post(N8N_WEBHOOK_URL, {
      SessionID: getSessionID(),
      Message: text
    });
    console.log('Respuesta recibida de n8n');
    
    // Check if n8n returned a direct response (Synchronous)
    // Common pattern in n8n Respond to Webhook is to return an object with the data
    const n8nData = Array.isArray(response.data) ? response.data[0] : response.data;
    
    if (n8nData && (n8nData.output || n8nData.text)) {
      const responseText = n8nData.output || n8nData.text;
      const incomingMsg = {
        id: messages.length + 1,
        sender: 'Asistente AI',
        text: responseText,
        timestamp: new Date(),
        incoming: true
      };
      messages.push(incomingMsg);
      console.log('Respuesta de n8n guardada automáticamente:', responseText);
    }
    
    console.log('Mensaje enviado exitosamente a n8n');
  } catch (error) {
    console.error('Error al enviar mensaje a n8n:', error.message);
  }
  
  res.status(201).json(newMessage);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`Conectado a n8n en: ${N8N_WEBHOOK_URL}`);
});

