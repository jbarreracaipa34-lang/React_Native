import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import NavigationService from '../../Src/Services/NavegationService';

export default function Perfil({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [medicoData, setMedicoData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      
      if (authData.isAuthenticated) {
        setUser(authData.user);
        const role = authData.user.role || authData.user.tipo_usuario;
        setUserRole(role);
        

        if (role?.toLowerCase() === 'medico' || role?.toLowerCase() === 'doctor') {
          await loadMedicoData(authData.user.id);
        } else {
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setLoading(false);
    }
  };

  const loadMedicoData = async (userId) => {
    try {
      
      const medicosResult = await AuthService.getMedicosConEspecialidades();
      
      if (medicosResult && medicosResult.data && Array.isArray(medicosResult.data)) {
        
        const currentMedico = medicosResult.data.find(
          medico => medico.email?.toLowerCase() === user?.email?.toLowerCase()
        );
        
        if (currentMedico) {
          setMedicoData(currentMedico);
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del médico:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            NavigationService.navigate('InicioStack', { screen: 'Inicio' });
          },
        },
      ]
    );
  };

  const getHeaderColor = () => {
    switch (userRole?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return '#1E88E5';
      case 'medico':
      case 'doctor':
        return '#4CAF50';
      case 'paciente':
        return '#8E24AA';
      default:
        return '#607D8B';
    }
  };

  const getRoleIcon = () => {
    switch (userRole?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return '👨‍💼';
      case 'medico':
      case 'doctor':
        return '👨‍⚕️';
      case 'paciente':
        return '👤';
      default:
        return '👤';
    }
  };

  const getRoleText = () => {
    switch (userRole?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'Administrador';
      case 'medico':
      case 'doctor':
        return 'Médico';
      case 'paciente':
        return 'Paciente';
      default:
        return 'Usuario';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Avatar y Nombre */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarLarge, { backgroundColor: getHeaderColor() + '20' }]}>
            <Text style={styles.avatarLargeText}>{getRoleIcon()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getHeaderColor() }]}>
            <Text style={styles.roleText}>{getRoleText()}</Text>
          </View>
        </View>

        {/* Información Personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person-outline" size={20} color="#1E88E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre Completo</Text>
                <Text style={styles.infoValue}>{user?.name || 'No disponible'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#1E88E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo Electrónico</Text>
                <Text style={styles.infoValue}>{user?.email || 'No disponible'}</Text>
              </View>
            </View>

            {(user?.telefono || medicoData?.telefono) && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="call-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>
                      {medicoData?.telefono || user?.telefono}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {user?.direccion && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Dirección</Text>
                    <Text style={styles.infoValue}>{user.direccion}</Text>
                  </View>
                </View>
              </>
            )}

            {user?.fecha_nacimiento && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
                    <Text style={styles.infoValue}>{user.fecha_nacimiento}</Text>
                  </View>
                </View>
              </>
            )}

            {user?.cedula && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="card-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Cédula</Text>
                    <Text style={styles.infoValue}>{user.cedula}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Información Específica por Rol - MÉDICO */}
        {(userRole?.toLowerCase() === 'medico' || userRole?.toLowerCase() === 'doctor') && medicoData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Profesional</Text>
            <View style={styles.infoCard}>
              {medicoData?.especialidad_nombre && (
                <>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <MaterialCommunityIcons name="medical-bag" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Especialidad</Text>
                      <Text style={styles.infoValue}>{medicoData.especialidad_nombre}</Text>
                    </View>
                  </View>
                </>
              )}
              
              {medicoData?.numeroLicencia && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <MaterialCommunityIcons name="certificate" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Licencia Médica</Text>
                      <Text style={styles.infoValue}>{medicoData.numeroLicencia}</Text>
                    </View>
                  </View>
                </>
              )}
              
              {/* Horarios disponibles para médicos */}
              {medicoData?.horarios_disponibles && medicoData.horarios_disponibles.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="time-outline" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Horarios Disponibles</Text>
                      <View style={styles.horariosContainer}>
                        {medicoData.horarios_disponibles.map((horario, index) => (
                          <View key={index} style={styles.horarioChip}>
                            <Text style={styles.horarioText}>
                              {horario.diaSemana}: {horario.horaInicio} - {horario.horaFin}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <View style={styles.actionLeft}>
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              <Text style={[styles.actionText, styles.logoutText]}>Cerrar Sesión</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 48,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  horariosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  horarioChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  horarioText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutText: {
    color: '#EF4444',
  },
});