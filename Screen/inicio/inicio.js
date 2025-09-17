import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import IniciarSession from '../Auth/iniciarSession';
import Registrar from '../Auth/registrar';
import AdminInicio from '../inicio/adminInicio'; 
import MedicoInicio from '../inicio/medicoInicio';
import PacienteInicio from '../inicio/pacienteInicio';

const Stack = createNativeStackNavigator();

function PantallaInicio({ navigation }) {
  return (
    <View style={styles.contenedor}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.botonHeader} 
          onPress={() => navigation.navigate('IniciarSesion')}
        >
          <Text style={styles.textoBotonHeader}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.botonHeader} 
          onPress={() => navigation.navigate('Registrar')}
        >
          <Text style={styles.textoBotonHeader}>Registrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
        
        <View style={styles.seccionPrincipal}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoTexto}>🏥</Text>
          </View>
          
          <Text style={styles.nombreApp}>Citas Médicas</Text>
          <Text style={styles.sloganApp}>Tu salud en tus manos</Text>
        </View>

        <View style={styles.cajaBienvenida}>
          <Text style={styles.textoBienvenida}>¡Bienvenido!</Text>
          <Text style={styles.descripcion}>
            Una plataforma completa para gestionar tu atención médica de forma eficiente y segura.
          </Text>
        </View>

        <View style={styles.seccionCaracteristicas}>
          <Text style={styles.tituloSeccion}>¿Qué puedes hacer?</Text>
          
          <View style={styles.gridCaracteristicas}>
            <View style={styles.cartaCaracteristica}>
              <Ionicons name="calendar-outline" size={32} color="#1E88E5" />
              <Text style={styles.tituloCaracteristica}>Programar Citas</Text>
              <Text style={styles.descripcionCaracteristica}>
                Agenda tus citas médicas de manera rápida y sencilla
              </Text>
            </View>

            <View style={styles.cartaCaracteristica}>
              <MaterialCommunityIcons name="doctor" size={32} color="#4CAF50" />
              <Text style={styles.tituloCaracteristica}>Médicos Especializados</Text>
              <Text style={styles.descripcionCaracteristica}>
                Encuentra médicos por especialidad y revisa sus perfiles
              </Text>
            </View>

            <View style={styles.cartaCaracteristica}>
              <Ionicons name="people-outline" size={32} color="#8E24AA" />
              <Text style={styles.tituloCaracteristica}>Gestión de Pacientes</Text>
              <Text style={styles.descripcionCaracteristica}>
                Administra la información de pacientes de forma segura
              </Text>
            </View>

            <View style={styles.cartaCaracteristica}>
              <Ionicons name="time-outline" size={32} color="#dac407ff" />
              <Text style={styles.tituloCaracteristica}>Horarios Disponibles</Text>
              <Text style={styles.descripcionCaracteristica}>
                Consulta los horarios disponibles de cada médico
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.seccionEstadisticas}>
          <Text style={styles.tituloSeccion}>Confianza y Experiencia</Text>
          
          <View style={styles.filaEstadisticas}>
            <View style={styles.estadistica}>
              <Text style={styles.numeroEstadistica}>500+</Text>
              <Text style={styles.labelEstadistica}>Médicos Registrados</Text>
            </View>
            
            <View style={styles.estadistica}>
              <Text style={styles.numeroEstadistica}>10K+</Text>
              <Text style={styles.labelEstadistica}>Citas Programadas</Text>
            </View>
            
            <View style={styles.estadistica}>
              <Text style={styles.numeroEstadistica}>25+</Text>
              <Text style={styles.labelEstadistica}>Especialidades</Text>
            </View>
          </View>
        </View>

        <View style={styles.seccionCTA}>
          <Text style={styles.tituloCTA}>¿Listo para comenzar?</Text>
          <Text style={styles.descripcionCTA}>
            Únete a miles de usuarios que ya confían en nuestra plataforma
          </Text>
          
          <View style={styles.botonesCTA}>
            <TouchableOpacity 
              style={styles.botonPrimario} 
              onPress={() => navigation.navigate('Registrar')}
            >
              <Text style={styles.textoBotonPrimario}>Crear Cuenta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.botonSecundario} 
              onPress={() => navigation.navigate('IniciarSesion')}
            >
              <Text style={styles.textoBotonSecundario}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default function InicioStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Inicio" 
        component={PantallaInicio} 
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="IniciarSesion" 
        component={IniciarSession} 
        options={{ title: 'Iniciar Sesión' }}
      />
      <Stack.Screen 
        name="Registrar" 
        component={Registrar} 
        options={{ title: 'Registro' }}
      />
      <Stack.Screen 
        name="AdminInicio"
        component={AdminInicio}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MedicoInicio"
        component={MedicoInicio}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PacienteInicio"
        component={PacienteInicio}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


const styles = StyleSheet.create({
  contenedor: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonHeader: {
    marginLeft: 15,
  },
  textoBotonHeader: {
    color: '#1E88E5',
    fontWeight: '700',
    fontSize: 16,
  },
  scrollContenido: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  seccionPrincipal: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  logoTexto: {
    fontSize: 60,
    color: '#FFFFFF',
  },
  nombreApp: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  sloganApp: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cajaBienvenida: {
    backgroundColor: '#E3F2FD',
    padding: 24,
    borderRadius: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  textoBienvenida: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  descripcion: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  seccionCaracteristicas: {
    marginBottom: 30,
  },
  tituloSeccion: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  gridCaracteristicas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  cartaCaracteristica: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tituloCaracteristica: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  descripcionCaracteristica: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  seccionEstadisticas: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  filaEstadisticas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  estadistica: {
    alignItems: 'center',
  },
  numeroEstadistica: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E88E5',
    marginBottom: 4,
  },
  labelEstadistica: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  seccionCTA: {
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  tituloCTA: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  descripcionCTA: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  botonesCTA: {
    width: '100%',
    gap: 12,
  },
  botonPrimario: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoBotonPrimario: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600',
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textoBotonSecundario: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});