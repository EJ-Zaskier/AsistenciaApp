import { useState } from "react"
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { login, getUserData } from "../src/services/api" // Importar funciones actualizadas

const LoginScreen = () => {
  const router = useRouter()
  const [matricula, setMatricula] = useState("")
  const [password, setPassword] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!matricula || !password) {
      setMensaje("Por favor, ingresa tu matrícula y contraseña")
      return
    }

    setLoading(true)
    setMensaje("")

    try {
      console.log("Enviando solicitud de login...")
      const result = await login(matricula, password)
      console.log("Respuesta del servidor:", result)

      if (result.error) {
        // Maneja errores específicos del backend
        if (result.error.includes("Matrícula incorrecta")) {
          setMensaje("Matrícula incorrecta")
        } else if (result.error.includes("Contraseña incorrecta")) {
          setMensaje("Contraseña incorrecta")
        } else {
          setMensaje("Error: " + result.error)
        }
      } else {
        // Inicio de sesión exitoso
        setMensaje("Inicio de sesión exitoso")

        // Guardar el token en AsyncStorage
        await AsyncStorage.setItem("token", result.token)

        try {
          // Obtener los datos completos del usuario usando la función actualizada
          const userData = await getUserData(result.token)
          console.log("Datos del usuario recibidos:", userData)

          // Guardar los datos del usuario en AsyncStorage
          await AsyncStorage.setItem("user", JSON.stringify(userData))

          // Redirigir según el rol
          if (result.rol === "alumno") {
            router.push("/inicio")
          } else if (result.rol === "maestro") {
            router.push("/inicioMaestro")
          } else {
            setMensaje("Error: Rol de usuario desconocido")
          }
        } catch (userError) {
          console.error("Error al obtener datos del usuario:", userError)
          setMensaje("Error al obtener datos del usuario")
        }
      }
    } catch (error) {
      console.error("Error en el login:", error)
      setMensaje("Error: No se pudo conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>¡Bienvenido!</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>MATRICULA</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="352398671"
                placeholderTextColor="#999"
                value={matricula}
                onChangeText={setMatricula}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CONTRASEÑA</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="****"
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
          </TouchableOpacity>

          {mensaje ? (
            <Text style={[styles.mensaje, mensaje.includes("Error") ? styles.mensajeError : styles.mensajeExito]}>
              {mensaje}
            </Text>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    
  },
  logo: {
    width: 333,
    height: 333, 
  },
  formContainer: {
    backgroundColor: "#95AAAA",
    borderRadius: 25,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 44,
    color: "#333",
    paddingHorizontal: 5,
  },
  button: {
    backgroundColor: "#2F4F4F",
    borderRadius: 10,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mensaje: {
    textAlign: "center",
    marginTop: 15,
    padding: 3,
    borderRadius: 15,
  },
  mensajeError: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  mensajeExito: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
});

export default LoginScreen;