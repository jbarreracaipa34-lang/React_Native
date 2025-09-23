import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Ionicons } from "@expo/vector-icons";
import AdminInicio from "../../Screen/inicio/adminInicio";
import CitasStack from "./Stack/CitasStack";
import PacientesStack from "./Stack/PacientesStack";
import MedicosStack from "./Stack/MedicosStack";
import EspecialidadesStack from "./Stack/EspecialidadesStack";
import horariosDisponiblesStack from "./Stack/horariosDisponiblesStack";

const Tab = createBottomTabNavigator();

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
        component={AdminInicio}
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
          tabBarLabel: "Médicos",
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
    </Tab.Navigator>
  );
}
