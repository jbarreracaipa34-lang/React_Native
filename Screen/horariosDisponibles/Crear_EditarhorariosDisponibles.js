import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AuthService from '../../Src/Services/AuthService';

export default function Crear_EditarHorariosDisponibles({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [medicoActual, setMedicoActual] = useState(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [formData, setFormData] = useState({
    medicos_id: '',
    diaSemana: '',
    horaInicio: '',
    horaFin: ''
  });
  const [errors, setErrors] = useState({});
  
  const medicoParam = route?.params?.medico;
  const isEditing = !!medicoParam;

  const diasSemana = [
    { key: 'L', label: 'Lunes', color: '#1976D2' },
    { key: 'Mar', label: 'Martes', color: '#388E3C' },
    { key: 'Mie', label: 'Miercoles', color: '#F57C00' },
    { key: 'J', label: 'Jueves', color: '#7B1FA2' },
    { key: 'V', label: 'Viernes', color: '#00796B' },
    { key: 'S', label: 'Sabado', color: '#F9A825' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      await loadUserData();
      await loadMedicos();
      
      if (isEditing && medicoParam) {
        setFormData({
          medicos_id: medicoParam.medicos_id || '',
          diaSemana: medicoParam.diaSemana || '',
          horaInicio: medicoParam.horaInicio || '',
          horaFin: medicoParam.horaFin || ''
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la informacion inicial');
    } finally {
      setLoadingData(false);
    }
  };

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
        
        if (authData.usuario.role === 'paciente') {
          Alert.alert(
            'Sin permisos',
            'Solo medicos y administradores pueden gestionar horarios',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }

        if (authData.usuario.role === 'medico') {
          await loadMedicoActual(authData.usuario.id, authData.usuario);
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

  const loadMedicoActual = async (usuarioId, usuarioData) => {
    try {
      
      const medicosResult = await AuthService.getMedicos();
      let medicosData = [];
      
      if (medicosResult && medicosResult.data) {
        medicosData = medicosResult.data;
      } else if (medicosResult && Array.isArray(medicosResult)) {
        medicosData = medicosResult;
      }


      const especialidades = await obtenerEspecialidades();
      const especialidadesMap = {};
      especialidades.forEach(esp => {
        especialidadesMap[esp.id] = esp.nombre || esp.name || esp.title || 'Sin nombre';
      });


      const medicoEncontrado = medicosData.find(medico => {
        
        if (medico.email && usuarioData?.email) {
          const emailCoincide = medico.email.toLowerCase().trim() === usuarioData.email.toLowerCase().trim();
          if (emailCoincide) {
            return true;
          }
        }
        
        if (medico.usuario_id && String(medico.usuario_id) === String(usuarioId)) {
          return true;
        }
        
        const nombreUsuario = usuarioData?.name || '';
        const apellidoUsuario = usuarioData?.apellido || '';
        
        if (nombreUsuario && medico.nombre) {
          const nombreCoincide = medico.nombre.toLowerCase().trim() === nombreUsuario.toLowerCase().trim();
          let apellidoCoincide = true;
          if (apellidoUsuario && medico.apellido) {
            apellidoCoincide = medico.apellido.toLowerCase().trim() === apellidoUsuario.toLowerCase().trim();
          }
          
          if (nombreCoincide && apellidoCoincide) {
            return true;
          }
        }
        
        return false;
      });


      if (medicoEncontrado) {
        let especialidad = 'Sin especialidad';
        if (medicoEncontrado.especialidad_id && especialidadesMap[medicoEncontrado.especialidad_id]) {
          especialidad = especialidadesMap[medicoEncontrado.especialidad_id];
        }

        const medicoConEspecialidad = {
          ...medicoEncontrado,
          especialidad: especialidad
        };


        setMedicoActual(medicoConEspecialidad);
        setFormData(prev => ({
          ...prev,
          medicos_id: medicoConEspecialidad.id
        }));
      } else {
        Alert.alert(
          'Error',
          'No se encontro el perfil de medico asociado a tu usuario. Verifica que tengas un registro en la tabla de medicos.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error loading medico actual:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar la informacion del medico',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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
      const medicosResult = await AuthService.getMedicos();
      let medicosData = [];
      
      if (medicosResult && medicosResult.data) {
        medicosData = medicosResult.data;
      } else if (medicosResult && Array.isArray(medicosResult)) {
        medicosData = medicosResult;
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
      console.error('Error loading medicos:', error);
      Alert.alert('Error', 'No se pudieron cargar los medicos disponibles');
      setMedicos([]);
    }
  };

  const formatTimeInput = (text) => {
    const numbers = text.replace(/\D/g, '');
    
    const limitedNumbers = numbers.substring(0, 4);
    
    let formatted = limitedNumbers;
    
    if (limitedNumbers.length >= 2) {
      formatted = limitedNumbers.substring(0, 2) + ':' + limitedNumbers.substring(2);
    }
    
    return formatted;
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'horaInicio' || field === 'horaFin') {
      processedValue = formatTimeInput(value);
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

    if (!formData.medicos_id) {
      newErrors.medicos_id = 'Debe seleccionar un medico';
    }

    if (!formData.diaSemana) {
      newErrors.diaSemana = 'Debe seleccionar un dia';
    }

    if (!formData.horaInicio.trim()) {
      newErrors.horaInicio = 'La hora de inicio es obligatoria';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.horaInicio)) {
      newErrors.horaInicio = 'Formato de hora invalido (HH:MM)';
    }

    if (!formData.horaFin.trim()) {
      newErrors.horaFin = 'La hora de fin es obligatoria';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.horaFin)) {
      newErrors.horaFin = 'Formato de hora invalido (HH:MM)';
    }

    if (formData.horaInicio && formData.horaFin && 
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.horaInicio) &&
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.horaFin)) {
      const inicio = new Date(`2000-01-01T${formData.horaInicio}:00`);
      const fin = new Date(`2000-01-01T${formData.horaFin}:00`);
      
      if (fin <= inicio) {
        newErrors.horaFin = 'La hora de fin debe ser posterior a la hora de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardarHorario = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);

      const horarioData = {
        medicos_id: formData.medicos_id,
        diaSemana: formData.diaSemana,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin
      };

      let response;
      if (isEditing) {
        response = await AuthService.editarHorario(medicoParam.id, horarioData);
      } else {
        response = await AuthService.crearHorario(horarioData);
      }

      if (response && (response.data || response.success)) {
        Alert.alert(
          'exito',
          `Horario ${isEditing ? 'actualizado' : 'creado'} correctamente`,
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
      console.error('Error al guardar horario:', error);
      
      let errorMessage = 'Error desconocido al guardar el horario';
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 409:
            errorMessage = 'Ya existe un horario en ese dia y hora';
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
            }
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

  const renderDayPicker = () => (
    <Modal
      visible={showDayPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDayPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar dia</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDayPicker(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.daysList}>
            {diasSemana.map(dia => (
              <TouchableOpacity
                key={dia.key}
                style={[
                  styles.dayOption,
                  formData.diaSemana === dia.key && styles.dayOptionSelected
                ]}
                onPress={() => {
                  handleInputChange('diaSemana', dia.key);
                  setShowDayPicker(false);
                }}
              >
                <View style={[styles.dayColorIndicator, { backgroundColor: dia.color }]} />
                <Text style={[
                  styles.dayOptionText,
                  formData.diaSemana === dia.key && styles.dayOptionTextSelected
                ]}>
                  {dia.label}
                </Text>
                {formData.diaSemana === dia.key && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMedicoSelector = () => {
    if (usuario?.role === 'medico' && medicoActual) {
    }

    if (usuario?.role === 'medico' && !medicoActual) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Medico <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={16} color="#FF9800" />
            <Text style={styles.infoMedicoText}>
              No se pudo identificar automaticamente tu perfil. Seleccionalo de la lista.
            </Text>
          </View>
          <View style={[styles.pickerContainer, errors.medicos_id && styles.inputError]}>
            <Picker
              selectedValue={formData.medicos_id}
              onValueChange={(value) => handleInputChange('medicos_id', value)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar tu perfil de medico" value="" />
              {medicos.map((medico) => {
                const nombreCompleto = `Dr. ${medico.nombre} ${medico.apellido}`.trim();
                const especialidadTexto = medico.especialidad;
                const labelCompleto = `${nombreCompleto} - ${especialidadTexto}`;
                
                return (
                  <Picker.Item
                    key={medico.id}
                    label={labelCompleto}
                    value={medico.id}
                  />
                );
              })}
            </Picker>
          </View>
          {errors.medicos_id && <Text style={styles.errorText}>{errors.medicos_id}</Text>}
        </View>
      );
    }

    if (usuario?.role === 'admin') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Medico <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.pickerContainer, errors.medicos_id && styles.inputError]}>
            <Picker
              selectedValue={formData.medicos_id}
              onValueChange={(value) => handleInputChange('medicos_id', value)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar medico" value="" />
              {medicos.map((medico) => {
                const nombreCompleto = `Dr. ${medico.nombre} ${medico.apellido}`.trim();
                const especialidadTexto = medico.especialidad;
                const labelCompleto = `${nombreCompleto} - ${especialidadTexto}`;
                
                return (
                  <Picker.Item
                    key={medico.id}
                    label={labelCompleto}
                    value={medico.id}
                  />
                );
              })}
            </Picker>
          </View>
          {errors.medicos_id && <Text style={styles.errorText}>{errors.medicos_id}</Text>}
        </View>
      );
    }

    return null;
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
            {usuario?.role === 'medico' && medicoActual && 'Tu perfil de medico se ha seleccionado automaticamente. '}
            {usuario?.role === 'medico' && !medicoActual && 'Selecciona tu perfil de medico de la lista. '}
            {usuario?.role === 'admin' && 'Como administrador, puedes crear horarios para cualquier medico. '}
            Configura los horarios de atencion medica. Puedes agregar multiples horarios por dia.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-plus-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>
              {isEditing ? 'Editar Horario' : 'Nuevo Horario'}
            </Text>
          </View>

          {renderMedicoSelector()}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Dia de la semana <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.selectInput, errors.diaSemana && styles.inputError]}
              onPress={() => setShowDayPicker(true)}
            >
              <Text style={[styles.selectInputText, !formData.diaSemana && styles.placeholder]}>
                {formData.diaSemana 
                  ? diasSemana.find(d => d.key === formData.diaSemana)?.label 
                  : 'Seleccionar dia'
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {errors.diaSemana && <Text style={styles.errorText}>{errors.diaSemana}</Text>}
          </View>

          <View style={styles.timeRow}>
            <View style={[styles.inputContainer, styles.timeInput]}>
              <Text style={styles.inputLabel}>
                Hora inicio <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.horaInicio && styles.inputError]}
                value={formData.horaInicio}
                onChangeText={(value) => handleInputChange('horaInicio', value)}
                placeholder="08:00"
                keyboardType="numeric"
                maxLength={5}
              />
              {errors.horaInicio && <Text style={styles.errorText}>{errors.horaInicio}</Text>}
            </View>

            <View style={[styles.inputContainer, styles.timeInput]}>
              <Text style={styles.inputLabel}>
                Hora fin <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.horaFin && styles.inputError]}
                value={formData.horaFin}
                onChangeText={(value) => handleInputChange('horaFin', value)}
                placeholder="17:00"
                keyboardType="numeric"
                maxLength={5}
              />
              {errors.horaFin && <Text style={styles.errorText}>{errors.horaFin}</Text>}
            </View>
          </View>
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
            onPress={handleGuardarHorario}
            disabled={loading || !formData.medicos_id || !formData.diaSemana || !formData.horaInicio || !formData.horaFin}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar Horario' : 'Guardar Horario'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      {renderDayPicker()}
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
  infoMedicoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1976D2',
    flex: 1,
    fontStyle: 'italic',
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
    flex: 1,
  },
  horariosCount: {
    fontSize: 14,
    color: '#666',
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
  selectInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  selectInputText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  placeholder: {
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
    marginBottom: 4,
  },
  roleText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  especialidadText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    padding: 4,
  },
  daysList: {
    maxHeight: 400,
  },
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dayOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  dayColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dayOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dayOptionTextSelected: {
    fontWeight: '600',
    color: '#2196F3',
  },
});