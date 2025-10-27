# 📱 Sistema de Gestión de Citas Médicas - App Móvil

## 📋 Descripción del Sistema

Aplicación móvil desarrollada en React Native con Expo para la gestión integral
de citas médicas. El sistema permite a clínicas, hospitales y consultorios
médicos gestionar de manera eficiente las citas entre médicos y pacientes, con
funcionalidades específicas para cada rol del sistema de salud.

## 🏥 Características del Sistema Médico

### Gestión Integral de Citas

- **Programación de citas** con validación de disponibilidad
- **Confirmación automática** de citas por parte de médicos
- **Recordatorios** automáticos para pacientes
- **Cancelación y reprogramación** de citas
- **Estados de seguimiento**: Pendiente, Confirmada, Cancelada, Completada

### Administración de Horarios Médicos

- **Configuración de horarios** por médico y especialidad
- **Bloqueo de horarios** ocupados automáticamente
- **Validación de compatibilidad** entre fecha y horario médico
- **Gestión de disponibilidad** en tiempo real

### Gestión de Especialidades Médicas

- **Catálogo de especialidades** médicas
- **Asignación de médicos** por especialidad
- **Filtrado de citas** por especialidad
- **Administración centralizada** de especialidades

## 🏗️ Arquitectura Técnica

### Frontend Mobile

```
React_Native/
├── App.js
├── package.json
├── assets/
├── components/
│   └── CardComponent.js
├── Screen/
│   ├── Admin/
│   ├── Auth/
│   ├── Citas/
│   ├── Configuracion/
│   ├── Especialidades/
│   ├── horariosDisponibles/
│   ├── inicio/
│   ├── Medicos/
│   └── Pacientes/
└── Src/
    ├── Hooks/
    ├── Navegation/
    └── Services/
```

### Stack Tecnológico

- **React Native 0.81.4** - Framework móvil principal
- **Expo SDK 54** - Herramientas de desarrollo móvil
- **React Navigation 7** - Navegación entre pantallas
- **Axios 1.12.2** - Cliente HTTP para APIs médicas
- **AsyncStorage 2.2.0** - Almacenamiento local de datos médicos
- **Expo Notifications** - Sistema de notificaciones médicas

### Backend Médico

- **Laravel** - API REST para sistema médico
- **MySQL** - Base de datos de citas médicas
- **Sanctum** - Autenticación segura de usuarios médicos

## 👥 Roles del Sistema Médico

### 🔐 Administrador Médico

**Funcionalidades:**

- Gestión completa de médicos y pacientes
- Administración de especialidades médicas
- Supervisión de todas las citas del sistema
- Control de acceso y permisos médicos
- Reportes y estadísticas de citas

**Pantallas:**

- Dashboard administrativo con métricas médicas
- Gestión de usuarios médicos y pacientes
- Administración de especialidades
- Supervisión de horarios médicos
- Reportes de citas y estadísticas

### 👨‍⚕️ Médico

**Funcionalidades:**

- Visualización de citas asignadas
- Gestión de horarios disponibles
- Confirmación/cancelación de citas
- Edición de observaciones médicas
- Notificaciones de nuevas citas

**Pantallas:**

- Dashboard médico con citas del día
- Gestión de horarios disponibles
- Lista de citas pendientes y confirmadas
- Perfil médico y especialidades
- Configuración de notificaciones

### 🏥 Paciente

**Funcionalidades:**

- Solicitud de citas médicas
- Visualización de citas programadas
- Edición limitada de observaciones
- Notificaciones de recordatorios
- Historial de citas médicas

**Pantallas:**

- Dashboard paciente con citas próximas
- Solicitud de nuevas citas
- Historial de citas médicas
- Perfil de paciente y datos médicos
- Configuración de notificaciones

## 📱 Módulos del Sistema

### 🔐 Autenticación Médica

**Características:**

- Login seguro con validación de credenciales médicas
- Registro de nuevos usuarios del sistema médico
- Gestión de sesiones con tokens seguros
- Navegación automática según rol médico

**Validaciones:**

- Verificación de credenciales médicas
- Validación de permisos por rol
- Control de acceso a funcionalidades médicas

### 📅 Gestión de Citas Médicas

**Funcionalidades:**

- Creación de citas con validación médica
- Edición con restricciones por rol médico
- Eliminación con validaciones de negocio médico
- Validación de compatibilidad fecha-horario médico
- Estados médicos: Pendiente, Confirmada, Cancelada, Completada

**Validaciones Médicas:**

- Verificación de disponibilidad del médico
- Validación de horarios médicos disponibles
- Control de citas futuras vs pasadas
- Prevención de doble reserva

### ⏰ Gestión de Horarios Médicos

**Características:**

