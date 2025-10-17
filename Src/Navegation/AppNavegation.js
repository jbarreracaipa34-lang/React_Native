import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import NavegacionPrincipal from "./NavegacionPrincipal";
import AuthNavegation from "./AuthNavegation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { navigationRef } from "../Services/NavegationService";

export default function AppNavegacion() {
  const [isCargando, setEstaCargando] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const appState = useRef(AppState.currentState);

  const loadToken = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      setUserToken(token);
    } catch (error) {
      console.error("Error al cargar el token:", error);
    } finally {
      setEstaCargando(false);
    }
  };

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App en primer plano, verificando token");
        loadToken();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.current === "active") {
        loadToken();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {userToken ? <NavegacionPrincipal /> : <AuthNavegation />}
    </NavigationContainer>
  );
}
