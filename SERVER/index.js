const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://dmncrt.app.n8n.cloud/webhook/notaria-asistente';

app.use(cors({
  origin: ['https://notaria-client.vercel.app', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));
app.use(bodyParser.json());

// --- CONFIGURACIÓN DE POSTGRESQL ---
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Inicializar tabla de Citas
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Citas (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        priority TEXT DEFAULT 'Primary',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla Citas verificada/creada exitosamente.');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
};
initDB();

// --- ENDPOINTS DE CITAS ---

// Obtener todas las citas
app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Citas ORDER BY start_date ASC');
    // Mapear para que coincida con el formato de FullCalendar
    const events = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      start: row.start_date,
      end: row.end_date,
      extendedProps: { calendar: row.priority }
    }));
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear o actualizar cita
app.post('/api/citas', async (req, res) => {
  const { id, title, start, end, extendedProps } = req.body;
  const priority = extendedProps?.calendar || 'Primary';

  try {
    if (id && !id.startsWith('tmp-')) { // Si tiene ID real, intentamos actualizar
      const result = await pool.query(
        'UPDATE Citas SET title = $1, start_date = $2, end_date = $3, priority = $4 WHERE id = $5 RETURNING *',
        [title, start, end, priority, id]
      );
      return res.json(result.rows[0]);
    } else {
      // Crear nueva
      const result = await pool.query(
        'INSERT INTO Citas (title, start_date, end_date, priority) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, start, end, priority]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar cita
app.delete('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Citas WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

