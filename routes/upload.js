const express = require('express');
const multer = require('multer');
const { uploadFile, ensureFolderExists } = require('../config/gcs');

const router = express.Router();

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
                error: 'ID de usuario no válido'
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

        res.json({
            success: true,
            message: 'PDF subido exitosamente',
            data: {
                fileName: result.fileName,
                publicUrl: result.publicUrl,
                userFolder: userId,  // ← Ahora sí muestra la carpeta real
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
    res.json({
        success: true,
        message: 'Endpoint de upload funcionando',
        carpeta_fija: '1001510303',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;