import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import NavigationService from '../../Src/Services/NavegationService';

export default function Perfil({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [rolUsuario, setRolUsuario] = useState(null);
  const [medicoData, setMedicoData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsuarioData();
  }, []);

  const loadUsuarioData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
        const role = authData.usuario.role || authData.usuario.tipo_usuario;
        setRolUsuario(role);
        

        if (role?.toLowerCase() === 'medico' || role?.toLowerCase() === 'doctor') {
          await loadMedicoData(authData.usuario.id);
        } else {
        }
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const loadMedicoData = async (usuarioId) => {
    try {
      
      const medicosResult = await AuthService.getMedicosConEspecialidades();
      
      if (medicosResult && medicosResult.data && Array.isArray(medicosResult.data)) {
        
        const currentMedico = medicosResult.data.find(
          medico => medico.email?.toLowerCase() === usuario?.email?.toLowerCase()
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

  const handleEditField = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingField || !editValue.trim()) {
      Alert.alert('Error', 'El campo no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (rolUsuario?.toLowerCase() === 'medico') {
        const medicoData = {
          [editingField]: editValue.trim()
        };
        response = await AuthService.editarMedico(usuario.id, medicoData);
        
      } else if (rolUsuario?.toLowerCase() === 'paciente') {
        const pacienteData = {
          [editingField]: editValue.trim()
        };
        response = await AuthService.editarPaciente(usuario.id, pacienteData);
        
      } else if (rolUsuario?.toLowerCase() === 'admin') {
        const adminData = {
          [editingField]: editValue.trim()
        };
        response = await AuthService.updateAdmin(usuario.id, adminData);
      }
      
      if (response && (response.data || response.success)) {
        if (rolUsuario?.toLowerCase() === 'medico') {
          setMedicoData(prev => ({ ...prev, [editingField]: editValue }));
        } else {
          setUsuario(prev => ({ ...prev, [editingField]: editValue }));
        }
        
        Alert.alert('Éxito', 'Campo actualizado correctamente');
        setShowEditModal(false);
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      let errorMessage = 'No se pudo actualizar el campo';
      
      if (error.response) {
        const { status, data } = error.response;
        errorMessage = data.message || `Error del servidor (${status})`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field) => {
    const labels = {
      telefono: 'Teléfono',
      fecha_nacimiento: 'Fecha de Nacimiento',
      direccion: 'Dirección'
    };
    return labels[field] || field;
  };

  const getFieldPlaceholder = (field) => {
    const placeholders = {
      telefono: 'Ingresa tu teléfono',
      fecha_nacimiento: 'YYYY-MM-DD',
      direccion: 'Ingresa tu dirección'
    };
    return placeholders[field] || '';
  };

  const getHeaderColor = () => {
    switch (rolUsuario?.toLowerCase()) {
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
    switch (rolUsuario?.toLowerCase()) {
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
    switch (rolUsuario?.toLowerCase()) {
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
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarLarge, { backgroundColor: getHeaderColor() + '20' }]}>
            <Text style={styles.avatarLargeText}>{getRoleIcon()}</Text>
          </View>
          <Text style={styles.usuarioName}>{usuario?.name || 'Usuario'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getHeaderColor() }]}>
            <Text style={styles.roleText}>{getRoleText()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person-outline" size={20} color="#1E88E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>
                  {usuario?.nombre || 'No disponible'}
                </Text>
              </View>
              {isEditing && (
                <TouchableOpacity 
                  style={styles.editIcon}
                  onPress={() => handleEditField('nombre', usuario?.nombre)}
                >
                  <Ionicons name="create-outline" size={20} color="#1E88E5" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person-outline" size={20} color="#1E88E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Apellido</Text>
                <Text style={styles.infoValue}>
                  {usuario?.apellido || 'No disponible'}
                </Text>
              </View>
              {isEditing && (
                <TouchableOpacity 
                  style={styles.editIcon}
                  onPress={() => handleEditField('apellido', usuario?.apellido)}
                >
                  <Ionicons name="create-outline" size={20} color="#1E88E5" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#1E88E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo Electrónico</Text>
                <Text style={styles.infoValue}>{usuario?.email || 'No disponible'}</Text>
              </View>
              {isEditing && (
                <TouchableOpacity 
                  style={styles.editIcon}
                  onPress={() => handleEditField('email', usuario?.email)}
                >
                  <Ionicons name="create-outline" size={20} color="#1E88E5" />
                </TouchableOpacity>
              )}
            </View>

            {rolUsuario?.toLowerCase() === 'medico' && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="call-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>
                      {medicoData?.telefono || usuario?.telefono || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('telefono', medicoData?.telefono || usuario?.telefono)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {rolUsuario?.toLowerCase() === 'paciente' && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="card-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Tipo de Documento</Text>
                    <Text style={styles.infoValue}>
                      {usuario?.tipoDocumento || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('tipoDocumento', usuario?.tipoDocumento)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="card-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Número de Documento</Text>
                    <Text style={styles.infoValue}>
                      {usuario?.numeroDocumento || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('numeroDocumento', usuario?.numeroDocumento)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
                    <Text style={styles.infoValue}>
                      {usuario?.fechaNacimiento || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('fechaNacimiento', usuario?.fechaNacimiento)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="person-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Género</Text>
                    <Text style={styles.infoValue}>
                      {usuario?.genero || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('genero', usuario?.genero)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="call-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>
                      {usuario?.telefono || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('telefono', usuario?.telefono)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Dirección</Text>
                    <Text style={styles.infoValue}>
                      {usuario?.direccion || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('direccion', usuario?.direccion)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="medical-outline" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>EPS</Text>
                    <Text style={styles.infoValue}>
                      {usuario?.eps || 'No disponible'}
                    </Text>
                  </View>
                  {isEditing && (
                    <TouchableOpacity 
                      style={styles.editIcon}
                      onPress={() => handleEditField('eps', usuario?.eps)}
                    >
                      <Ionicons name="create-outline" size={20} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

          </View>
        </View>

        {(rolUsuario?.toLowerCase() === 'medico' || rolUsuario?.toLowerCase() === 'doctor') && medicoData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Profesional</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="medical-bag" size={20} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Especialidad</Text>
                  <Text style={styles.infoValue}>
                    {medicoData?.especialidad_nombre || usuario?.especialidad || 'No disponible'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="certificate" size={20} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Licencia Médica</Text>
                  <Text style={styles.infoValue}>
                    {medicoData?.numeroLicencia || 'No disponible'}
                  </Text>
                </View>
              </View>
              
            </View>
          </View>
        )}

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

      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar {getFieldLabel(editingField)}</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowEditModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={getFieldPlaceholder(editingField)}
                  keyboardType={editingField === 'telefono' ? 'phone-pad' : 'default'}
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleSaveEdit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  usuarioName: {
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F9FAFB',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});