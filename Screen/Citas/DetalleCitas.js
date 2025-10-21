import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function DetalleCitas({ route, navigation }) {
  const { cita } = route.params;
  const [usuario, setUsuario] = useState(null);
  const [citaDetallada, setCitaDetallada] = useState(cita);
  const [paciente, setPaciente] = useState(null);
  const [medico, setMedico] = useState(null);

  useEffect(() => {
    loadUsuarioData();
    cargarDetallesCompletos();
  }, []);

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

  const cargarDetallesCompletos = async () => {
    try {      
      if (cita.pacientes_id || cita.paciente_id) {
        const pacientesResponse = await AuthService.getPacientes();
        if (pacientesResponse?.data) {
          const pacienteEncontrado = pacientesResponse.data.find(
            p => p.id === (cita.pacientes_id || cita.paciente_id)
          );
          if (pacienteEncontrado) {
            setPaciente(pacienteEncontrado);
          }
        }
      }
      
      if (cita.medicos_id || cita.medico_id) {
        const medicosResponse = await AuthService.getMedicos();
        if (medicosResponse?.data) {
          const medicoEncontrado = medicosResponse.data.find(
            m => m.id === (cita.medicos_id || cita.medico_id)
          );
          if (medicoEncontrado) {
            setMedico(medicoEncontrado);
            
            if (medicoEncontrado.especialidad_id) {
              const especialidadesResponse = await AuthService.getEspecialidades();
              if (especialidadesResponse?.data) {
                const especialidadEncontrada = especialidadesResponse.data.find(
                  e => e.id === medicoEncontrado.especialidad_id
                );
                if (especialidadEncontrada) {
                  setMedico({
                    ...medicoEncontrado,
                    especialidad: especialidadEncontrada
                  });
                }
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    
    let date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      // Para fechas sin hora, agregar T00:00:00 para evitar problemas de zona horaria
      date = new Date(dateString + 'T00:00:00');
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return 'No disponible';
    return time.substring(0, 5);
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
      case 'confirmado':
        return { bg: '#E8F5E8', text: '#2E7D32', icon: 'checkmark-circle' };
      case 'pendiente':
        return { bg: '#FFF3E0', text: '#EF6C00', icon: 'time' };
      case 'cancelada':
      case 'cancelado':
        return { bg: '#FFEBEE', text: '#C62828', icon: 'close-circle' };
      case 'completada':
      case 'completado':
        return { bg: '#E3F2FD', text: '#1976D2', icon: 'checkmark-done-circle' };
      default:
        return { bg: '#F3E5F5', text: '#8E24AA', icon: 'help-circle' };
    }
  };

  const colorEstado = getEstadoColor(citaDetallada.estado);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colorEstado.bg }]}>
              <Ionicons 
                name={colorEstado.icon}
                size={48} 
                color={colorEstado.text} 
              />
            </View>
          </View>
          
          <Text style={styles.citaTitle}>Cita Medica</Text>
          
          <View style={[styles.estadoBadge, { backgroundColor: colorEstado.bg }]}>
            <Ionicons 
              name={colorEstado.icon}
              size={18}
              color={colorEstado.text}
            />
            <Text style={[styles.estadoText, { color: colorEstado.text }]}>
              {citaDetallada.estado || 'Pendiente'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Fecha y Hora</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Fecha de la Cita</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatDate(citaDetallada.fechaCita)}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Hora</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatTime(citaDetallada.horaCita)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion del Paciente</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Nombre</Text>
              </View>
              <Text style={styles.infoValue}>
                {paciente 
                  ? `${paciente.nombre} ${paciente.apellido}`
                  : citaDetallada.paciente_nombre 
                    ? `${citaDetallada.paciente_nombre} ${citaDetallada.paciente_apellido || ''}`
                    : 'No disponible'
                }
              </Text>
            </View>

            {paciente?.numeroDocumento && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="document-text-outline" size={18} color="#666" />
                    <Text style={styles.infoLabelText}>Documento</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {paciente.numeroDocumento}
                  </Text>
                </View>
              </>
            )}

            {paciente?.telefono && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="call-outline" size={18} color="#666" />
                    <Text style={styles.infoLabelText}>Telefono</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {paciente.telefono}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="doctor" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion del Medico</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Nombre</Text>
              </View>
              <Text style={styles.infoValue}>
                {medico 
                  ? `Dr. ${medico.nombre} ${medico.apellido}`
                  : citaDetallada.medico_nombre 
                    ? `Dr. ${citaDetallada.medico_nombre} ${citaDetallada.medico_apellido || ''}`
                    : 'No disponible'
                }
              </Text>
            </View>

            {medico?.especialidad?.nombre && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoLabel}>
                    <MaterialCommunityIcons name="stethoscope" size={18} color="#666" />
                    <Text style={styles.infoLabelText}>Especialidad</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {medico.especialidad.nombre}
                  </Text>
                </View>
              </>
            )}

            {medico?.numeroLicencia && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="document-text-outline" size={18} color="#666" />
                    <Text style={styles.infoLabelText}>Licencia</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {medico.numeroLicencia}
                  </Text>
                </View>
              </>
            )}

            {medico?.telefono && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="call-outline" size={18} color="#666" />
                    <Text style={styles.infoLabelText}>Telefono</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {medico.telefono}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {citaDetallada.observaciones && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#2196F3" />
              <Text style={styles.cardHeaderTitle}>Observaciones</Text>
            </View>
            
            <View style={styles.observacionesContainer}>
              <Text style={styles.observacionesText}>
                {citaDetallada.observaciones}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  estadoText: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoList: {
    gap: 0,
  },
  infoItem: {
    paddingVertical: 12,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoLabelText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '400',
    paddingLeft: 26,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  observacionesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  observacionesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 20,
  },
});