import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function DetallePacientes({ route, navigation }) {
  const { paciente } = route.params;
  const [usuario, setUsuario] = useState(null);
  const [pacienteDetallado, setPacienteDetallado] = useState(paciente);
(false);

  useEffect(() => {
    loadUserData();
    cargarDetallesCompletos();
  }, []);

  const loadUserData = async () => {
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
      const pacientesResponse = await AuthService.getPacientes();
      
      if (pacientesResponse?.data) {
        const pacienteActualizado = pacientesResponse.data.find(p => p.id === paciente.id);
        if (pacienteActualizado) {
          setPacienteDetallado({
            ...pacienteActualizado,
            citas: paciente.citas || []
          });
        }
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No disponible') return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento || fechaNacimiento === 'No disponible') return 'No disponible';
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return `${edad} años`;
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

  const contarCitasPorEstado = () => {
    if (!pacienteDetallado.citas) return { total: 0, pendientes: 0, completadas: 0, canceladas: 0 };
    
    return {
      total: pacienteDetallado.citas.length,
      pendientes: pacienteDetallado.citas.filter(c => 
        c.estado?.toLowerCase() === 'pendiente' || c.estado?.toLowerCase() === 'confirmada'
      ).length,
      completadas: pacienteDetallado.citas.filter(c => 
        c.estado?.toLowerCase() === 'completada' || c.estado?.toLowerCase() === 'completado'
      ).length,
      canceladas: pacienteDetallado.citas.filter(c => 
        c.estado?.toLowerCase() === 'cancelada' || c.estado?.toLowerCase() === 'cancelado'
      ).length,
    };
  };



  const estadisticas = contarCitasPorEstado();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons 
                name="account" 
                size={48} 
                color="#2196F3" 
              />
            </View>
          </View>
          
          <Text style={styles.patientName}>
            {pacienteDetallado.nombre} {pacienteDetallado.apellido}
          </Text>
          
          <View style={styles.patientMetaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                Doc. {pacienteDetallado.documento || pacienteDetallado.numeroDocumento || 'No disponible'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {calcularEdad(pacienteDetallado.fechaNacimiento)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion Personal</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Nombre Completo</Text>
              </View>
              <Text style={styles.infoValue}>
                {pacienteDetallado.nombre} {pacienteDetallado.apellido}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="document-text-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Documento</Text>
              </View>
              <Text style={styles.infoValue}>
                {pacienteDetallado.documento || pacienteDetallado.numeroDocumento || 'No disponible'}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="male-female-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Genero</Text>
              </View>
              <Text style={styles.infoValue}>
                {pacienteDetallado.genero || 'No especificado'}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Fecha de Nacimiento</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatDate(pacienteDetallado.fechaNacimiento)}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="fitness-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Edad</Text>
              </View>
              <Text style={styles.infoValue}>
                {calcularEdad(pacienteDetallado.fechaNacimiento)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion de Contacto</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="call-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Telefono</Text>
              </View>
              <Text style={styles.infoValue}>
                {pacienteDetallado.telefono || 'No disponible'}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="mail-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Email</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {pacienteDetallado.email || 'No disponible'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="medical" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion Medica</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <MaterialCommunityIcons name="shield-plus-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>EPS</Text>
              </View>
              <Text style={styles.infoValue}>
                {pacienteDetallado.eps || 'No disponible'}
              </Text>
            </View>
          </View>
        </View>

        {pacienteDetallado.citas && pacienteDetallado.citas.length > 0 && (
          <View style={styles.historialCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={20} color="#2196F3" />
              <Text style={styles.cardHeaderTitle}>Historial Reciente</Text>
            </View>
            
            {pacienteDetallado.citas.slice(0, 5).map((cita, index) => {
              const colorEstado = getEstadoColor(cita.estado);
              return (
                <View key={cita.id || index} style={styles.historialItem}>
                  <View style={styles.historialLeft}>
                    <View style={[styles.historialIcono, { backgroundColor: colorEstado.bg }]}>
                      <Ionicons 
                        name={colorEstado.icon} 
                        size={16} 
                        color={colorEstado.text} 
                      />
                    </View>
                    <View style={styles.historialInfo}>
                      <Text style={styles.historialFecha}>
                        {formatDate(cita.fechaCita)}
                      </Text>
                      <Text style={styles.historialHora}>
                        {formatTime(cita.horaCita)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.historialEstado, { backgroundColor: colorEstado.bg }]}>
                    <Text style={[styles.historialEstadoText, { color: colorEstado.text }]}>
                      {cita.estado}
                    </Text>
                  </View>
                </View>
              );
            })}
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
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
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
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  patientMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#DDD',
    marginHorizontal: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  proximaCitaCard: {
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
  proximaCitaContent: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  proximaCitaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proximaCitaText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  estadoBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  estadoTextLarge: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 1,
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
  historialCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 1,
  },
  historialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historialIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historialInfo: {
    flex: 1,
  },
  historialFecha: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  historialHora: {
    fontSize: 12,
    color: '#666',
  },
  historialEstado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historialEstadoText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bottomSpacer: {
    height: 20,
  },
});