import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AdminInicio from "../../Screen/inicio/adminInicio";
import Perfil from "../../Screen/inicio/perfil";
import CitasStack from "./Stack/CitasStack";
import PacientesStack from "./Stack/PacientesStack";
import MedicosStack from "./Stack/MedicosStack";
import EspecialidadesStack from "./Stack/EspecialidadesStack";
import horariosDisponiblesStack from "./Stack/horariosDisponiblesStack";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminMainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminInicio" 
        component={AdminInicio} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function NavegacionPrincipal() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#f8f8f8",
          borderTopWidth: 1,
          borderTopColor: "#504a4aff",
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "#504a4aff",
      }}
    >
        <Tab.Screen
          name="Inicio"
          component={AdminMainStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            tabBarLabel: "Inicio",
          }}
        />

      <Tab.Screen
        name="CitasStack"
        component={CitasStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
          tabBarLabel: "Citas",
        }}
      />

      <Tab.Screen
        name="PacientesStack"
        component={PacientesStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
          tabBarLabel: "Pacientes",
        }}
      />

      <Tab.Screen
        name="MedicosStack"
        component={MedicosStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="doctor" size={size} color={color} />
          ),
          tabBarLabel: "Medicos",
        }}
      />

      <Tab.Screen
        name="EspecialidadesStack"
        component={EspecialidadesStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="medical-bag" size={size} color={color} />
          ),
          tabBarLabel: "Especialidades",
        }}
      />

      <Tab.Screen
        name="HorariosStack"
        component={horariosDisponiblesStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-outline" size={size} color={color} />
          ),
          tabBarLabel: "Horarios",
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={Perfil}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          tabBarLabel: "Perfil",
        }}
      />
    </Tab.Navigator>
  );
}