import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import { useNotifications } from '../../Src/Hooks/useNotifications';

export default function EliminarCitas({ route, navigation }) {
  const { cita, onGoBack } = route.params;
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [accionSeleccionada, setAccionSeleccionada] = useState(null);

  const { notifyAppointmentCancelled, permissionsGranted } = useNotifications();

  useEffect(() => {
  }, []);

  const handleConfirmarAccion = async () => {
    const citaId = cita?.id;
        
    if (!citaId) {
      Alert.alert('Error', 'No se ha proporcionado un ID de cita válido');
      return;
    }

    try {
      let response;
      let mensaje;
      
      if (accionSeleccionada === 'cancelar') {
        response = await AuthService.cancelarCita(citaId);
        mensaje = 'La cita ha sido cancelada correctamente.';
      } else {
        response = await AuthService.eliminarCita(citaId);
        mensaje = 'La cita ha sido cancelada y eliminada correctamente.';
      }
      
      if (!response.success) {
        Alert.alert('Error', response.message || 'No se pudo completar la acción');
        return;
      }
      
      if (permissionsGranted && response && response.success) {
        const notificationData = {
          id: cita.id,
          fechaCita: cita.fechaCita,
          horaCita: cita.horaCita,
          medico_nombre: cita.medico_nombre,
          medico_apellido: cita.medico_apellido,
          paciente_nombre: cita.paciente_nombre,
          paciente_apellido: cita.paciente_apellido,
        };
        
        await notifyAppointmentCancelled(notificationData);
      }
      
      setMostrarConfirmacion(false);
      
      Alert.alert(
        'Éxito',
        mensaje,
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
      console.error('Error al procesar la cita:', error);
      
      let mensaje = 'No se pudo completar la acción. Inténtelo de nuevo.';
      
      if (error.response) {
        if (error.response.status === 404) {
          mensaje = 'La cita ya no existe.';
        } else if (error.response.status === 403) {
          mensaje = 'No tienes permisos para realizar esta acción.';
        } else if (error.response.data?.message) {
          mensaje = error.response.data.message;
        }
      } else if (error.message) {
        mensaje = error.message;
      }

      Alert.alert('Error', mensaje);
    } finally {
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    
    let date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString + 'T00:00:00');
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
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
        {!mostrarOpciones && !mostrarConfirmacion ? (
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
              onPress={() => setMostrarOpciones(true)}
              disabled={false}
            >
              <Ionicons name="trash-outline" size={20} color="#FFF" />
              <Text style={styles.textoBoton}>Cancelar/Eliminar Cita</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.textoCancelar}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : !mostrarConfirmacion ? (
          <View style={styles.opcionesContainer}>
            <View style={styles.iconInfo}>
              <Ionicons name="information-circle" size={64} color="#2196F3" />
            </View>
            
            <Text style={styles.opcionesTitle}>¿Qué desea hacer?</Text>
            <Text style={styles.opcionesSubtitle}>
              Seleccione una opción para la cita
            </Text>

            <TouchableOpacity
              style={styles.opcionButton}
              onPress={() => {
                setAccionSeleccionada('cancelar');
                setMostrarConfirmacion(true);
              }}
            >
              <Ionicons name="close-circle-outline" size={24} color="#F57C00" />
              <View style={styles.opcionTextContainer}>
                <Text style={styles.opcionTitle}>Solo Cancelar</Text>
                <Text style={styles.opcionDescription}>
                  La cita se marcará como cancelada pero permanecerá en el historial
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.opcionButton, styles.opcionButtonEliminar]}
              onPress={() => {
                setAccionSeleccionada('eliminar');
                setMostrarConfirmacion(true);
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#D32F2F" />
              <View style={styles.opcionTextContainer}>
                <Text style={styles.opcionTitle}>Cancelar y Eliminar</Text>
                <Text style={styles.opcionDescription}>
                  La cita se cancelará y será eliminada del historial
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() => setMostrarOpciones(false)}
            >
              <Text style={styles.textoCancelar}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.confirmacionContainer}>
            <View style={styles.iconWarning}>
              <Ionicons name="warning" size={64} color="#EF6C00" />
            </View>
            
            <Text style={styles.confirmTitle}>
              {accionSeleccionada === 'cancelar' ? '¿Cancelar Cita?' : '¿Eliminar Cita?'}
            </Text>
            <Text style={styles.confirmSubtitle}>
              {accionSeleccionada === 'cancelar' 
                ? 'La cita será marcada como cancelada' 
                : 'Esta acción no se puede deshacer'}
            </Text>

            <View style={styles.botonesConfirm}>
                <TouchableOpacity
                  style={styles.botonNo}
                  onPress={() => {
                    setMostrarConfirmacion(false);
                    setAccionSeleccionada(null);
                  }}
                >
                  <Text style={styles.textoNo}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.botonSi}
                  onPress={handleConfirmarAccion}
                >
                  <Ionicons 
                    name={accionSeleccionada === 'cancelar' ? 'close-circle' : 'trash'} 
                    size={18} 
                    color="#FFF" 
                  />
                  <Text style={styles.textoSi}>
                    {accionSeleccionada === 'cancelar' ? 'Confirmar' : 'Eliminar'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  opcionesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  iconInfo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  opcionesTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  opcionesSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  opcionButton: {
    width: '100%',
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  opcionButtonEliminar: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  opcionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  opcionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  opcionDescription: {
    fontSize: 13,
    color: '#666',
  },
});