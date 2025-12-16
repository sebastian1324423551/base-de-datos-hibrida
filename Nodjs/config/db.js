import { createPool } from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar .env relativo a la raíz del proyecto si dotenv no cargó aún
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Configuración con valores por defecto
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,  // IMPORTANTE: null, no ''
    database: process.env.DB_NAME || 'db_force',  // Cambia bd_force por db_force
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    timezone: 'local',
    charset: 'utf8mb4',  // Corrección: utf8mb4, no utf8mba
    decimalNumbers: true,
    connectionLimit: 20,
    queueLimit: 100
};

console.log('Configuración de MySQL:', {
    ...poolConfig,
    password: poolConfig.password ? '***' : '(null)'  // Cambia (vacia) por (null)
});

// Comprobación adicional: si dotenv fue cargado correctamente, debería mostrar '***' si hay contraseña
console.log('Comprobación env -> DB_HOST:', process.env.DB_HOST || '(no definido)', ' DB_PASSWORD presente:', process.env.DB_PASSWORD ? '***' : '(no definido)');

export const pool = createPool(poolConfig);

// También necesitas añadir la verificación de conexión:
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a MySQL. Base de datos: ', connection.config.database);
        connection.release();
    })
    .catch(error => {
        console.error('❌ Error al conectar a MySQL:', error.message);
        console.log('Verifica:');
        console.log('- Usuario:', poolConfig.user);
        console.log('- Base de datos:', poolConfig.database);
        console.log('- Puerto:', poolConfig.port);
        console.log('- ¿Servidor MySQL está corriendo?');
        process.exit(1);
    });