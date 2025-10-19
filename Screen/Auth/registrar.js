import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService'; 

export default function Registrar({ navigation }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    fechaNacimiento: '',
    genero: 'M',
    telefono: '',
    email: '',
    direccion: '',
    eps: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTipoDocModal, setShowTipoDocModal] = useState(false);
  const [showGeneroModal, setShowGeneroModal] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTipoDocText = () => {
    switch(formData.tipoDocumento) {
      case 'CC': return 'Cédula de Ciudadanía';
      case 'TI': return 'Tarjeta de Identidad';
      case 'CE': return 'Cédula de Extranjería';
      default: return 'Seleccionar tipo de documento';
    }
  };

  const getGeneroText = () => {
    switch(formData.genero) {
      case 'M': return 'Masculino';
      case 'F': return 'Femenino';
      default: return 'Seleccionar género';
    }
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.apellido || !formData.numeroDocumento || 
        !formData.fechaNacimiento || !formData.telefono || !formData.email || 
        !formData.direccion || !formData.eps || !formData.password || !formData.password_confirmation) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return false;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await AuthService.registerPaciente(formData);

      if (result.success) {
        Alert.alert('Registro exitoso', 'Tu cuenta de paciente ha sido creada correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'PacienteInicio' }]
                });
              }
            }
          ]
        );
      } else {
        console.log('Error del servidor:', result.message);
        Alert.alert('Error', result.message || 'Error en el registro');
      }
    } catch (error) {
      Alert.alert('Error', `Error de conexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🏥</Text>
        </View>

        <Text style={styles.title}>Registro de Paciente</Text>
        <Text style={styles.subtitle}>Completa la informacion para registrarte como paciente</Text>

        <View style={styles.formContainer}>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                value={formData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Apellido</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu apellido"
                value={formData.apellido}
                onChangeText={(value) => handleInputChange('apellido', value)}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Tipo de Documento</Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowTipoDocModal(true)}
            >
              <Ionicons name="card-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <Text style={styles.pickerText}>{getTipoDocText()}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Número de Documento</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu número de documento"
                value={formData.numeroDocumento}
                onChangeText={(value) => handleInputChange('numeroDocumento', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Fecha de Nacimiento</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.fechaNacimiento}
                onChangeText={(value) => handleInputChange('fechaNacimiento', value)}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Género</Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowGeneroModal(true)}
            >
              <Ionicons name="people-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <Text style={styles.pickerText}>{getGeneroText()}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu teléfono"
                value={formData.telefono}
                onChangeText={(value) => handleInputChange('telefono', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu correo"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Dirección</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu dirección"
                value={formData.direccion}
                onChangeText={(value) => handleInputChange('direccion', value)}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>EPS</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="medical-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu EPS"
                value={formData.eps}
                onChangeText={(value) => handleInputChange('eps', value)}
                autoCapitalize="words"
              />
            </View>
          </View>  

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Confirmar Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirma tu contraseña"
                value={formData.password_confirmation}
                onChangeText={(value) => handleInputChange('password_confirmation', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => navigation.navigate('IniciarSesion')}
          >
            <Text style={styles.loginButtonText}>¿Ya tienes cuenta? Inicia sesion</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showTipoDocModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTipoDocModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Tipo de Documento</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, formData.tipoDocumento === 'CC' && styles.modalOptionSelected]}
              onPress={() => {
                handleInputChange('tipoDocumento', 'CC');
                setShowTipoDocModal(false);
              }}
            >
              <Ionicons name="card-outline" size={24} color={formData.tipoDocumento === 'CC' ? '#1E88E5' : '#6B7280'} />
              <Text style={[styles.modalOptionText, formData.tipoDocumento === 'CC' && styles.modalOptionTextSelected]}>
                Cédula de Ciudadanía
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, formData.tipoDocumento === 'TI' && styles.modalOptionSelected]}
              onPress={() => {
                handleInputChange('tipoDocumento', 'TI');
                setShowTipoDocModal(false);
              }}
            >
              <Ionicons name="card-outline" size={24} color={formData.tipoDocumento === 'TI' ? '#1E88E5' : '#6B7280'} />
              <Text style={[styles.modalOptionText, formData.tipoDocumento === 'TI' && styles.modalOptionTextSelected]}>
                Tarjeta de Identidad
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, formData.tipoDocumento === 'CE' && styles.modalOptionSelected]}
              onPress={() => {
                handleInputChange('tipoDocumento', 'CE');
                setShowTipoDocModal(false);
              }}
            >
              <Ionicons name="card-outline" size={24} color={formData.tipoDocumento === 'CE' ? '#1E88E5' : '#6B7280'} />
              <Text style={[styles.modalOptionText, formData.tipoDocumento === 'CE' && styles.modalOptionTextSelected]}>
                Cédula de Extranjería
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowTipoDocModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGeneroModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGeneroModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Género</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, formData.genero === 'M' && styles.modalOptionSelected]}
              onPress={() => {
                handleInputChange('genero', 'M');
                setShowGeneroModal(false);
              }}
            >
              <Ionicons name="male-outline" size={24} color={formData.genero === 'M' ? '#1E88E5' : '#6B7280'} />
              <Text style={[styles.modalOptionText, formData.genero === 'M' && styles.modalOptionTextSelected]}>
                Masculino
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, formData.genero === 'F' && styles.modalOptionSelected]}
              onPress={() => {
                handleInputChange('genero', 'F');
                setShowGeneroModal(false);
              }}
            >
              <Ionicons name="female-outline" size={24} color={formData.genero === 'F' ? '#1E88E5' : '#6B7280'} />
              <Text style={[styles.modalOptionText, formData.genero === 'F' && styles.modalOptionTextSelected]}>
                Femenino
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowGeneroModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    placeholderTextColor: '#9CA3AF',
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  modalOptionSelected: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});