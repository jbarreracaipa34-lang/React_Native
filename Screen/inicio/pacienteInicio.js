import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, RefreshControl} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import NavigationService from '../../Src/Services/NavegationService';


export default function PacienteInicio({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [proximaCita, setProximaCita] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsuarioData();
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

  const handleLogout = () => {
    Alert.alert('Cerrar Sesion', 'Seguro que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesion',
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
    if (diferenciaDias > 1) return `En ${diferenciaDias} dias`;
    return '';
  };

  const navigateToPerfil = () => {
    navigation.getParent()?.navigate('Perfil');
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
            <Text style={styles.nameText}>{usuario?.name || 'Paciente'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>¿Que deseas hacer?</Text>

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
              <Text style={styles.actionTitle}>Ver Medicos</Text>
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

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('PacienteInicio')}
        >
          <MaterialCommunityIcons name="home" size={24} color="#8E24AA" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('CitasStack', { screen: 'AgendarCita' })}
        >
          <MaterialCommunityIcons name="calendar-blank" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Citas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('MedicosStack', { screen: 'VerMedicos' })}
        >
          <MaterialCommunityIcons name="stethoscope" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Médicos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('horariosDisponiblesStack', { screen: 'VerHorarios' })}
        >
          <MaterialCommunityIcons name="clock-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Horarios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={navigateToPerfil}
        >
          <Ionicons name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
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
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#8E24AA',
    fontWeight: '600',
  },
});