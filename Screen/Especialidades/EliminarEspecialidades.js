import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function EliminarEspecialidades({ route, navigation }) {
  const { especialidad, onGoBack } = route.params;
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cargando, setCargando] = useState(false);
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
    const especialidadId = especialidad?.id;
        
    if (!especialidadId) {
      Alert.alert('Error', 'No se ha proporcionado un ID de especialidad válido');
      return;
    }

    if (usuario?.role !== 'admin') {
      Alert.alert('Error', 'Solo los administradores pueden eliminar especialidades');
      return;
    }

    setCargando(true);
    try {
      const response = await AuthService.eliminarEspecialidad(especialidadId);
      
      setMostrarConfirmacion(false);
      
      Alert.alert(
        'Éxito',
        'La especialidad ha sido eliminada correctamente.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              if (onGoBack) {
                onGoBack();
              }
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al eliminar la especialidad:', error);
      
      let mensaje = 'No se pudo eliminar la especialidad. Inténtelo de nuevo.';
      
      if (error.response) {
        if (error.response.status === 404) {
          mensaje = 'La especialidad ya no existe.';
        } else if (error.response.status === 403) {
          mensaje = 'No tienes permisos para eliminar esta especialidad.';
        } else if (error.response.status === 409) {
          mensaje = 'No se puede eliminar la especialidad porque tiene médicos asociados.';
        } else if (error.response.data?.message) {
          mensaje = error.response.data.message;
        }
      } else if (error.message) {
        mensaje = error.message;
      }

      Alert.alert('Error', mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {!mostrarConfirmacion ? (
          <View style={styles.infoContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="medical" size={48} color="#2196F3" />
              </View>
            </View>
            
            <Text style={styles.title}>Detalles de la Especialidad</Text>
            
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                Al eliminar esta especialidad, los médicos asociados quedarán sin especialidad asignada
              </Text>
            </View>

            <View style={styles.especialidadInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="medical-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>
                    {especialidad?.nombre || 'No disponible'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Descripción</Text>
                  <Text style={styles.infoValue}>
                    {especialidad?.descripcion || 'Sin descripción'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="key-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>ID</Text>
                  <Text style={styles.infoValue}>
                    {especialidad?.id || 'No disponible'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => setMostrarConfirmacion(true)}
              disabled={cargando}
            >
              <Ionicons name="trash-outline" size={20} color="#FFF" />
              <Text style={styles.textoBoton}>Eliminar Especialidad</Text>
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
            
            <Text style={styles.confirmTitle}>¿Eliminar Especialidad?</Text>
            
            <View style={styles.deleteInfo}>
              <Text style={styles.deleteInfoTitle}>Se eliminará:</Text>
              <View style={styles.deleteItem}>
                <Ionicons name="medical" size={18} color="#F44336" />
                <Text style={styles.deleteItemText}>
                  {especialidad?.nombre}
                </Text>
              </View>
            </View>

            <Text style={styles.confirmWarning}>
              Esta acción no se puede deshacer
            </Text>

            {cargando ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C62828" />
                <Text style={styles.loadingText}>Eliminando especialidad...</Text>
              </View>
            ) : (
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
            )}
          </View>
        )}
      </View>
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
    justifyContent: 'center',
    padding: 20,
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
    backgroundColor: '#E3F2FD',
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
  especialidadInfo: {
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
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteInfo: {
    width: '100%',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  deleteInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  confirmWarning: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
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