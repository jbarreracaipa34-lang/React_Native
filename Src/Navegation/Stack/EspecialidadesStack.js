import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListarEspecialidades from "../../../Screen/Especialidades/ListarEspecialidades";
import Crear_EditarEspecialidades from "../../../Screen/Especialidades/Crear_EditarEspecialidades";
import EliminarEspecialidades from "../../../Screen/Especialidades/EliminarEspecialidades";
import DetalleEspecialidades from "../../../Screen/Especialidades/DetalleEspecialidades";

const Stack = createNativeStackNavigator();

export default function EspecialidadesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ListarEspecialidades"
        component={ListarEspecialidades}
        options={{ title: "Especialidades" }}
      />
      <Stack.Screen 
        name="Crear_EditarEspecialidades"
        component={Crear_EditarEspecialidades}
        options={{ title: "Crear/Editar Especialidades" }}
      />
      <Stack.Screen 
        name="EliminarEspecialidades"
        component={EliminarEspecialidades}
        options={{ title: "Eliminar Especialidades" }}
      />
      <Stack.Screen 
        name="DetalleEspecialidades"
        component={DetalleEspecialidades}
        options={{ title: "Detalle Especialidades" }}
      />
    </Stack.Navigator>
  );
}
