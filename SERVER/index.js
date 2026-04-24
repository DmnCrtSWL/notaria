const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// --- CONFIGURACIÓN DE AWS S3 ---
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://dmncrt.app.n8n.cloud/webhook/notaria-asistente';
const N8N_CONFIRMAR_CITA_URL = 'https://dmncrt.app.n8n.cloud/webhook/notaria-confirmar-cita';
const N8N_RECHAZAR_CITA_URL  = 'https://dmncrt.app.n8n.cloud/webhook/notaria-rechazar-cita';

app.use(cors({
  origin: function (origin, callback) {
    // Permite cualquier subdominio de vercel.app, localhost, o sin origin (Postman, etc.)
    if (!origin || /\.vercel\.app$/.test(origin) || /^http:\/\/localhost/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido para: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));
app.use(bodyParser.json());

// ============================================================
// --- ENDPOINT DE SUBIDA A S3 ---
// ============================================================

// Genera una URL prefirmada para subir un archivo directamente a S3
app.post('/api/upload', async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName y fileType son requeridos' });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `documentos/${Date.now()}-${fileName}`, // Con fecha para evitar duplicados
      ContentType: fileType,
    });

    // URL que expira en 60 segundos
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    res.status(200).json({ uploadUrl, key: command.input.Key });
  } catch (error) {
    console.error('Error generando URL de S3:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar archivos del bucket S3
app.get('/api/files', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
    });

    const data = await s3Client.send(command);
    const files = (data.Contents || [])
      .filter(item => item.Size > 0) // Excluir carpetas vacías
      .map(item => {
        // Obtener solo el nombre del archivo (quitar carpetas y timestamp)
        const parts = item.Key.split('/');
        const rawName = parts[parts.length - 1];
        const name = rawName.replace(/^\d+-/, '');
        return {
          key: item.Key,
          name: name || rawName,
          size: item.Size,
          lastModified: item.LastModified,
          url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
        };
      })
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.json(files);
  } catch (error) {
    console.error('Error listando archivos de S3:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- CONFIGURACIÓN DE POSTGRESQL ---
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Inicializar tabla de Citas
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Citas (
        id SERIAL PRIMARY KEY,
        client_nombre TEXT NOT NULL,
        fecha DATE NOT NULL,
        horario TEXT,
        telefono TEXT,
        tramite TEXT,
        estado TEXT DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla Citas verificada.');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
};
initDB();

// ============================================================
// --- ENDPOINTS DE CITAS ---
// ============================================================

// Obtener todas las citas CONFIRMADAS (para el calendario)
app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Citas WHERE estado = 'confirmado' ORDER BY fecha ASC, horario ASC");

    const events = result.rows.map(row => {
      try {
        const dateStr = (row.fecha instanceof Date) ? row.fecha.toISOString() : String(row.fecha);
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const start = `${datePart}T${row.horario || '00:00:00'}`;
        return {
          id: row.id.toString(),
          title: row.tramite || 'Cita',
          start: start,
          extendedProps: {
            nombre: row.client_nombre || 'Cliente',
            celular: row.telefono || ''
          }
        };
      } catch (e) {
        console.error('Error procesando fila de cita:', e, row);
        return null;
      }
    }).filter(e => e !== null);

    res.json(events);
  } catch (err) {
    console.error('Error en /api/citas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las citas PENDIENTES (solicitudes)
app.get('/api/solicitudes', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Citas WHERE estado = 'pendiente' ORDER BY created_at DESC");

    const normalized = result.rows.map(row => {
      try {
        const dateStr = (row.fecha instanceof Date) ? row.fecha.toISOString() : String(row.fecha);
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const start_date = `${datePart}T${row.horario || '00:00:00'}`;
        return {
          ...row,
          title: row.tramite || 'Solicitud',
          nombre: row.client_nombre || 'Cliente',
          celular: row.telefono || '',
          start_date: start_date
        };
      } catch (e) {
        console.error('Error procesando solicitud:', e, row);
        return null;
      }
    }).filter(e => e !== null);

    res.json(normalized);
  } catch (err) {
    console.error('Error en /api/solicitudes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Confirmar o Rechazar solicitud (con integración n8n)
app.put('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'confirmed' o 'rejected'

  try {
    if (status === 'rejected') {
      const rejectResult = await pool.query(
        'UPDATE Citas SET estado = $1 WHERE id = $2 RETURNING *',
        ['rechazado', id]
      );
      return res.json({ message: 'Solicitud rechazada', cita: rejectResult.rows[0] });
    }

    // 1. Actualizar estado en la base de datos
    const result = await pool.query(
      'UPDATE Citas SET estado = $1 WHERE id = $2 RETURNING *',
      ['confirmado', id]
    );
    const cita = result.rows[0];

    // 2. Disparar flujo n8n para enviar confirmación al cliente via WhatsApp
    const n8nPayload = {
      id: cita.id,
      nombre: cita.client_nombre,
      telefono: cita.telefono,
      tramite: cita.tramite,
      fecha: cita.fecha,
      horario: cita.horario,
      estado: 'confirmado',
      webhook_destino: 'https://notaria-server.vercel.app/api/webhook'
    };

    try {
      await fetch(N8N_CONFIRMAR_CITA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });
      console.log(`✅ Flujo n8n disparado para cita ID ${id} (${cita.client_nombre})`);
    } catch (n8nErr) {
      // La cita ya quedó confirmada en DB aunque n8n falle
      console.error('⚠️ Error al llamar n8n:', n8nErr.message);
    }

    res.json(cita);
  } catch (err) {
    console.error('Error al confirmar solicitud:', err);
    res.status(500).json({ error: err.message });
  }
});

// Crear cita directamente desde admin
app.post('/api/citas', async (req, res) => {
  const { title, start, nombre, celular } = req.body;
  const [fecha, horario] = start.split('T');

  try {
    const result = await pool.query(
      'INSERT INTO Citas (tramite, fecha, horario, client_nombre, telefono, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, fecha, horario || '00:00:00', nombre, celular, 'confirmado']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear cita:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar cita del calendario
app.delete('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Citas WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error al eliminar cita:', err);
    res.status(500).json({ error: err.message });
  }
});

// Modificar cita del calendario
app.put('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  const { title, start, nombre, celular } = req.body;
  const [fecha, horario] = start.split('T');

  try {
    const result = await pool.query(
      'UPDATE Citas SET tramite = $1, fecha = $2, horario = $3, client_nombre = $4, telefono = $5 WHERE id = $6 RETURNING *',
      [title, fecha, horario || '00:00:00', nombre, celular, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar cita:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// --- ENDPOINTS DE MENSAJERÍA (Chat / WhatsApp) ---
// ============================================================

let messages = [];

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.post('/api/reset', (req, res) => {
  messages = [];
  console.log('Historial de mensajes borrado.');
  res.json({ message: 'Chat reiniciado correctamente' });
});

// Recibir mensaje DESDE n8n (confirmación de cita u otro mensaje)
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

// Enviar mensaje A n8n (Chat del cliente)
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

  try {
    console.log('Enviando mensaje a n8n...');
    await axios.post(N8N_WEBHOOK_URL, {
      SessionID: SessionID || 'fallback-id',
      Message: text
    });
    console.log('Mensaje enviado a n8n exitosamente');
  } catch (error) {
    console.error('Error al enviar mensaje a n8n:', error.message);
  }

  res.status(201).json(newMessage);
});

// ============================================================
// ============================================================
// --- ENDPOINTS DE USUARIOS ---
// ============================================================

// Login: validar credenciales contra la tabla usuarios
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    // La tabla usa columnas con mayúsculas ("Usuario", "Contraseña")
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE "Usuario" = $1 AND "Contraseña" = $2 LIMIT 1',
      [usuario, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.Nombre || user.nombre,
        usuario: user.Usuario || user.usuario,
        correo: user.Correo || user.correo,
        rol: user.Rol || user.rol
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
    const normalized = result.rows.map(row => ({
      id: row.id,
      nombre: row.Nombre || row.nombre,
      usuario: row.Usuario || row.usuario,
      correo: row.Correo || row.correo,
      rol: row.Rol || row.rol,
      created_at: row.created_at
    }));
    res.json(normalized);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { nombre, usuario, correo, password, rol } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios ("Nombre", "Usuario", "Correo", "Contraseña", "Rol") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, usuario, correo, password, rol]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Exportar para Vercel (serverless) y también escuchar en local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
    console.log(`Conectado a n8n en: ${N8N_WEBHOOK_URL}`);
  });
}

module.exports = app;
