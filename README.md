# AsistenciaApp: control de asistencias escolares

App móvil para que maestros y alumnos lleven el control de asistencias, justificantes y el seguimiento emocional del grupo. Forma parte del proyecto **Face Guard** de la Universidad Tecnológica de Tehuacán, que identifica a los alumnos por reconocimiento facial desde el backend.

*React Native · Expo · TypeScript · Socket.io · Expo Print / Sharing · React Native Chart Kit*

## Funciones

- **Inicio de sesión** con vistas distintas para alumno y maestro.
- **Grupos y alumnos:** el maestro consulta sus grupos y la lista de cada uno.
- **Calendario** de asistencias.
- **Justificantes:** el alumno envía su justificante y el maestro lo revisa.
- **Estadísticas** con gráficas de barras y de pastel que se actualizan en tiempo real con **Socket.io**.
- **Reportes en PDF** que se pueden compartir desde el teléfono.
- **Registro de emociones** del grupo y **notificaciones**.

## Estructura

```text
app/(tabs)/        pantallas (login, inicio, inicioMaestro, Calendario, Estadisticas, justificantes...)
app/src/services/  cliente de la API con manejo de errores y timeout
app/src/config/    URL de la API para desarrollo y producción
components/        componentes reutilizables con tema claro/oscuro
```

## Ejecutar

```bash
npm install
npx expo start
```

Abre la app en Expo Go o en un emulador de Android. La URL del backend se configura en `app/src/config/config.js`.
