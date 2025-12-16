import { getCollection } from '../config/mongodb.js';

// Obtener todos los productos de MongoDB
export const getProductsMongo = async (req, res, next) => {
    try {
        const collection = getCollection('products');
        const products = await collection.find({}).toArray();
        
        // Formatear la respuesta
        const formattedProducts = products.map(product => ({
            id: product._id,
            name: product.name || 'Sin nombre',
            price: product.price || 0,
            stock: product.stock || 0,
            created_at: product.created_at || product._id.getTimestamp(),
            // Incluir todos los campos adicionales que puedan existir
            ...product
        }));
        
        res.json({
            success: true,
            source: 'mongodb',
            count: formattedProducts.length,
            data: formattedProducts
        });
    } catch (error) {
        console.error('Error en getProductsMongo:', error);
        next(error);
    }
};

// Agregar nuevo producto a MongoDB
export const addProductMongo = async (req, res, next) => {
    try {
        const { name, price, stock } = req.body;
        
        if (!name || price === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y precio son requeridos'
            });
        }
        
        const newProduct = {
            name,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            created_at: new Date()
        };
        
        const collection = getCollection('products');
        const result = await collection.insertOne(newProduct);
        
        res.status(201).json({
            success: true,
            message: 'Producto agregado a MongoDB',
            product_id: result.insertedId,
            product: newProduct
        });
    } catch (error) {
        console.error('Error en addProductMongo:', error);
        next(error);
    }
};

// Buscar producto por ID
export const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Necesitaríamos ObjectId desde mongodb package
        // Por ahora buscamos por nombre como ejemplo
        const collection = getCollection('products');
        const product = await collection.findOne({ 
            $or: [
                { name: { $regex: id, $options: 'i' } },
                { _id: id }
            ]
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error en getProductById:', error);
        next(error);
    }
};