- Creación de horarios disponibles por médico
- Edición de horarios médicos existentes
- Eliminación con validación de citas asociadas
- Bloqueo automático de horarios ocupados
- Gestión de disponibilidad médica

**Validaciones:**

- Prevención de eliminación con citas pendientes
- Validación de horarios médicos válidos
- Control de conflictos de horarios
- Verificación de disponibilidad médica

### 👨‍⚕️ Gestión de Médicos

**Funcionalidades:**

- CRUD completo de médicos
- Asignación de especialidades médicas
- Gestión de horarios disponibles
- Validación de datos médicos profesionales
- Control de permisos médicos

**Datos Médicos:**

- Información profesional del médico
- Especialidades médicas asignadas
- Horarios de disponibilidad
- Datos de contacto médico
- Credenciales médicas

### 🏥 Gestión de Pacientes

**Características:**

- CRUD completo de pacientes
- Información de contacto y EPS
- Historial de citas médicas
- Gestión de datos personales médicos
- Seguimiento de citas médicas

**Datos del Paciente:**

- Información personal y médica
- Datos de contacto y EPS
- Historial de citas médicas
- Observaciones médicas
- Preferencias de comunicación

### 🎯 Gestión de Especialidades Médicas

**Funcionalidades:**

- Creación de especialidades médicas
- Edición de especialidades existentes
- Eliminación con validaciones médicas
- Asignación de médicos por especialidad
- Catálogo de especialidades médicas

**Características:**

- Catálogo completo de especialidades
- Asignación de médicos por especialidad
- Filtrado de citas por especialidad
- Administración centralizada

## 🔧 Servicios Médicos

### AuthService.js - Autenticación Médica

```javascript
login(credentials);
register(userData);
isAuthenticated();
logout();
getCitas();
crearCita(citaData);
editarCita(id, data);
eliminarCita(id);
getMedicos();
getPacientes();
getHorariosDisponibles();
crearHorario(data);
eliminarHorario(id);
```

### NotificationService.js - Notificaciones Médicas

```javascript
configureNotifications();
scheduleNotification();
cancelNotification();
NotificationProvider;
```

### NavegationService.js - Navegación Médica

```javascript
navigationRef;
navigate(route, params);
```

## 🔄 Hooks Médicos

### useNotifications.js

Hook personalizado para manejo de notificaciones médicas:

```javascript
notifyAppointmentCreated();
notifyAppointmentUpdated();
scheduleAppointmentReminder();
permissionsGranted;
```

## 🧭 Sistema de Navegación Médica

### Estructura de Navegación

- **AuthNavigation** - Pantallas de autenticación médica
- **AppNavigation** - Navegación principal médica
- **Stack Navigators** - Navegación por módulos médicos:
  - AdminStack - Administración médica
  - CitasStack - Gestión de citas médicas
  - MedicosStack - Gestión de médicos
  - PacientesStack - Gestión de pacientes
  - EspecialidadesStack - Gestión de especialidades
  - HorariosDisponiblesStack - Gestión de horarios médicos

### Flujo de Navegación Médica

1. **Inicio** → Verificación de autenticación médica
2. **Login/Registro** → Autenticación de usuario médico
3. **Dashboard Médico** → Según rol del usuario médico
4. **Módulos Médicos** → Funcionalidades específicas por rol médico

## 📱 Pantallas del Sistema Médico

### 🔐 Autenticación Médica

- **iniciarSession.js** - Pantalla de login médico
- **registrar.js** - Pantalla de registro médico

### 🏠 Dashboards Médicos

- **inicio.js** - Pantalla principal médica
- **adminInicio.js** - Dashboard de administrador médico
- **medicoInicio.js** - Dashboard de médico
- **pacienteInicio.js** - Dashboard de paciente
- **perfil.js** - Perfil de usuario médico

### 📅 Gestión de Citas Médicas

- **ListarCitas.js** - Lista de citas médicas
- **Crear_EditarCitas.js** - Crear/editar citas médicas
- **DetalleCitas.js** - Detalle de cita médica
- **EliminarCitas.js** - Eliminar citas médicas

### ⏰ Gestión de Horarios Médicos

- **ListarhorariosDisponibles.js** - Lista de horarios médicos
- **Crear_EditarhorariosDisponibles.js** - Crear/editar horarios médicos
- **DetallehorariosDisponibles.js** - Detalle de horario médico
- **EliminarhorariosDisponibles.js** - Eliminar horarios médicos

### 👨‍⚕️ Gestión de Médicos

- **ListarMedicos.js** - Lista de médicos
- **Crear_EditarMedicos.js** - Crear/editar médicos
- **DetalleMedicos.js** - Detalle de médico
- **EliminarMedicos.js** - Eliminar médicos

### 🏥 Gestión de Pacientes

