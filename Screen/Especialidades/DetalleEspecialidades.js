import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function DetalleEspecialidades({ route, navigation }) {
  const { especialidad } = route.params;
  const [user, setUser] = useState(null);
  const [especialidadDetallada, setEspecialidadDetallada] = useState(especialidad);
  const [medicosCount, setMedicosCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    cargarDetallesCompletos();
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

  const cargarDetallesCompletos = async () => {
    try {
      setLoading(true);
      
      const medicosResponse = await AuthService.getMedicos();
      if (medicosResponse?.data) {
        const medicosConEspecialidad = medicosResponse.data.filter(
          m => m.especialidad_id === especialidad.id
        );
        setMedicosCount(medicosConEspecialidad.length);
      }
      
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
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
                name="stethoscope" 
                size={48} 
                color="#2196F3" 
              />
            </View>
          </View>
          
          <Text style={styles.especialidadName}>
            {especialidadDetallada.nombre}
          </Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {medicosCount} {medicosCount === 1 ? 'medico' : 'medicos'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion General</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="medical-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Nombre de la Especialidad</Text>
              </View>
              <Text style={styles.infoValue}>
                {especialidadDetallada.nombre}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="people-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Medicos Disponibles</Text>
              </View>
              <Text style={styles.infoValue}>
                {medicosCount} {medicosCount === 1 ? 'medico' : 'medicos'}
              </Text>
            </View>
          </View>
        </View>

        {especialidadDetallada.descripcion && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#2196F3" />
              <Text style={styles.cardHeaderTitle}>Descripcion</Text>
            </View>
            
            <View style={styles.descripcionContainer}>
              <Text style={styles.descripcionText}>
                {especialidadDetallada.descripcion}
              </Text>
            </View>
          </View>
        )}

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
  especialidadName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  descripcionContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  descripcionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 20,
  },
});