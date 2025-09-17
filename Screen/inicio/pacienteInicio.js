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
    loadPacienteData();
  }, []);

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
        setEspecialidades(especialidadesResult.data);
      }

      const medicosResult = await AuthService.getMedicos();
      if (medicosResult.success) {
        setMedicos(medicosResult.data);
      }

      const citasResult = await AuthService.getCitasConMedicos();
      if (citasResult.success && citasResult.data.length > 0 && user) {
        const misCitas = citasResult.data.filter(
          (cita) =>
            cita.paciente_id === user.id ||
            cita.paciente_nombre?.toLowerCase().includes(user.name?.toLowerCase())
        );
        if (misCitas.length > 0) {
          setProximaCita(misCitas[0]);
        } else {
          setProximaCita(null);
        }
      } else {
        setProximaCita(null);
      }
    } catch (error) {
      console.error('Error loading paciente data:', error);
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
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.proximaCitaContainer}>
          <Text style={styles.sectionTitle}>Mi Próxima Cita</Text>

          {proximaCita ? (
            <View style={styles.citaCard}>
              <View style={styles.citaHeader}>
                <Ionicons name="calendar-outline" size={20} color="#8E24AA" />
                <Text style={styles.citaTitulo}>Cita Programada</Text>
              </View>

              <View style={styles.citaContent}>
                <View style={styles.citaInfo}>
                  <MaterialCommunityIcons name="doctor" size={18} color="#4B5563" />
                  <Text style={styles.citaText}>Dr. {proximaCita.medico_nombre || 'No asignado'}</Text>
                </View>

                <View style={styles.citaInfo}>
                  <Ionicons name="medical-outline" size={18} color="#4B5563" />
                  <Text style={styles.citaText}>{proximaCita.especialidad || 'Consulta general'}</Text>
                </View>

                <View style={styles.citaInfo}>
                  <Ionicons name="calendar-outline" size={18} color="#4B5563" />
                  <Text style={styles.citaText}>{formatDate(proximaCita.fecha)}</Text>
                </View>

                <View style={styles.citaInfo}>
                  <Ionicons name="time-outline" size={18} color="#4B5563" />
                  <Text style={styles.citaText}>{formatTime(proximaCita.hora_inicio)}</Text>
                </View>
              </View>

              <View style={[styles.citaStatus, { backgroundColor: '#F3E5F5' }]}>
                <Text style={[styles.citaStatusText, { color: '#8E24AA' }]}>
                  {proximaCita.estado || 'Confirmada'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noCitaCard}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noCitaTitle}>No tienes citas programadas</Text>
              <Text style={styles.noCitaText}>¡Programa tu próxima consulta médica!</Text>
            </View>
          )}
        </View>

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
  },
  citaTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
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