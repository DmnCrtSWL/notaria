const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://dmncrt.app.n8n.cloud/webhook/notaria-asistente';

app.use(cors({
  origin: ['https://notaria-client.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

// In-memory message store for testing
let messages = [];

// Get all messages
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// Reset messages (for testing)
app.post('/api/reset', (req, res) => {
  messages = [];
  console.log('Historial de mensajes borrado.');
  res.json({ message: 'Chat reiniciado correctamente' });
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
  const { text, SessionID } = req.body;
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
      SessionID: SessionID || 'fallback-id',
      Message: text
    });
    console.log('Mensaje enviado a n8n exitosamente');
    
    // Desactivamos la captura síncrona para evitar duplicados al usar el nodo HTTP Request de n8n
    /*
    const n8nData = Array.isArray(response.data) ? response.data[0] : response.data;
    if (n8nData && (n8nData.output || n8nData.text)) { ... }
    */
  } catch (error) {
    console.error('Error al enviar mensaje a n8n:', error.message);
  }
  
  res.status(201).json(newMessage);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`Conectado a n8n en: ${N8N_WEBHOOK_URL}`);
});

