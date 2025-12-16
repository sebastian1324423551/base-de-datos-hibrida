import { MongoClient } from 'mongodb';

const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'db_force';

let client = null;
let isConnecting = false;
let connectionPromise = null;

export const connectMongoDB = async () => {
    // Si ya está conectado, retornar
    if (client && client.topology && client.topology.isConnected()) {
        console.log('✅ MongoDB ya está conectado');
        return client;
    }
    
    // Si ya se está conectando, esperar esa promesa
    if (isConnecting && connectionPromise) {
        console.log('⏳ MongoDB ya se está conectando...');
        return connectionPromise;
    }
    
    isConnecting = true;
    console.log('🔗 Conectando a MongoDB...');
    console.log('📡 URL:', url);
    console.log('🗄️  Base de datos:', dbName);
    
    try {
        client = new MongoClient(url);
        connectionPromise = client.connect();
        await connectionPromise;
        
        console.log('✅ Conectado a MongoDB exitosamente');
        isConnecting = false;
        return client;
    } catch (error) {
        isConnecting = false;
        console.error('❌ Error conectando a MongoDB:', error.message);
        console.log('💡 Verifica que MongoDB esté corriendo: mongod');
        console.log('💡 O instala MongoDB si no lo tienes');
        throw error;
    }
};

export const getCollection = (collectionName) => {
    if (!client) {
        throw new Error('MongoDB no conectado. Ejecuta connectMongoDB() primero.');
    }
    
    const db = client.db(dbName);
    return db.collection(collectionName);
};

export const getCollectionSafe = async (collectionName) => {
    try {
        // Intentar conectar si no hay cliente
        if (!client || !client.topology || !client.topology.isConnected()) {
            await connectMongoDB();
        }
        
        const db = client.db(dbName);
        return db.collection(collectionName);
    } catch (error) {
        console.error('❌ Error al obtener colección:', error.message);
        throw error;
    }
};

export const closeMongoDB = async () => {
    if (client) {
        await client.close();
        console.log('🔌 Conexión a MongoDB cerrada');
        client = null;
    }
};

export const checkMongoConnection = async () => {
    try {
        if (!client) {
            await connectMongoDB();
        }
        
        const db = client.db(dbName);
        await db.command({ ping: 1 });
        console.log('✅ MongoDB responde correctamente');
        return true;
    } catch (error) {
        console.error('❌ MongoDB no responde:', error.message);
        return false;
    }
};