import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function DetalleAdmin({ route, navigation }) {
  const { admin } = route.params;
  const [usuario, setUsuario] = useState(null);
  const [adminDetallado, setAdminDetallado] = useState(admin);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsuarioData();
    cargarDetallesCompletos();
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

  const cargarDetallesCompletos = async () => {
    try {
      setLoading(true);
      
      setAdminDetallado(admin);
      
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    navigation.navigate('Crear_EditarAdmin', { admin: adminDetallado });
  };

  const handleEliminar = () => {
    Alert.alert(
      'Eliminar Administrador',
      `¿Estás seguro de que quieres eliminar al administrador ${adminDetallado.nombre} ${adminDetallado.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('EliminarAdmin', { admin: adminDetallado });
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <Text style={styles.headerTitle}>Detalle del Administrador</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons 
                name="account-cog" 
                size={48} 
                color="#2196F3" 
              />
            </View>
          </View>
          
          <Text style={styles.adminName}>
            {adminDetallado.nombre} {adminDetallado.apellido}
          </Text>
          
          <View style={styles.adminMetaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="shield-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                Administrador
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="mail-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {adminDetallado.email || 'No disponible'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Informacion Personal</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Nombre Completo</Text>
              </View>
              <Text style={styles.infoValue}>
                {adminDetallado.nombre} {adminDetallado.apellido}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="mail-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Email</Text>
              </View>
              <Text style={styles.infoValue}>
                {adminDetallado.email || 'No disponible'}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="shield-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Rol</Text>
              </View>
              <Text style={styles.infoValue}>
                Administrador
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Fecha de Registro</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatDate(adminDetallado.created_at)}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Última Actualización</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatDate(adminDetallado.updated_at)}
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
  adminName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  adminMetaInfo: {
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

