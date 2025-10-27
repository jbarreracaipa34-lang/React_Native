import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AuthService from '../../Src/Services/AuthService';
import { useNotifications } from '../../Src/Hooks/useNotifications';

export default function Crear_EditarCita({ navigation, route }) {
  const [usuario, setUsuario] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [pacienteInfo, setPacienteInfo] = useState(null);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const citaAEditar = route?.params?.cita;
  const medicoParam = route?.params?.medico;
  const isEditing = !!citaAEditar;
  const [ultimaConsultaHorarios, setUltimaConsultaHorarios] = useState({ medicoId: null });

  const {
    notifyAppointmentCreated,
    notifyAppointmentUpdated,
    scheduleAppointmentReminder,
    permissionsGranted
  } = useNotifications();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (usuario && !isEditing) {
      preseleccionarDatosPorRol();
      if (usuario.role === 'paciente') {
        obtenerInfoPaciente();
      }
    }
  }, [usuario, pacientes, medicos, isEditing]);

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
        const nombreCoincide = paciente.nombre && (usuario.nombre || usuario.name) && 
          paciente.nombre.toLowerCase().trim() === (usuario.nombre || usuario.name).toLowerCase().trim();
        const usuarioIdCoincide = paciente.usuario_id && String(paciente.usuario_id) === String(usuario.id);
        return nombreCoincide || usuarioIdCoincide;
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
      await Promise.all([loadUserData(), loadPacientes(), loadMedicos()]);
      
      if (isEditing && citaAEditar) {
        await cargarDatosCita();
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
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la informacion del usuario');
    }
  };

  const loadPacientes = async () => {
    try {
      if (usuario?.role === 'paciente') {
        setPacientes([{
          id: usuario.id,
          nombre: usuario.nombre || usuario.name,
          apellido: usuario.apellido || '',
          numeroDocumento: usuario.documento || usuario.numeroDocumento || 'N/A'
        }]);
        return;
      }
      
      const response = await AuthService.getPacientes();
      const data = response?.data || response || [];
      setPacientes(data);
    } catch (error) {
      if (usuario?.role === 'paciente' && error.response?.status === 403) {
        setPacientes([{
          id: usuario.id,
          nombre: usuario.nombre || usuario.name,
          apellido: usuario.apellido || '',
          numeroDocumento: usuario.documento || usuario.numeroDocumento || 'N/A'
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
      if (usuario?.role === 'medico') {
        setMedicos([{
          id: usuario.id,
          nombre: usuario.nombre || usuario.name,
          apellido: usuario.apellido || '',
          especialidad: usuario.especialidad || 'Sin especialidad'
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
      if (usuario?.role === 'medico' && error.response?.status === 403) {
        setMedicos([{
          id: usuario.id,
          nombre: usuario.nombre || usuario.name,
          apellido: usuario.apellido || '',
          especialidad: usuario.especialidad || 'Sin especialidad'
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
    if (!usuario) return;
    
    setFormData(prev => {
      const newFormData = { ...prev };
      
      if (usuario.role === 'paciente') {
        newFormData.pacientes_id = String(pacienteInfo?.id || usuario.id);
      }
      
      if (usuario.role === 'medico') {
        newFormData.medicos_id = String(usuario.id);
      }
      
      if (medicoParam) {
        const medicoEncontrado = medicos.find(m => 
          m.nombre === medicoParam.nombre && m.apellido === medicoParam.apellido
        );
        
        if (medicoEncontrado) {
          newFormData.medicos_id = String(medicoEncontrado.id);
        } else if (medicoParam.id) {
          newFormData.medicos_id = String(medicoParam.id);
        }
      }
      
      return newFormData;
    });
  };

  const handleInputChange = (field, value) => {
    if (isFieldDisabled(field)) {
      return;
    }
    if (isEditing && usuario?.role === 'medico' && field !== 'observaciones' && field !== 'estado') {
      return;
    }

    if (isEditing && usuario?.role === 'paciente') {
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

  const verificarCompatibilidadFechaHorario = (fecha, horaCita) => {
    if (!fecha || !horaCita) return true;
    
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);
    
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const diaFecha = diasSemana[fechaObj.getDay()];
    
    const horarioSeleccionado = horariosDisponibles.find(h => h.horaInicio === horaCita);
    
    if (!horarioSeleccionado) {
      return true;
    }
    
    const diaHorario = horarioSeleccionado.dia;
    
    return diaFecha === diaHorario;
  };

  const obtenerNombreDiaCompleto = (diaAbrev) => {
    const diasCompletos = {
      'Lun': 'Lunes',
      'Mar': 'Martes', 
      'Mie': 'Miércoles',
      'Jue': 'Jueves',
      'Vie': 'Viernes',
      'Sab': 'Sábado',
      'Dom': 'Domingo'
    };
    return diasCompletos[diaAbrev] || diaAbrev;
  };

  const obtenerProximaFechaPorDia = (diaNombre) => {
    const diasSemana = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    
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
    
    if (diasHastaObjetivo < 2) {
      diasHastaObjetivo += 7;
    }
    
    const fechaObjetivo = new Date(hoy);
    fechaObjetivo.setDate(hoy.getDate() + diasHastaObjetivo);
    
    const diaCalculado = fechaObjetivo.getDay();
    
    if (diaCalculado !== diaObjetivo) {
      const diferencia = diaObjetivo - diaCalculado;
      fechaObjetivo.setDate(fechaObjetivo.getDate() + diferencia);
    }
    
    const year = fechaObjetivo.getFullYear();
    const month = String(fechaObjetivo.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObjetivo.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const verificarSiPacientePuedeEditar = () => {
    if (!citaAEditar || !usuario || usuario.role !== 'paciente') return false;
    
    const usuarioIdActual = String(usuario.id);
    const citaUserId = String(citaAEditar.usuario_id || '');
    const citaPacientesId = String(citaAEditar.pacientes_id || '');
    
    const puedeEditarPorUserId = citaUserId === usuarioIdActual;
    const puedeEditarPorPacienteId = citaPacientesId === usuarioIdActual;
    const puedeEditarPorPacienteInfo = pacienteInfo && String(citaAEditar.pacientes_id) === String(pacienteInfo.id);
    const puedeEditarPorDatos = citaAEditar.paciente_nombre && (usuario.nombre || usuario.name) &&
      citaAEditar.paciente_nombre.toLowerCase().trim() === (usuario.nombre || usuario.name || '').toLowerCase().trim();
    
    return puedeEditarPorUserId || puedeEditarPorPacienteId || puedeEditarPorPacienteInfo || puedeEditarPorDatos;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isEditing && usuario?.role !== 'admin' && !formData.pacientes_id) {
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
    if (!usuario) {
      Alert.alert('Error', 'Sesion no valida');
      return;
    }

    if (formData.fechaCita && formData.horaCita) {
      const esCompatible = verificarCompatibilidadFechaHorario(formData.fechaCita, formData.horaCita);
      if (!esCompatible) {
        const fechaObj = new Date(formData.fechaCita);
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const diaFecha = diasSemana[fechaObj.getDay()];
        const horarioSeleccionado = horariosDisponibles.find(h => h.horaInicio === formData.horaCita);
        
        Alert.alert(
          'Error de compatibilidad',
          `El horario está puesto en ${obtenerNombreDiaCompleto(horarioSeleccionado?.dia)} y la fecha no coincide con el día del horario seleccionado por lo cual no se puede crear la cita hasta que concuerde bien un día del horario con el mismo día de la fecha.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (!validateForm()) {
      Alert.alert('Error', 'Corrige los errores en el formulario');
      return;
    }

    try {
    } catch (error) {
      Alert.alert('Error', 'Problema de autenticacion. Por favor inicia sesion nuevamente.');
      return;
    }

    try {
      const observacionesProcessed = String(formData.observaciones || '').trim();

      const citaData = {
        fechaCita: formData.fechaCita.trim(),
        horaCita: formData.horaCita.trim(),
        estado: formData.estado.trim(),
        observaciones: observacionesProcessed
      };

      if (isEditing) {
        const baseData = {};

        if (usuario.role === 'medico') {
          baseData.estado = formData.estado.trim();
          baseData.observaciones = observacionesProcessed;
        } else if (usuario.role === 'paciente') {
          const pacientePuedeEditar = verificarSiPacientePuedeEditar();
          if (pacientePuedeEditar) {
            Object.assign(baseData, citaData);
          } else {
            baseData.observaciones = observacionesProcessed;
          }
        } else if (usuario.role === 'admin') {
          Object.assign(baseData, citaData);
          if (formData.medicos_id) baseData.medicos_id = parseInt(formData.medicos_id);
          if (formData.pacientes_id) baseData.pacientes_id = parseInt(formData.pacientes_id);
        }

        Object.assign(citaData, baseData);
      } else {
        citaData.usuario_id = usuario.id;
        citaData.medicos_id = parseInt(formData.medicos_id);
        
        if (usuario.role === 'paciente') {
          citaData.pacientes_id = pacienteInfo?.id ? parseInt(pacienteInfo.id) : null;
        } else {
          citaData.pacientes_id = parseInt(formData.pacientes_id) || null;
        }
      }
      
      const response = isEditing 
        ? await AuthService.editarCita(citaAEditar.id, citaData)
        : await AuthService.crearCita(citaData);

      if (response && (response.data || response.success)) {
        const appointmentData = response.data || response;
        const medicoSeleccionado = medicos.find(m => m.id === parseInt(formData.medicos_id));
        const pacienteSeleccionado = pacientes.find(p => p.id === parseInt(formData.pacientes_id));
        
        const notificationData = {
          id: appointmentData.id || citaAEditar?.id,
          fechaCita: formData.fechaCita,
          horaCita: formData.horaCita,
          medico_nombre: medicoSeleccionado?.nombre || citaAEditar?.medico_nombre,
          medico_apellido: medicoSeleccionado?.apellido || citaAEditar?.medico_apellido,
          paciente_nombre: pacienteSeleccionado?.nombre || citaAEditar?.paciente_nombre,
          paciente_apellido: pacienteSeleccionado?.apellido || citaAEditar?.paciente_apellido,
        };

        if (permissionsGranted) {
          if (isEditing) {
            await notifyAppointmentUpdated(notificationData);
          } else {
            await notifyAppointmentCreated(notificationData);
            const appointmentDate = new Date(`${formData.fechaCita}T${formData.horaCita}`);
            if (appointmentDate > new Date()) {
              await scheduleAppointmentReminder(notificationData);
            }
          }
        }

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

  const isPacienteEditingCitaConfirmada = () => {
    const estado = (citaAEditar?.estado || '').toLowerCase();
    return isEditing && usuario?.role === 'paciente' && (estado === 'confirmada' || estado === 'confirmed');
  };

  const isFieldDisabled = (field) => {
    if (isPacienteEditingCitaConfirmada() && (field === 'fechaCita' || field === 'horaCita')) return true;
    if (!isEditing && usuario?.role === 'paciente' && field === 'pacientes_id') return true;
    if (!isEditing && usuario?.role === 'paciente' && field === 'estado') return true;
    if (!isEditing && usuario?.role === 'medico' && field === 'medicos_id') return true;
    if (isEditing && usuario?.role === 'medico') return field !== 'observaciones' && field !== 'estado';
    if (isEditing && usuario?.role === 'paciente') {
      const pacientePuedeEditar = verificarSiPacientePuedeEditar();
      return !pacientePuedeEditar ? field !== 'observaciones' : field === 'medicos_id' || field === 'estado';
    }
    return false;
  };

  const shouldShowField = (field) => {
    if (usuario?.role === 'paciente' && field === 'pacientes_id') return false;
    if (usuario?.role === 'paciente' && field === 'observaciones') return false;
    if (usuario?.role === 'medico' && field === 'medicos_id') return false;
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
              enabled={!disabled}
            >
              <Picker.Item 
                label={horariosLibres.length === 0 ? "No hay horarios disponibles" : "Seleccionar horario"} 
                value="" 
              />
              {horariosLibres.map((horario) => (
                <Picker.Item key={horario.value} label={horario.label} value={horario.value} />
              ))}
            </Picker>
          </View>
        )}
        
        {errors['horaCita'] && <Text style={styles.errorText}>{errors['horaCita']}</Text>}
        {isPacienteEditingCitaConfirmada() && (
          <Text style={styles.infoTextSmall}>No se puede editar porque ya está confirmada.</Text>
        )}
        
        {mostrarPicker && horariosLibres.length === 0 && (
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

  const renderDatePicker = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDatePicker(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Selecciona la fecha de tu cita:</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                value={formData.fechaCita}
                onChangeText={(value) => handleInputChange('fechaCita', formatDateInput(value))}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <Text style={styles.datePickerHint}>
              Formato: AAAA-MM-DD (ejemplo: 2024-12-25)
            </Text>
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  const today = new Date();
                  const todayString = today.toISOString().split('T')[0];
                  handleInputChange('fechaCita', todayString);
                }}
              >
                <Text style={styles.datePickerButtonText}>Hoy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowString = tomorrow.toISOString().split('T')[0];
                  handleInputChange('fechaCita', tomorrowString);
                }}
              >
                <Text style={styles.datePickerButtonText}>Mañana</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.confirmDateButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.confirmDateButtonText}>Confirmar Fecha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const estadoOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'completada', label: 'Completada' }
  ];

  const isLoading = false;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            {usuario?.role === 'medico' && 'Como medico, esta cita sera asignada automaticamente a ti.'}
            {usuario?.role === 'paciente' && !isEditing && 'Como paciente, esta cita sera creada automaticamente para ti. El estado se establecera como "Pendiente" hasta que el medico la confirme.'}
            {usuario?.role === 'paciente' && isEditing && 'Como paciente, no puedes cambiar el medico ni el estado de la cita.'}
            {usuario?.role === 'admin' && 'Como administrador, puedes asignar cualquier medico y paciente (opcional). Las observaciones son opcionales.'}
            {isEditing && usuario?.role === 'medico' && ' Solo puedes editar las observaciones y el estado de la cita.'}
          </Text>
        </View>

        {renderPicker('Paciente', 'pacientes_id', pacientes.map(p => ({ value: String(p.id), label: `${p.nombre} ${p.apellido}`.trim() })), true)}
        {renderMedicoPicker()}
        {renderHoraCitaPicker()}
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Fecha de la Cita
            <Text style={styles.required}> *</Text>
            {isFieldDisabled('fechaCita') && <Text style={styles.disabledText}> (Solo lectura)</Text>}
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.fechaCita && styles.inputError, isFieldDisabled('fechaCita') && styles.inputDisabled]}
            onPress={() => !isFieldDisabled('fechaCita') && setShowDatePicker(true)}
            disabled={isFieldDisabled('fechaCita')}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={[styles.dateButtonText, isFieldDisabled('fechaCita') && styles.disabledText]}>
              {formData.fechaCita ? formatDate(formData.fechaCita) : 'Seleccionar fecha'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {errors.fechaCita && <Text style={styles.errorText}>{errors.fechaCita}</Text>}
          {isPacienteEditingCitaConfirmada() && (
            <Text style={styles.infoTextSmall}>No se puede editar porque ya está confirmada.</Text>
          )}
        </View>
        {renderPicker('Estado', 'estado', estadoOptions, true)}

        {shouldShowField('observaciones') && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Observaciones
              {isFieldDisabled('observaciones') && <Text style={styles.disabledText}> (Solo lectura)</Text>}
            </Text>
            <TextInput
              style={[styles.textArea, errors.observaciones && styles.inputError, isFieldDisabled('observaciones') && styles.inputDisabled]}
              value={formData.observaciones}
              onChangeText={(value) => handleInputChange('observaciones', value)}
              placeholder="Ingresa observaciones adicionales..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isFieldDisabled('observaciones')}
            />
            {errors.observaciones && <Text style={styles.errorText}>{errors.observaciones}</Text>}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Actualizar Cita' : 'Crear Cita'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>
      
      {renderDatePicker()}
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 20,
  },
  infoTextSmall: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  infoContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  disabledText: {
    color: '#999',
    fontSize: 12,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#333',
    minHeight: 100,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#BBDEFB',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpace: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    padding: 4,
  },
  datePickerContainer: {
    alignItems: 'center',
  },
  datePickerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateInputContainer: {
    width: '100%',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#FFF',
    color: '#333',
  },
  datePickerHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  datePickerButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  datePickerButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmDateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  confirmDateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});