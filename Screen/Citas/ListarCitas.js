import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function ListarCitas({ navigation }) {
  const [user, setUser] = useState(null);
  const [citas, setCitas] = useState([]);
  const [filteredCitas, setFilteredCitas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [citaExpandida, setCitaExpandida] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadCitas();
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, filtroEstado]);

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUser(authData.user);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const loadCitas = async () => {
    try {
      setLoading(true);
      const citasResult = await AuthService.getCitasConMedicos();
      
      if (citasResult && citasResult.data && Array.isArray(citasResult.data)) {
        let citasFiltradas = [];
        
        if (citasResult.data.length > 0) {}

        switch (user.role) {
          case 'admin':
            citasFiltradas = citasResult.data;
            break;

          case 'medico':
            citasFiltradas = citasResult.data.filter(cita => {
              const medicoUserIdCita = String(cita.medico_user_id || '');
              const userIdActual = String(user.id);
              
              return medicoUserIdCita === userIdActual;
            });
            break;

          case 'paciente':
            citasFiltradas = citasResult.data.filter(cita => {
              const userIdCita = String(cita.user_id || '');
              const userIdUser = String(user.id);
              
              return userIdCita === userIdUser;
            });
            
            if (citasFiltradas.length === 0 && citasResult.data.length > 0) {
              
              Alert.alert('No se encontraron citas', 
                `Hay ${citasResult.data.length} citas en total pero ninguna coincide con tu ID (${user.id}). Revisa la consola para más detalles.`,
                [{ text: 'OK' }]
              );
            }
            break;

          default:
            citasFiltradas = [];
        }
        
        const citasConDefaults = citasFiltradas.map(cita => ({
          ...cita,
          estado: cita.estado || 'Pendiente',
          paciente_nombre: cita.paciente_nombre || 'Paciente',
          medico_nombre: cita.medico_nombre || 'Médico',
          medico_apellido: cita.medico_apellido || '',
          paciente_apellido: cita.paciente_apellido || ''
        }));
        
        setCitas(citasConDefaults);
      } else {
        setCitas([]);
      }
    } catch (error) {
      console.error('Error loading citas:', error);
      setCitas([]);
      Alert.alert('Error', 'No se pudieron cargar las citas: ' + error.message);
    } finally {
      setLoading(false);
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
    await loadCitas();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
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

  const renderAccionesCita = (cita) => {
    if (citaExpandida !== cita.id) return null;

    return (
      <View style={styles.accionesContainer}>
        <View style={styles.accionesPaciente}>
          <TouchableOpacity 
            style={[styles.botonAccion, { borderColor: '#4CAF50' }]}
            onPress={() => navigation.navigate('Crear_EditarCitas', { cita: cita })}
          >
            <Ionicons name="create-outline" size={18} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.botonAccion, { borderColor: '#1E88E5' }]}
            onPress={() => navigation.navigate('DetalleCitas', { cita: cita })}
          >
            <Ionicons name="eye-outline" size={18} color="#1E88E5" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.botonAccion, { borderColor: '#F44336' }]}
            onPress={() => navigation.navigate('EliminarCitas', { cita: cita })}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCitaItem = (cita, index) => {
    const isExpanded = citaExpandida === cita.id;
    const estadoColor = getEstadoColor(cita.estado);
    
    return (
      <View key={cita.id || index} style={styles.citaContainer}>
        <TouchableOpacity 
          style={[styles.citaItem, isExpanded && styles.citaItemExpanded]}
          onPress={() => handleCitaPress(cita)}
          activeOpacity={0.7}
        >
          <View style={styles.citaHeader}>
            <View style={styles.citaInfo}>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>
                  {(user?.role === 'paciente' || user?.role === 'admin') 
                    ? `Dr. ${cita.medico_nombre || ''} ${cita.medico_apellido || ''}`.trim()
                    : `${cita.paciente_nombre || 'Paciente no asignado'}`
                  }
                </Text>
                <Text style={styles.specialty}>
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="calendar-clock" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No hay citas</Text>
      <Text style={styles.emptyText}>
        {filtroEstado === 'todas' 
          ? 'No tienes citas programadas' 
          : `No hay citas ${filtroEstado}`
        }
      </Text>
      {user?.role === 'paciente' && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Crear_EditarCitas')}
        >
          <Text style={styles.emptyButtonText}>Agendar primera cita</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando citas...</Text>
      </View>
    );
  }

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
              <Text style={styles.appSubtitle}>Tu salud en tus manos</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>
            {user?.role === 'admin' ? 'Todas las Citas' : 
             user?.role === 'medico' ? 'Mis Consultas' : 'Mis Citas'}
          </Text>
          <TouchableOpacity 
            style={styles.newButton}
            onPress={() => navigation.navigate('Crear_EditarCitas')}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.newButtonText}>
              {user?.role === 'paciente' ? 'Agendar' : 'Nueva'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{citas.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {citas.filter(c => c.estado?.toLowerCase() === 'confirmada').length}
          </Text>
          <Text style={styles.statLabel}>
            {user?.role === 'paciente' ? 'Confirmadas' : 'Activas'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {citas.filter(c => c.estado?.toLowerCase() === 'completada').length}
          </Text>
          <Text style={styles.statLabel}>
            {user?.role === 'medico' ? 'Atendidas' : 'Completadas'}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <Text style={styles.searchPlaceholder}>Buscar por nombre o documento...</Text>
      </View>

      <ScrollView
        style={styles.citasList}
        contentContainerStyle={styles.citasContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredCitas.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Lista de Citas</Text>
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
});