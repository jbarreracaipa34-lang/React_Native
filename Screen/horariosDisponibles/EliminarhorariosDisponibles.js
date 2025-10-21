import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function EliminarHorariosDisponibles({ route, navigation }) {
  const { medico } = route.params;
  const [horariosIndividuales, setHorariosIndividuales] = useState([]);
(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedHorarios, setSelectedHorarios] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    loadUserData();
    loadHorariosIndividuales();
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

  const loadHorariosIndividuales = async () => {
    try {
      const response = await AuthService.getHorariosDisponiblesPorMedico();
      
      if (response && response.data && Array.isArray(response.data)) {
        const horariosMedico = response.data.filter(h => 
          `${h.nombre} ${h.apellido}` === `${medico.nombre} ${medico.apellido}`
        );
        
        setHorariosIndividuales(horariosMedico);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const getDiaColor = (dia) => {
    const colores = {
      'L': { bg: '#E3F2FD', text: '#1976D2' },
      'Mar': { bg: '#E8F5E8', text: '#388E3C' },
      'Mie': { bg: '#FFF3E0', text: '#F57C00' },
      'J': { bg: '#F3E5F5', text: '#7B1FA2' },
      'V': { bg: '#E0F2F1', text: '#00796B' },
      'S': { bg: '#FFF8E1', text: '#F9A825' }
    };
    return colores[dia] || { bg: '#F5F5F5', text: '#666' };
  };

  const getDiaCompleto = (dia) => {
    const dias = {
      'L': 'Lunes',
      'Mar': 'Martes',
      'Mie': 'Miércoles',
      'J': 'Jueves',
      'V': 'Viernes',
      'S': 'Sábado'
    };
    return dias[dia] || dia;
  };

  const toggleHorarioSelection = (horarioId) => {
    setSelectedHorarios(prev => {
      if (prev.includes(horarioId)) {
        return prev.filter(id => id !== horarioId);
      } else {
        return [...prev, horarioId];
      }
    });
  };

  const selectAllHorarios = () => {
    if (selectedHorarios.length === horariosIndividuales.length) {
      setSelectedHorarios([]);
    } else {
      setSelectedHorarios(horariosIndividuales.map(h => h.id));
    }
  };

  const handleEliminar = async () => {
    if (selectedHorarios.length === 0) {
      Alert.alert('Atención', 'Debes seleccionar al menos un horario para eliminar');
      return;
    }

    if (usuario?.role !== 'admin' && usuario?.role !== 'medico') {
      Alert.alert('Error', 'No tienes permisos para eliminar horarios');
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar ${selectedHorarios.length} horario(s)?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: confirmarEliminacion
        }
      ]
    );
  };

  const confirmarEliminacion = async () => {
    setDeleting(true);
    
    let exitosos = 0;
    let errores = 0;
    const erroresDetalle = [];

    for (let i = 0; i < selectedHorarios.length; i++) {
      const horarioId = selectedHorarios[i];
      
      try {
        const response = await AuthService.eliminarHorario(horarioId);
        exitosos++;
      } catch (error) {
        console.error(`✗ Error al eliminar horario ${horarioId}:`, error.message);
        errores++;
        erroresDetalle.push(`Horario ID ${horarioId}: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setDeleting(false);

    if (errores === 0) {
      Alert.alert(
        'Éxito',
        `${exitosos} horario(s) eliminado(s) correctamente`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else if (exitosos > 0) {
      Alert.alert(
        'Eliminación parcial',
        `Se eliminaron ${exitosos} horario(s) correctamente, pero ${errores} no pudieron eliminarse.\n\n${erroresDetalle.join('\n')}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert(
        'Error',
        `No se pudo eliminar ningún horario.\n\n${erroresDetalle.join('\n')}`
      );
    }
  };

  const renderHorarioItem = (horario) => {
    const isSelected = selectedHorarios.includes(horario.id);
    const colorDia = getDiaColor(horario.diaSemana);

    return (
      <View key={horario.id} style={styles.horarioWrapper}>
        <TouchableOpacity
          style={[styles.horarioItem, isSelected && styles.horarioItemSelected]}
          onPress={() => toggleHorarioSelection(horario.id)}
          activeOpacity={0.7}
        >
          <View style={styles.horarioLeft}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            
            <View style={styles.horarioInfo}>
              <View style={[styles.diaBadge, { backgroundColor: colorDia.bg }]}>
                <Text style={[styles.diaText, { color: colorDia.text }]}>
                  {getDiaCompleto(horario.diaSemana)}
                </Text>
              </View>
              
              <View style={styles.horarioTiempo}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.horarioTexto}>
                  {formatTime(horario.horaInicio)} - {formatTime(horario.horaFin)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.horarioRight}>
            <Text style={styles.horarioId}>ID: {horario.id}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Eliminar Horarios</Text>
          <Text style={styles.headerSubtitle}>
            Dr. {medico.nombre} {medico.apellido}
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#FF9800" />
        <Text style={styles.infoText}>
          Selecciona los horarios que deseas eliminar. Puedes seleccionar uno o varios.
        </Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{horariosIndividuales.length}</Text>
          <Text style={styles.statLabel}>Total horarios</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>
            {selectedHorarios.length}
          </Text>
          <Text style={styles.statLabel}>Seleccionados</Text>
        </View>
      </View>

      <View style={styles.selectAllContainer}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={selectAllHorarios}
        >
          <View style={[
            styles.checkbox, 
            selectedHorarios.length === horariosIndividuales.length && styles.checkboxSelected
          ]}>
            {selectedHorarios.length === horariosIndividuales.length && (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            )}
          </View>
          <Text style={styles.selectAllText}>
            {selectedHorarios.length === horariosIndividuales.length 
              ? 'Deseleccionar todos' 
              : 'Seleccionar todos'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.horariosList}>
        {horariosIndividuales.length > 0 ? (
          horariosIndividuales.map(renderHorarioItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay horarios disponibles</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={deleting}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (selectedHorarios.length === 0 || deleting) && styles.deleteButtonDisabled
          ]}
          onPress={handleEliminar}
          disabled={selectedHorarios.length === 0 || deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="trash" size={18} color="#FFF" />
              <Text style={styles.deleteButtonText}>
                Eliminar ({selectedHorarios.length})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectAllContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  horariosList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  horarioWrapper: {
    marginBottom: 8,
  },
  horarioItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  horarioItemSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  horarioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  horarioInfo: {
    flex: 1,
  },
  diaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  diaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  horarioTiempo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  horarioTexto: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  horarioRight: {
    alignItems: 'flex-end',
  },
  horarioId: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  footer: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#CCC',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});