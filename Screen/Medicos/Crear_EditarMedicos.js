import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AuthService from '../../Src/Services/AuthService';

export default function Crear_EditarMedicos({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [especialidadesError, setEspecialidadesError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    numeroLicencia: '',
    telefono: '',
    email: '',
    especialidad_id: ''
  });
  const [errors, setErrors] = useState({});
  
  const medicoAEditar = route?.params?.medico;
  const isEditing = !!medicoAEditar;

  useEffect(() => {
    loadUserData();
    loadEspecialidades();
    if (isEditing && medicoAEditar) {
      cargarDatosMedico();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUser(authData.user);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la informacion del usuario');
    }
  };

  const loadEspecialidades = async () => {
    try {
      setLoadingEspecialidades(true);
      setEspecialidadesError(null);
      const response = await AuthService.getEspecialidades();
      if (response && response.data) {
        setEspecialidades(response.data);
      }
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
      
      if (error.response?.status === 403) {
        setEspecialidadesError('forbidden');
        Alert.alert(
          'Permisos Insuficientes', 
          'Tu rol actual no tiene permisos para acceder a las especialidades. Contacta al administrador para obtener los permisos necesarios.',
          [
            { 
              text: 'Volver', 
              onPress: () => navigation.goBack() 
            },
            {
              text: 'Continuar sin especialidades',
              onPress: () => setEspecialidadesError('no_permissions')
            }
          ]
        );
        return;
      }
      
      setEspecialidadesError('general');
      Alert.alert(
        'Error al Cargar Especialidades', 
        'No se pudieron cargar las especialidades. Puedes intentar nuevamente o continuar sin seleccionar especialidad.',
        [
          { 
            text: 'Reintentar', 
            onPress: () => loadEspecialidades() 
          },
          { 
            text: 'Continuar', 
            onPress: () => setLoadingEspecialidades(false) 
          }
        ]
      );
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const cargarDatosMedico = () => {
    if (medicoAEditar) {
      setFormData({
        nombre: medicoAEditar.nombre || '',
        apellido: medicoAEditar.apellido || '',
        numeroLicencia: medicoAEditar.numeroLicencia || '',
        telefono: medicoAEditar.telefono || '',
        email: medicoAEditar.email || '',
        especialidad_id: medicoAEditar.especialidad_id || ''
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }

    if (!formData.numeroLicencia.trim()) {
      newErrors.numeroLicencia = 'El numero de licencia es obligatorio';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El telefono es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato valido';
    }

    if (especialidades.length > 0 && !formData.especialidad_id) {
      newErrors.especialidad_id = 'La especialidad es obligatoria';
    }

    if (formData.telefono && !/^[\d\s\-\+\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'El telefono solo puede contener numeros, espacios, guiones, + y parentesis';
    }

    if (formData.numeroLicencia && !/^[A-Za-z0-9\-]+$/.test(formData.numeroLicencia)) {
      newErrors.numeroLicencia = 'El numero de licencia solo puede contener numeros, letras y guiones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Sesion no valida. Por favor, reinicia la aplicacion.');
      return;
    }

    if (especialidades.length === 0 && !formData.especialidad_id) {
      Alert.alert(
        'Advertencia',
        'No se ha seleccionado una especialidad. ¿Deseas continuar de todos modos?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => proceedWithSubmit() }
        ]
      );
      return;
    }

    proceedWithSubmit();
  };

  const proceedWithSubmit = async () => {
    try {
      const tokenVerification = await AuthService.verifyToken();
      console.log('Verificacion de token:', tokenVerification);
      
      if (!tokenVerification.success) {
        Alert.alert('Error', 'Tu sesion ha expirado. Por favor inicia sesion nuevamente.');
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Problema de autenticacion. Por favor inicia sesion nuevamente.');
      return;
    }

    try {
      setLoading(true);

      const medicoData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        numeroLicencia: formData.numeroLicencia,
        telefono: formData.telefono,
        email: formData.email,
        especialidad_id: formData.especialidad_id || null
      };


      let response;
      if (isEditing) {
        response = await AuthService.editarMedico(medicoAEditar.id, medicoData);
      } else {
        response = await AuthService.crearMedico(medicoData);
      }


      if (response && (response.data || response.success)) {
        Alert.alert(
          'exito',
          isEditing ? 'Medico actualizado correctamente' : 'Medico creado correctamente',
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
      console.error('Error response:', error.response);
      
      let errorMessage = 'Error desconocido al guardar el medico';
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 403:
            if (data.debug?.user_role && data.debug?.allowed_roles) {
              errorMessage = `Error de permisos: Tu rol (${data.debug.user_role}) no tiene acceso a esta funcion.\nRoles permitidos: ${data.debug.allowed_roles.join(', ')}`;
            } else {
              errorMessage = 'No tienes permisos para realizar esta accion';
            }
            break;
          case 422:
            if (data.errors) {
              const firstError = Object.values(data.errors)[0];
              errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            } else {
              errorMessage = data.message || 'Datos invalidos';
            }
            break;
          case 409:
            errorMessage = 'Ya existe un medico con este numero de licencia o email';
            break;
          case 500:
            if (data.message && (data.message.includes("user_id") || data.message.includes("Unknown column"))) {
              errorMessage = 'Error interno: estructura de datos incorrecta. Por favor contacta al administrador.';
            } else {
              errorMessage = data.message || `Error del servidor (${status})`;
            }
            break;
          default:
            errorMessage = data.message || `Error del servidor (${status})`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error de conexion o respuesta inesperada. Detalles: ${JSON.stringify(error)}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    maxLength = null
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {['nombre', 'apellido', 'numeroLicencia', 'telefono', 'email'].includes(field) && (
          <Text style={styles.required}> *</Text>
        )}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          errors[field] && styles.inputError
        ]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        maxLength={maxLength}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCorrect={false}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderEspecialidadesPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        Especialidad
        {especialidades.length > 0 && <Text style={styles.required}> *</Text>}
      </Text>
      
      {loadingEspecialidades ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#2196F3" />
          <Text style={styles.loadingText}>Cargando especialidades...</Text>
        </View>
      ) : especialidadesError === 'forbidden' ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#FF9800" />
          <Text style={styles.warningText}>
            No tienes permisos para ver las especialidades
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadEspecialidades}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : especialidadesError === 'general' ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#F44336" />
          <Text style={styles.errorText}>Error al cargar especialidades</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadEspecialidades}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : especialidades.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.noDataText}>No hay especialidades disponibles</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadEspecialidades}
          >
            <Text style={styles.retryButtonText}>Cargar especialidades</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.pickerContainer, errors.especialidad_id && styles.inputError]}>
          <Picker
            selectedValue={formData.especialidad_id}
            onValueChange={(value) => handleInputChange('especialidad_id', value)}
            style={styles.picker}
          >
            <Picker.Item label="Seleccionar especialidad" value="" />
            {especialidades.map((especialidad) => (
              <Picker.Item
                key={especialidad.id}
                label={especialidad.nombre}
                value={especialidad.id}
              />
            ))}
          </Picker>
        </View>
      )}
      
      {errors.especialidad_id && <Text style={styles.errorText}>{errors.especialidad_id}</Text>}
    </View>
  );

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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion Personal</Text>
          </View>

          {renderInput('Nombre', 'nombre', 'Ingrese el nombre')}
          {renderInput('Apellido', 'apellido', 'Ingrese el apellido')}
          {renderInput('Numero de Licencia', 'numeroLicencia', 'Ingrese el numero de licencia medica')}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion de Contacto</Text>
          </View>

          {renderInput('Telefono', 'telefono', 'Ingrese el telefono', 'phone-pad')}
          {renderInput('Email', 'email', 'Ingrese el email', 'email-address')}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion Medica</Text>
          </View>

          {renderEspecialidadesPicker()}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !user}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </Text>
              </>
            )}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#FF8F00',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfoContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingUserText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  },
});