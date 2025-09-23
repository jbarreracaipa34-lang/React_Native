import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListarHorariosDisponibles from "../../../Screen/horariosDisponibles/ListarhorariosDisponibles";
import Crear_EditarHorariosDisponibles from "../../../Screen/horariosDisponibles/Crear_EditarhorariosDisponibles";
import EliminarHorariosDisponibles from "../../../Screen/horariosDisponibles/EliminarhorariosDisponibles";
import DetalleHorariosDisponibles from "../../../Screen/horariosDisponibles/DetallehorariosDisponibles";

const Stack = createNativeStackNavigator();

export default function HorariosDisponiblesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ListarHorariosDisponibles"
        component={ListarHorariosDisponibles}
        options={{ title: "Horarios Disponibles" }}
      />
      <Stack.Screen 
        name="Crear_EditarHorariosDisponibles"
        component={Crear_EditarHorariosDisponibles}
        options={{ title: "Crear/Editar Horario" }}
      />
      <Stack.Screen 
        name="EliminarHorariosDisponibles"
        component={EliminarHorariosDisponibles}
        options={{ title: "Eliminar Horario" }}
      />
      <Stack.Screen 
        name="DetalleHorariosDisponibles"
        component={DetalleHorariosDisponibles}
        options={{ title: "Detalle Horario" }}
      />
    </Stack.Navigator>
  );
}
