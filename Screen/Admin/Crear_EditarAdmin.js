import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';

export default function Crear_EditarAdmin({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const adminAEditar = route?.params?.admin;
  const isEditing = !!adminAEditar;

  useEffect(() => {
    loadUsuarioData();
    if (isEditing && adminAEditar) {
      cargarDatosAdmin();
    }
  }, []);

  const loadUsuarioData = async () => {
    try {
      const authData = await AuthService.isAuthenticated();
      if (authData.isAuthenticated) {
        setUsuario(authData.usuario);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    }
  };

  const cargarDatosAdmin = () => {
    setFormData({
      nombre: adminAEditar.nombre || '',
      apellido: adminAEditar.apellido || '',
      email: adminAEditar.email || '',
      password: '',
      password_confirmation: ''
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!isEditing && !formData.password_confirmation.trim()) {
      newErrors.password_confirmation = 'La confirmación de contraseña es obligatoria';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores antes de continuar');
      return;
    }

    if (!usuario || usuario.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para realizar esta acción');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isEditing) {

        const updateData = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email
        };
        
        if (formData.password) {
          updateData.password = formData.password;
          updateData.password_confirmation = formData.password_confirmation;
        }

        result = await AuthService.updateAdmin(adminAEditar.id, updateData);
      } else {

        result = await AuthService.registerAdmin(formData);
      }

      if (result.success) {
        Alert.alert(
          'Éxito',
          isEditing ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Ocurrió un error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', `Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    maxLength = null,
    secureTextEntry = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {['nombre', 'apellido', 'email'].includes(field) && (
          <Text style={styles.required}> *</Text>
        )}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          errors[field] && styles.inputError
        ]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        maxLength={maxLength}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Administrador' : 'Crear Administrador'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion Personal</Text>
          </View>

          {renderInput('Nombre', 'nombre', 'Ingrese el nombre')}
          {renderInput('Apellido', 'apellido', 'Ingrese el apellido')}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Informacion de Contacto</Text>
          </View>

          {renderInput('Email', 'email', 'Ingrese el email', 'email-address')}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Seguridad</Text>
          </View>

          {renderInput(
            isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña', 
            'password', 
            isEditing ? 'Deje vacío para mantener la actual' : 'Ingrese la contraseña',
            'default',
            false,
            null,
            true
          )}
          {renderInput(
            'Confirmar Contraseña', 
            'password_confirmation', 
            'Confirme la contraseña',
            'default',
            false,
            null,
            true
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !usuario}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#BBDEFB',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpace: {
    height: 40,
  },
});

