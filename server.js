const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS MÁS PERMISIVO PARA PRUEBAS
app.use(cors({
    origin: '*', // PERMITE TODOS LOS ORÍGENES
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging de CORS
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas
app.use('/api/upload', require('./src/routes/upload'));

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor funcionando',
        cors: 'Habilitado para todos los orígenes',
        timestamp: new Date().toISOString()
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Backend para subir PDFs',
        endpoints: {
            health: '/health',
            upload: '/api/upload/pdf-base64 (POST)'
        }
    });
});

app.listen(PORT, '0.0.0.0', () => { // Escuchar en todas las interfaces
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    console.log(`🌐 CORS habilitado para TODOS los orígenes`);
    console.log(`📁 Listo para recibir PDFs...`);
});