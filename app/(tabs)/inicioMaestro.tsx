import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Group {
  grupo: string
  nombre: string
  id_carrera: string
  descripcion: string
}

interface Carrera {
  _id: string
  nombre: string
}

interface User {
  nombre_completo: string
  rol: string
}

export default function GroupListScreen() {
  const [groups, setGroups] = useState<Group[]>([])
  const [carreras, setCarreras] = useState<{ [key: string]: string }>({})
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    fetchGroups()
    fetchCarreras()
    fetchUser()

    // Depuración adicional
    AsyncStorage.getItem("user").then((userData) => {
      if (userData) {
        console.log("DEBUG - Estructura completa del usuario:", JSON.parse(userData))
      }
    })
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch("http://192.168.56.1:5000/api/grupos")
      const data = await response.json()
      console.log("Grupos obtenidos:", JSON.stringify(data, null, 2))
      setGroups(data)
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const fetchCarreras = async () => {
    try {
      const response = await fetch("http://192.168.56.1:5000/api/carrera")
      const data: Carrera[] = await response.json()
      console.log("Carreras obtenidas:", JSON.stringify(data, null, 2))
      const carrerasMap = data.reduce(
        (acc, carrera) => {
          acc[carrera._id] = carrera.nombre
          return acc
        },
        {} as { [key: string]: string },
      )
      setCarreras(carrerasMap)
    } catch (error) {
      console.error("Error fetching carreras:", error)
    }
  }

  const fetchUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      console.log("User data from AsyncStorage:", userData)
      if (userData) {
        const parsedUser = JSON.parse(userData)
        console.log("Parsed user data:", parsedUser)
        setUser(parsedUser)
        // Verifica diferentes propiedades donde podría estar el nombre
        setUserName(parsedUser.nombre_completo || parsedUser.nombre || parsedUser.name || "")
      } else {
        console.log("No user data found in AsyncStorage")
      }
    } catch (error) {
      console.error("Error fetching user from AsyncStorage:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user")
      await AsyncStorage.removeItem("token")
      console.log("Cerrando sesión...")
      router.replace("/login")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const handleGroupSelect = (group: Group) => {
    console.log(`Navegando al grupo: ${group.nombre || group.grupo}`)
    // Guardar el grupo seleccionado en AsyncStorage para acceder a él en otras pantallas
    AsyncStorage.setItem("selectedGroup", JSON.stringify(group))
    // Navegar a la pantalla de asistencias del grupo
    router.push({
      pathname: "/VerMas" as const,
      params: { groupId: group.grupo },
    })
  }

  const handleEmotions = () => {
    console.log("Navegando a la pantalla de Emociones...")
    router.push("/Emociones")
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Grupos</Text>
          <Text style={styles.subtitleText}>
            Bienvenido, {user?.nombre_completo || user?.nombre_completo || userName || "Usuario"}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.content}>
        {groups.map((group) => (
          <TouchableOpacity key={group.grupo} style={styles.groupCard} onPress={() => handleGroupSelect(group)}>
            <Text style={styles.groupName}>{group.nombre ? group.nombre : `Grupo ${group.grupo}`}</Text>
            <Text style={styles.careerText}>{group.descripcion || "No especificada"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botón de Emociones */}
      <View style={styles.emotionsButtonContainer}>
        <TouchableOpacity style={styles.emotionsButton} onPress={handleEmotions}>
          <Text style={styles.emotionsButtonText}>Emociones</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7697a0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#7697a0",
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 24,
    color: "white",
    fontFamily: "Montserrat",
    fontWeight: "bold",
  },
  subtitleText: {
    fontSize: 16,
    color: "white",
    fontFamily: "Montserrat",
    opacity: 0.9,
  },
  welcomeText: {
    fontSize: 18,
    color: "white",
    fontFamily: "Montserrat",
  },
  logoutButton: {
    backgroundColor: "#b6cce4",
    padding: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: "white",
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupName: {
    fontSize: 18,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    fontWeight: "bold",
    marginBottom: 8,
  },
  careerText: {
    color: "#7f8c8d",
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  emotionsButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emotionsButton: {
    backgroundColor: "#b6cce4",
    padding: 12,
    borderRadius: 20,
    paddingHorizontal: 24,
  },
  emotionsButtonText: {
    color: "white",
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "bold",
  },
})