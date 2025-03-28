import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MaterialIcons } from "@expo/vector-icons"

const API_URL = "http://3.142.210.221:5000" // URL para desarrollo local


interface Group {
  _id: string
  grupo: string
  descripcion: string
  id_carrera: string
  alumnos: string[]
}

interface Carrera {
  _id: string
  nombre: string
}

interface User {
  _id: string
  nombre_completo: string
  rol: string
}

export default function GroupListScreen() {
  const [groups, setGroups] = useState<Group[]>([])
  const [carreras, setCarreras] = useState<{ [key: string]: string }>({})
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
    fetchCarreras()
    fetchUser()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/grupos`)
      const data = await response.json()
      console.log("Grupos obtenidos:", JSON.stringify(data, null, 2))
      setGroups(data)
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCarreras = async () => {
    try {
      const response = await fetch(`${API_URL}/api/carrera`)
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
    console.log(`Navegando al grupo: ${group.grupo} (${group._id})`)
    // Guardar el grupo seleccionado en AsyncStorage para acceder a él en otras pantallas
    AsyncStorage.setItem("selectedGroup", JSON.stringify(group))
    // Navegar a la pantalla de asistencias del grupo
    router.push({
      pathname: "/VerMas",
      params: { groupId: group._id },
    })
  }

  const handleNotifications = () => {
    console.log("Navegando a la pantalla de Notificaciones...")
    router.push("/notificaciones")
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
          <Text style={styles.subtitleText}>Bienvenido, {user?.nombre_completo || "Usuario"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleNotifications}>
          <MaterialIcons name="notifications" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Cargando grupos...</Text>
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <TouchableOpacity key={group._id} style={styles.groupCard} onPress={() => handleGroupSelect(group)}>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>Grupo {group.grupo}</Text>
                <Text style={styles.careerText}>{group.descripcion || "No especificada"}</Text>
                <Text style={styles.studentsCount}>
                  <MaterialIcons name="people" size={16} color="#7f8c8d" /> {group.alumnos?.length || 0} alumnos
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#b6cce4" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noGroupsText}>No hay grupos disponibles</Text>
        )}
      </ScrollView>

      {/* Botón de Emociones */}
      <View style={styles.emotionsButtonContainer}>
        <TouchableOpacity style={styles.emotionsButton} onPress={handleEmotions}>
          <MaterialIcons name="emoji-emotions" size={20} color="white" style={styles.emotionsIcon} />
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
  loadingText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Montserrat",
  },
  noGroupsText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Montserrat",
  },
  groupCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    fontWeight: "bold",
    marginBottom: 4,
  },
  careerText: {
    color: "#7f8c8d",
    fontFamily: "Montserrat",
    fontSize: 14,
    marginBottom: 4,
  },
  studentsCount: {
    color: "#7f8c8d",
    fontFamily: "Montserrat",
    fontSize: 14,
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
  },
  emotionsIcon: {
    marginRight: 8,
  },
  emotionsButtonText: {
    color: "white",
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerButton: {
    backgroundColor: "#b6cce4",
    padding: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
})
