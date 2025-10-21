import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AuthService from '../../Src/Services/AuthService';

export default function ListarAdmins({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [adminExpandido, setAdminExpandido] = useState(null);

  useEffect(() => {
    loadUsuarioData();
  }, []);

  useEffect(() => {
    if (usuario) {
      loadAdmins();
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      if (usuario) {
        setTimeout(() => {
          loadAdmins();
        }, 100);
      }
    }, [usuario])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (usuario) {
        setTimeout(() => {
          loadAdmins();
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

  const loadAdmins = async () => {
    try {
      const adminsResult = await AuthService.getAdmins();

      if (adminsResult.success && adminsResult.data && Array.isArray(adminsResult.data)) {
        setAdmins(adminsResult.data);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      setAdmins([]);
      Alert.alert('Error', 'No se pudieron cargar los administradores: ' + error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdmins();
    setRefreshing(false);
  };

  const handleAdminPress = (admin) => {
    if (adminExpandido === admin.id) {
      setAdminExpandido(null);
    } else {
      setAdminExpandido(admin.id);
    }
  };

  const handleEditarAdmin = (admin) => {
    if (usuario?.role !== 'admin') {
      Alert.alert('Acceso denegado', 'Solo los administradores pueden editar otros administradores');
      return;
    }

    navigation.navigate('Crear_EditarAdmin', { 
      admin: admin,
      onGoBack: () => {
        setTimeout(() => {
          loadAdmins();
        }, 200);
      }
    });
  };

  const handleEliminarAdmin = (admin) => {
    if (usuario?.role !== 'admin') {
      Alert.alert('Acceso denegado', 'Solo los administradores pueden eliminar otros administradores');
      return;
    }

    navigation.navigate('EliminarAdmin', { 
      admin: admin,
      onGoBack: () => {
        setTimeout(() => {
          loadAdmins();
        }, 200);
      }
    });
  };

  const renderAccionesAdmin = (admin) => {
    if (adminExpandido !== admin.id) return null;

    return (
      <View style={styles.accionesContainer}>
        <View style={styles.accionesAdmin}>
          <TouchableOpacity
            style={[styles.botonAccion, { borderColor: '#1E88E5' }]}
            onPress={() => navigation.navigate('DetalleAdmin', { 
              admin: admin,
              onGoBack: () => {
                setTimeout(() => {
                  loadAdmins();
                }, 200);
              }
            })}
          >
            <Ionicons name="eye-outline" size={18} color="#1E88E5" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botonAccion, { borderColor: '#4CAF50' }]}
            onPress={() => handleEditarAdmin(admin)}
          >
            <Ionicons name="create-outline" size={18} color="#4CAF50" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botonAccion, { borderColor: '#F44336' }]}
            onPress={() => handleEliminarAdmin(admin)}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAdminItem = (admin, index) => {
    const isExpanded = adminExpandido === admin.id;

    return (
      <View key={admin.id || index} style={styles.adminContainer}>
        <TouchableOpacity
          style={[styles.adminItem, isExpanded && styles.adminItemExpanded]}
          onPress={() => handleAdminPress(admin)}
          activeOpacity={0.7}
        >
          <View style={styles.adminHeader}>
            <View style={styles.adminInfo}>
              <View style={styles.adminDetails}>
                <Text style={styles.adminName}>
                  {admin.nombre || ''} {admin.apellido || ''}
                </Text>
                <Text style={styles.adminRole}>
                  Administrador
                </Text>
                <Text style={styles.adminId}>
                  ID: {admin.id || 'No disponible'}
                </Text>
              </View>

              <View style={styles.contactContainer}>
                <View style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={14} color="#666" />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {admin.email || 'No disponible'}
                  </Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.contactText}>
                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {renderAccionesAdmin(admin)}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-group" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No hay administradores</Text>
      <Text style={styles.emptyText}>
        No hay administradores registrados en el sistema
      </Text>
      {usuario?.role === 'admin' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Crear_EditarAdmin', {
            onGoBack: () => {
              setTimeout(() => {
                loadAdmins();
              }, 200);
            }
          })}
        >
          <Text style={styles.emptyButtonText}>Agregar primer administrador</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="medical" size={24} color="#2196F3" />
            </View>
            <View>
              <Text style={styles.appName}>Citas Medicas</Text>
              <Text style={styles.appSubtitle}>Tu salud en tus manos</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>Administradores</Text>
          {usuario?.role === 'admin' && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => navigation.navigate('Crear_EditarAdmin', {
                onGoBack: () => {
                  setTimeout(() => {
                    loadAdmins();
                  }, 200);
                }
              })}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newButtonText}>Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{admins.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {admins.filter(a => a.email && a.email !== 'No disponible').length}
          </Text>
          <Text style={styles.statLabel}>Con Email</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {admins.filter(a => a.created_at).length}
          </Text>
          <Text style={styles.statLabel}>Registrados</Text>
        </View>
      </View>

      <ScrollView
        style={styles.adminsList}
        contentContainerStyle={styles.adminsContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {admins.length > 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Lista de Administradores</Text>
            </View>
            {admins.map((admin, index) => renderAdminItem(admin, index))}
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
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  adminsList: {
    flex: 1,
  },
  adminsContent: {
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
  adminContainer: {
    marginHorizontal: 20,
    marginBottom: 1,
  },
  adminItem: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  adminItemExpanded: {
    borderLeftColor: '#2196F3',
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  adminRole: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 2,
  },
  adminId: {
    fontSize: 12,
    color: '#666',
  },
  contactContainer: {
    alignItems: 'flex-end',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    maxWidth: 150,
  },
  accionesContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  accionesAdmin: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botonAccion: {
    width: 32,
    height: 32,
    borderRadius: 16,
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

