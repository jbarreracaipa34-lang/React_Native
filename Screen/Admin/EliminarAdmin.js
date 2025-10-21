import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function EliminarAdmin({ route, navigation }) {
  const { admin } = route.params;
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [usuario, setUsuario] = useState(null);

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

  const handleConfirmarEliminar = async () => {
    if (!admin?.id) {
      Alert.alert('Error', 'No se ha proporcionado un ID de administrador válido');
      return;
    }

    if (usuario?.role !== 'admin') {
      Alert.alert('Error', 'Solo los administradores pueden eliminar otros administradores');
      return;
    }

    if (usuario?.id === admin.id) {
      Alert.alert('Error', 'No puedes eliminar tu propia cuenta');
      return;
    }

    try {
      const response = await AuthService.eliminarAdmin(admin.id);
      
      if (response.success) {
        setMostrarConfirmacion(false);
        
        Alert.alert(
          'Éxito',
          'El administrador ha sido eliminado correctamente.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ListarAdmins' }]
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo eliminar el administrador');
      }
    } catch (error) {
      console.error('Error al eliminar administrador:', error);
      
      let mensaje = 'No se pudo eliminar el administrador. Inténtelo de nuevo.';
      
      if (error.response) {
        if (error.response.status === 404) {
          mensaje = 'El administrador ya no existe.';
        } else if (error.response.status === 403) {
          mensaje = 'No tienes permisos para eliminar este administrador.';
        } else if (error.response.data?.message) {
          mensaje = error.response.data.message;
        }
      } else if (error.message) {
        mensaje = error.message;
      }

      Alert.alert('Error', mensaje);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Eliminar Administrador</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!mostrarConfirmacion ? (
          <View style={styles.infoContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="account-cog" size={48} color="#4CAF50" />
              </View>
            </View>
            
            <Text style={styles.title}>Detalles del Administrador</Text>
            
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                Al eliminar este administrador también se eliminará su usuario asociado del sistema
              </Text>
            </View>

            <View style={styles.adminInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Nombre Completo</Text>
                  <Text style={styles.infoValue}>
                    {admin?.nombre || ''} {admin?.apellido || ''}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Rol</Text>
                  <Text style={styles.infoValue}>
                    Administrador
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>
                    {admin?.email || 'No disponible'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Fecha de Registro</Text>
                  <Text style={styles.infoValue}>
                    {admin?.created_at ? new Date(admin.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.citasWarning}>
              <Ionicons name="warning" size={20} color="#F44336" />
              <Text style={styles.citasWarningText}>
                Esta acción eliminará permanentemente el administrador y todos sus datos asociados.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => setMostrarConfirmacion(true)}
              disabled={false}
            >
              <Ionicons name="trash-outline" size={20} color="#FFF" />
              <Text style={styles.textoBoton}>Eliminar Administrador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.textoCancelar}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.confirmacionContainer}>
            <View style={styles.iconWarning}>
              <Ionicons name="warning" size={64} color="#EF6C00" />
            </View>
            
            <Text style={styles.confirmTitle}>¿Eliminar Administrador?</Text>
            <Text style={styles.confirmSubtitle}>
              Esta acción eliminará:
            </Text>

            <View style={styles.deleteList}>
              <View style={styles.deleteItem}>
                <Ionicons name="checkmark-circle" size={20} color="#F44336" />
                <Text style={styles.deleteItemText}>
                  El administrador: {admin?.nombre} {admin?.apellido}
                </Text>
              </View>
              <View style={styles.deleteItem}>
                <Ionicons name="checkmark-circle" size={20} color="#F44336" />
                <Text style={styles.deleteItemText}>
                  Su usuario asociado en el sistema
                </Text>
              </View>
              <View style={styles.deleteItem}>
                <Ionicons name="checkmark-circle" size={20} color="#F44336" />
                <Text style={styles.deleteItemText}>
                  Su acceso a la aplicación
                </Text>
              </View>
              <View style={styles.deleteItem}>
                <Ionicons name="checkmark-circle" size={20} color="#F44336" />
                <Text style={styles.deleteItemText}>
                  Todos sus permisos administrativos
                </Text>
              </View>
            </View>

            <Text style={styles.confirmWarning}>
              Esta acción no se puede deshacer
            </Text>
              <View style={styles.botonesConfirm}>
                <TouchableOpacity
                  style={styles.botonNo}
                  onPress={() => setMostrarConfirmacion(false)}
                >
                  <Text style={styles.textoNo}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.botonSi}
                  onPress={handleConfirmarEliminar}
                >
                  <Ionicons name="trash" size={18} color="#FFF" />
                  <Text style={styles.textoSi}>Sí, eliminar</Text>
                </TouchableOpacity>
              </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  infoContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  adminInfo: {
    width: '100%',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  citasWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  citasWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
    lineHeight: 18,
  },
  botonEliminar: {
    width: '100%',
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  textoBoton: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  botonCancelar: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  textoCancelar: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmacionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  iconWarning: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteList: {
    width: '100%',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  deleteItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  confirmWarning: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  botonesConfirm: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  botonNo: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  botonSi: {
    flex: 1,
    backgroundColor: '#C62828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  textoNo: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  textoSi: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});