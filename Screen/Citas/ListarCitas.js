import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AuthService from '../../Src/Services/AuthService';

export default function ListarCitas({ navigation }) {
  const [user, setUser] = useState(null);
  const [citas, setCitas] = useState([]);
  const [filteredCitas, setFilteredCitas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [citaExpandida, setCitaExpandida] = useState(null);
  const [pacienteInfo, setPacienteInfo] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user && user.role === 'paciente') {

      obtenerInfoPaciente().then(info => {
        setPacienteInfo(info);
      });
      
      loadCitas(true);
    } else if (user) {
      loadCitas(true);
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, filtroEstado]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        setTimeout(() => {
          loadCitas(false);
        }, 100);
      }
    }, [user])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        setTimeout(() => {
          loadCitas(false);
        }, 50);
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  const obtenerInfoPaciente = async () => {
    try {
      const pacientesResponse = await AuthService.getPacientes();
      
      if (pacientesResponse && pacientesResponse.data) {
        const pacienteEncontrado = pacientesResponse.data.find(paciente => {
          const nombreCoincide = paciente.nombre && (user.nombre || user.name) && 
            paciente.nombre.toLowerCase().trim() === (user.nombre || user.name).toLowerCase().trim();
          const userIdCoincide = paciente.user_id && 
            String(paciente.user_id) === String(user.id);
          return nombreCoincide || userIdCoincide;
        });
        
        if (pacienteEncontrado) {
          return pacienteEncontrado;
        }
      }
    } catch (error) {
      console.error('Error obteniendo info del paciente:', error);
    }
    
    return null;
  };

  const loadUserData = async () => {
    try {      
      const authData = await AuthService.isAuthenticated();
      
      if (authData.isAuthenticated && authData.user) {
        setUser(authData.user);
      } else {
        setUser(null);
      }
      setLoading(false);
      
    } catch (error) {
      setUser(null);
      setLoading(false);
    }
  };

  const loadCitas = async (showLoading = false) => {
    try {
      if (!user || !user.role) {
        return;
      }

      if (showLoading) {
        setLoading(true);
      }
      
      const citasResult = await AuthService.getCitasConMedicos();
      
      if (citasResult && citasResult.data && Array.isArray(citasResult.data)) {        
        let citasFiltradas = [];        
        
        switch (user.role) {
          case 'admin':
            citasFiltradas = citasResult.data;
            break;

          case 'medico':
            citasFiltradas = citasResult.data.filter(cita => {
              const medicoUserIdCita = String(cita.medico_user_id || '');
              const medicoIdCita = String(cita.medicos_id || '');
              const userIdActual = String(user.id);
                            
              return medicoUserIdCita === userIdActual || medicoIdCita === userIdActual;
            });
            break;

          case 'paciente':
            
            citasFiltradas = citasResult.data.filter(cita => {
              const userIdCita = String(cita.user_id || '');
              const pacientesIdCita = String(cita.pacientes_id || '');
              const userIdActual = String(user.id);
              
              const matchUserId = userIdCita === userIdActual;
              
              let matchPacienteId = false;
              if (pacienteInfo && pacienteInfo.id) {
                matchPacienteId = String(cita.pacientes_id) === String(pacienteInfo.id);
              }
              
              const matchNombre = (
                cita.paciente_nombre && 
                (user.nombre || user.name)
              ) && (
                cita.paciente_nombre.toLowerCase().trim() === (user.nombre || user.name || '').toLowerCase().trim()
              );
              
              const incluida = matchUserId || matchPacienteId || matchNombre;
              
              return incluida;
            });
            break;

          default:
            citasFiltradas = [];
        }
        
        const citasConDefaults = citasFiltradas.map(cita => {
          return {
            ...cita,
            estado: cita.estado || 'Pendiente',
            paciente_nombre: cita.paciente_nombre || 'Paciente',
            medico_nombre: cita.medico_nombre || 'Medico',
            medico_apellido: cita.medico_apellido || '',
            paciente_apellido: cita.paciente_apellido || ''
          };
        });
        
        setCitas(citasConDefaults);
      } else {
        setCitas([]);
      }
    } catch (error) {
      setCitas([]);
      Alert.alert('Error', 'No se pudieron cargar las citas: ' + error.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const aplicarFiltros = () => {
    if (filtroEstado === 'todas') {
      setFilteredCitas(citas);
    } else {
      const citasFiltradas = citas.filter(cita => 
        cita.estado?.toLowerCase() === filtroEstado.toLowerCase()
      );
      setFilteredCitas(citasFiltradas);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(async () => {
      await loadCitas(false);
      setRefreshing(false);
    }, 300);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    let date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString + 'T00:00:00');
    }
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    
    if (time.length > 5) {
      return time.substring(0, 5);
    }
    
    return time;
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
      case 'confirmado':
        return '#4CAF50';
      case 'pendiente':
        return '#FF9800';
      case 'cancelada':
      case 'cancelado':
        return '#F44336';
      case 'completada':
      case 'completado':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const handleCitaPress = (cita) => {
    if (citaExpandida === cita.id) {
      setCitaExpandida(null);
    } else {
      setCitaExpandida(cita.id);
    }
  };

  const navegarAEditar = (cita) => {
    navigation.navigate('Crear_EditarCitas', { 
      cita: cita,
      onGoBack: () => {
        setTimeout(() => {
          loadCitas(false);
        }, 200);
      }
    });
  };

  const navegarADetalle = (cita) => {
    navigation.navigate('DetalleCitas', { 
      cita: cita,
      onGoBack: () => {
        setTimeout(() => {
          loadCitas(false);
        }, 200);
      }
    });
  };

  const navegarAEliminar = (cita) => {
    navigation.navigate('EliminarCitas', { 
      cita: cita,
      onGoBack: () => {
        setTimeout(() => {
          loadCitas(false);
        }, 200);
      }
    });
  };

  const getPermisosRol = (rol) => {
    switch (rol) {
      case 'admin':
        return {
          puedeCrear: true,
          puedeEditar: true,
          puedeVer: true,
          puedeEliminar: true,
          puedeVerTodas: true,
          mostrarBusqueda: true 
        };
      case 'medico':
        return {
          puedeCrear: false,
          puedeEditar: true,
          puedeVer: true,
          puedeEliminar: false,
          puedeVerTodas: false, 
          mostrarBusqueda: false
        };
      case 'paciente':
        return {
          puedeCrear: true,
          puedeEditar: true,
          puedeVer: true,
          puedeEliminar: true,
          puedeVerTodas: false,
          mostrarBusqueda: false
        };
      default:
        return {
          puedeCrear: false,
          puedeEditar: false,
          puedeVer: false,
          puedeEliminar: false,
          puedeVerTodas: false,
          mostrarBusqueda: false
        };
    }
  };

  const renderAccionesCita = (cita) => {
    if (citaExpandida !== cita.id) return null;

    const permisos = getPermisosRol(user?.role);

    return (
      <View style={styles.accionesContainer}>
        <View style={styles.accionesPaciente}>
          {permisos.puedeEditar && (
            <TouchableOpacity 
              style={[styles.botonAccion, { borderColor: '#4CAF50' }]}
              onPress={() => navegarAEditar(cita)}
            >
              <Ionicons name="create-outline" size={18} color="#4CAF50" />
            </TouchableOpacity>
          )}
          
          {permisos.puedeVer && (
            <TouchableOpacity 
              style={[styles.botonAccion, { borderColor: '#1E88E5' }]}
              onPress={() => navegarADetalle(cita)}
            >
              <Ionicons name="eye-outline" size={18} color="#1E88E5" />
            </TouchableOpacity>
          )}
          
          {permisos.puedeEliminar && (
            <TouchableOpacity 
              style={[styles.botonAccion, { borderColor: '#F44336' }]}
              onPress={() => navegarAEliminar(cita)}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCitaItem = (cita, index) => {
    const isExpanded = citaExpandida === cita.id;
    const estadoColor = getEstadoColor(cita.estado);
    
    return (
      <View key={`${cita.id}-${cita.estado}-${cita.fechaCita}-${Date.now()}`} style={styles.citaContainer}>
        <TouchableOpacity 
          style={[styles.citaItem, isExpanded && styles.citaItemExpanded]}
          onPress={() => handleCitaPress(cita)}
          activeOpacity={0.7}
        >
          <View style={styles.citaHeader}>
            <View style={styles.citaInfo}>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>
                  {user?.role === 'medico' 
                    ? `${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || ''}`.trim()
                    : `Dr. ${cita.medico_nombre || ''} ${cita.medico_apellido || ''}`.trim()
                  }
                </Text>
                <Text style={styles.specialty}>
                  {user?.role === 'admin' && (
                    `Paciente: ${cita.paciente_nombre || ''} ${cita.paciente_apellido || ''}`
                  )}
                </Text>
              </View>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: estadoColor }]}>
                  <Text style={styles.statusText}>
                    {cita.estado || 'Sin estado'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeRow}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.dateText}>{formatDate(cita.fechaCita)}</Text>
              </View>
              <View style={styles.dateTimeRow}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.timeText}>{formatTime(cita.horaCita)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        {renderAccionesCita(cita)}
      </View>
    );
  };

  const renderEmptyState = () => {
    const permisos = getPermisosRol(user?.role);
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="calendar-clock" size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>No hay citas</Text>
        <Text style={styles.emptyText}>
          {user?.role === 'admin' ? 'No hay citas en el sistema' :
           user?.role === 'medico' ? 'No tienes consultas programadas' :
           filtroEstado === 'todas' ? 'No tienes citas programadas' : `No hay citas ${filtroEstado}`
          }
        </Text>
        {permisos.puedeCrear && (
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Crear_EditarCitas')}
          >
            <Text style={styles.emptyButtonText}>
              {user?.role === 'paciente' ? 'Agendar primera cita' : 'Nueva cita'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getTituloScreen = () => {
    switch (user?.role) {
      case 'admin':
        return 'Gestion de Citas';
      case 'medico':
        return 'Mis Consultas';
      case 'paciente':
        return 'Mis Citas Medicas';
      default:
        return 'Citas';
    }
  };

  const getTextoBotonNuevo = () => {
    switch (user?.role) {
      case 'admin':
        return 'Nueva';
      case 'medico':
        return 'Consulta';
      case 'paciente':
        return 'Agendar';
      default:
        return 'Nueva';
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="account-alert" size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>Error de autenticacion</Text>
        <Text style={styles.emptyText}>
          No se pudo identificar el usuario. Por favor, inicia sesion nuevamente.
        </Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => {
            loadUserData();
          }}
        >
          <Text style={styles.emptyButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const permisos = getPermisosRol(user?.role);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="medical" size={24} color="#2196F3" />
            </View>
            <View>
              <Text style={styles.appName}>Citas Medicas</Text>
              <Text style={styles.appSubtitle}>
                {user?.role === 'admin' ? 'Panel de administracion' :
                 user?.role === 'medico' ? 'Portal medico' : 'Tu salud en tus manos'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>
            {getTituloScreen()}
          </Text>
          {permisos.puedeCrear && (
            <TouchableOpacity 
              style={styles.newButton}
              onPress={() => navigation.navigate('Crear_EditarCitas')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newButtonText}>
                {getTextoBotonNuevo()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{citas.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {citas.filter(c => c.estado?.toLowerCase() === 'pendiente' || c.estado?.toLowerCase() === 'confirmado').length}
          </Text>
          <Text style={styles.statLabel}>
            {user?.role === 'medico' ? 'Por atender' : 'Pendientes'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {citas.filter(c => c.estado?.toLowerCase() === 'completada' || c.estado?.toLowerCase() === 'completado').length}
          </Text>
          <Text style={styles.statLabel}>
            {user?.role === 'medico' ? 'Atendidas' : 'Completadas'}
          </Text>
        </View>
      </View>

      {permisos.mostrarBusqueda && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>Buscar por nombre o documento...</Text>
        </View>
      )}

      <ScrollView
        style={styles.citasList}
        contentContainerStyle={styles.citasContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {filteredCitas.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Lista de {user?.role === 'medico' ? 'Consultas' : 'Citas'} ({filteredCitas.length})
              </Text>
              <Text style={styles.lastUpdate}>
                ultima actualizacion: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {filteredCitas.map((cita, index) => renderCitaItem(cita, index))}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 18,
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
    gap: 6,
  },
  newButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 14,
    color: '#999',
  },
  citasList: {
    flex: 1,
  },
  citasContent: {
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
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  citaContainer: {
    marginHorizontal: 20,
    marginBottom: 1,
  },
  citaItem: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  citaItemExpanded: {
    borderLeftColor: '#2196F3',
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  citaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateTimeContainer: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  accionesContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  accionesPaciente: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botonAccion: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  debugButton: {
    marginTop: 20,
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});