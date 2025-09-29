import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function EliminarMedicos({ route, navigation }) {
  const { medico } = route.params;
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
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

  const handleConfirmarEliminar = async () => {
    if (!medico?.id) {
      Alert.alert('Error', 'No se ha proporcionado un ID de médico válido');
      return;
    }

    if (user?.role !== 'admin') {
      Alert.alert('Error', 'Solo los administradores pueden eliminar médicos');
      return;
    }

    setCargando(true);
    try {
      const response = await AuthService.eliminarMedico(medico.id);
      
      setMostrarConfirmacion(false);
      
      Alert.alert(
        'Éxito',
        'El médico y su usuario han sido eliminados correctamente.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al eliminar el médico:', error);
      
      let mensaje = 'No se pudo eliminar el médico. Inténtelo de nuevo.';
      
      if (error.response) {
        if (error.response.status === 404) {
          mensaje = 'El médico ya no existe.';
        } else if (error.response.status === 403) {
          mensaje = 'No tienes permisos para eliminar este médico.';
        } else if (error.response.status === 409) {
          mensaje = 'No se puede eliminar el médico porque tiene citas asociadas. Elimina primero las citas.';
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
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!mostrarConfirmacion ? (
          <View style={styles.infoContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="doctor" size={48} color="#4CAF50" />
              </View>
            </View>
            
            <Text style={styles.title}>Detalles del Médico</Text>
            
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                Al eliminar este médico también se eliminará su usuario asociado del sistema
              </Text>
            </View>

            <View style={styles.medicoInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Nombre Completo</Text>
                  <Text style={styles.infoValue}>
                    Dr. {medico?.nombre || ''} {medico?.apellido || ''}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="medical-bag" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Especialidad</Text>
                  <Text style={styles.infoValue}>
                    {medico?.especialidad_nombre || 'No disponible'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="certificate" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Licencia Médica</Text>
                  <Text style={styles.infoValue}>
                    {medico?.numeroLicencia || 'No disponible'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>
                    {medico?.email || 'No disponible'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>
                    {medico?.telefono || 'No disponible'}
                  </Text>
                </View>
              </View>

              {medico?.horarios_disponibles && medico.horarios_disponibles.length > 0 && (
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={20} color="#4CAF50" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Horarios Disponibles</Text>
                    <View style={styles.horariosContainer}>
                      {medico.horarios_disponibles.map((horario, index) => (
                        <View key={index} style={styles.horarioChip}>
                          <Text style={styles.horarioText}>
                            {horario.diaSemana}: {horario.horaInicio} - {horario.horaFin}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.citasWarning}>
              <Ionicons name="warning" size={20} color="#F44336" />
              <Text style={styles.citasWarningText}>
                Si este médico tiene citas asociadas, es posible que no se pueda eliminar hasta que se eliminen primero las citas.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => setMostrarConfirmacion(true)}
              disabled={cargando}
            >
              <Ionicons name="trash-outline" size={20} color="#FFF" />
              <Text style={styles.textoBoton}>Eliminar Médico</Text>
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
            
            <Text style={styles.confirmTitle}>¿Eliminar Médico?</Text>
            <Text style={styles.confirmSubtitle}>
              Esta acción eliminará:
            </Text>

            <View style={styles.deleteList}>
              <View style={styles.deleteItem}>
                <Ionicons name="checkmark-circle" size={20} color="#F44336" />
                <Text style={styles.deleteItemText}>
                  El médico: Dr. {medico?.nombre} {medico?.apellido}
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
                  Todos sus horarios disponibles
                </Text>
              </View>
            </View>

            <Text style={styles.confirmWarning}>
              Esta acción no se puede deshacer
            </Text>

            {cargando ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C62828" />
                <Text style={styles.loadingText}>Eliminando médico...</Text>
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
      </ScrollView>
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
  medicoInfo: {
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
  },
  horarioText: {
    fontSize: 12,
    color: '#2E7D32',
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