import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import NavigationService from './NavegationService';

const API_BASE_URL = 'https://avianna-surfy-mikaela.ngrok-free.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
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
    
    if (error.response?.status === 401) {
      const safeEndpoints = ['/logout', '/me'];
      const isSafe = safeEndpoints.some((url) => error.config?.url?.includes(url));
      
      if (!isSafe) {
        
        const currentToken = await AsyncStorage.getItem('authToken');
        if (currentToken) {
          console.log('Limpiando storage debido a token inválido');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('authData');
          
          Alert.alert(
            'Sesión Expirada',
            'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            [
              {
                text: 'OK',
                onPress: () => {
                  NavigationService.navigate('IniciarSession');
                }
              }
            ]
          );
        }
      }
    }
    
    return Promise.reject(error);
  }
);

class AuthService {
  async registerPaciente(pacienteData) {
    try {
      const response = await api.post('/registrar', pacienteData);
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('authData', JSON.stringify(response.data.paciente));
        console.log('Token guardado:', response.data.token);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar paciente',
        errors: error.response?.data?.errors || null
      };
    }
  }

  async registerMedico(medicoData) { return api.post('/registrar-medico', medicoData); }

  async login(credentials) {
    try {
      console.log('Intentando login con:', credentials);
      console.log('URL base:', API_BASE_URL);
      
      const loginApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });
      
      console.log('📡 Enviando petición a:', API_BASE_URL + '/login');
      const response = await loginApi.post('/login', credentials);
      
      const token = response.data?.token;
      const usuario = response.data?.user;
      const role = response.data?.role;


      if (token && usuario) {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('authData', JSON.stringify({...usuario, role}));
        return { success: true, data: response.data };
      } else {
        return { success: false, message: 'Token o usuario faltante en la respuesta' };
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al iniciar sesion',
        errors: error.response?.data?.errors || null
      };
    }
  }

  async logout() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await api.post('/logout');
      }
    } catch (error) {
    } finally {
      await AsyncStorage.multiRemove(['authToken', 'authData']);
    }
  }

  async isAuthenticated() {
    const token = await AsyncStorage.getItem('authToken');
    const authData = await AsyncStorage.getItem('authData');
    if (token && authData) {
      return { isAuthenticated: true, usuario: JSON.parse(authData), token };
    }
    return { isAuthenticated: false };
  }

  async getToken() {
    const token = await AsyncStorage.getItem('authToken');
    console.log('Token obtenido:', token);
    return token;
  }

  async getCurrentUsuario() {
    const authData = await AsyncStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  }

  async updateUsuarioData(usuarioData) {
    try {
      await AsyncStorage.setItem('authData', JSON.stringify(usuarioData));
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
      if (error.response?.status === 401) {
        await this.logout();
      }
      return { success: false, message: 'Token invalido' };
    }
  }

  async getCitas() { return api.get('/citas'); }
  async crearCita(data) { return api.post('/crearCitas', data); }
  async getCitaPorId(id) { return api.get(`/citas/${id}`); }
  async editarCita(id, data) { return api.put(`/editarCitas/${id}`, data); }
  async eliminarCita(id) { return api.delete(`/eliminarCitas/${id}`); }
  async getEspecialidades() {
    try {
      const response = await api.get('/especialidades');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error loading especialidades:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cargar especialidades',
        data: []
      };
    }
  }
  async getEspecialidadDelMedico() {
    try {
      const response = await api.get('/me');
      if (response.data && response.data.user && response.data.user.especialidad) {
        return { success: true, data: [response.data.user.especialidad] };
      }
      return { success: false, data: [], message: 'No se encontró especialidad del médico' };
    } catch (error) {
      console.error('Error loading especialidad del medico:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cargar especialidad del médico',
        data: []
      };
    }
  }
  async crearEspecialidad(data) { return api.post('/crearEspecialidades', data); }
  async editarEspecialidad(id, data) { return api.put(`/editarEspecialidades/${id}`, data); }
  async eliminarEspecialidad(id) { return api.delete(`/eliminarEspecialidades/${id}`); }
  async getHorarios() {
    try {
      const response = await api.get('/horarios');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error loading horarios:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cargar horarios',
        data: []
      };
    }
  }
  async crearHorario(data) { return api.post('/crearHorarios', data); }
  async editarHorario(id, data) { return api.put(`/editarHorarios/${id}`, data); }
  async eliminarHorario(id) { return api.delete(`/eliminarHorarios/${id}`); }
  async getMedicos() {
    try {
      const response = await api.get('/medicos');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error loading medicos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cargar médicos',
        data: []
      };
    }
  }
  async getMedicoPorId(id) { return api.get(`/medicos/${id}`); }
  async crearMedico(data) { return api.post('/crearMedico', data); }
  async editarMedico(id, data) { return api.put(`/editarMedico/${id}`, data); }
  async eliminarMedico(id) { return api.delete(`/eliminarMedico/${id}`); }
  async getPacientes() {
    try {
      const response = await api.get('/pacientes');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cargar pacientes',
        data: []
      };
    }
  }
  async getPacientePorId(id) { return api.get(`/pacientes/${id}`); }
  async crearPaciente(data) { return api.post('/crearPacientes', data); }
  async editarPaciente(id, data) { return api.put(`/editarPacientes/${id}`, data); }
  async eliminarPaciente(id) { return api.delete(`/eliminarPacientes/${id}`); }

async getCitasConMedicos() { return api.get('/citasConMedicos'); }
async getCitasPendientes() { return api.get('/citasPendientes'); }
async getCitasCompletadas() { return api.get('/citasCompletadas'); }
async getCitasPorFecha(fecha) { return api.get(`/citasPorFecha/${fecha}`); }
  async getHorariosDisponiblesPorMedico() {
    try {
      const response = await api.get('/horariosDisponiblesPorMedico');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error loading horarios disponibles por medico:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cargar horarios disponibles',
        data: []
      };
    }
  }
async getMedicosConEspecialidades() {
  try {
    const response = await api.get('/medicosConEspecialidad');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error loading medicos con especialidades:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al cargar médicos con especialidades',
      data: []
    };
  }
}
async getMedicosConHorarios() { return api.get('/medicosConHorarios'); }
async getPacientesConCitas() { return api.get('/pacientesConCitas'); }
async getPacientesPorEPS(eps) { return api.get(`/pacientesPorEPS/${eps}`); }
async getEspecialidadesConMedicos() { return api.get('/EspecialidadesConMedicos'); }
  async registerAdmin(adminData) { return api.post('/crearAdmin', adminData); }
  async getAdmins() {
    try {
      const response = await api.get('/admin');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error loading admins:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cargar administradores',
        data: []
      };
    }
  }
  async getAdmin(id) { return api.get(`/admin/${id}`); }
  async updateAdmin(id, adminData) { return api.put(`/editarAdmin/${id}`, adminData); }
  async eliminarAdmin(id) { return api.delete(`/eliminarAdmin/${id}`); }
}

export default new AuthService();
