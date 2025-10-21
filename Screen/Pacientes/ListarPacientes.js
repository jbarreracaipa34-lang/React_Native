import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AuthService from '../../Src/Services/AuthService';

export default function ListarPacientes({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pacienteExpandido, setPacienteExpandido] = useState(null);

  useEffect(() => {
    loadUsuarioData();
  }, []);

  useEffect(() => {
    if (usuario) {
      loadPacientes(usuario);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      if (usuario) {
        setTimeout(() => {
          loadPacientes(usuario);
        }, 100);
      }
    }, [usuario])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (usuario) {
        setTimeout(() => {
          loadPacientes(usuario);
        }, 50);
      }
    });

    return unsubscribe;
  }, [navigation, usuario]);

  const loadUsuarioData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const loadPacientes = async (loggedUser = usuario) => {
    try {
      if (loggedUser?.role === 'admin') {
        const todosPacientesResult = await AuthService.getPacientes();
        
        if (todosPacientesResult.success && todosPacientesResult.data && Array.isArray(todosPacientesResult.data)) {
          const pacientesConCitas = await AuthService.getPacientesConCitas();
          const citasPorPaciente = new Map();
          
          if (pacientesConCitas.success && pacientesConCitas.data && Array.isArray(pacientesConCitas.data)) {
            pacientesConCitas.data.forEach(item => {
              const pacienteId = item.id;
              if (!citasPorPaciente.has(pacienteId)) {
                citasPorPaciente.set(pacienteId, []);
              }
              citasPorPaciente.get(pacienteId).push({
                id: item.cita_id,
                fechaCita: item.fechaCita,
                horaCita: item.horaCita,
                estado: item.estado,
                observaciones: item.observaciones || '',
                medicoId: item.medicos_id
              });
            });
          }

          const pacientesArray = todosPacientesResult.data.map(paciente => ({
            id: paciente.id,
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            documento: paciente.numeroDocumento || 'No disponible',
            telefono: paciente.telefono || 'No disponible',
            email: paciente.email || 'No disponible',
            fechaNacimiento: paciente.fechaNacimiento || 'No disponible',
            genero: paciente.genero || 'No disponible',
            direccion: paciente.direccion || 'No disponible',
            eps: paciente.eps || 'No disponible',
            citas: citasPorPaciente.get(paciente.id) || []
          }));

          pacientesArray.forEach(paciente => {
            if (paciente.citas.length > 0) {
              paciente.citas.sort((a, b) => {
                const dateA = new Date(`${a.fechaCita} ${a.horaCita}`);
                const dateB = new Date(`${b.fechaCita} ${b.horaCita}`);
                return dateB - dateA;
              });
            }
          });

          setPacientes(pacientesArray);
        } else {
          setPacientes([]);
        }
      } else {
        const pacientesResult = await AuthService.getPacientesConCitas();
        
        if (pacientesResult && pacientesResult.data && Array.isArray(pacientesResult.data)) {
          const citasFiltradas = pacientesResult.data.filter(item => 
            item.medicos_id === loggedUser.id
          );
          
          const pacientesMap = new Map();

          citasFiltradas.forEach(item => {
            const pacienteId = item.id;

            if (!pacientesMap.has(pacienteId)) {
              pacientesMap.set(pacienteId, {
                id: pacienteId,
                nombre: item.nombre,
                apellido: item.apellido,
                documento: item.documento || 'No disponible',
                telefono: item.telefono || 'No disponible',
                email: item.email || 'No disponible',
                fechaNacimiento: item.fechaNacimiento || 'No disponible',
                genero: item.genero || 'No disponible',
                eps: item.eps || 'No disponible',
                citas: []
              });
            }

            pacientesMap.get(pacienteId).citas.push({
              id: item.cita_id,
              fechaCita: item.fechaCita,
              horaCita: item.horaCita,
              estado: item.estado,
              observaciones: item.observaciones || '',
              medicoId: item.medicos_id
            });
          });

          const pacientesArray = Array.from(pacientesMap.values());
          pacientesArray.forEach(paciente => {
            paciente.citas.sort((a, b) => {
              const dateA = new Date(`${a.fechaCita} ${a.horaCita}`);
              const dateB = new Date(`${b.fechaCita} ${b.horaCita}`);
              return dateB - dateA;
            });
          });

          setPacientes(pacientesArray);
        } else {
          setPacientes([]);
        }
      }
    } catch (error) {
      console.error('Error loading pacientes:', error);
      setPacientes([]);
      Alert.alert('Error', 'No se pudieron cargar los pacientes: ' + error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPacientes();
    setRefreshing(false);
  };

  const handlePacientePress = (paciente) => {
    if (pacienteExpandido === paciente.id) {
      setPacienteExpandido(null);
    } else {
      setPacienteExpandido(paciente.id);
    }
  };

  const handleEditarPaciente = (paciente) => {
    navigation.navigate('Crear_EditarPacientes', { 
      paciente: paciente
    });
  };

  const handleEliminarPaciente = (paciente) => {
    if (usuario?.role !== 'admin') {
      Alert.alert('Acceso denegado', 'Solo los administradores pueden eliminar pacientes');
      return;
    }

    navigation.navigate('EliminarPacientes', { 
      paciente: paciente,
      onGoBack: () => {
        setTimeout(() => {
          loadPacientes(usuario);
        }, 200);
      }
    });
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

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
      case 'confirmado':
        return { bg: '#E8F5E8', text: '#2E7D32' };
      case 'pendiente':
        return { bg: '#FFF3E0', text: '#EF6C00' };
      case 'cancelada':
      case 'cancelado':
        return { bg: '#FFEBEE', text: '#C62828' };
      case 'completada':
      case 'completado':
        return { bg: '#E3F2FD', text: '#1976D2' };
      default:
        return { bg: '#F3E5F5', text: '#8E24AA' };
    }
  };

  const getProximaCita = (citas) => {
    if (!citas || citas.length === 0) return null;
    
    const now = new Date();
    const citasFuturas = citas.filter(cita => {
      const fechaCita = new Date(`${cita.fechaCita} ${cita.horaCita}`);
      return fechaCita > now;
    });
    
    if (citasFuturas.length === 0) return null;
    
    return citasFuturas.sort((a, b) => {
      const dateA = new Date(`${a.fechaCita} ${a.horaCita}`);
      const dateB = new Date(`${b.fechaCita} ${b.horaCita}`);
      return dateA - dateB;
    })[0];
  };

  const contarCitasPorEstado = () => {
    const contadores = {
      completadas: 0,
      pendientes: 0,
      confirmadas: 0,
      canceladas: 0
    };

    pacientes.forEach(paciente => {
      if (paciente.citas) {
        paciente.citas.forEach(cita => {
          switch (cita.estado?.toLowerCase()) {
            case 'completada':
            case 'completado':
              contadores.completadas++;
              break;
            case 'pendiente':
              contadores.pendientes++;
              break;
            case 'confirmada':
            case 'confirmado':
              contadores.confirmadas++;
              break;
            case 'cancelada':
            case 'cancelado':
              contadores.canceladas++;
              break;
          }
        });
      }
    });

    return contadores;
  };

  const renderAccionesPaciente = (paciente) => {
    if (pacienteExpandido !== paciente.id) return null;

    return (
      <View style={styles.accionesContainer}>
        {paciente.citas && paciente.citas.length > 0 ? (
          <View style={styles.citasInfo}>
            <Text style={styles.citasTitle}>Historial de citas:</Text>
            {paciente.citas.slice(0, 3).map((cita, index) => (
              <View key={cita.id || index} style={styles.citaItem}>
                <View style={styles.citaHeader}>
                  <Text style={styles.citaDate}>
                    {formatDate(cita.fechaCita)} - {formatTime(cita.horaCita)}
                  </Text>
                  <View style={[
                    styles.estadoBadge, 
                    { backgroundColor: getEstadoColor(cita.estado).bg }
                  ]}>
                    <Text style={[
                      styles.estadoText,
                      { color: getEstadoColor(cita.estado).text }
                    ]}>
                      {cita.estado}
                    </Text>
                  </View>
                </View>
                <Text style={styles.tipoCita}>{cita.tipoCita}</Text>
                {cita.observaciones && (
                  <Text style={styles.observaciones} numberOfLines={2}>
                    {cita.observaciones}
                  </Text>
                )}
              </View>
            ))}
            {paciente.citas.length > 3 && (
              <TouchableOpacity 
                style={styles.verMasCitas}
                onPress={() => navigation.navigate('HistorialCitas', { paciente: paciente })}
              >
                <Text style={styles.verMasCitasText}>
                  Ver todas las citas ({paciente.citas.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.sinCitasInfo}>
            <MaterialCommunityIcons name="calendar-blank" size={32} color="#CCC" />
            <Text style={styles.sinCitasText}>Sin citas registradas</Text>
          </View>
        )}

        <View style={styles.accionesPaciente}>
          <TouchableOpacity
            style={[styles.botonAccion, { borderColor: '#1E88E5' }]}
            onPress={() => navigation.navigate('DetallePacientes', { 
              paciente: paciente,
              onGoBack: () => {
                setTimeout(() => {
                  loadPacientes(usuario);
                }, 200);
              }
            })}
          >
            <Ionicons name="eye-outline" size={18} color="#1E88E5" />
          </TouchableOpacity>

          {(usuario?.role === 'admin' || usuario?.role === 'medico') && (
            <TouchableOpacity
              style={[styles.botonAccion, { borderColor: '#4CAF50' }]}
              onPress={() => handleEditarPaciente(paciente)}
            >
              <Ionicons name="create-outline" size={18} color="#4CAF50" />
            </TouchableOpacity>
          )}

          {usuario?.role === 'admin' && (
            <TouchableOpacity
              style={[styles.botonAccion, { borderColor: '#F44336' }]}
              onPress={() => handleEliminarPaciente(paciente)}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPacienteItem = (paciente, index) => {
    const isExpanded = pacienteExpandido === paciente.id;
    const proximaCita = getProximaCita(paciente.citas);
    const citasActivas = paciente.citas?.filter(cita => 
      cita.estado?.toLowerCase() === 'pendiente' || 
      cita.estado?.toLowerCase() === 'confirmada'
    ).length || 0;

    return (
      <View key={paciente.id || index} style={styles.pacienteContainer}>
        <TouchableOpacity
          style={[styles.pacienteItem, isExpanded && styles.pacienteItemExpanded]}
          onPress={() => handlePacientePress(paciente)}
          activeOpacity={0.7}
        >
          <View style={styles.pacienteMainInfo}>
            <View style={styles.pacienteLeft}>
              <Text style={styles.pacienteName}>
                {paciente.nombre || ''} {paciente.apellido || ''}
              </Text>
              <Text style={styles.pacienteSpecialty}>
                Doc. {paciente.documento}
              </Text>
              <Text style={styles.pacienteLicense}>
                {paciente.genero || 'No especificado'} • EPS: {paciente.eps || 'No disponible'}
              </Text>
              
              {proximaCita && (
                <View style={styles.proximaCitaInfo}>
                  <Ionicons name="calendar-outline" size={12} color="#2196F3" />
                  <Text style={styles.proximaCitaText}>
                    {formatDate(proximaCita.fechaCita)} - {formatTime(proximaCita.horaCita)}
                  </Text>
                  <View style={[
                    styles.miniEstadoBadge, 
                    { backgroundColor: getEstadoColor(proximaCita.estado).bg }
                  ]}>
                    <Text style={[
                      styles.miniEstadoText,
                      { color: getEstadoColor(proximaCita.estado).text }
                    ]}>
                      {proximaCita.estado}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.pacienteRight}>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={14} color="#666" />
                  <Text style={styles.contactValue}>{paciente.telefono}</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={14} color="#666" />
                  <Text style={styles.contactValue} numberOfLines={1}>
                    {paciente.email}
                  </Text>
                </View>
              </View>
              
              <View style={styles.citasCounter}>
                <Text style={styles.citasCounterNumber}>{paciente.citas?.length || 0}</Text>
                <Text style={styles.citasCounterLabel}>citas</Text>
                {citasActivas > 0 && (
                  <View style={styles.citasActivasBadge}>
                    <Text style={styles.citasActivasText}>{citasActivas} activas</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {renderAccionesPaciente(paciente)}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-group" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No hay pacientes</Text>
      <Text style={styles.emptyText}>
        {usuario?.role === 'medico' 
          ? 'No tienes pacientes con citas programadas'
          : 'No hay pacientes registrados en el sistema'
        }
      </Text>
      {(usuario?.role === 'admin') && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Crear_EditarPacientes')}
        >
          <Text style={styles.emptyButtonText}>Agregar primer paciente</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const estadisticasCitas = contarCitasPorEstado();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="people" size={24} color="#2196F3" />
            </View>
            <View>
              <Text style={styles.appName}>Citas Medicas</Text>
              <Text style={styles.appSubtitle}>
                {usuario?.role === 'admin' ? 'Panel de administracion' : 
                 usuario?.role === 'medico' ? 'Portal medico' : 'Tu salud en tus manos'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>
            {usuario?.role === 'medico' ? 'Mis Pacientes' : 'Pacientes'}
          </Text>
          {(usuario?.role === 'admin') && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => navigation.navigate('Crear_EditarPacientes')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newButtonText}>Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pacientes.length}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {pacientes.filter(p => p.citas && p.citas.length > 0).length}
          </Text>
          <Text style={styles.statLabel}>Con Citas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {estadisticasCitas.completadas}
          </Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {estadisticasCitas.pendientes + estadisticasCitas.confirmadas}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      <ScrollView
        style={styles.pacientesList}
        contentContainerStyle={styles.pacientesContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {pacientes.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {usuario?.role === 'medico' ? 'Mis Pacientes' : 'Lista de Pacientes'}
              </Text>
            </View>
            {pacientes.map((paciente, index) => renderPacienteItem(paciente, index))}
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
  pacientesList: {
    flex: 1,
  },
  pacientesContent: {
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
  pacienteContainer: {
    marginHorizontal: 20,
    marginBottom: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    overflow: 'hidden',
  },
  pacienteItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pacienteItemExpanded: {
    borderLeftColor: '#2196F3',
  },
  pacienteMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pacienteLeft: {
    flex: 1,
  },
  pacienteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  pacienteSpecialty: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 4,
  },
  pacienteLicense: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  proximaCitaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  proximaCitaText: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '500',
    flex: 1,
  },
  miniEstadoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniEstadoText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pacienteRight: {
    alignItems: 'flex-end',
  },
  contactInfo: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    maxWidth: 150,
  },
  citasCounter: {
    alignItems: 'center',
  },
  citasCounterNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  citasCounterLabel: {
    fontSize: 10,
    color: '#666',
  },
  citasActivasBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
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
  citasInfo: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  citasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  citaItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  citaDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tipoCita: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  observaciones: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  verMasCitas: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
  },
  verMasCitasText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  sinCitasInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sinCitasText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  accionesPaciente: {
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