import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, RefreshControl} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import NavigationService from '../../Src/Services/NavegationService';


export default function PacienteInicio({ navigation }) {
  const [user, setUser] = useState(null);
  const [proximaCita, setProximaCita] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadPacienteData();
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

  const loadPacienteData = async () => {
    try {
      const especialidadesResult = await AuthService.getEspecialidades();
      if (especialidadesResult.success) {
      }

      const medicosResult = await AuthService.getMedicos();
      if (medicosResult.success) {
      }

      const citasResult = await AuthService.getCitasConMedicos();
      
      if (citasResult && citasResult.data && Array.isArray(citasResult.data) && citasResult.data.length > 0 && user) {
        
        const citasDelUsuario = citasResult.data;
        
        if (citasDelUsuario.length > 0) {
          const ahora = new Date();
          
          const citasProximas = citasDelUsuario.filter(cita => {
            if (!cita.fechaCita) return false;
            const fechaCitaCompleta = new Date(`${cita.fechaCita}T${cita.horaCita || '00:00:00'}`);
            const diferenciaDias = Math.ceil((fechaCitaCompleta - ahora) / (1000 * 60 * 60 * 24));
            
            return diferenciaDias >= 0 && diferenciaDias <= 7;
          });


          if (citasProximas.length > 0) {
            citasProximas.sort((a, b) => {
              const fechaA = new Date(`${a.fechaCita}T${a.horaCita || '00:00:00'}`);
              const fechaB = new Date(`${b.fechaCita}T${b.horaCita || '00:00:00'}`);
              return fechaA - fechaB;
            });
            setProximaCita(citasProximas[0]);
          } else {
            setProximaCita(null);
          }
        } else {
          setProximaCita(null);
        }
      } else {
        setProximaCita(null);
      }
    } catch (error) {
      setProximaCita(null);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', 'Seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Inicio' }],
            });
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPacienteData();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
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
      default:
        return { bg: '#F3E5F5', text: '#8E24AA' };
    }
  };

  const getDiasRestantes = (fechaCita, horaCita) => {
    if (!fechaCita) return '';
    
    const ahora = new Date();
    const fechaCitaCompleta = new Date(`${fechaCita}T${horaCita || '00:00:00'}`);
    const diferenciaDias = Math.ceil((fechaCitaCompleta - ahora) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias === 0) return 'Hoy';
    if (diferenciaDias === 1) return 'Mañana';
    if (diferenciaDias > 1) return `En ${diferenciaDias} días`;
    return '';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>¡Hola!</Text>
            <Text style={styles.nameText}>{user?.name || 'Paciente'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>¿Qué deseas hacer?</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('CitasStack', { screen: 'AgendarCita' })}
            >
              <MaterialCommunityIcons name="calendar-plus" size={40} color="#1E88E5" />
              <Text style={styles.actionTitle}>Agendar Cita</Text>
              <Text style={styles.actionDescription}>Programar nueva consulta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('MedicosStack', { screen: 'VerMedicos' })}
            >
              <MaterialCommunityIcons name="doctor" size={40} color="#4CAF50" />
              <Text style={styles.actionTitle}>Ver Médicos</Text>
              <Text style={styles.actionDescription}>Explorar especialistas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('horariosDisponiblesStack', { screen: 'VerHorarios' })}
            >
              <MaterialCommunityIcons name="clock-outline" size={40} color="#8E24AA" />
              <Text style={styles.actionTitle}>Horarios</Text>
              <Text style={styles.actionDescription}>Ver y gestionar disponibilidad</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#8E24AA',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  proximaCitaContainer: {
    marginBottom: 30,
  },
  citaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  citaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  citaTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  diasRestantesContainer: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  diasRestantesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  citaContent: {
    marginBottom: 16,
  },
  citaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  citaText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  citaStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  citaStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noCitaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  noCitaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  noCitaText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});