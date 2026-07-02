// Configuración centralizada de la URL del API
// Esto permite cambiar fácilmente entre desarrollo y producción

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default API_URL;
