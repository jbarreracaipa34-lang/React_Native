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
  const [pacienteInfo, setPacienteInfo] = useState(null);
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

  useEffect(() => {
    if (user && !isEditing) {
      preseleccionarDatosPorRol();
      if (user.role === 'paciente') {
        obtenerInfoPaciente();
      }
    }
  }, [user, pacientes, medicos, isEditing]);

  const obtenerInfoPaciente = async () => {
    try {
      const pacienteEncontrado = pacientes.find(paciente => {
        const nombreCoincide = paciente.nombre && (user.nombre || user.name) && 
          paciente.nombre.toLowerCase().trim() === (user.nombre || user.name).toLowerCase().trim();
        const userIdCoincide = paciente.user_id && 
          String(paciente.user_id) === String(user.id);
        return nombreCoincide || userIdCoincide;
      });
      
      if (pacienteEncontrado) {
        setPacienteInfo(pacienteEncontrado);
      }
    } catch (error) {
      console.error('Error obteniendo info del paciente:', error);
    }
  };

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
      if (user?.role === 'paciente') {
        setPacientes([{
          id: user.id,
          nombre: user.nombre || user.name,
          apellido: user.apellido || '',
          numeroDocumento: user.documento || user.numeroDocumento || 'N/A'
        }]);
        return;
      }
      
      const response = await AuthService.getPacientes();
      
      if (response && response.data) {
        setPacientes(response.data);
      } else if (response && Array.isArray(response)) {
        setPacientes(response);
      }
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      
      if (user?.role === 'paciente' && error.response?.status === 403) {
        setPacientes([{
          id: user.id,
          nombre: user.nombre || user.name,
          apellido: user.apellido || '',
          numeroDocumento: user.documento || user.numeroDocumento || 'N/A'
        }]);
        return;
      }
      
      Alert.alert('Error', 'No se pudieron cargar los pacientes');
    }
  };

  const obtenerEspecialidades = async () => {
    try {
      const response = await AuthService.getEspecialidades();
      return response?.data || response || [];
    } catch (error) {
      console.error('Error obteniendo especialidades:', error);
      return [];
    }
  };

  const loadMedicos = async () => {
    try {
      if (user?.role === 'medico') {
        setMedicos([{
          id: user.id,
          nombre: user.nombre || user.name,
          apellido: user.apellido || '',
          especialidad: user.especialidad || 'Sin especialidad'
        }]);
        return;
      }

      const response = await AuthService.getMedicos();
      let medicosData = [];
      
      if (response && response.data) {
        medicosData = response.data;
      } else if (response && Array.isArray(response)) {
        medicosData = response;
      }

      const especialidades = await obtenerEspecialidades();

      const especialidadesMap = {};
      especialidades.forEach(esp => {
        especialidadesMap[esp.id] = esp.nombre || esp.name || esp.title || 'Sin nombre';
      });


      const medicosConEspecialidad = medicosData.map(medico => {
        let especialidad = 'Sin especialidad';
        
        if (medico.especialidad_id && especialidadesMap[medico.especialidad_id]) {
          especialidad = especialidadesMap[medico.especialidad_id];
        }
        
        return {
          ...medico,
          especialidad: especialidad
        };
      });

      setMedicos(medicosConEspecialidad);
    } catch (error) {
      console.error('Error cargando médicos:', error);
      
      if (user?.role === 'medico' && error.response?.status === 403) {
        setMedicos([{
          id: user.id,
          nombre: user.nombre || user.name,
          apellido: user.apellido || '',
          especialidad: user.especialidad || 'Sin especialidad'
        }]);
        return;
      }
      
      Alert.alert('Error', 'No se pudieron cargar los médicos');
    }
  };

  const cargarDatosCita = () => {
    if (citaAEditar) {
      let horaFormateada = citaAEditar.horaCita;
      if (horaFormateada && horaFormateada.includes(':')) {
        const partesHora = horaFormateada.split(':');
        horaFormateada = `${partesHora[0]}:${partesHora[1]}`;
      }

      let observacionesProcesadas = '';
      if (citaAEditar.observaciones !== null && citaAEditar.observaciones !== undefined) {
        observacionesProcesadas = String(citaAEditar.observaciones);
      }

      setFormData({
        pacientes_id: String(citaAEditar.pacientes_id || ''),
        medicos_id: String(citaAEditar.medicos_id || ''),
        fechaCita: citaAEditar.fechaCita || '',
        horaCita: horaFormateada || '',
        estado: citaAEditar.estado || 'pendiente',
        observaciones: observacionesProcesadas
      });
    }
  };

  const preseleccionarDatosPorRol = () => {
    if (!user) return;
    
    setFormData(prev => {
      const newFormData = { ...prev };
      
      if (user.role === 'paciente' && pacienteInfo) {
        newFormData.pacientes_id = String(pacienteInfo.id);
      } else if (user.role === 'paciente' && pacientes.length > 0) {
        newFormData.pacientes_id = String(user.id);
      }
      
      if (user.role === 'medico' && medicos.length > 0) {
        newFormData.medicos_id = String(user.id);
      }
      
      return newFormData;
    });
  };

  const handleInputChange = (field, value) => {
    if (isEditing && user?.role === 'medico') {
      if (field !== 'observaciones' && field !== 'estado') {
        return;
      }
    }

    if (isEditing && user?.role === 'paciente') {
      const pacientePuedeEditar = verificarSiPacientePuedeEditar();
      
      if (!pacientePuedeEditar) {
        if (field !== 'observaciones') {
          Alert.alert(
            'Sin permisos',
            'No tienes permisos para editar esta cita. Solo puedes agregar observaciones.',
            [{ text: 'OK' }]
          );
          return;
        }
      } else {
        if (field === 'medicos_id' || field === 'estado') {
          return;
        }
      }
    }

    let processedValue = value;
    if (field === 'observaciones') {
      processedValue = value === null || value === undefined ? '' : String(value);
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

  const verificarSiPacientePuedeEditar = () => {
    if (!citaAEditar || !user || user.role !== 'paciente') {
      return false;
    }
    
    const userIdActual = String(user.id);
    const citaUserId = String(citaAEditar.user_id || '');
    const citaPacientesId = String(citaAEditar.pacientes_id || '');
    
    const puedeEditarPorUserId = citaUserId === userIdActual;
    const puedeEditarPorPacienteId = citaPacientesId === userIdActual;
    
    let puedeEditarPorPacienteInfo = false;
    if (pacienteInfo && citaAEditar.pacientes_id) {
      puedeEditarPorPacienteInfo = String(citaAEditar.pacientes_id) === String(pacienteInfo.id);
    }
    
    const puedeEditarPorDatos = (
      citaAEditar.paciente_nombre && 
      (user.nombre || user.name)
    ) && (
      citaAEditar.paciente_nombre.toLowerCase().trim() === (user.nombre || user.name || '').toLowerCase().trim()
    );
    
    return puedeEditarPorUserId || puedeEditarPorPacienteId || puedeEditarPorPacienteInfo || puedeEditarPorDatos;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isEditing && user?.role !== 'admin' && !formData.pacientes_id) {
      newErrors.pacientes_id = 'El paciente es obligatorio';
    }
    
    if (isEditing && shouldShowField('pacientes_id') && !formData.pacientes_id) {
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
        } else if (date < today && !isEditing) {
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

      let observacionesProcessed = '';
      
      if (formData.observaciones !== null && formData.observaciones !== undefined) {
        const obsValue = formData.observaciones;
        if (typeof obsValue === 'string') {
          observacionesProcessed = obsValue.trim();
        } else {
          observacionesProcessed = String(obsValue).trim();
        }
      }

      observacionesProcessed = observacionesProcessed || '';

      const citaData = {
        fechaCita: formData.fechaCita.trim(),
        horaCita: formData.horaCita.trim(),
        estado: formData.estado.trim(),
        observaciones: String(observacionesProcessed)
      };

      if (isEditing) {
        const baseData = {};

        if (user.role === 'medico') {
          Object.assign(baseData, {
            estado: formData.estado.trim(),
            observaciones: String(observacionesProcessed)
          });
        } else if (user.role === 'paciente') {
          const pacientePuedeEditar = verificarSiPacientePuedeEditar();
          if (pacientePuedeEditar) {
            Object.assign(baseData, {
              fechaCita: formData.fechaCita.trim(),
              horaCita: formData.horaCita.trim(),
              estado: formData.estado.trim(),
              observaciones: String(observacionesProcessed) 
            });
          } else {
            baseData.observaciones = String(observacionesProcessed);
          }
        } else if (user.role === 'admin') {
          Object.assign(baseData, {
            fechaCita: formData.fechaCita.trim(),
            horaCita: formData.horaCita.trim(),
            estado: formData.estado.trim(),
            observaciones: String(observacionesProcessed)
          });
          
          if (formData.medicos_id) {
            baseData.medicos_id = parseInt(formData.medicos_id);
          }
          if (formData.pacientes_id) {
            baseData.pacientes_id = parseInt(formData.pacientes_id);
          }
        }

        Object.keys(citaData).forEach(key => delete citaData[key]);
        Object.assign(citaData, baseData);
        
      } else {
        citaData.user_id = user.id;
        citaData.medicos_id = parseInt(formData.medicos_id);
        
        if (user.role === 'paciente') {
          if (pacienteInfo && pacienteInfo.id) {
            citaData.pacientes_id = parseInt(pacienteInfo.id);
          } else {
            citaData.pacientes_id = null;
          }
        } else {
          citaData.pacientes_id = parseInt(formData.pacientes_id) || null;
        }
      }
      
      if (citaData.observaciones !== undefined) {
        citaData.observaciones = String(citaData.observaciones || '');
      }
      
      let response;
      if (isEditing) {
        const dataToSend = {};
        Object.keys(citaData).forEach(key => {
          if (key === 'observaciones') {
            dataToSend[key] = String(citaData[key] || '');
          } else {
            dataToSend[key] = citaData[key];
          }
        });
                
        response = await AuthService.editarCita(citaAEditar.id, dataToSend);
      } else {
        response = await AuthService.crearCita(citaData);
      }

      if (response && (response.data || response.success)) {
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
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error completo:', error);
  
      let errorMessage = 'Error desconocido al guardar la cita';
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 500:
            errorMessage = 'Error interno del servidor.';
            if (data.message && data.message.includes('Integrity constraint')) {
              errorMessage = 'Error de referencia en base de datos. El paciente o médico seleccionado no existe.';
            } else if (data.message) {
              errorMessage += '\nDetalle: ' + data.message;
            }
            break;
          case 403:
            if (data.debug?.user_role && data.debug?.allowed_roles) {
              errorMessage = `Error de permisos: Tu rol (${data.debug.user_role}) no tiene acceso a esta función.\nRoles permitidos: ${data.debug.allowed_roles.join(', ')}`;
            } else {
              errorMessage = 'No tienes permisos para realizar esta acción';
            }
            break;
          case 422:
            if (data.errors) {
              const errorsList = Object.entries(data.errors).map(([field, errors]) => {
                const errorArray = Array.isArray(errors) ? errors : [errors];
                return `• ${field}: ${errorArray.join(', ')}`;
              }).join('\n');
              
              errorMessage = `Errores de validación:\n${errorsList}`;
              
              if (Object.keys(data.errors).length === 1) {
                const firstError = Object.values(data.errors)[0];
                const errorText = Array.isArray(firstError) ? firstError[0] : firstError;
                errorMessage = `Error de validación: ${errorText}`;
              }
            } else if (data.message) {
              errorMessage = data.message;
            } else {
              errorMessage = 'Datos inválidos - revisa los campos del formulario';
            }
            break;
          case 409:
            errorMessage = 'Ya existe una cita para este paciente en la fecha y hora seleccionada';
            break;
          default:
            errorMessage = data.message || `Error del servidor (${status})`;
        }
      } else if (error.message) {
        errorMessage = error.message;
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

  const isFieldDisabled = (field) => {
    if (!isEditing && user?.role === 'paciente' && field === 'pacientes_id') {
      return true;
    }
    
    if (!isEditing && user?.role === 'medico' && field === 'medicos_id') {
      return true;
    }
    
    if (isEditing && user?.role === 'medico') {
      return field !== 'observaciones' && field !== 'estado';
    }
    
    if (isEditing && user?.role === 'paciente') {
      const pacientePuedeEditar = verificarSiPacientePuedeEditar();
      
      if (!pacientePuedeEditar) {
        return field !== 'observaciones';
      }
      
      return field === 'medicos_id' || field === 'estado';
    }
    
    return false;
  };

  const shouldShowField = (field) => {
    if (user?.role === 'paciente' && field === 'pacientes_id') {
      return false;
    }
    
    if (user?.role === 'medico' && field === 'medicos_id') {
      return false;
    }
    
    return true;
  };

  const renderMedicoPicker = () => {
    const disabled = isFieldDisabled('medicos_id');
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Médico
          <Text style={styles.required}> *</Text>
          {disabled && (
            <Text style={styles.disabledText}> (Solo lectura)</Text>
          )}
        </Text>
        <View style={[
          styles.pickerContainer, 
          errors['medicos_id'] && styles.inputError,
          disabled && styles.inputDisabled
        ]}>
          <Picker
            selectedValue={formData.medicos_id}
            onValueChange={(value) => handleInputChange('medicos_id', value)}
            style={[styles.picker, disabled && styles.pickerDisabled]}
            enabled={!disabled}
          >
            <Picker.Item label="Seleccionar médico" value="" />
            {medicos.map((medico) => {
              const nombreCompleto = `${medico.nombre} ${medico.apellido}`.trim();
              const especialidadTexto = medico.especialidad;
              const labelCompleto = `${nombreCompleto} - ${especialidadTexto}`;
                            
              return (
                <Picker.Item
                  key={medico.id}
                  label={labelCompleto}
                  value={String(medico.id)}
                />
              );
            })}
          </Picker>
        </View>
        {errors['medicos_id'] && <Text style={styles.errorText}>{errors['medicos_id']}</Text>}
      </View>
    );
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
    const disabled = isFieldDisabled(field);
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {required && (
            <Text style={styles.required}> *</Text>
          )}
          {disabled && (
            <Text style={styles.disabledText}> (Solo lectura)</Text>
          )}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            errors[field] && styles.inputError,
            disabled && styles.inputDisabled
          ]}
          value={formData[field] || ''}
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
          editable={!disabled}
        />
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  const renderPicker = (label, field, options, required = false) => {
    if (!shouldShowField(field)) {
      return null;
    }
    
    const disabled = isFieldDisabled(field);
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
          {disabled && (
            <Text style={styles.disabledText}> (Solo lectura)</Text>
          )}
        </Text>
        <View style={[
          styles.pickerContainer, 
          errors[field] && styles.inputError,
          disabled && styles.inputDisabled
        ]}>
          <Picker
            selectedValue={formData[field]}
            onValueChange={(value) => handleInputChange(field, value)}
            style={[styles.picker, disabled && styles.pickerDisabled]}
            enabled={!disabled}
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
  };

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
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            {user?.role === 'medico' && 'Como médico, esta cita será asignada automáticamente a ti.'}
            {user?.role === 'paciente' && 'Como paciente, esta cita será creada automáticamente para ti.'}
            {user?.role === 'admin' && 'Como administrador, puedes asignar cualquier médico y paciente (opcional). Las observaciones son opcionales.'}
            {isEditing && user?.role === 'medico' && ' Solo puedes editar las observaciones y el estado de la cita.'}
            {isEditing && user?.role === 'paciente' && ' No puedes cambiar el médico ni el estado de la cita.'}
          </Text>
        </View>

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
              value: String(paciente.id)
            })),
            user?.role !== 'admin'
          )}

          {shouldShowField('medicos_id') && renderMedicoPicker()}

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
              { label: 'Completada', value: 'completada' },
              { label: 'Cancelada', value: 'cancelada' }
            ],
            true
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>
              Observaciones
              {(user?.role === 'admin' || user?.role === 'medico') && (
                <Text style={styles.optionalText}> (Opcional)</Text>
              )}
            </Text>
          </View>

          {renderInput(
            'Observaciones', 
            'observaciones', 
            user?.role === 'admin' 
              ? 'Observaciones adicionales (opcional)...' 
              : user?.role === 'medico' 
              ? 'Notas médicas o instrucciones (opcional)...'
              : 'Ingrese observaciones adicionales...', 
            'default', 
            true
          )}
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
  optionalText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
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
  disabledText: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: 12,
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
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
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
  pickerDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
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