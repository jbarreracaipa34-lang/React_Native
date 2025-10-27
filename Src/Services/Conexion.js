import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL_BASE = 'https://lue-premoral-rosa.ngrok-free.dev/api';

const api = axios.create({
    baseURL: API_URL_BASE,
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

const RutasPublicas = ['/login', '/register'];

api.interceptors.request.use(
    async (config) => {
        
        const esRutaPublica = RutasPublicas.some(ruta => config.url.includes(ruta));
        
        if (!esRutaPublica) {
            const userToken = await AsyncStorage.getItem('userToken');
            if (userToken) {
                config.headers.Authorization = `Bearer ${userToken}`;
                console.log('Token agregado al header');
            } else {
                console.log('No hay token disponible para ruta privada');
            }
        } else {
            console.log('Ruta publica, no se requiere token');
        }
        
        return config;
    },
    (error) => {
        console.log('Error en request interceptor:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('Response exitosa:', response.status, response.config.url);
        return response;
    },
    async (error) => {
        console.log('Error en response:', error.response?.status, error.config?.url);
        
        const originalRequest = error.config;
        const isRutaPublica = RutasPublicas.some(ruta => originalRequest?.url?.includes(ruta));

        if (error.response && error.response.status === 401 && !originalRequest._retry && !isRutaPublica) {
            originalRequest._retry = true;
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            console.log("Token invalido o expirado. Storage limpiado");
            
            if (originalRequest?.navigation) {
                originalRequest?.navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        }

        return Promise.reject(error);
    }
);

export default api;
