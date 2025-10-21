import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function DetalleMedicos({ route, navigation }) {
  const { medico } = route.params;
  const [usuario, setUsuario] = useState(null);
  const [medicoDetallado, setMedicoDetallado] = useState(medico);
  const [especialidad, setEspecialidad] = useState(null);
(false);

  useEffect(() => {
    loadUserData();
    cargarDetallesCompletos();
  }, []);

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const cargarDetallesCompletos = async () => {
    try {
      
      const medicosResponse = await AuthService.getMedicos();
      
      if (medicosResponse?.data) {
        const medicoActualizado = medicosResponse.data.find(m => m.id === medico.id);
        if (medicoActualizado) {
          setMedicoDetallado(medicoActualizado);
          
          if (medicoActualizado.especialidad_id) {
            const especialidadesResponse = await AuthService.getEspecialidades();
            if (especialidadesResponse?.data) {
              const especialidadEncontrada = especialidadesResponse.data.find(
                e => e.id === medicoActualizado.especialidad_id
              );
              setEspecialidad(especialidadEncontrada);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons 
                name="doctor" 
                size={48} 
                color="#2196F3" 
              />
            </View>
          </View>
          
          <Text style={styles.medicoName}>
            Dr. {medicoDetallado.nombre} {medicoDetallado.apellido}
          </Text>
          
          <View style={styles.medicoMetaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="medical-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {especialidad?.nombre || 'Especialidad no disponible'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                NumLic {medicoDetallado.numeroLicencia || 'No disponible'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="briefcase" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion Profesional</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Nombre Completo</Text>
              </View>
              <Text style={styles.infoValue}>
                Dr. {medicoDetallado.nombre} {medicoDetallado.apellido}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="document-text-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Numero de Licencia</Text>
              </View>
              <Text style={styles.infoValue}>
                {medicoDetallado.numeroLicencia || 'No disponible'}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <MaterialCommunityIcons name="stethoscope" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Especialidad</Text>
              </View>
              <Text style={styles.infoValue}>
                {especialidad?.nombre || 'No disponible'}
              </Text>
            </View>

            {especialidad?.descripcion && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="information-circle-outline" size={18} color="#666" />
                    <Text style={styles.infoLabelText}>Descripcion</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {especialidad.descripcion}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion de Contacto</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="call-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Telefono</Text>
              </View>
              <Text style={styles.infoValue}>
                {medicoDetallado.telefono || 'No disponible'}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="mail-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Email</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {medicoDetallado.email || 'No disponible'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
  mainCard: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicoName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  medicoMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#DDD',
    marginHorizontal: 12,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoList: {
    gap: 0,
  },
  infoItem: {
    paddingVertical: 12,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoLabelText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '400',
    paddingLeft: 26,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  bottomSpacer: {
    height: 20,
  },
});