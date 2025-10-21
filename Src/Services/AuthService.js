import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import NavigationService from './NavegationService';

//const API_BASE_URL = 'https://avianna-surfy-mikaela.ngrok-free.dev/api';
const API_BASE_URL = 'http://192.168.1.6:8000/api';

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

  async registerMedico(medicoData) {
    try {
      const response = await api.post('/registrar-medico', medicoData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating medico:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear médico',
        errors: error.response?.data?.errors || null
      };
    }
  }

  async login(credentials) {
    try {
      
      const loginApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });
      
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
  async crearCita(data) {
    try {
      const response = await api.post('/crearCitas', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear cita',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async getCitaPorId(id) { return api.get(`/citas/${id}`); }
  async editarCita(id, data) {
    try {
      const response = await api.put(`/editarCitas/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar cita',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async eliminarCita(id) {
    try {
      const response = await api.delete(`/eliminarCitas/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar cita',
        errors: error.response?.data?.errors || null
      };
    }
  }
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
  async crearEspecialidad(data) {
    try {
      const response = await api.post('/crearEspecialidades', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating especialidad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear especialidad',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async editarEspecialidad(id, data) {
    try {
      const response = await api.put(`/editarEspecialidades/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating especialidad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar especialidad',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async eliminarEspecialidad(id) {
    try {
      const response = await api.delete(`/eliminarEspecialidades/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting especialidad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar especialidad',
        errors: error.response?.data?.errors || null
      };
    }
  }
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
  async crearHorario(data) {
    try {
      const response = await api.post('/crearHorarios', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating horario:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear horario',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async editarHorario(id, data) {
    try {
      const response = await api.put(`/editarHorarios/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating horario:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar horario',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async eliminarHorario(id) {
    try {
      const response = await api.delete(`/eliminarHorarios/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting horario:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar horario',
        errors: error.response?.data?.errors || null
      };
    }
  }

  async updateHorarioDirect(id, data) {
    try {
      const response = await api.put(`/horarios/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en updateHorarioDirect:', error);
      throw error;
    }
  }

  async updateHorarioAlternative(id, data) {
    try {
      const response = await api.post(`/horarios/${id}/update`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en updateHorarioAlternative:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar horario',
        errors: error.response?.data?.errors || null
      };
    }
  }

  async updateHorarioThird(id, data) {
    try {
      const response = await api.patch(`/horarios/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en updateHorarioThird:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar horario',
        errors: error.response?.data?.errors || null
      };
    }
  }

  async updateHorarioFallback(id, data) {
    try {
      await api.delete(`/horarios/${id}`);
      const response = await api.post('/horarios', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en updateHorarioFallback:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar horario',
        errors: error.response?.data?.errors || null
      };
    }
  }
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
  async crearMedico(data) {
    try {
      const response = await api.post('/crearMedico', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating medico:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear médico',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async editarMedico(id, data) {
    try {
      const response = await api.put(`/editarMedico/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating medico:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar médico',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async eliminarMedico(id) {
    try {
      const response = await api.delete(`/eliminarMedico/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting medico:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar médico',
        errors: error.response?.data?.errors || null
      };
    }
  }
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
  async crearPaciente(data) {
    try {
      const response = await api.post('/crearPacientes', data, { timeout: 15000 });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating paciente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear paciente',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async editarPaciente(id, data) {
    try {
      const response = await api.put(`/editarPacientes/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating paciente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar paciente',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async eliminarPaciente(id) {
    try {
      const response = await api.delete(`/eliminarPacientes/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting paciente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar paciente',
        errors: error.response?.data?.errors || null
      };
    }
  }

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
  async registerAdmin(adminData) {
    try {
      const response = await api.post('/crearAdmin', adminData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating admin:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear administrador',
        errors: error.response?.data?.errors || null
      };
    }
  }
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
  async updateAdmin(id, adminData) {
    try {
      const response = await api.put(`/editarAdmin/${id}`, adminData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating admin:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar administrador',
        errors: error.response?.data?.errors || null
      };
    }
  }
  async eliminarAdmin(id) {
    try {
      const response = await api.delete(`/eliminarAdmin/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting admin:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar administrador',
        errors: error.response?.data?.errors || null
      };
    }
  }
}

export default new AuthService();
