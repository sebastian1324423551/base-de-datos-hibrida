import { pool } from '../config/db.js';

export const executeQuery = async (query, params = []) => {
    let connection;
    try {
        console.log(`🔍 Ejecutando query: ${query.substring(0, 100)}...`);
        console.log(`📊 Parámetros:`, params);
        
        connection = await pool.getConnection();
        const [result] = await connection.execute(query, params);
        
        console.log(`✅ Query ejecutada exitosamente. Filas afectadas:`, result.affectedRows || result.length);
        return result;
    } catch (error) {
        console.error('❌ Error en executeQuery:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            query: query,
            params: params
        });
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Función para verificar estructura de tabla
export const checkTableStructure = async () => {
    try {
        const result = await executeQuery('DESCRIBE products');
        console.log('📋 Estructura de tabla products:', result);
        return result;
    } catch (error) {
        console.error('Error al verificar estructura:', error);
        return null;
    }
};

// Función para probar la conexión
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a MySQL:', error.message);
        return false;
    }
};