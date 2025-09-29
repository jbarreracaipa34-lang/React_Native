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
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [citasExistentes, setCitasExistentes] = useState([]);
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
  const [ultimaConsultaHorarios, setUltimaConsultaHorarios] = useState({ medicoId: null });

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

  useEffect(() => {
    if (formData.medicos_id && formData.medicos_id !== ultimaConsultaHorarios.medicoId) {
      setUltimaConsultaHorarios({ medicoId: formData.medicos_id });
      obtenerHorariosDisponibles(formData.medicos_id);
      obtenerCitasExistentes(formData.medicos_id);
    } else if (!formData.medicos_id) {
      setHorariosDisponibles([]);
      setCitasExistentes([]);
      setUltimaConsultaHorarios({ medicoId: null });
    }
  }, [formData.medicos_id]);

  const obtenerCitasExistentes = async (medicoId) => {
    try {
      const response = await AuthService.getCitas();
      const citasData = response?.data || response || [];
      
      if (citasData.length === 0) {
        setCitasExistentes([]);
        return;
      }
      
      const citasMedico = citasData.filter(cita => {
        const medicoIdDeLaCita = cita.medicos_id || cita.medico_id || cita.doctorId || cita.doctor_id;
        const medicoMatch = String(medicoIdDeLaCita) === String(medicoId);
        const estadoValido = ['confirmada', 'pendiente', 'confirmed', 'pending'].includes(cita.estado?.toLowerCase());
        const noEsLaCitaActual = isEditing ? cita.id !== citaAEditar?.id : true;
        
        return medicoMatch && estadoValido && noEsLaCitaActual;
      });
      
      setCitasExistentes(citasMedico);
    } catch (error) {
      setCitasExistentes([]);
    }
  };

  const obtenerInfoPaciente = async () => {
    try {
      const pacienteEncontrado = pacientes.find(paciente => {
        const nombreCoincide = paciente.nombre && (user.nombre || user.name) && 
          paciente.nombre.toLowerCase().trim() === (user.nombre || user.name).toLowerCase().trim();
        const userIdCoincide = paciente.user_id && String(paciente.user_id) === String(user.id);
        return nombreCoincide || userIdCoincide;
      });
      
      if (pacienteEncontrado) {
        setPacienteInfo(pacienteEncontrado);
      }
    } catch (error) {
    }
  };

  const obtenerHorariosDisponibles = async (medicoId) => {
    if (!medicoId) {
      setHorariosDisponibles([]);
      return;
    }

    try {
      setLoadingHorarios(true);
      const response = await AuthService.getHorariosDisponiblesPorMedico();
      const horariosData = response?.data || response || [];
      
      const medicoSeleccionado = medicos.find(m => String(m.id) === String(medicoId));
      
      if (!medicoSeleccionado) {
        setHorariosDisponibles([]);
        return;
      }
      
      const horariosFiltrados = horariosData.filter(horario => {
        const nombreMatch = horario.nombre?.toLowerCase().trim() === medicoSeleccionado.nombre?.toLowerCase().trim();
        const apellidoMatch = horario.apellido?.toLowerCase().trim() === medicoSeleccionado.apellido?.toLowerCase().trim();
        return nombreMatch && apellidoMatch;
      });

      let horasDisponibles = [];
      
      if (horariosFiltrados.length > 0) {
        const diasSemana = {
          'L': 'Lun', 'M': 'Mar', 'X': 'Mie', 'J': 'Jue', 'V': 'Vie', 'S': 'Sab',
          'lunes': 'Lun', 'martes': 'Mar', 'miercoles': 'Mie', 'miercoles': 'Mie',
          'jueves': 'Jue', 'viernes': 'Vie', 'sabado': 'Sab', 'sabado': 'Sab'
        };

        horariosFiltrados.forEach(horario => {
          const dia = horario.diaSemana || horario.dia || horario.day || horario.day_of_week;
          const horaInicio = horario.horaInicio || horario.hora_inicio || horario.start_time;
          const horaFin = horario.horaFin || horario.hora_fin || horario.end_time;
          
          if (dia && horaInicio) {
            const diaAbrev = diasSemana[dia] || dia;
            const formatearHora = (hora) => hora ? hora.split(':').slice(0, 2).join(':') : '';
            
            const horaInicioFormateada = formatearHora(horaInicio);
            const horaFinFormateada = horaFin ? formatearHora(horaFin) : horaInicioFormateada;
            const bloqueHorario = horaFin ? `${horaInicioFormateada}-${horaFinFormateada}` : horaInicioFormateada;
            
            horasDisponibles.push({
              value: `${diaAbrev}_${horaInicioFormateada}_${horaFinFormateada}`,
              label: `${diaAbrev} ${bloqueHorario}`,
              dia: diaAbrev,
              horaInicio: horaInicioFormateada,
              horaFin: horaFinFormateada,
              horarioId: `${dia}_${horaInicio}`
            });
          }
        });
      }

      setHorariosDisponibles(horasDisponibles);
    } catch (error) {
      setHorariosDisponibles([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const isHorarioOcupado = (horarioOption) => {
    return citasExistentes.some(cita => {
      const fechaQueSeGeneraria = obtenerProximaFechaPorDia(horarioOption.dia);
      const fechaCoincide = cita.fechaCita === fechaQueSeGeneraria;
      
      if (!fechaCoincide) return false;
      
      const normalizarHora = (hora) => hora ? hora.split(':').slice(0, 2).join(':') : '';
      const horaCitaNormalizada = normalizarHora(cita.horaCita);
      const horaInicioNormalizada = normalizarHora(horarioOption.horaInicio);
      const horaFinNormalizada = normalizarHora(horarioOption.horaFin);
      
      let horaCoincide = false;
      if (horaCitaNormalizada && horaInicioNormalizada) {
        if (horaFinNormalizada && horaInicioNormalizada !== horaFinNormalizada) {
          horaCoincide = horaCitaNormalizada >= horaInicioNormalizada && horaCitaNormalizada <= horaFinNormalizada;
        } else {
          horaCoincide = horaCitaNormalizada === horaInicioNormalizada;
        }
      }
      
      return fechaCoincide && horaCoincide;
    });
  };

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([loadUserData(), loadPacientes(), loadMedicos()]);
      
      if (isEditing && citaAEditar) {
        await cargarDatosCita();
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
        setUser(authData.user);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la informacion del usuario');
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
      const data = response?.data || response || [];
      setPacientes(data);
    } catch (error) {
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
      let medicosData = response?.data || response || [];
      const especialidades = await obtenerEspecialidades();

      const especialidadesMap = {};
      especialidades.forEach(esp => {
        especialidadesMap[esp.id] = esp.nombre || esp.name || esp.title || 'Sin nombre';
      });

      const medicosConEspecialidad = medicosData.map(medico => ({
        ...medico,
        especialidad: medico.especialidad_id && especialidadesMap[medico.especialidad_id] 
          ? especialidadesMap[medico.especialidad_id] 
          : 'Sin especialidad'
      }));

      setMedicos(medicosConEspecialidad);
    } catch (error) {
      if (user?.role === 'medico' && error.response?.status === 403) {
        setMedicos([{
          id: user.id,
          nombre: user.nombre || user.name,
          apellido: user.apellido || '',
          especialidad: user.especialidad || 'Sin especialidad'
        }]);
        return;
      }
      Alert.alert('Error', 'No se pudieron cargar los medicos');
    }
  };

  const cargarDatosCita = async () => {
    if (!citaAEditar) return;

    const horaFormateada = citaAEditar.horaCita?.split(':').slice(0, 2).join(':') || '';
    const observacionesProcesadas = String(citaAEditar.observaciones || '');

    const newFormData = {
      pacientes_id: String(citaAEditar.pacientes_id || ''),
      medicos_id: String(citaAEditar.medicos_id || ''),
      fechaCita: citaAEditar.fechaCita || '',
      horaCita: horaFormateada,
      estado: citaAEditar.estado || 'pendiente',
      observaciones: observacionesProcesadas
    };

    setFormData(newFormData);

    if (newFormData.medicos_id) {
      await Promise.all([
        obtenerHorariosDisponibles(newFormData.medicos_id),
        obtenerCitasExistentes(newFormData.medicos_id)
      ]);
    }
  };

  const preseleccionarDatosPorRol = () => {
    if (!user) return;
    
    setFormData(prev => {
      const newFormData = { ...prev };
      
      if (user.role === 'paciente') {
        newFormData.pacientes_id = String(pacienteInfo?.id || user.id);
      }
      
      if (user.role === 'medico') {
        newFormData.medicos_id = String(user.id);
      }
      
      return newFormData;
    });
  };

  const handleInputChange = (field, value) => {
    if (isEditing && user?.role === 'medico' && field !== 'observaciones' && field !== 'estado') {
      return;
    }

    if (isEditing && user?.role === 'paciente') {
      const pacientePuedeEditar = verificarSiPacientePuedeEditar();
      
      if (!pacientePuedeEditar && field !== 'observaciones') {
        Alert.alert('Sin permisos', 'Solo puedes agregar observaciones.', [{ text: 'OK' }]);
        return;
      } else if (pacientePuedeEditar && (field === 'medicos_id' || field === 'estado')) {
        return;
      }
    }

    let processedValue = field === 'observaciones' ? String(value || '') : value;

    if (field === 'horaCita' && value) {
      const horarioSeleccionado = horariosDisponibles.find(h => h.value === value);
      if (horarioSeleccionado) {
        const fechaParaCita = obtenerProximaFechaPorDia(horarioSeleccionado.dia);
        setFormData(prev => ({
          ...prev,
          fechaCita: fechaParaCita,
          horaCita: horarioSeleccionado.horaInicio
        }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const obtenerProximaFechaPorDia = (diaNombre) => {
    const diasSemana = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
    const hoy = new Date();
    const diaObjetivo = diasSemana[diaNombre];
    const diaActual = hoy.getDay();
    
    let diasHastaObjetivo;
    if (diaObjetivo > diaActual) {
      diasHastaObjetivo = diaObjetivo - diaActual;
    } else if (diaObjetivo < diaActual) {
      diasHastaObjetivo = 7 - diaActual + diaObjetivo;
    } else {
      diasHastaObjetivo = 7;
    }
    
    const fechaObjetivo = new Date(hoy);
    fechaObjetivo.setDate(hoy.getDate() + diasHastaObjetivo);
    
    const year = fechaObjetivo.getFullYear();
    const month = String(fechaObjetivo.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObjetivo.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const verificarSiPacientePuedeEditar = () => {
    if (!citaAEditar || !user || user.role !== 'paciente') return false;
    
    const userIdActual = String(user.id);
    const citaUserId = String(citaAEditar.user_id || '');
    const citaPacientesId = String(citaAEditar.pacientes_id || '');
    
    const puedeEditarPorUserId = citaUserId === userIdActual;
    const puedeEditarPorPacienteId = citaPacientesId === userIdActual;
    const puedeEditarPorPacienteInfo = pacienteInfo && String(citaAEditar.pacientes_id) === String(pacienteInfo.id);
    const puedeEditarPorDatos = citaAEditar.paciente_nombre && (user.nombre || user.name) &&
      citaAEditar.paciente_nombre.toLowerCase().trim() === (user.nombre || user.name || '').toLowerCase().trim();
    
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
      newErrors.medicos_id = 'El medico es obligatorio';
    }

    if (!formData.fechaCita.trim()) {
      newErrors.fechaCita = 'La fecha de la cita es obligatoria';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.fechaCita)) {
        newErrors.fechaCita = 'Formato de fecha invalido (YYYY-MM-DD)';
      } else {
        const date = new Date(formData.fechaCita);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isNaN(date.getTime())) {
          newErrors.fechaCita = 'Fecha invalida';
        } else if (date < today && !isEditing) {
          newErrors.fechaCita = 'La fecha no puede ser anterior a hoy';
        }
      }
    }

    if (!formData.horaCita.trim()) {
      newErrors.horaCita = 'La hora de la cita es obligatoria';
    }

    if (!formData.estado) {
      newErrors.estado = 'El estado es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) {
      Alert.alert('Error', !user ? 'Sesion no valida' : 'Corrige los errores en el formulario');
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
      setLoading(true);
      const observacionesProcessed = String(formData.observaciones || '').trim();

      const citaData = {
        fechaCita: formData.fechaCita.trim(),
        horaCita: formData.horaCita.trim(),
        estado: formData.estado.trim(),
        observaciones: observacionesProcessed
      };

      if (isEditing) {
        const baseData = {};

        if (user.role === 'medico') {
          baseData.estado = formData.estado.trim();
          baseData.observaciones = observacionesProcessed;
        } else if (user.role === 'paciente') {
          const pacientePuedeEditar = verificarSiPacientePuedeEditar();
          if (pacientePuedeEditar) {
            Object.assign(baseData, citaData);
          } else {
            baseData.observaciones = observacionesProcessed;
          }
        } else if (user.role === 'admin') {
          Object.assign(baseData, citaData);
          if (formData.medicos_id) baseData.medicos_id = parseInt(formData.medicos_id);
          if (formData.pacientes_id) baseData.pacientes_id = parseInt(formData.pacientes_id);
        }

        Object.assign(citaData, baseData);
      } else {
        citaData.user_id = user.id;
        citaData.medicos_id = parseInt(formData.medicos_id);
        
        if (user.role === 'paciente') {
          citaData.pacientes_id = pacienteInfo?.id ? parseInt(pacienteInfo.id) : null;
        } else {
          citaData.pacientes_id = parseInt(formData.pacientes_id) || null;
        }
      }
      
      const response = isEditing 
        ? await AuthService.editarCita(citaAEditar.id, citaData)
        : await AuthService.crearCita(citaData);

      if (response && (response.data || response.success)) {
        Alert.alert(
          'Exito',
          isEditing ? 'Cita actualizada correctamente' : 'Cita creada correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      let errorMessage = 'Error desconocido al guardar la cita';
      
      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 500:
            errorMessage = data.message?.includes('Integrity constraint') 
              ? 'Error de referencia en base de datos. El paciente o medico seleccionado no existe.'
              : data.message || 'Error interno del servidor';
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

  const isFieldDisabled = (field) => {
    if (!isEditing && user?.role === 'paciente' && field === 'pacientes_id') return true;
    if (!isEditing && user?.role === 'medico' && field === 'medicos_id') return true;
    if (isEditing && user?.role === 'medico') return field !== 'observaciones' && field !== 'estado';
    if (isEditing && user?.role === 'paciente') {
      const pacientePuedeEditar = verificarSiPacientePuedeEditar();
      return !pacientePuedeEditar ? field !== 'observaciones' : field === 'medicos_id' || field === 'estado';
    }
    return false;
  };

  const shouldShowField = (field) => {
    if (user?.role === 'paciente' && field === 'pacientes_id') return false;
    if (user?.role === 'medico' && field === 'medicos_id') return false;
    return true;
  };

  const renderMedicoPicker = () => {
    const disabled = isFieldDisabled('medicos_id');
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Medico<Text style={styles.required}> *</Text>
          {disabled && <Text style={styles.disabledText}> (Solo lectura)</Text>}
        </Text>
        <View style={[styles.pickerContainer, errors['medicos_id'] && styles.inputError, disabled && styles.inputDisabled]}>
          <Picker
            selectedValue={formData.medicos_id}
            onValueChange={(value) => handleInputChange('medicos_id', value)}
            style={[styles.picker, disabled && styles.pickerDisabled]}
            enabled={!disabled}
          >
            <Picker.Item label="Seleccionar medico" value="" />
            {medicos.map((medico) => (
              <Picker.Item
                key={medico.id}
                label={`${medico.nombre} ${medico.apellido} - ${medico.especialidad}`.trim()}
                value={String(medico.id)}
              />
            ))}
          </Picker>
        </View>
        {errors['medicos_id'] && <Text style={styles.errorText}>{errors['medicos_id']}</Text>}
      </View>
    );
  };

  const renderHoraCitaPicker = () => {
    const disabled = isFieldDisabled('horaCita');
    const mostrarPicker = formData.medicos_id;
    const horariosLibres = horariosDisponibles.filter(horario => !isHorarioOcupado(horario));
    
    return (
      <View style={styles.inputContainer}>
        {!mostrarPicker ? (
          <View style={styles.infoContainerSmall}>
            <Text style={styles.infoTextSmall}>
              Selecciona un medico para ver los horarios disponibles
            </Text>
          </View>
        ) : (
          <View style={[styles.pickerContainer, errors['horaCita'] && styles.inputError, disabled && styles.inputDisabled]}>
            <Picker
              selectedValue={formData.horaCita ? 
                horariosDisponibles.find(h => h.horaInicio === formData.horaCita)?.value || '' : ''}
              onValueChange={(value) => handleInputChange('horaCita', value)}
              style={[styles.picker, disabled && styles.pickerDisabled]}
              enabled={!disabled && !loadingHorarios}
            >
              <Picker.Item 
                label={loadingHorarios ? "Cargando horarios..." : 
                       horariosLibres.length === 0 ? "No hay horarios disponibles" : "Seleccionar horario"} 
                value="" 
              />
              {horariosLibres.map((horario) => (
                <Picker.Item key={horario.value} label={horario.label} value={horario.value} />
              ))}
            </Picker>
          </View>
        )}
        
        {errors['horaCita'] && <Text style={styles.errorText}>{errors['horaCita']}</Text>}
        
        {mostrarPicker && horariosLibres.length === 0 && !loadingHorarios && (
          <Text style={styles.infoTextSmall}>
            {horariosDisponibles.length === 0 
              ? "Este medico no tiene horarios configurados"
              : "Todos los horarios de este medico estan ocupados"}
          </Text>
        )}

        {mostrarPicker && horariosDisponibles.length > horariosLibres.length && horariosLibres.length > 0 && (
          <Text style={styles.infoTextSmall}>
            {horariosDisponibles.length - horariosLibres.length} horario(s) ocupado(s)
          </Text>
        )}
      </View>
    );
  };

  const renderInput = (label, field, placeholder, keyboardType = 'default', multiline = false, maxLength = null, required = false) => {
    const disabled = isFieldDisabled(field);
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
          {disabled && <Text style={styles.disabledText}> (Solo lectura)</Text>}
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
    if (!shouldShowField(field)) return null;
    
    const disabled = isFieldDisabled(field);
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
          {disabled && <Text style={styles.disabledText}> (Solo lectura)</Text>}
        </Text>
        <View style={[styles.pickerContainer, errors[field] && styles.inputError, disabled && styles.inputDisabled]}>
          <Picker
            selectedValue={formData[field]}
            onValueChange={(value) => handleInputChange(field, value)}
            style={[styles.picker, disabled && styles.pickerDisabled]}
            enabled={!disabled}
          >
            <Picker.Item label={`Seleccionar ${label.toLowerCase()}`} value="" />
            {options.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            {user?.role === 'medico' && 'Como medico, esta cita sera asignada automaticamente a ti.'}
            {user?.role === 'paciente' && !isEditing && 'Como paciente, esta cita sera creada automaticamente para ti.'}
            {user?.role === 'paciente' && isEditing && 'Como paciente, no puedes cambiar el medico ni el estado de la cita.'}
            {user?.role === 'admin' && 'Como administrador, puedes asignar cualquier medico y paciente (opcional). Las observaciones son opcionales.'}
            {isEditing && user?.role === 'medico' && ' Solo puedes editar las observaciones y el estado de la cita.'}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion de la Cita</Text>
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
          {renderHoraCitaPicker()}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Fecha de la Cita<Text style={styles.required}> *</Text>
              <Text style={styles.disabledText}> (Generada automaticamente)</Text>
            </Text>
            <TextInput
              style={[styles.textInput, styles.inputDisabled]}
              value={formData.fechaCita || ''}
              placeholder="Se generara al seleccionar horario"
              editable={false}
            />
            {errors['fechaCita'] && <Text style={styles.errorText}>{errors['fechaCita']}</Text>}
          </View>

          {renderPicker(
            'Estado',
            'estado',
            [
              { label: 'Pendiente', value: 'pendiente' },
              { label: 'Completada', value: 'completada' },
              { label: 'Confirmada', value: 'confirmada' },
              { label: 'Cancelada', value: 'cancelada' }
            ],
            true
          )}
        </View>

        {(user?.role !== 'paciente' || isEditing) && (
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
                ? 'Notas medicas o instrucciones (opcional)...'
                : 'Ingrese observaciones adicionales...', 
              'default', 
              true
            )}
          </View>
        )}

        {user?.role === 'paciente' && !isEditing && (
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={[styles.infoText, { color: '#F57C00' }]}>
              Las observaciones no están disponibles al crear una cita. Podrás agregarlas después editando la cita.
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
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
    color: '#2196F3',
    fontStyle: 'italic',
    fontSize: 12,
  },
  infoTextSmall: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  infoContainerSmall: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
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