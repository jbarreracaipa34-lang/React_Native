import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function ListarEspecialidades({ navigation, route }) {
  const [usuario, setUsuario] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [especialidadExpandida, setEspecialidadExpandida] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsuarioData();
  }, []);

  useEffect(() => {
    if (usuario) {
      loadEspecialidades(usuario);
    }
  }, [usuario]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const shouldRefresh = route?.params?.refresh;
      if (usuario && shouldRefresh) {
        navigation.setParams({ refresh: false });
        
        setTimeout(() => {
          loadEspecialidades(usuario);
        }, 1000);
      }
    });

    return unsubscribe;
  }, [navigation, usuario, route?.params?.refresh]);

  const loadUsuarioData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
      }
    } catch (error) {
      console.error('Error loading usuario data:', error);
      setError('Error al cargar datos del usuario');
    }
  };

  const loadEspecialidades = async (loggedUser = usuario, showLoading = true) => {
    try {
      setError(null);
      
      if (loggedUser?.role === 'admin') {
        await loadEspecialidadesAdmin();
      } else {
        await loadEspecialidadesMedico(loggedUser);
      }
    } catch (error) {
      console.error('Error loading especialidades:', error);
      handleLoadingError(error);
    }
  };

  const loadEspecialidadesAdmin = async () => {
    try {
      
      const especialidadesResult = await AuthService.getEspecialidadesConMedicos();
      
      if (!especialidadesResult?.data) {
        throw new Error('No se pudieron cargar las especialidades');
      }

      
      if (especialidadesResult.success && especialidadesResult.data && Array.isArray(especialidadesResult.data) && especialidadesResult.data[0]?.medicos) {

        const especialidadesCompletas = especialidadesResult.data.map(especialidad => ({
          id: especialidad.id,
          nombre: especialidad.nombre,
          descripcion: especialidad.descripcion || 'Sin descripcion',
          medicos: especialidad.medicos || [],
          totalMedicos: (especialidad.medicos || []).length,
          totalCitas: 0,
          citasActivas: 0
        }));
        
        setEspecialidades(especialidadesCompletas);
        return;
      }
      
      if (Array.isArray(especialidadesResult.data)) {

        const medicosMap = new Map();
        const especialidadesMap = new Map();
        
        especialidadesResult.data.forEach(item => {
          const especialidadId = item.id;
          
          if (!especialidadesMap.has(especialidadId)) {
            especialidadesMap.set(especialidadId, {
              id: especialidadId,
              nombre: item.nombre,
              descripcion: item.descripcion || 'Sin descripcion'
            });
          }
          
          if (item.medico_id || item.medicos) {
            if (!medicosMap.has(especialidadId)) {
              medicosMap.set(especialidadId, []);
            }
            
            if (item.medicos && Array.isArray(item.medicos)) {
              medicosMap.get(especialidadId).push(...item.medicos);
            }
            else if (item.medico_id) {
              medicosMap.get(especialidadId).push({
                id: item.medico_id,
                nombre: item.medico_nombre,
                apellido: item.apellido,
                numeroLicencia: item.numeroLicencia,
                telefono: item.telefono || 'No disponible',
                email: item.email || 'No disponible'
              });
            }
          }
        });

        const especialidadesCompletas = Array.from(especialidadesMap.values()).map(especialidad => ({
          ...especialidad,
          medicos: medicosMap.get(especialidad.id) || [],
          totalMedicos: (medicosMap.get(especialidad.id) || []).length,
          totalCitas: 0,
          citasActivas: 0
        }));

        setEspecialidades(especialidadesCompletas);
        return;
      }
      
      throw new Error('Formato de respuesta no reconocido');
      
    } catch (error) {
      console.error('Error in loadEspecialidadesAdmin:', error);
      throw error;
    }
  };

  const loadEspecialidadesMedico = async (loggedUser) => {
    try {
      const especialidadesResult = await AuthService.getEspecialidadDelMedico();
      
      if (!especialidadesResult?.data) {
        throw new Error('No se pudieron cargar las especialidades');
      }

      const especialidadesData = especialidadesResult.data;
      
      if (especialidadesResult.success && Array.isArray(especialidadesData) && especialidadesData.length > 0) {
        const especialidadesConStats = especialidadesData.map(especialidad => ({
          id: especialidad.id,
          nombre: especialidad.nombre,
          descripcion: especialidad.descripcion || 'Sin descripcion',
          totalMedicos: 1, // Solo este médico
          totalCitas: 0,
          citasActivas: 0
        }));

        setEspecialidades(especialidadesConStats);
      } else {
        setEspecialidades([]);
      }
    } catch (error) {
      console.error('Error in loadEspecialidadesMedico:', error);
      setError('Error al cargar especialidades del médico');
      setEspecialidades([]);
    }
  };

  const handleLoadingError = (error) => {
    let errorMessage = 'Error al cargar las especialidades';
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      errorMessage = 'Error de conexion. Verifica tu conexion a internet.';
    } else if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
      errorMessage = 'La peticion tardo demasiado. Intenta nuevamente.';
    } else if (error.response) {
      const { status } = error.response;
      switch (status) {
        case 401:
          errorMessage = 'Tu sesion ha expirado. Por favor inicia sesion nuevamente.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para ver las especialidades.';
          break;
        case 500:
          errorMessage = 'Error del servidor. Intenta nuevamente.';
          break;
        default:
          errorMessage = `Error del servidor (${status}).`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    setEspecialidades([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEspecialidades(usuario, false);
    } catch (error) {
      console.error('Error on refresh:', error);
    }
    setRefreshing(false);
  };

  const handleRetry = async () => {
    setError(null);
    await loadEspecialidades(usuario);
  };

  const handleEspecialidadPress = (especialidad) => {
    if (especialidadExpandida === especialidad.id) {
      setEspecialidadExpandida(null);
    } else {
      setEspecialidadExpandida(especialidad.id);
    }
  };

  const handleEditarEspecialidad = (especialidad) => {
    navigation.navigate('Crear_EditarEspecialidades', { especialidad: especialidad });
  };

  const handleEliminarEspecialidad = (especialidad) => {
    if (usuario?.role !== 'admin') {
      Alert.alert('Acceso denegado', 'Solo los administradores pueden eliminar especialidades');
      return;
    }
    navigation.navigate('EliminarEspecialidades', { especialidad: especialidad });
  };

  const handleDetalleEspecialidad = (especialidad) => {
    navigation.navigate('DetalleEspecialidades', { especialidad: especialidad });
  };

  const handleCrearEspecialidad = () => {
    navigation.navigate('Crear_EditarEspecialidades');
  };

  const contarEstadisticas = () => {
    const contadores = {
      conMedicos: 0,
      sinMedicos: 0,
      totalMedicos: 0,
      totalCitas: 0
    };

    especialidades.forEach(especialidad => {
      if (especialidad.totalMedicos > 0) {
        contadores.conMedicos++;
      } else {
        contadores.sinMedicos++;
      }
      contadores.totalMedicos += especialidad.totalMedicos || 0;
      contadores.totalCitas += especialidad.totalCitas || 0;
    });

    return contadores;
  };

  const renderAccionesEspecialidad = (especialidad) => {
    if (especialidadExpandida !== especialidad.id) return null;

    return (
      <View style={styles.accionesContainer}>
        <View style={styles.accionesEspecialidad}>
          <TouchableOpacity
            style={[styles.botonAccion, { borderColor: '#1E88E5' }]}
            onPress={() => handleDetalleEspecialidad(especialidad)}
          >
            <Ionicons name="eye-outline" size={18} color="#1E88E5" />
          </TouchableOpacity>

          {usuario?.role === 'admin' && (
            <TouchableOpacity
              style={[styles.botonAccion, { borderColor: '#4CAF50' }]}
              onPress={() => handleEditarEspecialidad(especialidad)}
            >
              <Ionicons name="create-outline" size={18} color="#4CAF50" />
            </TouchableOpacity>
          )}

          {usuario?.role === 'admin' && (
            <TouchableOpacity
              style={[styles.botonAccion, { borderColor: '#F44336' }]}
              onPress={() => handleEliminarEspecialidad(especialidad)}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEspecialidadItem = (especialidad, index) => {
    const isExpanded = especialidadExpandida === especialidad.id;
    const totalMedicos = especialidad.totalMedicos || 0;

    return (
      <View key={especialidad.id || index} style={styles.especialidadContainer}>
        <TouchableOpacity
          style={[styles.especialidadItem, isExpanded && styles.especialidadItemExpanded]}
          onPress={() => handleEspecialidadPress(especialidad)}
          activeOpacity={0.7}
        >
          <View style={styles.especialidadMainInfo}>
            <View style={styles.especialidadLeft}>
              <Text style={styles.especialidadName}>
                {especialidad.nombre || ''}
              </Text>
              <Text style={styles.especialidadDescription}>
                {especialidad.descripcion}
              </Text>
              <Text style={styles.especialidadStats}>
                {totalMedicos} medico{totalMedicos !== 1 ? 's' : ''} asociado{totalMedicos !== 1 ? 's' : ''}
              </Text>
              
              <View style={styles.estadoInfo}>
                <Ionicons name="medical-outline" size={12} color="#666" />
                <Text style={styles.estadoInfoText}>
                  {totalMedicos > 0 ? 'Disponible para citas' : 'Sin medicos disponibles'}
                </Text>
              </View>
            </View>

            <View style={styles.especialidadRight}>
              <View style={styles.medicosPreviewRight}>
                {especialidad.medicos && especialidad.medicos.slice(0, 2).map((medico, idx) => (
                  <View key={idx} style={styles.medicoPreviewItem}>
                  </View>
                ))}
                {especialidad.medicos && especialidad.medicos.length > 2 && (
                  <Text style={styles.masMedicosText}>
                    +{especialidad.medicos.length - 2}
                  </Text>
                )}
              </View>
              
              <View style={styles.medicosCounter}>
                <Text style={styles.medicosCounterNumber}>{totalMedicos}</Text>
                <Text style={styles.medicosCounterLabel}>medicos</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {renderAccionesEspecialidad(especialidad)}
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="alert-circle" size={64} color="#F44336" />
      <Text style={styles.errorTitle}>Error al cargar</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Ionicons name="refresh" size={20} color="#FFF" />
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="medical-bag" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No hay especialidades</Text>
      <Text style={styles.emptyText}>
        {usuario?.role === 'medico' 
          ? 'No tienes especialidades asignadas'
          : 'No hay especialidades registradas en el sistema'
        }
      </Text>
      {usuario?.role === 'admin' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => handleCrearEspecialidad()}
        >
          <Text style={styles.emptyButtonText}>Agregar especialidades</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const estadisticas = contarEstadisticas();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="#2196F3" />
            </View>
            <View>
              <Text style={styles.appName}>Citas Medicas</Text>
              <Text style={styles.appSubtitle}>Tu salud en tus manos</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>
            {usuario?.role === 'medico' ? 'Mis Especialidades' : 'Gestion de Especialidades'}
          </Text>
          {usuario?.role === 'admin' && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => handleCrearEspecialidad()}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newButtonText}>Nueva</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{especialidades.length}</Text>
          <Text style={styles.statLabel}>Especialidades</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{estadisticas.totalMedicos}</Text>
          <Text style={styles.statLabel}>Medicos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {estadisticas.conMedicos}
          </Text>
          <Text style={styles.statLabel}>Con Medicos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {estadisticas.sinMedicos}
          </Text>
          <Text style={styles.statLabel}>Sin Medicos</Text>
        </View>
      </View>

      <ScrollView
        style={styles.especialidadesList}
        contentContainerStyle={styles.especialidadesContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          renderErrorState()
        ) : especialidades.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {usuario?.role === 'medico' ? 'Especialidades Asignadas' : 'Especialidades por Medico'}
              </Text>
              <Text style={styles.listSubtitle}>
                {usuario?.role === 'medico' 
                  ? 'Especialidades en las que puedes atender'
                  : 'Gestiona las especialidades medicas del sistema'
                }
              </Text>
            </View>
            {especialidades.map((especialidad, index) => renderEspecialidadItem(especialidad, index))}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 300,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  newButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  especialidadesList: {
    flex: 1,
  },
  especialidadesContent: {
    paddingBottom: 20,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  especialidadContainer: {
    marginHorizontal: 20,
    marginBottom: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    overflow: 'hidden',
  },
  especialidadItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  especialidadItemExpanded: {
    borderLeftColor: '#2196F3',
  },
  especialidadMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  especialidadLeft: {
    flex: 1,
  },
  especialidadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  especialidadDescription: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 4,
  },
  especialidadStats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  estadoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoInfoText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6,
  },
  especialidadRight: {
    alignItems: 'flex-end',
  },
  medicosPreviewRight: {
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  medicoPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  masMedicosText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  medicosCounter: {
    alignItems: 'center',
  },
  medicosCounterNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  medicosCounterLabel: {
    fontSize: 10,
    color: '#666',
  },
  accionesContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  accionesEspecialidad: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  botonAccion: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 250,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});