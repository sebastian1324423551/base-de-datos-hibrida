import { executeQuery } from '../services/dbService.js';
export const getProducts = async (req, res, next) => {
    try {
        const products = await executeQuery('SELECT * FROM products');
        if (!products || products.length === 0){
            return res.status(404).json({
                success: false,
                message: "No se encontraron productos"
            });
        }
        res.json({
        success: true,
        data: products,
        count:products.length
        });
    }catch(error){
        console.log('Error en productController:', error);
        next(error);
    }
    
};