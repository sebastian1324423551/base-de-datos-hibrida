import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Función para inicializar bases de datos
async function initializeDatabases() {
    console.log('🔍 Inicializando bases de datos...');
    
    // Verificar MySQL
    try {
        const { pool } = await import('./config/db.js');
        const connection = await pool.getConnection();
        console.log('✅ MySQL conectado. Base de datos:', connection.config.database);
        connection.release();
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
    }
    
    // Verificar MongoDB (intentar conectar pero no fallar si no está disponible)
    try {
        const { connectMongoDB, checkMongoConnection } = await import('./config/mongodb.js');
        await connectMongoDB();
        const mongoConnected = await checkMongoConnection();
        
        if (mongoConnected) {
            console.log('✅ MongoDB conectado y respondiendo');
        } else {
            console.warn('⚠️ MongoDB no está disponible, pero el servidor continuará');
            console.log('💡 Para usar MongoDB, instálalo y ejecuta: mongod');
        }
    } catch (error) {
        console.warn('⚠️ No se pudo conectar a MongoDB:', error.message);
        console.log('💡 El servidor funcionará solo con MySQL');
        console.log('💡 Para instalar MongoDB: https://www.mongodb.com/try/download/community');
    }
}

// Importar rutas
import apiRouter from './routes/api.js';
app.use('/api', apiRouter);

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Ruta de estado del servidor
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Ruta para verificar estado de MongoDB
app.get('/mongo-status', async (req, res) => {
    try {
        const { checkMongoConnection } = await import('./config/mongodb.js');
        const isConnected = await checkMongoConnection();
        
        res.json({
            success: true,
            mongodb: {
                connected: isConnected,
                status: isConnected ? 'online' : 'offline',
                message: isConnected ? 
                    '✅ MongoDB está conectado y respondiendo' : 
                    '❌ MongoDB no está disponible'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: false,
            mongodb: {
                connected: false,
                status: 'error',
                message: 'Error al verificar MongoDB: ' + error.message
            }
        });
    }
});

// Ruta para crear tabla si no existe (ACTUALIZADA)
app.post('/init-db', async (req, res) => {
    try {
        const { executeQuery } = await import('./services/dbService.js');
        
        // Primero eliminar tabla si existe
        try {
            await executeQuery('DROP TABLE IF EXISTS products');
            console.log('🗑️  Tabla products eliminada (si existía)');
        } catch (dropError) {
            console.log('ℹ️  No se pudo eliminar la tabla (probablemente no existe):', dropError.message);
        }
        
        // Crear tabla products con AUTO_INCREMENT
        await executeQuery(`
            CREATE TABLE products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                stock INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        
        console.log('✅ Tabla products creada correctamente con AUTO_INCREMENT');
        
        res.json({
            success: true,
            message: 'Base de datos inicializada correctamente con AUTO_INCREMENT'
        });
    } catch (error) {
        console.error('❌ Error al inicializar BD:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Asegúrate de que MySQL esté corriendo y tengas permisos'
        });
    }
});

// Ruta para crear datos de prueba (ACTUALIZADA)
app.post('/setup-test-data', async (req, res) => {
    try {
        const { executeQuery } = await import('./services/dbService.js');
        
        console.log('🧪 Creando datos de prueba...');
        
        // Primero eliminar tabla si existe
        try {
            await executeQuery('DROP TABLE IF EXISTS products');
            console.log('🗑️  Tabla products eliminada');
        } catch (dropError) {
            console.log('ℹ️  No se pudo eliminar la tabla:', dropError.message);
        }
        
        // Crear tabla products con AUTO_INCREMENT
        await executeQuery(`
            CREATE TABLE products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                stock INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        
        console.log('✅ Tabla creada con AUTO_INCREMENT');
        
        // Insertar datos de prueba
        await executeQuery(`
            INSERT INTO products (name, price, stock) VALUES
            ('Laptop Dell XPS 13', 1299.99, 15),
            ('iPhone 15 Pro', 999.99, 25),
            ('Samsung Galaxy S24', 899.99, 20),
            ('PlayStation 5', 499.99, 10),
            ('Auriculares Sony WH-1000XM5', 399.99, 30),
            ('Smart TV LG OLED 55"', 1299.99, 8),
            ('Tablet iPad Pro', 1099.99, 12),
            ('Cámara Canon EOS R5', 3899.99, 5),
            ('Apple Watch Series 9', 399.99, 18),
            ('Nintendo Switch OLED', 349.99, 22)
        `);
        
        // Obtener conteo
        const countResult = await executeQuery('SELECT COUNT(*) as count FROM products');
        const count = countResult[0].count;
        
        console.log(`✅ Datos de prueba creados: ${count} productos`);
        
        res.json({
            success: true,
            message: `Se crearon ${count} productos de prueba`,
            count: count
        });
    } catch (error) {
        console.error('❌ Error al crear datos de prueba:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            solution: 'Ejecuta primero: POST /init-db'
        });
    }
});

// Ruta de diagnóstico
app.get('/diagnose', async (req, res) => {
    try {
        const { executeQuery } = await import('./services/dbService.js');
        
        // Verificar si la tabla existe
        const tables = await executeQuery("SHOW TABLES LIKE 'products'");
        
        if (tables.length === 0) {
            return res.json({
                success: false,
                message: 'La tabla products NO existe',
                solution: 'Ejecuta POST /init-db'
            });
        }
        
        // Verificar estructura de la tabla
        const structure = await executeQuery('DESCRIBE products');
        
        // Verificar si id tiene AUTO_INCREMENT
        const idColumn = structure.find(col => col.Field === 'id');
        const hasAutoIncrement = idColumn && idColumn.Extra.includes('auto_increment');
        
        res.json({
            success: true,
            tableExists: true,
            hasAutoIncrement: hasAutoIncrement,
            structure: structure,
            idColumn: idColumn,
            message: hasAutoIncrement ? 
                '✅ Tabla correcta con AUTO_INCREMENT' : 
                '❌ Falta AUTO_INCREMENT en columna id'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Middleware de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error global:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
});

// Iniciar servidor
app.listen(PORT, async () => {
    console.log('🚀 Servidor corriendo en http://localhost:' + PORT);
    console.log('📁 Página principal: http://localhost:' + PORT);
    console.log('🩺 Estado del servidor: http://localhost:' + PORT + '/status');
    console.log('🗄️  APIs disponibles:');
    console.log('   - GET  http://localhost:' + PORT + '/api/products');
    console.log('   - POST http://localhost:' + PORT + '/api/products');
    console.log('   - GET  http://localhost:' + PORT + '/api/mongo/products');
    console.log('🔧 Utilidades:');
    console.log('   - POST http://localhost:' + PORT + '/init-db');
    console.log('   - POST http://localhost:' + PORT + '/setup-test-data');
    console.log('   - GET  http://localhost:' + PORT + '/mongo-status');
    console.log('   - GET  http://localhost:' + PORT + '/diagnose');
    
    // Inicializar bases de datos
    await initializeDatabases();
});