import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import AuthService from '../../Src/Services/AuthService';
import { useNotifications } from '../../Src/Hooks/useNotifications';

export default function Crear_EditarPacientes({ navigation, route }) {
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    fechaNacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    eps: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  
  const pacienteAEditar = route?.params?.paciente;
  const isEditing = !!pacienteAEditar;

  const { notifyUserCreated, permissionsGranted } = useNotifications();

  useEffect(() => {
    loadUsuarioData();
    if (isEditing && pacienteAEditar) {
      cargarDatosPaciente();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
    }, [])
  );

  const loadUsuarioData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la informacion del usuario');
    }
  };

  const cargarDatosPaciente = () => {
    if (pacienteAEditar) {
      setFormData({
        nombre: pacienteAEditar.nombre || '',
        apellido: pacienteAEditar.apellido || '',
        tipoDocumento: pacienteAEditar.tipoDocumento || 'CC',
        numeroDocumento: pacienteAEditar.documento || pacienteAEditar.numeroDocumento || '',
        fechaNacimiento: pacienteAEditar.fechaNacimiento || '',
        genero: pacienteAEditar.genero || '',
        telefono: pacienteAEditar.telefono || '',
        email: pacienteAEditar.email || '',
        direccion: pacienteAEditar.direccion || '',
        eps: pacienteAEditar.eps || ''
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

    if (!formData.numeroDocumento.trim()) {
      newErrors.numeroDocumento = 'El numero de documento es obligatorio';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El telefono es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato valido';
    }

    if (!formData.genero) {
      newErrors.genero = 'El genero es obligatorio';
    }

    if (formData.fechaNacimiento) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.fechaNacimiento)) {
        newErrors.fechaNacimiento = 'Formato de fecha invalido (YYYY-MM-DD)';
      } else {
        const date = new Date(formData.fechaNacimiento);
        if (isNaN(date.getTime()) || date > new Date()) {
          newErrors.fechaNacimiento = 'Fecha de nacimiento invalida';
        }
      }
    }

    if (formData.telefono && !/^[\d\s\-\+\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'El telefono solo puede contener numeros, espacios, guiones, + y parentesis';
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (!isEditing && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!isEditing && !formData.password_confirmation.trim()) {
      newErrors.password_confirmation = 'La confirmación de contraseña es obligatoria';
    } else if (!isEditing && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validateForm()) {
    Alert.alert('Error', 'Por favor corrige los errores en el formulario');
    return;
  }

  if (!usuario) {
    Alert.alert('Error', 'Sesion no valida. Por favor, reinicia la aplicacion.');
    return;
  }

  try {
    let pacienteData;
    if (isEditing) {
      const { password, password_confirmation, ...dataWithoutPassword } = formData;
      pacienteData = {
        ...dataWithoutPassword,
        usuario_id: usuario.id
      };
    } else {
      // Para crear paciente, excluir password_confirmation del envío
      const { password_confirmation, ...dataToSend } = formData;
      pacienteData = {
        ...dataToSend,
        // Asegurar que los campos opcionales tengan valores por defecto
        email: dataToSend.email || '',
        direccion: dataToSend.direccion || ''
      };
    }

    console.log('📝 Datos del paciente a enviar:', pacienteData);

    let response;
    if (isEditing) {
      response = await AuthService.editarPaciente(pacienteAEditar.id, pacienteData);
    } else {
      response = await AuthService.crearPaciente(pacienteData);
    }

    console.log('📥 Respuesta del servidor:', response);

    if (response && response.success) {
      if (!isEditing && permissionsGranted) {
        // Usar los datos del formulario para la notificación si no hay datos en la respuesta
        const patientData = response.data || {
          id: 'nuevo',
          nombre: formData.nombre,
          apellido: formData.apellido
        };
        await notifyUserCreated(patientData, 'paciente');
      }

      Alert.alert(
        'Éxito',
        isEditing ? 'Paciente actualizado correctamente' : 'Paciente creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      throw new Error(response?.message || 'Error al procesar la solicitud');
    }
  } catch (error) {
    console.error('❌ Error completo al guardar paciente:', error);
    console.log('📊 Detalles del error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No hay respuesta'
    });
    
    let errorMessage = 'Error desconocido al guardar el paciente';
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 403:
          if (data.debug?.usuario_role && data.debug?.allowed_roles) {
            errorMessage = `Error de permisos: Tu rol (${data.debug.usuario_role}) no tiene acceso a esta funcion.\nRoles permitidos: ${data.debug.allowed_roles.join(', ')}`;
          } else {
            errorMessage = 'No tienes permisos para realizar esta accion';
          }
          break;
        case 422:
          if (data.errors) {
            // Mostrar el primer error de validación
            const firstError = Object.values(data.errors)[0];
            let specificError = Array.isArray(firstError) ? firstError[0] : firstError;
            
            // Mensajes más específicos para errores comunes
            if (specificError.includes('email') && specificError.includes('unique')) {
              errorMessage = 'Ya existe un paciente con este email';
            } else if (specificError.includes('numeroDocumento') && specificError.includes('unique')) {
              errorMessage = 'Ya existe un paciente con este número de documento';
            } else {
              errorMessage = specificError;
            }
          } else {
            errorMessage = data.message || 'Datos invalidos';
          }
          break;
        case 409:
          if (data.message && data.message.includes('email')) {
            errorMessage = 'Ya existe un paciente con este email';
          } else if (data.message && data.message.includes('numeroDocumento')) {
            errorMessage = 'Ya existe un paciente con este número de documento';
          } else {
            errorMessage = 'Ya existe un paciente con estos datos';
          }
          break;
        case 500:
          if (data.message && data.message.includes("usuario_id")) {
            errorMessage = 'Error interno del servidor. Por favor contacta al administrador.';
          } else {
            errorMessage = data.message || `Error del servidor (${status})`;
          }
          break;
        default:
          errorMessage = data.message || `Error del servidor (${status})`;
      }
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
  }
};

  const formatDateInput = (text) => {
    const numbers = text.replace(/\D/g, '');
    
    let formatted = numbers;
    if (numbers.length >= 5) {
      formatted = numbers.substring(0, 4) + '-' + numbers.substring(4, 6);
      if (numbers.length >= 7) {
        formatted += '-' + numbers.substring(6, 8);
      }
    }
    
    return formatted;
  };

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    maxLength = undefined
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {['nombre', 'apellido', 'numeroDocumento', 'telefono', 'email', 'genero'].includes(field) && (
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
        onChangeText={(value) => {
          if (field === 'fechaNacimiento') {
            handleInputChange(field, formatDateInput(value));
          } else {
            handleInputChange(field, value);
          }
        }}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        {...(maxLength && { maxLength })}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCorrect={false}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderPicker = (label, field, options, required = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.pickerContainer, errors[field] && styles.inputError]}>
        <Picker
          selectedValue={formData[field]}
          onValueChange={(value) => handleInputChange(field, value)}
          style={styles.picker}
        >
          <Picker.Item label={`Seleccionar ${label.toLowerCase()}`} value="" />
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
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
          
          {renderPicker(
            'Tipo de Documento',
            'tipoDocumento',
            [
              { label: 'Cedula de Ciudadania', value: 'CC' },
              { label: 'Tarjeta de Identidad', value: 'TI' },
              { label: 'Cedula de Extranjeria', value: 'CE' },
              { label: 'Pasaporte', value: 'PP' }
            ]
          )}

          {renderInput('Numero de Documento', 'numeroDocumento', 'Ingrese el numero de documento', 'numeric')}
          
          {renderInput(
            'Fecha de Nacimiento',
            'fechaNacimiento',
            'YYYY-MM-DD (Ej: 1990-05-15)',
            'numeric',
            false,
            10
          )}

          {renderPicker(
            'Genero',
            'genero',
            [
              { label: 'Masculino', value: 'M' },
              { label: 'Femenino', value: 'F' },
            ],
            true
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion de Contacto</Text>
          </View>

          {renderInput('Telefono', 'telefono', 'Ingrese el telefono', 'phone-pad')}
          {renderInput('Email', 'email', 'Ingrese el email', 'email-address')}
          {renderInput('Direccion', 'direccion', 'Ingrese la direccion', 'default', true)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion Medica</Text>
          </View>

          {renderInput('EPS', 'eps', 'Ingrese la EPS')}
          
          {!isEditing && renderInput('Contraseña', 'password', 'Ingrese la contraseña', 'default', false)}
          {!isEditing && renderInput('Confirmar Contraseña', 'password_confirmation', 'Confirme la contraseña', 'default', false)}
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
            disabled={!usuario}
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
  usuarioInfoContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  usuarioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usuarioInfoText: {
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