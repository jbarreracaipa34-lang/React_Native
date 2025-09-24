import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.137.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    console.log('Usando token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const safeEndpoints = ['/logout', '/me'];
    const isSafe = safeEndpoints.some((url) => error.config?.url?.includes(url));
    if (error.response?.status === 401 && !isSafe) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

class AuthService {
  async register(userData) {
    try {
      const response = await api.post('/registrar', userData);
      if (response.data.access_token) {
        await AsyncStorage.setItem('userToken', response.data.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        console.log('Token guardado:', response.data.access_token);
      }
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar usuario',
        errors: error.response?.data?.errors || null
      };
    }
  }

  async login(credentials) {
  try {
    const response = await api.post('/login', credentials);
    const token = response.data?.token;
    const user = response.data?.user;

    if (token && user) {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      return { success: true, data: response.data };
    } else {
      return { success: false, message: 'Token o usuario faltante en la respuesta' };
    }
  } catch (error) {
    console.log('Error en login:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al iniciar sesión',
      errors: error.response?.data?.errors || null
    };
  }
}

  async logout() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) { await api.post('/logout');
      }
    } catch (error) {
      console.log('Error al hacer logout:', error.message);
    } finally {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
    }
  }

  async isAuthenticated() {
    const token = await AsyncStorage.getItem('userToken');
    const userData = await AsyncStorage.getItem('userData');
    if (token && userData) {
      return { isAuthenticated: true, user: JSON.parse(userData), token };
    }
    return { isAuthenticated: false };
  }

  async getToken() {
    const token = await AsyncStorage.getItem('userToken');
    console.log('Token obtenido:', token);
    return token;
  }

  async getCurrentUser() {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  async updateUserData(userData) {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      return true;
    } catch {
      return false;
    }
  }

  async verifyToken() {
    try {
      const response = await api.get('/me');
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 401) await this.logout();
      return { success: false, message: 'Token inválido' };
    }
  }

  async getCitas() { return api.get('/citas'); }
  async crearCita(data) { return api.post('/crearCitas', data); }
  async getCitaPorId(id) { return api.get(`/citas/${id}`); }
  async editarCita(id, data) { return api.put(`/editarCitas/${id}`, data); }
  async eliminarCita(id) { return api.delete(`/eliminarCitas/${id}`); }
  async getEspecialidades() { return api.get('/especialidades'); }
  async getEspecialidadPorId(id) { return api.get(`/especialidades/${id}`); }
  async crearEspecialidad(data) { return api.post('/crearEspecialidades', data); }
  async editarEspecialidad(id, data) { return api.put(`/editarEspecialidades/${id}`, data); }
  async eliminarEspecialidad(id) { return api.delete(`/eliminarEspecialidades/${id}`); }
  async getHorarios() { return api.get('/horarios'); }
  async crearHorario(data) { return api.post('/crearHorarios', data); }
  async editarHorario(id, data) { return api.put(`/editarHorarios/${id}`, data); }
  async eliminarHorario(id) { return api.delete(`/eliminarHorarios/${id}`); }
  async getMedicos() { return api.get('/medicos'); }
  async getMedicoPorId(id) { return api.get(`/medicos/${id}`); }
  async crearMedico(data) { return api.post('/crearMedico', data); }
  async editarMedico(id, data) { return api.put(`/editarMedico/${id}`, data); }
  async eliminarMedico(id) { return api.delete(`/eliminarMedico/${id}`); }
  async getPacientes() { return api.get('/pacientes'); }
  async getPacientePorId(id) { return api.get(`/pacientes/${id}`); }
  async crearPaciente(data) { return api.post('/crearPacientes', data); }
  async editarPaciente(id, data) { return api.put(`/editarPacientes/${id}`, data); }
  async eliminarPaciente(id) { return api.delete(`/eliminarPacientes/${id}`); }

async getCitasConMedicos() { return api.get('/citasConMedicos'); }
async getCitasPendientes() { return api.get('/citasPendientes'); }
async getCitasCompletadas() { return api.get('/citasCompletadas'); }
async getCitasPorFecha(fecha) { return api.get(`/citasPorFecha/${fecha}`); }
async getHorariosDisponiblesPorMedico() { return api.get('/horariosDisponiblesPorMedico'); }
async getMedicosConEspecialidades() { return api.get('/medicosConEspecialidad'); }
async getMedicosConHorarios() { return api.get('/medicosConHorarios'); }
async getPacientesConCitas() { return api.get('/pacientesConCitas'); }
async getPacientesPorEPS(eps) { return api.get(`/pacientesPorEPS/${eps}`); }
async getEspecialidadesConMedicos() {return api.get('/EspecialidadesConMedicos'); 
}
}

export default new AuthService();
