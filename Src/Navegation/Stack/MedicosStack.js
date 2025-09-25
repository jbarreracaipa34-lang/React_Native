import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListarMedicos from "../../../Screen/Medicos/ListarMedicos";
import Crear_EditarMedicos from "../../../Screen/Medicos/Crear_EditarMedicos";
import EliminarMedicos from "../../../Screen/Medicos/EliminarMedicos";
import DetalleMedicos from "../../../Screen/Medicos/DetalleMedicos";

const Stack = createNativeStackNavigator();

export default function MedicosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
      name="Medicos"
      component={ListarMedicos} 
      options={{ title: "Medicos" }} 
    />
      <Stack.Screen 
        name="Crear_EditarMedicos"
        component={Crear_EditarMedicos}
        options={{ title: "Crear/Editar Medico" }}
      />
      <Stack.Screen 
        name="EliminarMedicos"
        component={EliminarMedicos}
        options={{ title: "Eliminar Medico" }}
      />
      <Stack.Screen 
        name="DetalleMedicos"
        component={DetalleMedicos}
        options={{ title: "Detalle Medico" }}
      />
    </Stack.Navigator>
  );
}
