import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AuthService from '../../Src/Services/AuthService';

export default function Crear_EditarCita({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [user, setUser] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [formData, setFormData] = useState({
    pacientes_id: '',
    medicos_id: '',
    fechaCita: '',
    horaCita: '',
    estado: 'pendiente',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});
  
  const citaAEditar = route?.params?.cita;
  const isEditing = !!citaAEditar;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([
        loadUserData(),
        loadPacientes(),
        loadMedicos()
      ]);
      
      if (isEditing && citaAEditar) {
        cargarDatosCita();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información inicial');
    } finally {
      setLoadingData(false);
    }
  };

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUser(authData.user);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    }
  };

  const loadPacientes = async () => {
    try {
      const response = await AuthService.getPacientes();
      console.log('Respuesta pacientes:', response);
      if (response && response.data) {
        setPacientes(response.data);
        console.log('Pacientes cargados:', response.data);
      } else if (response && Array.isArray(response)) {
        setPacientes(response);
        console.log('Pacientes cargados (array directo):', response);
      }
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes');
    }
  };

  const loadMedicos = async () => {
    try {
      const response = await AuthService.getMedicos();
      console.log('Respuesta médicos:', response);
      if (response && response.data) {
        setMedicos(response.data);
        console.log('Médicos cargados:', response.data);
      } else if (response && Array.isArray(response)) {
        setMedicos(response);
        console.log('Médicos cargados (array directo):', response);
      }
    } catch (error) {
      console.error('Error cargando médicos:', error);
      Alert.alert('Error', 'No se pudieron cargar los médicos');
    }
  };

  const cargarDatosCita = () => {
    if (citaAEditar) {
      setFormData({
        pacientes_id: citaAEditar.pacientes_id || '',
        medicos_id: citaAEditar.medicos_id || '',
        fechaCita: citaAEditar.fechaCita || '',
        horaCita: citaAEditar.horaCita || '',
        estado: citaAEditar.estado || 'pendiente',
        observaciones: citaAEditar.observaciones || ''
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

    if (!formData.pacientes_id) {
      newErrors.pacientes_id = 'El paciente es obligatorio';
    }

    if (!formData.medicos_id) {
      newErrors.medicos_id = 'El médico es obligatorio';
    }

    if (!formData.fechaCita.trim()) {
      newErrors.fechaCita = 'La fecha de la cita es obligatoria';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.fechaCita)) {
        newErrors.fechaCita = 'Formato de fecha inválido (YYYY-MM-DD)';
      } else {
        const date = new Date(formData.fechaCita);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isNaN(date.getTime())) {
          newErrors.fechaCita = 'Fecha inválida';
        } else if (date < today) {
          newErrors.fechaCita = 'La fecha no puede ser anterior a hoy';
        }
      }
    }

    if (!formData.horaCita.trim()) {
      newErrors.horaCita = 'La hora de la cita es obligatoria';
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.horaCita)) {
        newErrors.horaCita = 'Formato de hora inválido (HH:MM)';
      }
    }

    if (!formData.estado) {
      newErrors.estado = 'El estado es obligatorio';
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
      Alert.alert('Error', 'Sesión no válida. Por favor, reinicia la aplicación.');
      return;
    }

    try {
      const tokenVerification = await AuthService.verifyToken();
      console.log('Verificación de token:', tokenVerification);
      
      if (!tokenVerification.success) {
        Alert.alert('Error', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Problema de autenticación. Por favor inicia sesión nuevamente.');
      return;
    }

    try {
      setLoading(true);

      const citaData = {
        ...formData
      };

      let response;
      if (isEditing) {
        const citaDataWithUserId = {
          ...formData,
          user_id: user.id
        };
        response = await AuthService.editarCita(citaAEditar.id, citaDataWithUserId);
      } else {
        response = await AuthService.registrarCitaConUserId(citaData);
      }

      if (response && response.data) {
        Alert.alert(
          'Éxito',
          isEditing ? 'Cita actualizada correctamente' : 'Cita creada correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response?.response?.data?.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      let errorMessage = 'Error desconocido al guardar la cita';
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 403:
            if (data.debug?.user_role && data.debug?.allowed_roles) {
              errorMessage = `Error de permisos: Tu rol (${data.debug.user_role}) no tiene acceso a esta función.\nRoles permitidos: ${data.debug.allowed_roles.join(', ')}`;
            } else {
              errorMessage = 'No tienes permisos para realizar esta acción';
            }
            break;
          case 422:
            if (data.errors) {
              const firstError = Object.values(data.errors)[0];
              errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            } else {
              errorMessage = data.message || 'Datos inválidos';
            }
            break;
          case 409:
            errorMessage = 'Ya existe una cita para este paciente en la fecha y hora seleccionada';
            break;
          case 500:
            if (data.message && data.message.includes("user_id")) {
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
      setLoading(false);
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

  const formatTimeInput = (text) => {
    const numbers = text.replace(/\D/g, '');
    
    let formatted = numbers;
    if (numbers.length >= 3) {
      formatted = numbers.substring(0, 2) + ':' + numbers.substring(2, 4);
    }
    
    return formatted;
  };

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    maxLength = null,
    required = false
  ) => (
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
        value={formData[field]}
        onChangeText={(value) => {
          if (field === 'fechaCita') {
            handleInputChange(field, formatDateInput(value));
          } else if (field === 'horaCita') {
            handleInputChange(field, formatTimeInput(value));
          } else {
            handleInputChange(field, value);
          }
        }}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        maxLength={maxLength}
        autoCapitalize='none'
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Cita' : 'Nueva Cita'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEditing ? 'Modifica los datos de la cita' : 'Completa la información de la cita'}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Información de la Cita</Text>
          </View>

          {renderPicker(
            'Paciente',
            'pacientes_id',
            pacientes.map(paciente => ({
              label: `${paciente.nombre} ${paciente.apellido} (${paciente.numeroDocumento || paciente.documento})`,
              value: paciente.id
            })),
            true
          )}

          {renderPicker(
            'Médico',
            'medicos_id',
            medicos.map(medico => ({
              label: `${medico.nombre} ${medico.apellido} - ${medico.especialidad || 'General'}`,
              value: medico.id
            })),
            true
          )}

          {renderInput(
            'Fecha de la Cita',
            'fechaCita',
            'YYYY-MM-DD (Ej: 2024-12-31)',
            'numeric',
            false,
            10,
            true
          )}

          {renderInput(
            'Hora de la Cita',
            'horaCita',
            'HH:MM (Ej: 14:30)',
            'numeric',
            false,
            5,
            true
          )}

          {renderPicker(
            'Estado',
            'estado',
            [
              { label: 'Pendiente', value: 'pendiente' },
              { label: 'Completa', value: 'completa' },
              { label: 'Cancelada', value: 'cancelada' }
            ],
            true
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Observaciones</Text>
          </View>

          {renderInput('Observaciones', 'observaciones', 'Ingrese observaciones adicionales...', 'default', true)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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