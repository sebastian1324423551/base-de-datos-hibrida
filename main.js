// main.js - JavaScript separado para la gestión de productos
const API_BASE = 'http://localhost:8000';
let currentSource = 'mysql';

// Funciones de utilidad
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-${type}`;
    statusEl.style.display = 'block';
    
    // Ocultar después de 5 segundos (excepto errores)
    if (type !== 'error') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function showLoading(message = 'Cargando...') {
    document.getElementById('resultContent').innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function showResult(title, content) {
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultContent').innerHTML = content;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function getStockClass(stock) {
    if (stock > 10) return 'stock-high';
    if (stock > 0) return 'stock-low';
    return 'stock-zero';
}

// Funciones principales
async function checkServerStatus() {
    showStatus('Verificando estado del servidor...', 'info');
    showLoading('Probando conexión...');
    
    try {
        const response = await fetch(`${API_BASE}/status`);
        const data = await response.json();
        
        showStatus(`✅ Servidor activo - Puerto: ${data.port}`, 'success');
        
        let content = `
            <h4>✅ Servidor Conectado</h4>
            <p><strong>Estado:</strong> ${data.status}</p>
            <p><strong>Puerto:</strong> ${data.port}</p>
            <p><strong>Hora del servidor:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
            <p><strong>Entorno:</strong> ${data.environment}</p>
            
            <div style="margin-top: 20px;">
                <button class="btn btn-mysql" onclick="testMySQL()">🔍 Probar MySQL</button>
                <button class="btn btn-mongo" onclick="testMongoDB()">🔍 Probar MongoDB</button>
            </div>
        `;
        
        showResult('🔗 Estado del Servidor', content);
    } catch (error) {
        showStatus('❌ Error de conexión: ' + error.message, 'error');
        showResult('❌ Error de Conexión', `
            <h4>❌ Servidor no disponible</h4>
            <p>Verifica que el servidor esté corriendo:</p>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">npm run dev</pre>
            <p><strong>Error:</strong> ${error.message}</p>
        `);
    }
}

async function testMySQL() {
    showStatus('Probando conexión a MySQL...', 'info');
    showLoading('Conectando a MySQL...');
    
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        const data = await response.json();
        
        if (data.success) {
            showStatus(`✅ MySQL conectado - ${data.count} productos`, 'success');
            showResult('✅ MySQL Conectado', `
                <p>✅ Conexión a MySQL exitosa</p>
                <p><strong>Productos en la base de datos:</strong> ${data.count}</p>
                <button class="btn btn-mysql" onclick="loadMySQLProducts()">📦 Ver productos</button>
            `);
        } else {
            showStatus('⚠️ MySQL: ' + data.error, 'warning');
        }
    } catch (error) {
        showStatus('❌ Error MySQL: ' + error.message, 'error');
    }
}

async function testMongoDB() {
    showStatus('Probando conexión a MongoDB...', 'info');
    showLoading('Conectando a MongoDB...');
    
    try {
        const response = await fetch(`${API_BASE}/mongo-status`);
        const data = await response.json();
        
        if (data.success) {
            const mongoStatus = data.mongodb;
            
            if (mongoStatus.connected) {
                showStatus(`✅ ${mongoStatus.message}`, 'success');
                showResult('✅ MongoDB Conectado', `
                    <p>${mongoStatus.message}</p>
                    <p><strong>Estado:</strong> ${mongoStatus.status}</p>
                    <button class="btn btn-mongo" onclick="loadMongoDBProducts()">🍃 Ver productos MongoDB</button>
                `);
            } else {
                showStatus(`⚠️ ${mongoStatus.message}`, 'warning');
                showResult('⚠️ MongoDB No Disponible', `
                    <p>${mongoStatus.message}</p>
                    <p><strong>Solución:</strong> Instala MongoDB o ejecuta: <code>mongod</code></p>
                    <p>El servidor funciona perfectamente solo con MySQL.</p>
                `);
            }
        }
    } catch (error) {
        showStatus('❌ Error MongoDB: ' + error.message, 'error');
    }
}

async function initializeDatabase() {
    if (!confirm('¿Inicializar base de datos MySQL?\nEsto creará la tabla products con AUTO_INCREMENT.')) return;
    
    showStatus('Inicializando base de datos...', 'info');
    showLoading('Creando tabla products...');
    
    try {
        const response = await fetch(`${API_BASE}/init-db`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showStatus('✅ ' + data.message, 'success');
            showResult('✅ Base de Datos Inicializada', `
                <p>${data.message}</p>
                <p>La tabla <strong>products</strong> ha sido creada con AUTO_INCREMENT en la columna ID.</p>
                <button class="btn btn-test" onclick="createTestData()">🧪 Crear datos de prueba</button>
            `);
        } else {
            showStatus('❌ ' + data.error, 'error');
            showResult('❌ Error', `<p>${data.error}</p>`);
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
        showResult('❌ Error', `<p>${error.message}</p>`);
    }
}

async function createTestData() {
    if (!confirm('¿Crear datos de prueba?\nEsto eliminará los productos existentes y creará 10 productos de ejemplo.')) return;
    
    showStatus('Creando datos de prueba...', 'info');
    showLoading('Insertando productos de prueba...');
    
    try {
        const response = await fetch(`${API_BASE}/setup-test-data`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showStatus(`✅ ${data.message}`, 'success');
            showResult('✅ Datos de Prueba Creados', `
                <p>${data.message}</p>
                <p><strong>Cantidad:</strong> ${data.count} productos creados</p>
                <button class="btn btn-mysql" onclick="loadMySQLProducts()">📦 Ver productos</button>
            `);
        } else {
            showStatus('❌ ' + data.error, 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
        showResult('❌ Error', `<p>${error.message}</p>`);
    }
}

async function loadMySQLProducts() {
    showStatus('Cargando productos de MySQL...', 'info');
    showLoading('Obteniendo productos...');
    currentSource = 'mysql';
    
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        const data = await response.json();
        
        if (data.success) {
            showStatus(`✅ ${data.count} productos cargados de MySQL`, 'success');
            
            if (data.products.length === 0) {
                showResult('📦 Productos MySQL (0)', `
                    <p>No hay productos en la base de datos.</p>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-test" onclick="createTestData()">🧪 Crear datos de prueba</button>
                        <button class="btn" onclick="openForm()" style="background: #4CAF50; color: white;">➕ Agregar Producto</button>
                    </div>
                `);
                return;
            }
            
            let tableHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4>📦 Productos MySQL (${data.count})</h4>
                    <button class="btn" onclick="openForm()" style="background: #4CAF50; color: white; padding: 8px 16px;">➕ Agregar</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Creado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.products.forEach(product => {
                tableHTML += `
                    <tr>
                        <td>${product.id}</td>
                        <td><strong>${product.name}</strong></td>
                        <td>$${parseFloat(product.price).toFixed(2)}</td>
                        <td><span class="${getStockClass(product.stock)}">${product.stock} unidades</span></td>
                        <td>${formatDate(product.created_at)}</td>
                        <td class="table-actions">
                            <button class="btn-edit" onclick="editProduct(${product.id})">✏️ Editar</button>
                            <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
            `;
            
            showResult('📦 Productos MySQL', tableHTML);
        } else {
            showStatus('❌ ' + data.error, 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
        showResult('❌ Error', `
            <p>Error al cargar productos: ${error.message}</p>
            <button class="btn btn-db" onclick="initializeDatabase()">🗄️ Inicializar BD</button>
        `);
    }
}

async function loadMongoDBProducts() {
    showStatus('Cargando productos de MongoDB...', 'info');
    showLoading('Conectando a MongoDB...');
    currentSource = 'mongodb';
    
    try {
        const response = await fetch(`${API_BASE}/api/mongo/products`);
        const data = await response.json();
        
        if (data.success) {
            showStatus(`✅ ${data.count} productos cargados de MongoDB`, 'success');
            
            if (data.products.length === 0) {
                showResult('🍃 Productos MongoDB (0)', `
                    <p>No hay productos en MongoDB.</p>
                    <p><strong>Nota:</strong> MongoDB no está instalado o no está corriendo.</p>
                    <p>El servidor funciona perfectamente solo con MySQL.</p>
                `);
                return;
            }
            
            let tableHTML = `
                <h4>🍃 Productos MongoDB (${data.count})</h4>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Creado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.products.forEach(product => {
                tableHTML += `
                    <tr>
                        <td title="${product.id}">${product.id.substring(0, 8)}...</td>
                        <td><strong>${product.name}</strong></td>
                        <td>$${parseFloat(product.price).toFixed(2)}</td>
                        <td><span class="${getStockClass(product.stock)}">${product.stock} unidades</span></td>
                        <td>${formatDate(product.created_at)}</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
                <p style="margin-top: 10px; font-style: italic; color: #666;">
                    Datos de MongoDB - Solo lectura
                </p>
            `;
            
            showResult('🍃 Productos MongoDB', tableHTML);
        } else {
            showStatus('⚠️ ' + data.error, 'warning');
            showResult('⚠️ MongoDB No Disponible', `
                <p>${data.message || data.error}</p>
                <p><strong>Solución:</strong> ${data.solution || 'Instala MongoDB'}</p>
                <p>El servidor funciona perfectamente solo con MySQL.</p>
            `);
        }
    } catch (error) {
        showStatus('❌ Error MongoDB: ' + error.message, 'error');
        showResult('❌ Error MongoDB', `
            <p>${error.message}</p>
            <p>MongoDB no está disponible. Usa MySQL que sí funciona.</p>
        `);
    }
}

