import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import NavigationService from '../../Src/Services/NavegationService';

export default function AdminInicio({ navigation }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const init = async () => {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
      } else {
        console.warn('Usuario no autenticado');
        Alert.alert('Sesion invalida', 'Por favor inicia sesion nuevamente');
      }
    };

    init();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesion', '¿Estas seguro que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesion',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            NavigationService.navigate('Inicio');
          },
        },
      ]
    );
  };

  const navigateToRegistrarAdmin = () => {
    NavigationService.navigate('AdminStack');
  };

  const navigateToPerfil = () => {
    NavigationService.navigate('Perfil');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👨‍💼</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>¡Hola Admin!</Text>
            <Text style={styles.nameText}>
              {usuario?.nombre && usuario?.apellido 
                ? `${usuario.nombre} ${usuario.apellido}` 
                : usuario?.name || 'Administrador'
              }
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Gestion Administrativa</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('CitasStack', { screen: 'ListarCitas' })}
            >
              <MaterialCommunityIcons name="calendar-plus" size={40} color="#1E88E5" />
              <Text style={styles.actionTitle}>Programar Citas</Text>
              <Text style={styles.actionDescription}>Crear nuevas citas medicas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('PacientesStack', { screen: 'ListarPacientes' })}
            >
              <MaterialCommunityIcons name="account-plus" size={40} color="#4CAF50" />
              <Text style={styles.actionTitle}>Gestionar Pacientes</Text>
              <Text style={styles.actionDescription}>Crear y editar pacientes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('MedicosStack', { screen: 'ListarMedicos' })}
            >
              <MaterialCommunityIcons name="doctor" size={40} color="#8E24AA" />
              <Text style={styles.actionTitle}>Gestionar Medicos</Text>
              <Text style={styles.actionDescription}>Administrar medicos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('EspecialidadesStack', { screen: 'ListarEspecialidades' })}
            >
              <MaterialCommunityIcons name="medical-bag" size={40} color="#dac407ff" />
              <Text style={styles.actionTitle}>Especialidades</Text>
              <Text style={styles.actionDescription}>Gestionar especialidades</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={navigateToRegistrarAdmin}
            >
              <MaterialCommunityIcons name="account-plus" size={40} color="#FF5722" />
          <Text style={styles.actionTitle}>Gestionar Administradores</Text>
          <Text style={styles.actionDescription}>Crear y administrar otros admins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('horariosDisponiblesStack', { screen: 'ListarhorariosDisponibles' })}
            >
              <MaterialCommunityIcons name="clock-outline" size={40} color="#FF5722" />
              <Text style={styles.actionTitle}>Horarios</Text>
              <Text style={styles.actionDescription}>Configurar horarios</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavScroll}
        >
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => NavigationService.navigate('AdminInicio')}
          >
            <MaterialCommunityIcons name="pulse" size={22} color="#1E88E5" />
            <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => NavigationService.navigate('CitasStack', { screen: 'ListarCitas' })}
          >
            <MaterialCommunityIcons name="calendar-blank" size={22} color="#6B7280" />
            <Text style={styles.navLabel}>Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => NavigationService.navigate('PacientesStack', { screen: 'ListarPacientes' })}
          >
            <MaterialCommunityIcons name="account-group" size={22} color="#6B7280" />
            <Text style={styles.navLabel}>Pacientes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => NavigationService.navigate('MedicosStack', { screen: 'ListarMedicos' })}
          >
            <MaterialCommunityIcons name="stethoscope" size={22} color="#6B7280" />
            <Text style={styles.navLabel}>Médicos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => NavigationService.navigate('EspecialidadesStack', { screen: 'ListarEspecialidades' })}
          >
            <MaterialCommunityIcons name="medical-bag" size={22} color="#6B7280" />
            <Text style={styles.navLabel}>Especialidades</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => NavigationService.navigate('horariosDisponiblesStack', { screen: 'ListarhorariosDisponibles' })}
          >
            <MaterialCommunityIcons name="clock-outline" size={22} color="#6B7280" />
            <Text style={styles.navLabel}>Horarios</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={navigateToPerfil}
          >
            <Ionicons name="person-outline" size={22} color="#6B7280" />
            <Text style={styles.navLabel}>Perfil</Text>
          </TouchableOpacity>
        </ScrollView>
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
    backgroundColor: '#1E88E5',
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
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomNavScroll: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  navLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#1E88E5',
    fontWeight: '600',
  },
});