- **ListarPacientes.js** - Lista de pacientes
- **Crear_EditarPacientes.js** - Crear/editar pacientes
- **DetallePacientes.js** - Detalle de paciente
- **EliminarPacientes.js** - Eliminar pacientes

### 🎯 Gestión de Especialidades Médicas

- **ListarEspecialidades.js** - Lista de especialidades médicas
- **Crear_EditarEspecialidades.js** - Crear/editar especialidades médicas
- **DetalleEspecialidades.js** - Detalle de especialidad médica
- **EliminarEspecialidades.js** - Eliminar especialidades médicas

### 👤 Gestión de Administradores Médicos

- **ListarAdmins.js** - Lista de administradores médicos
- **Crear_EditarAdmin.js** - Crear/editar administradores médicos
- **DetalleAdmin.js** - Detalle de administrador médico
- **EliminarAdmin.js** - Eliminar administradores médicos

## 🔒 Validaciones y Seguridad Médica

### Validaciones de Formularios Médicos

- **Campos obligatorios** con indicadores visuales médicos
- **Formato de fechas** médicas (YYYY-MM-DD)
- **Formato de horas** médicas (HH:MM)
- **Compatibilidad** fecha-horario médico
- **Validación de emails** y documentos médicos

### Restricciones por Rol Médico

- **Administrador**: Acceso total al sistema médico
- **Médico**: Solo sus citas y horarios médicos
- **Paciente**: Solo sus propias citas médicas

### Validaciones de Negocio Médico

- **Horarios ocupados**: No permitir citas en horarios médicos ocupados
- **Citas futuras**: Solo permitir edición de citas médicas futuras
- **Dependencias**: Validar eliminación de horarios con citas médicas asociadas
- **Compatibilidad**: Validar que la fecha coincida con el día del horario
  médico

## 🔔 Sistema de Notificaciones Médicas

### Tipos de Notificaciones Médicas

- **Cita médica creada** - Confirmación de creación de cita médica
- **Cita médica actualizada** - Cambios en la cita médica
- **Recordatorio médico** - Notificación antes de la cita médica
- **Cita médica cancelada** - Notificación de cancelación médica

### Configuración de Notificaciones Médicas

- **Permisos** de notificación médica
- **Programación** automática de recordatorios médicos
- **Personalización** de mensajes médicos

## 🚀 Instalación y Configuración

### Prerrequisitos Técnicos

- Node.js (v16 o superior)
- npm o yarn
- Expo CLI
- Android Studio / Xcode (para desarrollo móvil nativo)

### Instalación del Sistema Médico

```bash
git clone [url-del-repositorio-medico]
cd React_Native
npm install
npm start
```

### Scripts de Desarrollo Médico

```bash
npm start
npm run android
npm run ios
npm run web
```

## 🔧 Configuración del Backend Médico

### Variables de Entorno Médicas

Configurar las siguientes variables en el backend Laravel médico:

- **APP_URL**: URL base de la API médica
- **DB_CONNECTION**: Conexión a base de datos médica
- **SANCTUM_STATEFUL_DOMAINS**: Dominios permitidos médicos

### Endpoints Principales Médicos

- **POST /api/login** - Autenticación médica
- **POST /api/registrar** - Registro médico
- **GET /api/citas** - Obtener citas médicas
- **POST /api/crearCitas** - Crear cita médica
- **PUT /api/editarCitas/{id}** - Editar cita médica
- **DELETE /api/eliminarCitas/{id}** - Eliminar cita médica
- **GET /api/horariosDisponiblesPorMedico** - Obtener horarios médicos
- **POST /api/crearHorarios** - Crear horario médico
- **DELETE /api/eliminarHorarios/{id}** - Eliminar horario médico

## 🐛 Debugging y Logs Médicos

### Herramientas de Debug Médico

- **React Native Debugger** - Debugging avanzado médico
- **Flipper** - Inspector de red y estado médico
- **Console logs** - Logs de desarrollo médico
- **Error boundaries** - Manejo de errores médicos

### Logs Importantes Médicos

- **Autenticación médica** - Logs de login/logout médico
- **API calls médicas** - Requests y responses médicos
- **Navegación médica** - Cambios de pantalla médica
- **Notificaciones médicas** - Estado de permisos médicos

## 📝 Notas de Versión Médica

### v1.0.0 (Actual)

- ✅ Sistema completo de gestión de citas médicas
- ✅ Autenticación por roles médicos
- ✅ Notificaciones push médicas
- ✅ Validaciones de negocio médico
- ✅ Interfaz responsive médica
- ✅ Gestión de horarios médicos
- ✅ Validación de compatibilidad fecha-horario médico
- ✅ Bloqueo de eliminación de horarios con citas asociadas

---

## 👨‍💻 Desarrollador

**Juan Pablo Barrera Caipa**
