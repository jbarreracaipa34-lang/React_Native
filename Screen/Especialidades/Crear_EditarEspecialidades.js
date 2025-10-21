import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import { useNotifications } from '../../Src/Hooks/useNotifications';

export default function Crear_EditarEspecialidad({ navigation, route }) {
  const { notifySpecialtyCreated } = useNotifications();
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });
  const [errors, setErrors] = useState({});
  
  const especialidadAEditar = route?.params?.especialidad;
  const isEditing = !!especialidadAEditar;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await loadUserData();
      
      if (isEditing && especialidadAEditar) {
        cargarDatosEspecialidad();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la informacion inicial');
    } finally {
    }
  };

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
        
        if (authData.usuario.role !== 'admin') {
          Alert.alert(
            'Sin permisos',
            'Solo los administradores pueden gestionar especialidades',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      } else {
        Alert.alert(
          'No autenticado',
          'Debes iniciar sesion para continuar',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la informacion del usuario');
    }
  };

  const cargarDatosEspecialidad = () => {
    if (especialidadAEditar) {
      setFormData({
        nombre: especialidadAEditar.nombre || '',
        descripcion: especialidadAEditar.descripcion || '',
        activo: especialidadAEditar.activo !== undefined ? especialidadAEditar.activo : true
      });
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'activo') {
      processedValue = value;
    } else if (field === 'nombre') {
      processedValue = value.replace(/\b\w/g, l => l.toUpperCase());
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la especialidad es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.descripcion.trim().length > 500) {
      newErrors.descripcion = 'La descripcion no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    if (!usuario || usuario.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para realizar esta accion');
      return;
    }

    try {
      const tokenVerification = await AuthService.verifyToken();
      
      if (!tokenVerification.success) {
        Alert.alert('Error', 'Tu sesion ha expirado. Por favor inicia sesion nuevamente.');
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Problema de autenticacion. Por favor inicia sesion nuevamente.');
      return;
    }

    try {

      const especialidadData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        activo: formData.activo
      };

      let response;
      if (isEditing) {
        response = await AuthService.editarEspecialidad(especialidadAEditar.id, especialidadData);
      } else {
        response = await AuthService.crearEspecialidad(especialidadData);
      }

      if (response && (response.data || response.success)) {
        // Enviar notificación solo para especialidades nuevas (no para ediciones)
        if (!isEditing) {
          const specialtyData = {
            id: response.data?.id || 'nuevo',
            nombre: formData.nombre.trim()
          };
          
          console.log('🏥 Enviando notificación de especialidad creada...');
          await notifySpecialtyCreated(specialtyData);
        }
        
        Alert.alert(
          'exito',
          isEditing ? 'Especialidad actualizada correctamente' : 'Especialidad creada correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error completo:', error);
  
      let errorMessage = 'Error desconocido al guardar la especialidad';
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 500:
            errorMessage = 'Error interno del servidor.';
            if (data.message) {
              errorMessage += '\nDetalle: ' + data.message;
            }
            break;
          case 403:
            errorMessage = 'No tienes permisos para realizar esta accion';
            break;
          case 422:
            if (data.errors) {
              const errorsList = Object.entries(data.errors).map(([field, errors]) => {
                const errorArray = Array.isArray(errors) ? errors : [errors];
                return `• ${field}: ${errorArray.join(', ')}`;
              }).join('\n');
              
              errorMessage = `Errores de validacion:\n${errorsList}`;
            } else if (data.message) {
              errorMessage = data.message;
            } else {
              errorMessage = 'Datos invalidos - revisa los campos del formulario';
            }
            break;
          case 409:
            errorMessage = 'Ya existe una especialidad con ese nombre';
            break;
          default:
            errorMessage = data.message || `Error del servidor (${status})`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
    }
  };

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    maxLength = null,
    required = false
  ) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {required && (
            <Text style={styles.required}> *</Text>
          )}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            errors[field] && styles.inputError
          ]}
          value={formData[field] || ''}
          onChangeText={(value) => handleInputChange(field, value)}
          placeholder={placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          maxLength={maxLength}
          autoCapitalize={field === 'nombre' ? 'words' : 'sentences'}
          autoCorrect={true}
        />
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  const renderSwitch = (label, field, description = null) => {
    return (
      <View style={styles.switchContainer}>
        <View style={styles.switchHeader}>
          <Text style={styles.switchLabel}>{label}</Text>
          <TouchableOpacity
            style={[styles.switch, formData[field] && styles.switchActive]}
            onPress={() => handleInputChange(field, !formData[field])}
          >
            <View style={[styles.switchThumb, formData[field] && styles.switchThumbActive]} />
          </TouchableOpacity>
        </View>
        {description && (
          <Text style={styles.switchDescription}>{description}</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Como administrador, puedes crear y editar especialidades medicas. Las especialidades activas estaran disponibles para asignar a los medicos.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion de la Especialidad</Text>
          </View>

          {renderInput(
            'Nombre de la Especialidad',
            'nombre',
            'Ej: Cardiologia, Pediatria, Neurologia...',
            'default',
            false,
            100,
            true
          )}

          {renderInput(
            'Descripcion',
            'descripcion',
            'Descripcion opcional de la especialidad...',
            'default',
            true,
            500,
            false
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={false}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton]}
            onPress={handleSubmit}
            disabled={!usuario || usuario.role !== 'admin'}
          >
            <>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Actualizar' : 'Guardar'}
              </Text>
            </>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  required: {
    color: '#F44336',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFF',
    color: '#333',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#2196F3',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  footerSpace: {
    height: 40,
  }
});