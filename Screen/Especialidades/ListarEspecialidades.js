import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function ListarEspecialidades({ navigation }) {
  const [user, setUser] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [especialidadExpandida, setEspecialidadExpandida] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadEspecialidades(user);
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUser(authData.user);
      }
    } catch (error) {
    }
  };

  const loadEspecialidades = async (loggedUser = user) => {
    try {
      setLoading(true);
      
      const especialidadesResult = await AuthService.getEspecialidadesConMedicos();
      
      if (especialidadesResult && especialidadesResult.data && Array.isArray(especialidadesResult.data)) {
        const especialidadesData = especialidadesResult.data;

        const especialidadesMap = new Map();

        especialidadesData.forEach(item => {
          const especialidadId = item.id;

          if (!especialidadesMap.has(especialidadId)) {
            especialidadesMap.set(especialidadId, {
              id: especialidadId,
              nombre: item.nombre,
              descripcion: item.descripcion || 'Sin descripción',
              medicos: []
            });
          }

          if (item.medico_id) {
            especialidadesMap.get(especialidadId).medicos.push({
              id: item.medico_id,
              nombre: item.medico_nombre,
              apellido: item.apellido,
              numeroLicencia: item.numeroLicencia,
              telefono: item.telefono || 'No disponible',
              email: item.email || 'No disponible'
            });
          }
        });

        const especialidadesArray = Array.from(especialidadesMap.values());
        
        let especialidadesFiltradas = especialidadesArray;
        if (loggedUser?.role === 'medico') {         
          especialidadesFiltradas = especialidadesArray.filter(especialidad => {
            especialidad.medicos.map(m => ({
              id: m.id,
              nombre: m.nombre,
              email: m.email
            }));
            
            const tieneElMedico = especialidad.medicos.some(medico => {
              const coincideId = medico.id === loggedUser.id;
              const coincideMedicoId = medico.id === loggedUser.medicoId;
              const coincideEmail = medico.email === loggedUser.email;
              
              return coincideId || coincideMedicoId || coincideEmail;
            });
            
            return tieneElMedico;
          });
        }

        const especialidadesConStats = especialidadesFiltradas.map(especialidad => ({
          ...especialidad,
          totalMedicos: especialidad.medicos.length,
          totalCitas: 0,
          citasActivas: 0
        }));

        setEspecialidades(especialidadesConStats);
      } else {
        setEspecialidades([]);
      }
    } catch (error) {
      console.error('Error loading especialidades:', error);
      setEspecialidades([]);
      Alert.alert('Error', 'No se pudieron cargar las especialidades: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEspecialidades();
    setRefreshing(false);
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
    if (user?.role !== 'admin') {
      Alert.alert('Acceso denegado', 'Solo los administradores pueden eliminar especialidades');
      return;
    }

    navigation.navigate('EliminarEspecialidades', { especialidad: especialidad });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEstadoColor = (totalMedicos) => {
    if (totalMedicos > 0) {
      return { bg: '#E8F5E8', text: '#2E7D32' };
    } else {
      return { bg: '#FFEBEE', text: '#C62828' };
    }
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
        <View style={styles.detallesInfo}>
          <Text style={styles.detallesTitle}>Detalles de la especialidad:</Text>
          
          <View style={styles.detalleItem}>
            <Text style={styles.detalleLabel}>Descripción:</Text>
            <Text style={styles.detalleValue}>{especialidad.descripcion}</Text>
          </View>

          <View style={styles.detalleItem}>
            <Text style={styles.detalleLabel}>Total de médicos:</Text>
            <Text style={styles.detalleValue}>{especialidad.totalMedicos}</Text>
          </View>

          <View style={styles.detalleItem}>
            <Text style={styles.detalleLabel}>Estado:</Text>
            <View style={[
              styles.estadoBadge, 
              { backgroundColor: getEstadoColor(especialidad.totalMedicos).bg }
            ]}>
              <Text style={[
                styles.estadoText,
                { color: getEstadoColor(especialidad.totalMedicos).text }
              ]}>
                {especialidad.totalMedicos > 0 ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.accionesEspecialidad}>
          <TouchableOpacity
            style={[styles.botonAccion, { borderColor: '#1E88E5' }]}
            onPress={() => navigation.navigate('DetalleEspecialidades', { especialidad: especialidad })}
          >
            <Ionicons name="eye-outline" size={18} color="#1E88E5" />
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity
              style={[styles.botonAccion, { borderColor: '#4CAF50' }]}
              onPress={() => handleEditarEspecialidad(especialidad)}
            >
              <Ionicons name="create-outline" size={18} color="#4CAF50" />
            </TouchableOpacity>
          )}

          {user?.role === 'admin' && (
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
    const estadoColor = getEstadoColor(especialidad.totalMedicos);

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
                {especialidad.nombre}
              </Text>
              <Text style={styles.especialidadDescription} numberOfLines={2}>
                {especialidad.descripcion}
              </Text>
              <Text style={styles.especialidadDate}>
                {especialidad.totalMedicos} médico{especialidad.totalMedicos !== 1 ? 's' : ''} asociado{especialidad.totalMedicos !== 1 ? 's' : ''}
              </Text>
              
              <View style={styles.estadoContainer}>
                <View style={[
                  styles.miniEstadoBadge, 
                  { backgroundColor: estadoColor.bg }
                ]}>
                  <Text style={[
                    styles.miniEstadoText,
                    { color: estadoColor.text }
                  ]}>
                    {especialidad.totalMedicos > 0 ? 'Activa' : 'Inactiva'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.especialidadRight}>
              <View style={styles.statsInfo}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.statValue}>{especialidad.totalMedicos || 0}</Text>
                  <Text style={styles.statLabel}>médicos</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.statValue}>{especialidad.totalCitas || 0}</Text>
                  <Text style={styles.statLabel}>citas</Text>
                </View>
              </View>
              
              {especialidad.citasActivas > 0 && (
                <View style={styles.citasActivasBadge}>
                  <Text style={styles.citasActivasText}>
                    {especialidad.citasActivas} activas
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {renderAccionesEspecialidad(especialidad)}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="medical-bag" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No hay especialidades</Text>
      <Text style={styles.emptyText}>
        {user?.role === 'medico' 
          ? 'No tienes especialidades asignadas'
          : 'No hay especialidades registradas'
        }
      </Text>
      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Crear_EditarEspecialidades')}
        >
          <Text style={styles.emptyButtonText}>Agregar primera especialidad</Text>
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
            {user?.role === 'medico' ? 'Mis Especialidades' : 'Especialidades'}
          </Text>
          {user?.role === 'admin' && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => navigation.navigate('Crear_EditarEspecialidades')}
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
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {estadisticas.conMedicos}
          </Text>
          <Text style={styles.statLabel}>Con Médicos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {estadisticas.totalMedicos}
          </Text>
          <Text style={styles.statLabel}>Médicos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>
            {estadisticas.totalCitas}
          </Text>
          <Text style={styles.statLabel}>Citas</Text>
        </View>
      </View>

      <ScrollView
        style={styles.especialidadesList}
        contentContainerStyle={styles.especialidadesContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {especialidades.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {user?.role === 'medico' ? 'Mis Especialidades' : 'Lista de Especialidades'}
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
    paddingRight: 16,
  },
  especialidadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  especialidadDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  especialidadDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  estadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  miniEstadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniEstadoText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  especialidadRight: {
    alignItems: 'flex-end',
  },
  statsInfo: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
    marginTop: 2,
  },
  citasActivasBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  citasActivasText: {
    fontSize: 9,
    color: '#2E7D32',
    fontWeight: '500',
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
  detallesInfo: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  detallesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detalleItem: {
    marginBottom: 12,
    paddingBottom: 8,
  },
  detalleLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  detalleValue: {
    fontSize: 14,
    color: '#333',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  medicoItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  masItems: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  accionesEspecialidad: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botonAccion: {
    width: 36,
    height: 36,
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