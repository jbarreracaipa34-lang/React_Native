import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListarAdmins from "../../../Screen/Admin/ListarAdmins";
import Crear_EditarAdmin from "../../../Screen/Admin/Crear_EditarAdmin";
import DetalleAdmin from "../../../Screen/Admin/DetalleAdmin";
import EliminarAdmin from "../../../Screen/Admin/EliminarAdmin";

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator initialRouteName="ListarAdmins">
      <Stack.Screen 
        name="ListarAdmins" 
        component={ListarAdmins} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Crear_EditarAdmin" 
        component={Crear_EditarAdmin} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DetalleAdmin" 
        component={DetalleAdmin} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EliminarAdmin" 
        component={EliminarAdmin} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

