const { Storage } = require('@google-cloud/storage');

// Configurar Google Cloud Storage
const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './config/service-account-key.json',
    projectId: process.env.GCP_PROJECT_ID
});

const bucketName = process.env.GCS_BUCKET_NAME || 'talenthub_central';
const bucket = storage.bucket(bucketName);

// Verificar conexión al bucket
async function verifyBucketConnection() {
    try {
        const [exists] = await bucket.exists();
        if (exists) {
            console.log(`✅ Conectado al bucket: ${bucketName}`);
            return true;
        } else {
            console.error(`❌ El bucket ${bucketName} no existe`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error conectando al bucket:', error.message);
        return false;
    }
}

// Función para subir archivo
async function uploadFile(fileBuffer, fileName, contentType = 'application/pdf') {
    try {
        const file = bucket.file(fileName);

        // Opciones de upload
        const options = {
            metadata: {
                contentType: contentType,
                metadata: {
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: 'pdf-upload-backend'
                }
            }
        };

        // Subir archivo
        await file.save(fileBuffer, options);

        // Hacer el archivo público (opcional)
        // await file.makePublic();

        // Obtener URL pública
        const [metadata] = await file.getMetadata();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

        return {
            success: true,
            fileName: fileName,
            publicUrl: publicUrl,
            size: metadata.size,
            contentType: metadata.contentType,
            uploadedAt: metadata.timeCreated
        };

    } catch (error) {
        console.error('Error subiendo archivo:', error);
        throw new Error(`Error al subir archivo: ${error.message}`);
    }
}

// Función para crear carpeta si no existe
async function ensureFolderExists(folderPath) {
    try {
        // En GCS, las carpetas son objetos con nombre que terminan en /
        const folderName = folderPath.endsWith('/') ? folderPath : folderPath + '/';
        const folder = bucket.file(folderName);

        const [exists] = await folder.exists();
        if (!exists) {
            // Crear "carpeta" subiendo un archivo vacío
            await folder.save('', {
                metadata: {
                    contentType: 'application/x-www-form-urlencoded'
                }
            });
            console.log(`📁 Carpeta creada: ${folderName}`);
        }

        return true;
    } catch (error) {
        console.error('Error creando carpeta:', error);
        throw error;
    }
}

module.exports = {
    storage,
    bucket,
    uploadFile,
    ensureFolderExists,
    verifyBucketConnection,
    bucketName
};