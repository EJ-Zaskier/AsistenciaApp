import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { io } from "socket.io-client"

interface Asistencia {
  _id: string
  fecha: string
  estado: string
  id_salon: string
  id_horario: string
  id_alumno: {
    _id: string
    matricula: string
    nombre_completo: string
  }
  id_materia: {
    _id: string
    nombre: string
  }
}

interface Subject {
  _id: string
  nombre: string
  grado: string
  id_carrera: string
  asistencias: Asistencia[]
}

interface User {
  _id: string
  id_alumno: string
  nombre_completo: string
  matricula: string
  grupo: string
  carrera: string
}

export default function AttendanceScreen() {
  const [user, setUser] = useState<User | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedTab, setSelectedTab] = useState("attendance")

  useEffect(() => {
    fetchUserData()
    const socket = io("http://192.168.56.1:5000")
    socket.on("attendanceUpdate", (updatedAttendance: Asistencia) => {
      setSubjects((prevSubjects) => {
        return prevSubjects.map((subject) => {
          if (subject._id === updatedAttendance.id_materia._id) {
            const updatedAsistencias = subject.asistencias.map((asistencia) =>
              asistencia._id === updatedAttendance._id ? updatedAttendance : asistencia
            )
            return {
              ...subject,
              asistencias: updatedAsistencias,
            }
          }
          return subject
        })
      })
    })
    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        console.log("Datos del usuario recibidos:", parsedUser)
        setUser(parsedUser)
        setSubjects([]) // Limpiar materias anteriores
        await fetchSubjects(parsedUser.id_alumno) // Usar id_alumno en lugar de _id
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
    }
  }

  const fetchSubjects = async (userId: string) => {
    try {
      const response = await fetch(`http://192.168.56.1:5000/api/materias?alumno=${userId}`)

      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`)
      }

      const data = await response.json()
      console.log("Materias recibidas:", data)

      if (Array.isArray(data)) {
        const subjectsWithAttendance = await Promise.all(
          data.map(async (subject) => {
            const asistencias = await fetchAsistencias(subject._id)
            return { ...subject, asistencias }
          })
        )
        setSubjects(subjectsWithAttendance)
      } else {
        console.error("La respuesta de materias no es un array", data)
        Alert.alert("Error", "Error al cargar las materias. Inténtalo de nuevo más tarde.")
      }
    } catch (error) {
      console.error("Error al obtener materias:", error)
      Alert.alert("Error", "No se pudieron cargar las materias. Inténtalo de nuevo más tarde.")
    }
  }

  const fetchAsistencias = async (subjectId: string) => {
    try {
      const response = await fetch(`http://192.168.56.1:5000/api/Asistencia?materia=${subjectId}`)

      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`)
      }

      const asistencias: Asistencia[] = await response.json()
      console.log("Asistencias recibidas:", asistencias)

      // Asegúrate de que los datos del usuario estén disponibles antes de filtrar
      const userData = await AsyncStorage.getItem("user")
      if (userData) {
        const parsedUser: User = JSON.parse(userData)
        // Filtra los datos de asistencia para incluir solo la asistencia del usuario que ha iniciado sesión
        const userAttendance = asistencias.filter(a => a.id_alumno._id === parsedUser.id_alumno)
        return userAttendance
      } else {
        return []
      }
    } catch (error) {
      console.error("Error al obtener asistencias:", error)
      Alert.alert("Error", "No se pudieron cargar las asistencias. Inténtalo de nuevo más tarde.")
      return []
    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user")
      await AsyncStorage.removeItem("token")
      setUser(null) // Limpiar estado del usuario
      setSubjects([]) // Limpiar estado de materias
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const handleJustify = () => {
    router.push("/justificar")
  }

  const handleNotifications = () => {
    router.push("/notificaciones")
  }

  const MonthlyAttendance = ({ subject }: { subject: Subject }) => {
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    const today = new Date()
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
    const [selectedYear, setSelectedYear] = useState(today.getFullYear())

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()

    const goToPreviousMonth = () => {
      if (selectedMonth === 0) {
        setSelectedMonth(11)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    }

    const goToNextMonth = () => {
      if (selectedMonth === 11) {
        setSelectedMonth(0)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    }

    const isDateInFuture = (date: Date) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date > today
    }

    const getAttendanceForDate = (dateStr: string) => {
      return subject.asistencias?.find((a) => {
        const asistenciaDate = new Date(a.fecha)
        const formattedDate = `${asistenciaDate.getFullYear()}-${String(asistenciaDate.getMonth() + 1).padStart(2, "0")}-${String(asistenciaDate.getDate()).padStart(2, "0")}`
        return formattedDate === dateStr
      })
    }

    const calculateMonthlyAttendancePercentage = () => {
      // Filtrar asistencias del mes seleccionado
      const monthAsistencias = subject.asistencias.filter((a) => {
        const asistenciaDate = new Date(a.fecha)
        return asistenciaDate.getMonth() === selectedMonth && asistenciaDate.getFullYear() === selectedYear
      })

      // Contar días pasados en el mes (no incluir días futuros)
      const today = new Date()
      const lastDay = Math.min(
        daysInMonth,
        selectedYear === today.getFullYear() && selectedMonth === today.getMonth() ? today.getDate() : daysInMonth,
      )

      // Si estamos viendo un mes futuro, no hay días para contar
      if (
        selectedYear > today.getFullYear() ||
        (selectedYear === today.getFullYear() && selectedMonth > today.getMonth())
      ) {
        return "N/A"
      }

      const presentDays = monthAsistencias.filter((a) => a.estado === "asistencia").length
      const percentage = Math.round((presentDays / lastDay) * 100)

      return `${percentage}%`
    }

    const getPercentageColor = () => {
      const percentageText = calculateMonthlyAttendancePercentage()
      if (percentageText === "N/A") return "#666"

      const percentage = Number.parseInt(percentageText)
      if (percentage < 80) return "#FF5252"
      if (percentage === 80) return "#FFC107"
      return "#4CAF50"
    }

    // Generar días de la semana del mes
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(selectedYear, selectedMonth, i)
      const dayOfWeek = dateObj.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue // Saltar domingos (0) y sábados (6)

      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      const isFuture = isDateInFuture(dateObj)
      const attendance = getAttendanceForDate(dateStr)

      days.push(
        <View key={i} style={styles.dayCell}>
          <Text style={styles.dayNumber}>{i}</Text>
          {isFuture ? (
            <FontAwesome name="circle-thin" size={16} color="#ccc" />
          ) : (
            <MaterialIcons
              name={attendance?.estado === "asistencia" ? "check-circle" : "cancel"}
              size={16}
              color={attendance?.estado === "asistencia" ? "green" : "red"}
            />
          )}
        </View>,
      )
    }

    return (
      <View style={styles.attendanceContainer}>
        <View style={styles.monthNavigator}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#2c3e50" />
          </TouchableOpacity>

          <Text style={styles.monthYearText}>
            {monthNames[selectedMonth]} {selectedYear}
          </Text>

          <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
            <MaterialIcons name="arrow-forward-ios" size={20} color="#2c3e50" />
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>{days}</View>

        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageLabel, { color: getPercentageColor() }]}>Porcentaje de asistencia:</Text>
          <Text style={[styles.percentageValue, { color: getPercentageColor() }]}>
            {calculateMonthlyAttendancePercentage()}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.justifyButton} onPress={handleJustify}>
          <MaterialIcons name="note-add" size={20} color="white" />
          <Text style={styles.justifyText}>Justificar</Text>
        </TouchableOpacity>

        <Text style={styles.titleText}>{"Bienvenido,\n" + (user?.nombre_completo || "Usuario")}</Text>

        <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {subjects && subjects.length > 0 ? (
          subjects.map((subject, index) => (
            <View key={index} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subject.nombre}</Text>
              </View>

              <Text style={styles.scheduleText}>{`Grado: ${subject.grado}`}</Text>

              <MonthlyAttendance subject={subject} />
            </View>
          ))
        ) : (
          <Text style={styles.noSubjectsText}>No hay materias disponibles</Text>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, selectedTab === "attendance" && styles.navButtonActive]}
          onPress={() => setSelectedTab("attendance")}
        >
          <MaterialIcons name="assessment" size={24} color={selectedTab === "attendance" ? "#b6cce4" : "#fff"} />
          <Text style={[styles.navText, selectedTab === "attendance" && styles.navTextActive]}>Estadísticas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={handleNotifications}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <Text style={styles.navText}>Notificaciones</Text>
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
  titleText: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
    fontFamily: "Montserrat",
  },
  justifyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#b6cce4",
    padding: 8,
    borderRadius: 20,
  },
  justifyText: {
    marginLeft: 4,
    color: "white",
    fontFamily: "Montserrat",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#b6cce4",
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subjectCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 18,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    fontWeight: "bold",
  },
  scheduleText: {
    color: "#666",
    marginBottom: 12,
    fontFamily: "Montserrat",
  },
  attendanceContainer: {
    marginTop: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
  },
  monthNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    padding: 8,
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    fontWeight: "bold",
  },
  tableContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "white",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#eee",
  },
  dayNumber: {
    fontSize: 12,
    color: "#2c3e50",
    marginBottom: 2,
    fontFamily: "Montserrat",
  },
  percentageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  percentageLabel: {
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  percentageValue: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#5f7d85",
    padding: 10,
    justifyContent: "space-around",
  },
  navButtonActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  navText: {
    color: "#fff",
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  navTextActive: {
    color: "#b6cce4",
  },
  noSubjectsText: {
    fontSize: 16,
    textAlign: "center",
    color: "white",
    fontFamily: "Montserrat",
  },
})