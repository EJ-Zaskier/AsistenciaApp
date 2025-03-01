"use client"
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
import { login } from "../src/services/api" // Importa la función login

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
        if (result.rol === "alumno") {
          router.push("/inicio")
        } else if (result.rol === "maestro") {
          router.push("/inicioMaestro")
        } else {
          setMensaje("Error: Rol de usuario desconocido")
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
            // source={require('./assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>FACE GUARD</Text>
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
  )
}

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
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2F4F4F",
  },
  formContainer: {
    backgroundColor: "#95AAAA",
    borderRadius: 25,
    padding: 20,
    width: "100%",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
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
  },
  input: {
    flex: 1,
    height: 45,
    color: "#333",
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#2F4F4F",
    borderRadius: 10,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mensaje: {
    textAlign: "center",
    marginTop: 15,
    padding: 10,
    borderRadius: 5,
  },
  mensajeError: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  mensajeExito: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
})

export default LoginScreen

