import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const PantallaPacientes = ({ navigation }) => {
  const pacientes = [
    {
      id: 1,
      nombre: 'Ana María Rodríguez',
      cedula: '12345678',
      eps: 'Sura EPS',
      telefono: '300 123 4567',
      correo: 'ana.rodriguez@email.com',
      proximaCita: '20 Dic 2025',
      edad: '45 años',
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Carlos Eduardo Martínez',
      cedula: '87654321',
      eps: 'Compensar EPS',
      telefono: '301 987 6543',
      correo: 'carlos.martinez@email.com',
      proximaCita: '22 Dic 2025',
      edad: '32 años',
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'María Fernanda López',
      cedula: '11223344',
      eps: 'Nueva EPS',
      telefono: '302 555 7788',
      correo: 'maria.lopez@email.com',
      proximaCita: '25 Dic 2025',
      edad: '28 años',
      estado: 'Inactivo'
    },
  ];

  const TarjetaPaciente = ({ paciente }) => (
    <TouchableOpacity style={estilos.cartaPaciente} activeOpacity={0.8}>
      <View style={estilos.cabeceraCarta}>
        <MaterialCommunityIcons name="account-circle" size={24} color="#1E88E5" />
        <Text style={estilos.nombrePaciente}>{paciente.nombre}</Text>
        <View style={[estilos.estadoBadge, { 
          backgroundColor: paciente.estado === 'Activo' ? '#E8F5E9' : '#FFF3E0' 
        }]}>
          <Text style={[estilos.textoEstado, {
            color: paciente.estado === 'Activo' ? '#2E7D32' : '#F57C00'
          }]}>
            {paciente.estado}
          </Text>
        </View>
      </View>

      <View style={estilos.contenidoPaciente}>
        <View style={estilos.filaDato}>
          <Text style={estilos.etiquetaDato}>CC:</Text>
          <Text style={estilos.valorDato}>{paciente.cedula}</Text>
        </View>
        
        <View style={estilos.filaDato}>
          <Text style={estilos.etiquetaDato}>EPS:</Text>
          <Text style={estilos.valorDato}>{paciente.eps}</Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiquetaDato}>Edad:</Text>
          <Text style={estilos.valorDato}>{paciente.edad}</Text>
        </View>

        <View style={estilos.infoContacto}>
          <View style={estilos.itemContacto}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={estilos.textoContacto}>{paciente.telefono}</Text>
          </View>
          <View style={estilos.itemContacto}>
            <Ionicons name="mail-outline" size={16} color="#6B7280" />
            <Text style={estilos.textoContacto} numberOfLines={1}>
              {paciente.correo}
            </Text>
          </View>
        </View>

        {paciente.proximaCita && (
          <View style={estilos.proximaCitaContainer}>
            <View style={estilos.proximaCita}>
              <Ionicons name="calendar-outline" size={14} color="#1E88E5" />
              <Text style={estilos.textoProximaCita}>{`Próxima: ${paciente.proximaCita}`}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={estilos.accionesPaciente}>
        <TouchableOpacity 
          style={[estilos.botonAccion, { borderColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('Crear_EditarPacientes', { paciente: paciente })}
        >
          <Ionicons name="create-outline" size={18} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[estilos.botonAccion, { borderColor: '#1E88E5' }]}
          onPress={() => navigation.navigate('DetallePacientes', { paciente: paciente })}
        >
          <Ionicons name="eye-outline" size={18} color="#1E88E5" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[estilos.botonAccion, { borderColor: '#F44336' }]}
          onPress={() => navigation.navigate('EliminarPacientes', { paciente: paciente })}
        >
          <Ionicons name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar style="auto" />
      
      <View style={estilos.encabezado}>
        <View style={estilos.logoContainer}>
          <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
        </View>
        <View style={estilos.textoEncabezado}>
          <Text style={estilos.nombreApp}>Pacientes</Text>
          <Text style={estilos.sloganApp}>Gestión de pacientes</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={estilos.scrollContenido} 
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cajaSaludo}>
          <Text style={estilos.textoSaludo}>Panel de Pacientes</Text>
        </View>

        <View style={estilos.gridAcciones}>
          <TouchableOpacity 
            style={estilos.cartaAccion}
            onPress={() => navigation.navigate('Crear_EditarPacientes')}
          >
            <Ionicons name="add-circle-outline" size={28} color="#1E88E5" />
            <Text style={estilos.textoAccion}>Nuevo Paciente</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.contenedorBusqueda}>
          <Ionicons name="search-outline" size={20} color="#6B7280" style={estilos.iconoBusqueda} />
          <TextInput
            style={estilos.inputBusqueda}
            placeholder="Buscar por nombre o documento..."
            placeholderTextColor="#6B7280"
          />
        </View>

        <View style={estilos.estadisticas}>
          <View style={estilos.estadItem}>
            <Text style={estilos.estadNumero}>{pacientes.length.toString()}</Text>
            <Text style={estilos.estadTexto}>Total</Text>
          </View>
          <View style={estilos.estadItem}>
            <Text style={estilos.estadNumero}>
              {pacientes.filter(p => p.estado === 'Activo').length.toString()}
            </Text>
            <Text style={estilos.estadTexto}>Activos</Text>
          </View>
          <View style={estilos.estadItem}>
            <Text style={estilos.estadNumero}>
              {pacientes.filter(p => p.proximaCita).length.toString()}
            </Text>
            <Text style={estilos.estadTexto}>Con Citas</Text>
          </View>
        </View>

        <Text style={estilos.tituloLista}>Lista de Pacientes</Text>
        {pacientes.map((paciente) => (
        <TarjetaPaciente key={String(paciente.cedula || paciente.id)} paciente={paciente} />
        ))}

        <View style={estilos.espacioFinal} />
      </ScrollView>
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContenido: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  textoEncabezado: {
    flexDirection: 'column',
  },
  nombreApp: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sloganApp: {
    fontSize: 13,
    color: '#6B7280',
  },
  cajaSaludo: {
    backgroundColor: '#E3F2FD',
    padding: 18,
    borderRadius: 14,
    marginBottom: 18,
  },
  textoSaludo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  gridAcciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  cartaAccion: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textoAccion: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  contenedorBusqueda: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconoBusqueda: {
    marginRight: 10,
  },
  inputBusqueda: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  estadisticas: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  estadItem: {
    alignItems: 'center',
  },
  estadNumero: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E88E5',
  },
  estadTexto: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tituloLista: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  cartaPaciente: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cabeceraCarta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nombrePaciente: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: '700',
  },
  contenidoPaciente: {
    marginBottom: 12,
  },
  filaDato: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  etiquetaDato: {
    fontSize: 13,
    color: '#6B7280',
    width: 50,
    fontWeight: '600',
  },
  valorDato: {
    fontSize: 13,
    color: '#1A1A1A',
    flex: 1,
  },
  infoContacto: {
    marginTop: 8,
    gap: 4,
  },
  itemContacto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoContacto: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  proximaCitaContainer: {
    marginTop: 10,
  },
  proximaCita: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  textoProximaCita: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E88E5',
    marginLeft: 4,
  },
  accionesPaciente: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  botonAccion: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  espacioFinal: {
    height: 80,
  },
});

export default PantallaPacientes;