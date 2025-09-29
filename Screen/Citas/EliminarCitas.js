import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function EliminarCitas({ route, navigation }) {
  const { cita, onGoBack } = route.params;
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
  }, []);

  const handleConfirmarEliminar = async () => {
    const citaId = cita?.id;
        
    if (!citaId) {
      Alert.alert('Error', 'No se ha proporcionado un ID de cita válido');
      return;
    }

    setCargando(true);
    try {
      const response = await AuthService.eliminarCita(citaId);
      
      setMostrarConfirmacion(false);
      
      Alert.alert(
        'Éxito',
        'La cita ha sido eliminada correctamente.',
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
      console.error('Error al eliminar la cita:', error);
      
      let mensaje = 'No se pudo eliminar la cita. Inténtelo de nuevo.';
      
      if (error.response) {
        if (error.response.status === 404) {
          mensaje = 'La cita ya no existe.';
        } else if (error.response.status === 403) {
          mensaje = 'No tienes permisos para eliminar esta cita.';
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {!mostrarConfirmacion ? (
          <View style={styles.infoContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={48} color="#2196F3" />
              </View>
            </View>
            
            <Text style={styles.title}>Detalles de la Cita</Text>
            
            <View style={styles.citaInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Paciente</Text>
                  <Text style={styles.infoValue}>
                    {cita?.paciente_nombre || 'No disponible'} {cita?.paciente_apellido || ''}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="medical-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Médico</Text>
                  <Text style={styles.infoValue}>
                    Dr. {cita?.medico_nombre || 'No disponible'} {cita?.medico_apellido || ''}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Fecha</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(cita?.fechaCita)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Hora</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(cita?.horaCita)}
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
              <Text style={styles.textoBoton}>Eliminar Cita</Text>
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
            
            <Text style={styles.confirmTitle}>¿Eliminar Cita?</Text>
            <Text style={styles.confirmSubtitle}>
              Esta acción no se puede deshacer
            </Text>

            {cargando ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C62828" />
                <Text style={styles.loadingText}>Eliminando cita...</Text>
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
                  <Text style={styles.textoSi}>Eliminar</Text>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  citaInfo: {
    width: '100%',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
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