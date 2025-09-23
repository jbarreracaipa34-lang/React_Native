import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function ListarMedicos({ navigation }) {
  const [user, setUser] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [filteredMedicos, setFilteredMedicos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas');
  const [medicoExpandido, setMedicoExpandido] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadMedicos();
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [medicos, filtroEspecialidad]);

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

  const loadMedicos = async () => {
    try {
      setLoading(true);
      const medicosResult = await AuthService.getMedicosConEspecialidades();

      if (medicosResult && medicosResult.data && Array.isArray(medicosResult.data)) {
        const medicosConDefaults = medicosResult.data.map(medico => ({
          ...medico,
          especialidad_nombre: medico.especialidad_nombre || 'Sin especialidad',
          telefono: medico.telefono || 'No disponible',
          email: medico.email || 'No disponible',
          horarios_disponibles: medico.horarios_disponibles || []
        }));

        setMedicos(medicosConDefaults);
      } else {
        setMedicos([]);
      }
    } catch (error) {
      console.error('Error loading medicos:', error);
      setMedicos([]);
      Alert.alert('Error', 'No se pudieron cargar los médicos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    if (filtroEspecialidad === 'todas') {
      setFilteredMedicos(medicos);
    } else {
      const medicosFiltrados = medicos.filter(medico =>
        medico.especialidad_nombre?.toLowerCase() === filtroEspecialidad.toLowerCase()
      );
      setFilteredMedicos(medicosFiltrados);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicos();
    setRefreshing(false);
  };

  const handleMedicoPress = (medico) => {
    if (medicoExpandido === medico.id) {
      setMedicoExpandido(null);
    } else {
      setMedicoExpandido(medico.id);
    }
  };

  const handleEditarMedico = (medico) => {
    if (user?.role === 'paciente') {
      Alert.alert('Acceso denegado', 'Los pacientes no pueden editar información de médicos');
      return;
    }

    if (user?.role === 'medico' && String(medico.user_id) !== String(user.id)) {
      Alert.alert('Acceso denegado', 'No puedes modificar datos de otros médicos');
      return;
    }

    navigation.navigate('Crear_EditarMedicos', { medico: medico });
  };

  const handleEliminarMedico = (medico) => {
    if (user?.role === 'paciente') {
      Alert.alert('Acceso denegado', 'Los pacientes no pueden eliminar médicos');
      return;
    }

    if (user?.role === 'medico') {
      Alert.alert('Acceso denegado', 'No puedes modificar datos de otros médicos');
      return;
    }

    navigation.navigate('EliminarMedicos', { medico: medico });
  };

  const renderAccionesMedico = (medico) => {
    if (medicoExpandido !== medico.id) return null;

    return (
      <View style={styles.accionesContainer}>
        {user?.role === 'paciente' && (
          <View style={styles.horariosContainer}>
            <Text style={styles.horariosTitle}>Horarios disponibles:</Text>
            <View style={styles.horariosGrid}>
              {medico.horarios_disponibles && medico.horarios_disponibles.length > 0 ? (
                medico.horarios_disponibles.map((horario, index) => (
                  <View key={index} style={styles.horarioChip}>
                    <Text style={styles.horarioText}>
                      {horario.diaSemana}: {horario.horaInicio} - {horario.horaFin}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noHorariosText}>No hay horarios disponibles</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.accionesMedico}>
          <TouchableOpacity
            style={[styles.botonAccion, { borderColor: '#1E88E5' }]}
            onPress={() => navigation.navigate('DetalleMedicos', { medico: medico })}
          >
            <Ionicons name="eye-outline" size={18} color="#1E88E5" />
          </TouchableOpacity>

          {(user?.role === 'admin' || user?.role === 'medico') && (
            <TouchableOpacity
              style={[styles.botonAccion, { borderColor: '#4CAF50' }]}
              onPress={() => handleEditarMedico(medico)}
            >
              <Ionicons name="create-outline" size={18} color="#4CAF50" />
            </TouchableOpacity>
          )}

          {user?.role === 'admin' && (
            <TouchableOpacity
              style={[styles.botonAccion, { borderColor: '#F44336' }]}
              onPress={() => handleEliminarMedico(medico)}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMedicoItem = (medico, index) => {
    const isExpanded = medicoExpandido === medico.id;

    return (
      <View key={medico.id || index} style={styles.medicoContainer}>
        <TouchableOpacity
          style={[styles.medicoItem, isExpanded && styles.medicoItemExpanded]}
          onPress={() => handleMedicoPress(medico)}
          activeOpacity={0.7}
        >
          <View style={styles.medicoHeader}>
            <View style={styles.medicoInfo}>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>
                  Dr. {medico.nombre || ''} {medico.apellido || ''}
                </Text>
                <Text style={styles.specialty}>
                  {medico.especialidad_nombre}
                </Text>
                <Text style={styles.licencia}>
                  Lic. {medico.numeroLicencia || 'No disponible'}
                </Text>
              </View>

              <View style={styles.contactContainer}>
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={14} color="#666" />
                  <Text style={styles.contactText}>{medico.telefono}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={14} color="#666" />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {medico.email}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {renderAccionesMedico(medico)}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="doctor" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No hay médicos</Text>
      <Text style={styles.emptyText}>
        {filtroEspecialidad === 'todas'
          ? 'No hay médicos registrados'
          : `No hay médicos de ${filtroEspecialidad}`
        }
      </Text>
      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Crear_EditarMedicos')}
        >
          <Text style={styles.emptyButtonText}>Agregar primer médico</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando médicos...</Text>
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
          <Text style={styles.screenTitle}>Médicos</Text>
          {user?.role === 'admin' && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => navigation.navigate('Crear_EditarMedicos')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newButtonText}>Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{medicos.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {new Set(medicos.map(m => m.especialidad_nombre)).size}
          </Text>
          <Text style={styles.statLabel}>Especialidades</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {medicos.filter(m => m.telefono && m.telefono !== 'No disponible').length}
          </Text>
          <Text style={styles.statLabel}>Con Teléfono</Text>
        </View>
      </View>

      <ScrollView
        style={styles.medicosList}
        contentContainerStyle={styles.medicosContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredMedicos.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Lista de Médicos</Text>
            </View>
            {filteredMedicos.map((medico, index) => renderMedicoItem(medico, index))}
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
  medicosList: {
    flex: 1,
  },
  medicosContent: {
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
  medicoContainer: {
    marginHorizontal: 20,
    marginBottom: 1,
  },
  medicoItem: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  medicoItemExpanded: {
    borderLeftColor: '#2196F3',
  },
  medicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicoInfo: {
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
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 2,
  },
  licencia: {
    fontSize: 12,
    color: '#666',
  },
  contactContainer: {
    alignItems: 'flex-end',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    maxWidth: 150,
  },
  accionesContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  horariosContainer: {
    marginBottom: 16,
  },
  horariosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horarioChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  horarioText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  noHorariosText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  accionesMedico: {
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