// Funciones del formulario
function openForm(product = null) {
    const formContainer = document.getElementById('productFormContainer');
    const formTitle = document.getElementById('formTitle');
    const productId = document.getElementById('productId');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const productStock = document.getElementById('productStock');
    
    if (product) {
        // Modo edición
        productId.value = product.id;
        productName.value = product.name;
        productPrice.value = product.price;
        productStock.value = product.stock;
        formTitle.textContent = '✏️ Editar Producto';
    } else {
        // Modo nuevo
        productId.value = '';
        productName.value = '';
        productPrice.value = '';
        productStock.value = '0';
        formTitle.textContent = '➕ Nuevo Producto';
    }
    
    formContainer.style.display = 'block';
    productName.focus();
}

function closeForm() {
    document.getElementById('productFormContainer').style.display = 'none';
    document.getElementById('productForm').reset();
}

async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    
    // Validación
    if (!name) {
        showStatus('❌ El nombre del producto es requerido', 'error');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        showStatus('❌ El precio debe ser mayor a 0', 'error');
        return;
    }
    
    if (isNaN(stock) || stock < 0) {
        showStatus('❌ El stock no puede ser negativo', 'error');
        return;
    }
    
    const method = productId ? 'PUT' : 'POST';
    const url = productId ? `${API_BASE}/api/products/${productId}` : `${API_BASE}/api/products`;
    
    showStatus(productId ? 'Actualizando producto...' : 'Creando producto...', 'info');
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, price, stock })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus(`✅ ${data.message}`, 'success');
            closeForm();
            setTimeout(() => {
                if (currentSource === 'mysql') {
                    loadMySQLProducts();
                } else {
                    loadMongoDBProducts();
                }
            }, 1000);
        } else {
            showStatus(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

async function editProduct(id) {
    showStatus('Cargando producto...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/products/${id}`);
        const data = await response.json();
        
        if (data.success) {
            openForm(data.product);
            showStatus('Producto cargado para editar', 'success');
        } else {
            showStatus('❌ ' + data.error, 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?\nEsta acción no se puede deshacer.')) return;
    
    showStatus('Eliminando producto...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/api/products/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus('✅ Producto eliminado', 'success');
            setTimeout(() => {
                if (currentSource === 'mysql') {
                    loadMySQLProducts();
                } else {
                    loadMongoDBProducts();
                }
            }, 1000);
        } else {
            showStatus('❌ ' + data.error, 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Inicializar aplicación
function initializeApp() {
    console.log('🚀 Aplicación de gestión de productos iniciada');
    
    // Asignar eventos a los botones principales
    document.querySelector('.btn-status').addEventListener('click', checkServerStatus);
    document.querySelector('.btn-db').addEventListener('click', initializeDatabase);
    document.querySelector('.btn-test').addEventListener('click', createTestData);
    document.querySelector('.btn-mysql').addEventListener('click', loadMySQLProducts);
    document.querySelector('.btn-mongo').addEventListener('click', loadMongoDBProducts);
    
    // Asignar evento al formulario
    document.getElementById('productForm').addEventListener('submit', saveProduct);
    
    // Asignar evento al botón cancelar
    document.querySelector('.btn-cancel').addEventListener('click', closeForm);
    
    // Verificar estado del servidor al cargar
    checkServerStatus();
}

// Ejecutar cuando el DOM esté cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Exportar funciones para uso global (si es necesario)
window.openForm = openForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.checkServerStatus = checkServerStatus;
window.initializeDatabase = initializeDatabase;
window.createTestData = createTestData;
window.loadMySQLProducts = loadMySQLProducts;
window.loadMongoDBProducts = loadMongoDBProducts;