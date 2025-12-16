import express from 'express';
import { executeQuery } from '../services/dbService.js';

const router = express.Router();

// Middleware de logging para API
router.use((req, res, next) => {
    console.log(`🌐 API ${req.method} ${req.path}`);
    next();
});

// GET /api/products - Obtener todos los productos
router.get('/products', async (req, res) => {
    try {
        console.log('📦 Obteniendo productos de MySQL...');
        const products = await executeQuery('SELECT * FROM products ORDER BY created_at DESC');
        
        res.json({
            success: true,
            products: products,
            count: products.length
        });
    } catch (error) {
        console.error('❌ Error GET /products:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/products - Crear nuevo producto
router.post('/products', async (req, res) => {
    console.log('📝 POST /products - Datos:', req.body);
    
    try {
        const { name, price, stock } = req.body;
        
        // Validación
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El nombre del producto es requerido'
            });
        }
        
        if (price === undefined || price === null || isNaN(price)) {
            return res.status(400).json({
                success: false,
                error: 'El precio debe ser un número válido'
            });
        }
        
        const result = await executeQuery(
            'INSERT INTO products (name, price, stock, created_at) VALUES (?, ?, ?, NOW())',
            [name.trim(), parseFloat(price), parseInt(stock) || 0]
        );
        
        console.log('✅ Producto creado, ID:', result.insertId);
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            productId: result.insertId
        });
    } catch (error) {
        console.error('❌ Error POST /products:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/products/:id - Obtener producto por ID
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const products = await executeQuery('SELECT * FROM products WHERE id = ?', [id]);
        
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Producto con ID ${id} no encontrado`
            });
        }
        
        res.json({
            success: true,
            product: products[0]
        });
    } catch (error) {
        console.error('❌ Error GET /products/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/products/:id - Actualizar producto
router.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock } = req.body;
        
        console.log(`✏️ PUT /products/${id} - Datos:`, { name, price, stock });
        
        // Validación
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El nombre del producto es requerido'
            });
        }
        
        const result = await executeQuery(
            'UPDATE products SET name = ?, price = ?, stock = ?, updated_at = NOW() WHERE id = ?',
            [name.trim(), parseFloat(price), parseInt(stock) || 0, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: `Producto con ID ${id} no encontrado`
            });
        }
        
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error PUT /products/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ DELETE /products/${id}`);
        
        const result = await executeQuery('DELETE FROM products WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: `Producto con ID ${id} no encontrado`
            });
        }
        
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error DELETE /products/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar producto',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/mongo/products - Obtener productos de MongoDB
router.get('/mongo/products', async (req, res) => {
    try {
        console.log('📡 Intentando conectar a MongoDB...');
        
        const { getCollectionSafe } = await import('../config/mongodb.js');
        
        try {
            const collection = await getCollectionSafe('products');
            const products = await collection.find({}).toArray();
            
            console.log(`✅ ${products.length} productos encontrados en MongoDB`);
            
            res.json({
                success: true,
                products: products.map(p => ({
                    id: p._id ? p._id.toString() : 'N/A',
                    name: p.name || 'Sin nombre',
                    price: p.price || 0,
                    stock: p.stock || 0,
                    created_at: p.created_at || (p._id ? p._id.getTimestamp() : new Date())
                })),
                count: products.length,
                source: 'mongodb'
            });
        } catch (mongoError) {
            console.warn('⚠️ MongoDB no disponible:', mongoError.message);
            res.json({
                success: false,
                error: 'MongoDB no está disponible',
                message: 'Instala MongoDB o verifica que esté corriendo',
                solution: 'Ejecuta: mongod',
                products: [],
                count: 0,
                source: 'mongodb'
            });
        }
    } catch (error) {
        console.error('❌ Error en GET /mongo/products:', error);
        res.status(500).json({
            success: false,
            error: 'Error al conectar con MongoDB',
            details: error.message
        });
    }
});

// POST /api/mongo/products - Crear producto en MongoDB
router.post('/mongo/products', async (req, res) => {
    try {
        const { name, price, stock } = req.body;
        
        if (!name || price === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y precio son requeridos'
            });
        }
        
        const { getCollectionSafe } = await import('../config/mongodb.js');
        
        try {
            const collection = await getCollectionSafe('products');
            
            const newProduct = {
                name: name.trim(),
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                created_at: new Date()
            };
            
            const result = await collection.insertOne(newProduct);
            
            console.log('✅ Producto creado en MongoDB:', result.insertedId);
            
            res.status(201).json({
                success: true,
                message: 'Producto creado en MongoDB',
                productId: result.insertedId,
                product: newProduct
            });
        } catch (mongoError) {
            console.warn('⚠️ MongoDB no disponible:', mongoError.message);
            res.status(503).json({
                success: false,
                error: 'MongoDB no está disponible',
                message: 'No se pudo crear el producto en MongoDB',
                solution: 'Instala y ejecuta MongoDB'
            });
        }
    } catch (error) {
        console.error('❌ Error en POST /mongo/products:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar solicitud'
        });
    }
});

export default router;