import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListarCitas from "../../../Screen/Citas/ListarCitas";
import Crear_EditarCitas from "../../../Screen/Citas/Crear_EditarCitas";
import EliminarCitas from "../../../Screen/Citas/EliminarCitas";
import DetalleCitas from "../../../Screen/Citas/DetalleCitas";

const Stack = createNativeStackNavigator();

export default function CitasStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ListarCitas"
        component={ListarCitas}
        options={{ title: "Citas" }}
      />
      <Stack.Screen 
        name="Crear_EditarCitas"
        component={Crear_EditarCitas}
        options={{ title: "Crear/Editar Cita" }}
      />
      <Stack.Screen 
        name="EliminarCitas"
        component={EliminarCitas}
        options={{ title: "Eliminar Cita" }}
      />
      <Stack.Screen 
        name="DetalleCitas"
        component={DetalleCitas}
        options={{ title: "Detalle Cita" }}
      />
    </Stack.Navigator>
  );
}
