const express = require('express');
const multer = require('multer');
const { uploadFile, ensureFolderExists } = require('../config/gcs');

const router = express.Router();

// ✅ ✅ ✅ MIDDLEWARE CORS ESPECÍFICO PARA ESTE ROUTER
router.use((req, res, next) => {
    console.log('🔧 Aplicando headers CORS manualmente para:', req.method, req.path);

    // Headers CORS esenciales
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Manejar preflight OPTIONS inmediatamente
    if (req.method === 'OPTIONS') {
        console.log('🛬 Preflight OPTIONS recibido - respondiendo 200');
        return res.status(200).end();
    }

    next();
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

// Endpoint para subir PDF - CORREGIDO
router.post('/pdf-base64', async (req, res) => {
    try {
        console.log('📤 Recibiendo PDF para upload...');
        console.log('📍 Headers recibidos:', req.headers);
        console.log('🌐 Origin:', req.headers.origin);

        const {
            pdfBase64,
            idUsuario,  // ← ESTE es el ID real del usuario
            identrega,
            nombres,
            acta
        } = req.body;

        if (!pdfBase64) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó PDF en base64'
            });
        }

        // ✅ USAR EL ID REAL DEL USUARIO - NO MÁS CARPETA FIJA
        const userId = (idUsuario || 'sin_id').toString().trim();

        // Validar que tenemos un ID válido
        if (!userId || userId === 'sin_id' || userId === '123456789') {
            return res.status(400).json({
                success: false,
                error: 'ID de usuario no válido: ' + userId
            });
        }

        const entregaId = (identrega || 'sin_id').toString().trim();
        const userName = (nombres || 'sin_nombre').toString().trim().replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '_');
        const timestamp = new Date().toISOString().split('T')[0];
        const safeUserName = userName.substring(0, 50);

        // Nombre del archivo - AHORA CON CARPETA DINÁMICA
        const fileName = `actas/${userId}/acta_${entregaId}_${safeUserName}_${timestamp}.pdf`;

        console.log(`📝 Subiendo a carpeta del usuario: ${fileName}`);
        console.log(`👤 Usuario real: ${userId}`);
        console.log(`📦 Entrega ID: ${entregaId}`);

        // Convertir base64 a buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Validar que es un PDF
        if (!pdfBuffer.slice(0, 4).equals(Buffer.from('%PDF'))) {
            return res.status(400).json({
                success: false,
                error: 'El archivo no es un PDF válido'
            });
        }

        // Asegurar carpeta DEL USUARIO REAL
        await ensureFolderExists(`actas/${userId}`);

        // Subir archivo
        const result = await uploadFile(pdfBuffer, fileName, 'application/pdf');

        console.log('✅ PDF subido exitosamente a carpeta del usuario');
        console.log(`📁 Archivo: ${result.fileName}`);
        console.log(`🔗 URL: ${result.publicUrl}`);

        res.json({
            success: true,
            message: 'PDF subido exitosamente',
            data: {
                fileName: result.fileName,
                publicUrl: result.publicUrl,
                userFolder: userId,
                uploadTime: new Date().toISOString(),
                bucket: process.env.GCS_BUCKET_NAME
            }
        });

    } catch (error) {
        console.error('❌ Error en upload:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint simple de prueba
router.get('/test', (req, res) => {
    console.log('✅ Test endpoint llamado desde:', req.headers.origin);
    res.json({
        success: true,
        message: 'Endpoint de upload funcionando',
        timestamp: new Date().toISOString(),
        cors: 'Configurado correctamente'
    });
});

// Endpoint específico para OPTIONS preflight
router.options('/pdf-base64', (req, res) => {
    console.log('🛬 Preflight OPTIONS específico para /pdf-base64');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(200).end();
});

module.exports = router;