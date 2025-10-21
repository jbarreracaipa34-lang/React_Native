import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function DetalleHorariosDisponibles({ route, navigation }) {
  const { medico } = route.params || {};
  const [usuario, setUsuario] = useState(null);

  if (!medico) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>No se encontro informacion del medico</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const formatTime = (time) => {
    if (!time) return 'No disponible';
    return time.substring(0, 5);
  };

  const getDiaSemanaTexto = (dia) => {
    const dias = {
      'L': 'Lunes',
      'lunes': 'Lunes',
      'Mar': 'Martes',
      'martes': 'Martes',
      'Mie': 'Miercoles',
      'miercoles': 'Miercoles',
      'miercoles': 'Miercoles',
      'J': 'Jueves',
      'jueves': 'Jueves',
      'V': 'Viernes',
      'viernes': 'Viernes',
      'S': 'Sabado',
      'sabado': 'Sabado',
      'sabado': 'Sabado',
      'domingo': 'Domingo',
    };
    return dias[dia] || dia || 'No disponible';
  };

  const getDiaColor = (dia) => {
    const dias = {
      'L': '#2196F3',
      'lunes': '#2196F3',
      'Mar': '#4CAF50',
      'martes': '#4CAF50',
      'Mie': '#FF9800',
      'miercoles': '#FF9800',
      'miercoles': '#FF9800',
      'J': '#9C27B0',
      'jueves': '#9C27B0',
      'V': '#F44336',
      'viernes': '#F44336',
      'S': '#00BCD4',
      'sabado': '#00BCD4',
      'sabado': '#00BCD4',
      'domingo': '#FF5722',
    };
    return dias[dia] || '#2196F3';
  };

  const calcularDuracionHorario = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return 'No disponible';
    
    const inicio = horaInicio.split(':');
    const fin = horaFin.split(':');
    
    const minutosInicio = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);
    const minutosFin = parseInt(fin[0]) * 60 + parseInt(fin[1]);
    
    const diferencia = minutosFin - minutosInicio;
    const horas = Math.floor(diferencia / 60);
    const minutos = diferencia % 60;
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    } else {
      return `${minutos} minutos`;
    }
  };

  const calcularTotalHorasSemanales = () => {
    let totalMinutos = 0;
    
    medico.horarios?.forEach(horario => {
      const inicio = horario.horaInicio.split(':');
      const fin = horario.horaFin.split(':');
      
      const minutosInicio = parseInt(inicio[0]) * 60 + parseInt(inicio[1]);
      const minutosFin = parseInt(fin[0]) * 60 + parseInt(fin[1]);
      
      totalMinutos += (minutosFin - minutosInicio);
    });
    
    const totalHoras = Math.floor(totalMinutos / 60);
    const minutosRestantes = totalMinutos % 60;
    
    if (totalHoras > 0 && minutosRestantes > 0) {
      return `${totalHoras}h ${minutosRestantes}min`;
    } else if (totalHoras > 0) {
      return `${totalHoras} horas`;
    } else {
      return `${minutosRestantes} minutos`;
    }
  };

  const renderHorariosPorDia = () => {
    if (!medico.horariosAgrupados || medico.horariosAgrupados.length === 0) {
      return (
        <View style={styles.noHorariosContainer}>
          <MaterialCommunityIcons name="clock-outline" size={48} color="#CCC" />
          <Text style={styles.noHorariosText}>No hay horarios disponibles</Text>
        </View>
      );
    }

    return medico.horariosAgrupados.map((diaHorarios, index) => {
      const diaColor = getDiaColor(diaHorarios.diaSemana);
      
      return (
        <View key={index} style={styles.diaContainer}>
          <View style={styles.diaHeader}>
            <View style={[styles.diaIconContainer, { backgroundColor: diaColor + '20' }]}>
              <Ionicons name="calendar" size={20} color={diaColor} />
            </View>
            <Text style={[styles.diaNombre, { color: diaColor }]}>
              {getDiaSemanaTexto(diaHorarios.diaSemana)}
            </Text>
            <View style={styles.diaStats}>
              <Text style={styles.diaStatsText}>
                {diaHorarios.horarios.length} horario{diaHorarios.horarios.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.horariosDelDia}>
            {diaHorarios.horarios.map((horario, idx) => (
              <View key={idx} style={[styles.horarioItem, { borderLeftColor: diaColor }]}>
                <View style={styles.horarioTime}>
                  <View style={styles.timeSection}>
                    <Text style={styles.timeLabel}>Inicio</Text>
                    <Text style={[styles.timeValue, { color: diaColor }]}>
                      {formatTime(horario.horaInicio)}
                    </Text>
                  </View>
                  
                  <View style={styles.timeArrow}>
                    <Ionicons name="arrow-forward" size={16} color="#666" />
                  </View>
                  
                  <View style={styles.timeSection}>
                    <Text style={styles.timeLabel}>Fin</Text>
                    <Text style={[styles.timeValue, { color: diaColor }]}>
                      {formatTime(horario.horaFin)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.horarioDuration}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.durationText}>
                    {calcularDuracionHorario(horario.horaInicio, horario.horaFin)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    });
  };

  const totalHorarios = medico.horarios?.length || 0;
  const diasUnicos = [...new Set(medico.horarios?.map(h => h.diaSemana) || [])];
  const totalHorasSemanales = calcularTotalHorasSemanales();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.medicoHeader}>
          <View style={styles.medicoAvatarContainer}>
            <View style={styles.medicoAvatar}>
              <MaterialCommunityIcons name="doctor" size={48} color="#2196F3" />
            </View>
          </View>
          
          <Text style={styles.medicoName}>
            Dr. {medico.nombre || ''} {medico.apellido || ''}
          </Text>
          
          <View style={styles.medicoStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalHorarios}</Text>
              <Text style={styles.statLabel}>Horarios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{diasUnicos.length}</Text>
              <Text style={styles.statLabel}>Dias</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalHorasSemanales}</Text>
              <Text style={styles.statLabel}>Total Semanal</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Resumen de Disponibilidad</Text>
          </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Medico</Text>
              </View>
              <Text style={styles.infoValue}>
                Dr. {medico.nombre || ''} {medico.apellido || ''}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Dias de Atencion</Text>
              </View>
              <Text style={styles.infoValue}>
                {diasUnicos.map(dia => getDiaSemanaTexto(dia)).join(', ')}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Total de Horarios</Text>
              </View>
              <Text style={styles.infoValue}>
                {totalHorarios} horario{totalHorarios !== 1 ? 's' : ''} disponible{totalHorarios !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="timer-outline" size={18} color="#666" />
                <Text style={styles.infoLabelText}>Horas Semanales</Text>
              </View>
              <Text style={styles.infoValue}>
                {totalHorasSemanales}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.horariosCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color="#2196F3" />
            <Text style={styles.cardHeaderTitle}>Horarios por Dia</Text>
          </View>
          
          {renderHorariosPorDia()}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {usuario?.role === 'paciente' && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.agendarButton}
            onPress={() => navigation.navigate('Crear_EditarCitas', { medico: medico })}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFF" />
            <Text style={styles.agendarButtonText}>Agendar Cita</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
  },
  
  medicoHeader: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  medicoAvatarContainer: {
    marginBottom: 16,
  },
  medicoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicoName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  medicoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 1,
  },
  horariosCard: {
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
  
  diaContainer: {
    marginBottom: 20,
  },
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  diaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaNombre: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  diaStats: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  diaStatsText: {
    fontSize: 11,
    color: '#666',
  },
  
  horariosDelDia: {
    gap: 8,
  },
  horarioItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  horarioTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeSection: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeArrow: {
    marginHorizontal: 16,
  },
  horarioDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  
  noHorariosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noHorariosText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  actionButtonsContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  agendarButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  agendarButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  bottomSpacer: {
    height: 20,
  },
});