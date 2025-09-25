import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function ListarHorariosDisponibles({ navigation }) {
  const [user, setUser] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [horarioExpandido, setHorarioExpandido] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadHorarios();
    }
  }, [user]);

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

  const loadHorarios = async () => {
    try {
      setLoading(true);
      
      const horariosResult = await AuthService.getHorariosDisponiblesPorMedico();
      
      if (horariosResult && horariosResult.data && Array.isArray(horariosResult.data)) {
        const horariosData = horariosResult.data;

        // Agrupar horarios por medico
        const medicosMap = new Map();

        horariosData.forEach(item => {
          const medicoKey = `${item.nombre} ${item.apellido}`;

          if (!medicosMap.has(medicoKey)) {
            medicosMap.set(medicoKey, {
              nombre: item.nombre,
              apellido: item.apellido,
              horarios: []
            });
          }

          medicosMap.get(medicoKey).horarios.push({
            diaSemana: item.diaSemana,
            horaInicio: item.horaInicio,
            horaFin: item.horaFin
          });
        });

        const horariosArray = Array.from(medicosMap.entries()).map(([key, value]) => ({
          id: key, // Usamos el nombre completo como ID unico
          ...value
        }));

        // Ordenar horarios por dia de la semana
        horariosArray.forEach(medico => {
          medico.horarios.sort((a, b) => {
            const diasOrden = {
              'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4,
              'viernes': 5, 'sabado': 6, 'domingo': 7
            };
            return (diasOrden[a.diaSemana.toLowerCase()] || 8) - (diasOrden[b.diaSemana.toLowerCase()] || 8);
          });
        });

        setHorarios(horariosArray);
      } else {
        setHorarios([]);
      }
    } catch (error) {
      console.error('Error loading horarios:', error);
      setHorarios([]);
      Alert.alert('Error', 'No se pudieron cargar los horarios disponibles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHorarios();
    setRefreshing(false);
  };

  const handleHorarioPress = (medico) => {
    if (horarioExpandido === medico.id) {
      setHorarioExpandido(null);
    } else {
      setHorarioExpandido(medico.id);
    }
  };

  const handleCrearCita = (medico) => {
    navigation.navigate('Crear_EditarCitas', { medico: medico });
  };

  const handleEditarHorarios = (medico) => {
    navigation.navigate('Crear_EditarHorariosDisponibles', { medico: medico });
  };

  const handleDetalleHorarios = (medico) => {
    navigation.navigate('DetalleHorariosDisponibles', { medico: medico });
  };

  const handleEliminarHorarios = (medico) => {
    navigation.navigate('EliminarHorariosDisponibles', { medico: medico });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const getDiaColor = (dia) => {
    const colores = {
      'lunes': { bg: '#E3F2FD', text: '#1976D2' },
      'martes': { bg: '#E8F5E8', text: '#388E3C' },
      'miercoles': { bg: '#FFF3E0', text: '#F57C00' },
      'jueves': { bg: '#F3E5F5', text: '#7B1FA2' },
      'viernes': { bg: '#E0F2F1', text: '#00796B' },
      'sabado': { bg: '#FFF8E1', text: '#F9A825' },
      'domingo': { bg: '#FFEBEE', text: '#D32F2F' }
    };
    return colores[dia.toLowerCase()] || { bg: '#F5F5F5', text: '#666' };
  };

  const contarHorariosPorDia = () => {
    const contadores = {
      lunes: 0, martes: 0, miercoles: 0, jueves: 0,
      viernes: 0, sabado: 0, domingo: 0
    };

    horarios.forEach(medico => {
      medico.horarios.forEach(horario => {
        const dia = horario.diaSemana.toLowerCase();
        if (contadores.hasOwnProperty(dia)) {
          contadores[dia]++;
        }
      });
    });

    return contadores;
  };

  const renderAccionesMedico = (medico) => {
    if (horarioExpandido !== medico.id) return null;

    return (
      <View style={styles.accionesContainer}>
        <View style={styles.horariosInfo}>
          <Text style={styles.horariosTitle}>Horarios de atencion:</Text>
          {medico.horarios.map((horario, index) => (
            <View key={index} style={styles.horarioItem}>
              <View style={styles.horarioHeader}>
                <View style={[
                  styles.diaBadge,
                  { backgroundColor: getDiaColor(horario.diaSemana).bg }
                ]}>
                  <Text style={[
                    styles.diaText,
                    { color: getDiaColor(horario.diaSemana).text }
                  ]}>
                    {horario.diaSemana.charAt(0).toUpperCase() + horario.diaSemana.slice(1)}
                  </Text>
                </View>
                <Text style={styles.horarioTime}>
                  {formatTime(horario.horaInicio)} - {formatTime(horario.horaFin)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[
          styles.accionesMedico,
          user?.role === 'paciente' ? styles.accionesMedicoPaciente : styles.accionesMedicoOtros
        ]}>
          {user?.role === 'paciente' && (
            <TouchableOpacity
              style={[
                styles.botonAccion, 
                styles.botonAccionPaciente,
                { borderColor: '#4CAF50', backgroundColor: '#4CAF50' }
              ]}
              onPress={() => handleCrearCita(medico)}
            >
              <Ionicons name="calendar-outline" size={18} color="#FFF" />
              <Text style={styles.botonAccionText}>Agendar Cita</Text>
            </TouchableOpacity>
          )}

          {(user?.role === 'medico' || user?.role === 'admin') && (
            <>
              <TouchableOpacity
                style={[styles.botonAccion, styles.botonAccionOtros, { borderColor: '#1E88E5' }]}
                onPress={() => handleDetalleHorarios(medico)}
              >
                <Ionicons name="eye-outline" size={18} color="#1E88E5" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonAccion, styles.botonAccionOtros, { borderColor: '#4CAF50' }]}
                onPress={() => handleEditarHorarios(medico)}
              >
                <Ionicons name="create-outline" size={18} color="#4CAF50" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonAccion, styles.botonAccionOtros, { borderColor: '#F44336' }]}
                onPress={() => handleEliminarHorarios(medico)}
              >
                <Ionicons name="trash-outline" size={18} color="#F44336" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderMedicoItem = (medico, index) => {
    const isExpanded = horarioExpandido === medico.id;
    const totalHorarios = medico.horarios?.length || 0;
    const diasUnicos = [...new Set(medico.horarios?.map(h => h.diaSemana.toLowerCase()) || [])];

    return (
      <View key={medico.id || index} style={styles.medicoContainer}>
        <TouchableOpacity
          style={[styles.medicoItem, isExpanded && styles.medicoItemExpanded]}
          onPress={() => handleHorarioPress(medico)}
          activeOpacity={0.7}
        >
          <View style={styles.medicoMainInfo}>
            <View style={styles.medicoLeft}>
              <Text style={styles.medicoName}>
                Dr. {medico.nombre || ''} {medico.apellido || ''}
              </Text>
              <Text style={styles.medicoSpecialty}>
                Medico General
              </Text>
              <Text style={styles.medicoLicense}>
                {totalHorarios} horario{totalHorarios !== 1 ? 's' : ''} disponible{totalHorarios !== 1 ? 's' : ''}
              </Text>
              
              <View style={styles.diasInfo}>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.diasText}>
                  {diasUnicos.length} dia{diasUnicos.length !== 1 ? 's' : ''} de atencion
                </Text>
              </View>
            </View>

            <View style={styles.medicoRight}>
              <View style={styles.horariosPreview}>
                {medico.horarios?.slice(0, 2).map((horario, idx) => (
                  <View key={idx} style={styles.horarioPreviewItem}>
                    <View style={[
                      styles.miniDiaBadge,
                      { backgroundColor: getDiaColor(horario.diaSemana).bg }
                    ]}>
                      <Text style={[
                        styles.miniDiaText,
                        { color: getDiaColor(horario.diaSemana).text }
                      ]}>
                        {horario.diaSemana.substring(0, 3)}
                      </Text>
                    </View>
                    <Text style={styles.miniHorarioText}>
                      {formatTime(horario.horaInicio)}
                    </Text>
                  </View>
                ))}
                {medico.horarios?.length > 2 && (
                  <Text style={styles.masHorariosText}>
                    +{medico.horarios.length - 2}
                  </Text>
                )}
              </View>
              
              <View style={styles.horariosCounter}>
                <Text style={styles.horariosCounterNumber}>{totalHorarios}</Text>
                <Text style={styles.horariosCounterLabel}>horarios</Text>
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
      <MaterialCommunityIcons name="clock-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No hay horarios disponibles</Text>
      <Text style={styles.emptyText}>
        {user?.role === 'paciente' 
          ? 'No hay medicos con horarios de atencion disponibles'
          : 'No hay horarios registrados en el sistema'
        }
      </Text>
      {(user?.role === 'medico' || user?.role === 'admin') && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Crear_EditarHorariosDisponibles')}
        >
          <Text style={styles.emptyButtonText}>Agregar horarios</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const estadisticasDias = contarHorariosPorDia();
  const totalHorarios = horarios.reduce((total, medico) => total + medico.horarios.length, 0);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="time" size={24} color="#2196F3" />
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
            {user?.role === 'paciente' ? 'Horarios Disponibles' : 'Gestion de Horarios'}
          </Text>
          {(user?.role === 'medico' || user?.role === 'admin') && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => navigation.navigate('Crear_EditarhorariosDisponibles')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newButtonText}>Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{horarios.length}</Text>
          <Text style={styles.statLabel}>Medicos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalHorarios}</Text>
          <Text style={styles.statLabel}>Horarios</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {estadisticasDias.lunes + estadisticasDias.martes + estadisticasDias.miercoles + estadisticasDias.jueves + estadisticasDias.viernes}
          </Text>
          <Text style={styles.statLabel}>Dias Laborales</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {estadisticasDias.sabado + estadisticasDias.domingo}
          </Text>
          <Text style={styles.statLabel}>Fines Semana</Text>
        </View>
      </View>

      <ScrollView
        style={styles.horariosList}
        contentContainerStyle={styles.horariosContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {horarios.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {user?.role === 'paciente' ? 'Medicos Disponibles' : 'Horarios por Medico'}
              </Text>
              <Text style={styles.listSubtitle}>
                {user?.role === 'paciente' 
                  ? 'Selecciona un medico para agendar tu cita'
                  : 'Gestiona los horarios de atencion medica'
                }
              </Text>
            </View>
            {horarios.map((medico, index) => renderMedicoItem(medico, index))}
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
  horariosList: {
    flex: 1,
  },
  horariosContent: {
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
  medicoContainer: {
    marginHorizontal: 20,
    marginBottom: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    overflow: 'hidden',
  },
  medicoItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  medicoItemExpanded: {
    borderLeftColor: '#2196F3',
  },
  medicoMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  medicoLeft: {
    flex: 1,
  },
  medicoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  medicoSpecialty: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 4,
  },
  medicoLicense: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  diasInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diasText: {
    fontSize: 11,
    color: '#666',
  },
  medicoRight: {
    alignItems: 'flex-end',
  },
  horariosPreview: {
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  horarioPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  miniDiaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniDiaText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  miniHorarioText: {
    fontSize: 10,
    color: '#666',
  },
  masHorariosText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  horariosCounter: {
    alignItems: 'center',
  },
  horariosCounterNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  horariosCounterLabel: {
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
  horariosInfo: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  horariosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  horarioItem: {
    marginBottom: 8,
  },
  horarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  diaText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  horarioTime: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  accionesMedico: {
    flexDirection: 'row',
    gap: 12,
  },
  accionesMedicoPaciente: {
    justifyContent: 'center',
  },
  accionesMedicoOtros: {
    justifyContent: 'flex-end',
  },
  botonAccion: {
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
    flexDirection: 'row',
    gap: 6,
  },
  botonAccionPaciente: {
    paddingHorizontal: 20,
  },
  botonAccionOtros: {
    paddingHorizontal: 12,
    width: 36,
  },
  botonAccionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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