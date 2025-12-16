import { connectMongoDB, getCollection } from '../config/mongodb.js';

const testMongoConnection = async () => {
    try {
        console.log('🔍 Probando conexión a MongoDB...');
        
        // Conectar
        await connectMongoDB();
        
        // Obtener colección de productos
        const collection = getCollection('products');
        
        // Contar documentos
        const count = await collection.countDocuments();
        console.log(`📊 Total de productos en la base de datos: ${count}`);
        
        // Mostrar algunos productos
        if (count > 0) {
            const products = await collection.find({}).limit(5).toArray();
            console.log('\n📝 Productos encontrados:');
            products.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name || 'Sin nombre'} - $${product.price || 0}`);
            });
        }
        
        console.log('\n✅ Prueba de conexión completada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        process.exit(1);
    }
};

testMongoConnection();