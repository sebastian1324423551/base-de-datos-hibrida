export const formatDate = (dateString) =>{
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};
export const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    if (typeof price === 'number' )return price.toFixed(2);
    const numericValue = parseFloat(price);
    return isNaN(numericValue) ? '0.00' : numericValue.toFixed(2);  

};