import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListarPacientes from "../../../Screen/Pacientes/ListarPacientes";
import Crear_EditarPacientes from "../../../Screen/Pacientes/Crear_EditarPacientes";
import EliminarPacientes from "../../../Screen/Pacientes/EliminarPacientes";
import DetallePacientes from "../../../Screen/Pacientes/DetallePacientes";

const Stack = createNativeStackNavigator();

export default function PacientesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ListarPacientes"
        component={ListarPacientes}
        options={{ title: "Pacientes" }}
      />
      <Stack.Screen 
        name="Crear_EditarPacientes"
        component={Crear_EditarPacientes}
        options={{ title: "Crear/Editar Paciente" }}
      />
      <Stack.Screen 
        name="EliminarPacientes"
        component={EliminarPacientes}
        options={{ title: "Eliminar Paciente" }}
      />
      <Stack.Screen 
        name="DetallePacientes"
        component={DetallePacientes}
        options={{ title: "Detalle Paciente" }}
      />
    </Stack.Navigator>
  );
}