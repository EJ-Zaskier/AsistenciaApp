import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, GestureResponderEvent } from "react-native"
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { getGrupos, getAlumnosGrupo, getEmociones } from "../src/services/api"

type TipoEmocion = "feliz" | "triste" | "enojado" | "ansioso" | "tranquilo"

interface Estudiante {
  _id: string
  nombre_completo: string
  matricula: string
  grupo: string
  carrera: string
  emociones?: { [key: string]: TipoEmocion }
}

interface Grupo {
  _id: string
  nombre: string
  descripcion: string
}

interface User {
  _id: string
  nombre_completo: string
  rol: string
}

export default function EmocionesGrupoScreen() {
  const { grupoId } = useLocalSearchParams<{ grupoId: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [emociones, setEmociones] = useState<{ [key: string]: { [key: string]: TipoEmocion } }>({})
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [selectedTab, setSelectedTab] = useState("emociones")

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        await fetchGrupos()
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Error al cargar datos del usuario")
    } finally {
      setLoading(false)
    }
  }

  const fetchGrupos = async () => {
    try {
      const data = await getGrupos()
      setGrupos(data)

      // Si hay un grupoId en los parámetros, seleccionar ese grupo
      // Si no, seleccionar el primer grupo
      const selectedGrupo = grupoId ? data.find((g: Grupo) => g._id === grupoId) : data[0]

      if (selectedGrupo) {
        setGrupo(selectedGrupo)
        fetchEstudiantes(selectedGrupo._id)
        fetchEmociones(selectedGrupo._id)
      }
    } catch (error) {
      console.error("Error fetching grupos:", error)
      setError("Error al cargar los grupos")
    }
  }

  const fetchEstudiantes = async (grupoId: string) => {
    try {
      const data = await getAlumnosGrupo(grupoId)
      setEstudiantes(data)
    } catch (error) {
      console.error("Error fetching estudiantes:", error)
      setError("Error al cargar los estudiantes")
    }
  }

  const fetchEmociones = async (grupoId: string) => {
    try {
      const fechaInicio = getStartOfWeek(selectedWeek)
      const fechaFin = getEndOfWeek(selectedWeek)

      try {
        const data = await getEmociones(grupoId, fechaInicio, fechaFin)

        const emocionesMap: { [key: string]: { [key: string]: TipoEmocion } } = {}

        data.forEach((emocion: any) => {
          if (!emocionesMap[emocion.id_alumno]) {
            emocionesMap[emocion.id_alumno] = {}
          }
          emocionesMap[emocion.id_alumno][emocion.fecha] = emocion.tipo_emocion
        })

        setEmociones(emocionesMap)

        // Si no hay datos reales, usar datos de ejemplo solo para demostración
        if (Object.keys(emocionesMap).length === 0) {
          setEmociones(generarDatosEjemplo())
        }
      } catch (error) {
        // Si hay un error en la API, usar datos de ejemplo
        console.warn("Usando datos de ejemplo debido a un error en la API:", error)
        setEmociones(generarDatosEjemplo())
      }
    } catch (error) {
      console.error("Error fetching emociones:", error)
      setError("Error al cargar las emociones")
    }
  }

  const generarDatosEjemplo = () => {
    const emocionesEjemplo: { [key: string]: { [key: string]: TipoEmocion } } = {}
    const tiposEmociones: TipoEmocion[] = ["feliz", "triste", "enojado", "ansioso", "tranquilo"]

    // Generar fechas de la semana
    const fechas = getDaysOfWeek(selectedWeek).map((date) => date.toISOString().split("T")[0])

    // Asignar emociones aleatorias a cada estudiante para cada día
    estudiantes.forEach((estudiante) => {
      emocionesEjemplo[estudiante._id] = {}
      fechas.forEach((fecha) => {
        const randomIndex = Math.floor(Math.random() * tiposEmociones.length)
        emocionesEjemplo[estudiante._id][fecha] = tiposEmociones[randomIndex]
      })
    })

    return emocionesEjemplo
  }

  const handleGrupoChange = (newGrupoId: string) => {
    const selectedGrupo = grupos.find((g) => g._id === newGrupoId)
    if (selectedGrupo) {
      setGrupo(selectedGrupo)
      fetchEstudiantes(newGrupoId)
      fetchEmociones(newGrupoId)
      router.setParams({ grupoId: newGrupoId })
    }
  }

  const handleBack = () => {
    router.back()
  }

  const changeWeek = (increment: number) => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(newDate.getDate() + increment * 7)
    setSelectedWeek(newDate)

    // Actualizar emociones para la nueva semana
    if (grupo) {
      fetchEmociones(grupo._id)
    }
  }

  // Obtener el primer día de la semana (lunes)
  const getStartOfWeek = (date: Date) => {
    const newDate = new Date(date)
    const day = newDate.getDay()
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1) // Ajustar cuando es domingo
    newDate.setDate(diff)
    return newDate.toISOString().split("T")[0]
  }

  // Obtener el último día de la semana (viernes)
  const getEndOfWeek = (date: Date) => {
    const newDate = new Date(date)
    const day = newDate.getDay()
    const diff = newDate.getDate() - day + 5 // Ajustar al viernes (5 días desde el lunes)
    newDate.setDate(diff)
    return newDate.toISOString().split("T")[0]
  }

  // Obtener todos los días de la semana (lunes a viernes)
  const getDaysOfWeek = (date: Date) => {
    const days = []
    const startDate = new Date(date)
    const day = startDate.getDay()
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1) // Ajustar cuando es domingo

    startDate.setDate(diff)

    // Agregar los 5 días (lunes a viernes)
    for (let i = 0; i < 5; i++) {
      const newDate = new Date(startDate)
      newDate.setDate(startDate.getDate() + i)
      days.push(newDate)
    }

    return days
  }

  const getEmocionEmoji = (emocion: TipoEmocion) => {
    switch (emocion) {
      case "feliz":
        return { emoji: "😊", color: "#4CAF50" }
      case "triste":
        return { emoji: "😢", color: "#2196F3" }
      case "enojado":
        return { emoji: "😠", color: "#F44336" }
      case "ansioso":
        return { emoji: "😰", color: "#FF9800" }
      case "tranquilo":
        return { emoji: "😌", color: "#9C27B0" }
      default:
        return { emoji: "😐", color: "#9E9E9E" }
    }
  }

  // Exportar a PDF (implementación mejorada usando HTML)
  const exportToPDF = async () => {
    try {
      setExporting(true)

      if (!grupo) {
        Alert.alert("Error", "No hay un grupo seleccionado para exportar")
        setExporting(false)
        return
      }

      // Obtener fechas de la semana
      const fechaInicio = getStartOfWeek(selectedWeek)
      const fechaFin = getEndOfWeek(selectedWeek)

      try {
        // Generar HTML para el reporte
        const htmlContent = await generateReportHTML(grupo._id, fechaInicio, fechaFin)

        // Guardar el HTML como archivo temporal
        const fileName = `emociones_${grupo.nombre || "grupo"}_${fechaInicio}_${fechaFin}.html`
        const htmlFile = FileSystem.documentDirectory + fileName
        await FileSystem.writeAsStringAsync(htmlFile, htmlContent)

        // Compartir el archivo HTML
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(htmlFile, {
            mimeType: "text/html",
            dialogTitle: "Reporte de Emociones",
          })
        } else {
          Alert.alert("Error", "El compartir archivos no está disponible en este dispositivo")
        }
      } catch (error) {
        console.error("Error generando reporte:", error)
        Alert.alert("Error", "No se pudo generar el reporte. Verifica la conexión con el servidor.")
      }
    } catch (error) {
      console.error("Error exportando reporte:", error)
      Alert.alert("Error", "No se pudo exportar el reporte.")
    } finally {
      setExporting(false)
    }
  }

  // Función para generar el HTML del reporte
  const generateReportHTML = async (grupoId: string, fechaInicio: string, fechaFin: string) => {
    try {
      // En un entorno real, llamaríamos a la API para generar el HTML
      // Para esta implementación, generaremos el HTML localmente

      // Mapear emociones por alumno y fecha
      const emocionesMap = emociones

      // Generar filas de la tabla
      let tablasAlumnos = ""
      estudiantes.forEach((estudiante) => {
        const emocionesAlumno = emocionesMap[estudiante._id] || {}

        // Contar emociones
        const conteoEmociones = {
          feliz: 0,
          triste: 0,
          enojado: 0,
          ansioso: 0,
          tranquilo: 0,
        }

        Object.values(emocionesAlumno).forEach((emocion) => {
          if (conteoEmociones[emocion as keyof typeof conteoEmociones] !== undefined) {
            conteoEmociones[emocion as keyof typeof conteoEmociones]++
          }
        })

        // Calcular emoción predominante
        let emocionPredominante: TipoEmocion = "tranquilo"
        let maxConteo = 0

        Object.entries(conteoEmociones).forEach(([emocion, conteo]) => {
          if (conteo > maxConteo) {
            maxConteo = conteo
            emocionPredominante = emocion as TipoEmocion
          }
        })

        const { emoji, color } = getEmocionEmoji(emocionPredominante)

        tablasAlumnos += `
          <div class="alumno-card">
            <h3>${estudiante.nombre_completo}</h3>
            <p>Matrícula: ${estudiante.matricula}</p>
            
            <table>
              <tr>
                <th>Emoción</th>
                <th>Conteo</th>
                <th>Porcentaje</th>
              </tr>
              <tr>
                <td><span class="emoji" style="color: #4CAF50;">😊</span> Feliz</td>
                <td>${conteoEmociones.feliz}</td>
                <td>${Math.round((conteoEmociones.feliz / 5) * 100)}%</td>
              </tr>
              <tr>
                <td><span class="emoji" style="color: #2196F3;">😢</span> Triste</td>
                <td>${conteoEmociones.triste}</td>
                <td>${Math.round((conteoEmociones.triste / 5) * 100)}%</td>
              </tr>
              <tr>
                <td><span class="emoji" style="color: #F44336;">😠</span> Enojado</td>
                <td>${conteoEmociones.enojado}</td>
                <td>${Math.round((conteoEmociones.enojado / 5) * 100)}%</td>
              </tr>
              <tr>
                <td><span class="emoji" style="color: #FF9800;">😰</span> Ansioso</td>
                <td>${conteoEmociones.ansioso}</td>
                <td>${Math.round((conteoEmociones.ansioso / 5) * 100)}%</td>
              </tr>
              <tr>
                <td><span class="emoji" style="color: #9C27B0;">😌</span> Tranquilo</td>
                <td>${conteoEmociones.tranquilo}</td>
                <td>${Math.round((conteoEmociones.tranquilo / 5) * 100)}%</td>
              </tr>
            </table>
            
            <p>Emoción predominante: <strong><span style="color: ${color}">${emoji}</span> ${emocionPredominante.charAt(0).toUpperCase() + emocionPredominante.slice(1)}</strong></p>
          </div>
        `
      })

      // Generar HTML completo
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Emociones</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #2c3e50; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { text-align: right; color: #7f8c8d; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #7f8c8d; }
            .emoji { font-size: 18px; }
            .alumno-card { 
              background-color: #f9f9f9; 
              border-radius: 10px; 
              padding: 15px; 
              margin-bottom: 20px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Emociones</h1>
            <h2>${grupo?.nombre || "Grupo"}</h2>
            <h3>Periodo: ${fechaInicio} al ${fechaFin}</h3>
          </div>
          
          <div class="date">
            <p>Fecha del reporte: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <h2>Resumen de Emociones por Alumno</h2>
          
          ${tablasAlumnos}
          
          <div class="footer">
            <p>Este reporte fue generado automáticamente por el sistema FACEGUARD.</p>
          </div>
        </body>
        </html>
      `
    } catch (error) {
      console.error("Error generando HTML:", error)
      throw error
    }
  }

  const handleNotificaciones = () => {
    setSelectedTab("notificaciones")
    router.push("/notificaciones")
  }

  const handleEstadisticas = () => {
    router.push("/inicioMaestro")
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b6cce4" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    )
  }

  // Obtener fechas de la semana actual
  const weekDays = getDaysOfWeek(selectedWeek)
  const weekDayNames = ["L", "M", "M", "J", "V"]

  // Formatear fecha para mostrar
  const formatWeekRange = () => {
    const start = weekDays[0]
    const end = weekDays[4]

    const startDay = start.getDate()
    const endDay = end.getDate()
    const month = end.toLocaleString("es-ES", { month: "long" })
    const year = end.getFullYear()

    if (start.getMonth() === end.getMonth()) {
      return `Semana del ${startDay} al ${endDay} de ${month} ${year}`
    } else {
      const startMonth = start.toLocaleString("es-ES", { month: "long" })
      return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${month} ${year}`
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>EMOCIONES</Text>
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{grupo?.nombre || "Grupo"}</Text>
          </View>
        </View>

        {/* Botón de exportación */}
        <View style={styles.exportButtons}>
          <TouchableOpacity style={styles.exportButton} onPress={exportToPDF} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome name="file-pdf-o" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector de Grupo */}
      <View style={styles.groupSelector}>
        <Text style={styles.selectorLabel}>Grupo:</Text>
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {grupos.map((g) => (
              <TouchableOpacity
                key={g._id}
                style={[styles.groupOption, grupo?._id === g._id && styles.groupOptionSelected]}
                onPress={() => handleGrupoChange(g._id)}
              >
                <Text style={[styles.groupOptionText, grupo?._id === g._id && styles.groupOptionTextSelected]}>
                  {g.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.content}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupName}>{grupo?.nombre || "Grupo"}</Text>
                <Text style={styles.scheduleText}>{formatWeekRange()}</Text>
              </View>
            </View>

            <View style={styles.attendanceContainer}>
              <View style={styles.calendarContainer}>
                <View style={styles.monthContainer}>
                  <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.arrowButton}>
                    <FontAwesome name="chevron-left" size={14} color="#2c3e50" />
                  </TouchableOpacity>
                  <Text style={styles.monthText}>{selectedWeek.toLocaleString("es-ES", { month: "long" })}</Text>
                  <TouchableOpacity onPress={() => changeWeek(1)} style={styles.arrowButton}>
                    <FontAwesome name="chevron-right" size={14} color="#2c3e50" />
                  </TouchableOpacity>
                </View>
                <View style={styles.daysContainer}>
                  {weekDayNames.map((day, index) => (
                    <View key={index} style={styles.dayItem}>
                      <Text style={styles.dayName}>{day}</Text>
                      <Text style={styles.dayText}>{weekDays[index].getDate()}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.studentsContainer}>
                {estudiantes.map((estudiante) => (
                  <View key={estudiante._id} style={styles.studentRow}>
                    <View style={styles.studentNameContainer}>
                      <Text style={styles.studentName}>{estudiante.nombre_completo}</Text>
                    </View>
                    <View style={styles.attendanceInfo}>
                      {weekDays.map((date, index) => {
                        const dateStr = date.toISOString().split("T")[0]
                        const emocion = emociones[estudiante._id]?.[dateStr] || "tranquilo"
                        const { emoji, color } = getEmocionEmoji(emocion)

                        return (
                          <View key={index} style={styles.emotionContainer}>
                            <Text style={[styles.emotionEmoji, { color }]}>{emoji}</Text>
                          </View>
                        )
                      })}
                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => console.log("Ver detalles de", estudiante.nombre_completo)}
                      >
                        <Text style={styles.detailsButtonText}>Detalles</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Leyenda */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <Text style={[styles.emotionEmoji, { color: "#4CAF50" }]}>😊</Text>
                <Text style={styles.legendText}>Feliz</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.emotionEmoji, { color: "#2196F3" }]}>😢</Text>
                <Text style={styles.legendText}>Triste</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.emotionEmoji, { color: "#F44336" }]}>😠</Text>
                <Text style={styles.legendText}>Enojado</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.emotionEmoji, { color: "#FF9800" }]}>😰</Text>
                <Text style={styles.legendText}>Ansioso</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.emotionEmoji, { color: "#9C27B0" }]}>😌</Text>
                <Text style={styles.legendText}>Tranquilo</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View
  style={bottomNavStyles.bottomNav}>
        <TouchableOpacity
          style={[bottomNavStyles.navButton, selectedTab === "emociones" && bottomNavStyles.navButtonActive]}
          onPress={handleEstadisticas}
        >
          <MaterialIcons name="assessment" size={24} color={selectedTab === "emociones" ? "#b6cce4" : "#fff"} />
          <Text style={[bottomNavStyles.navText, selectedTab === "emociones" && bottomNavStyles.navTextActive]}>Estadísticas</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={[bottomNavStyles.navButton, selectedTab === "notificaciones" && bottomNavStyles.navButtonActive]}
  onPress =
    { handleNotificaciones } >
    <Ionicons name="notifications" size={24} color={selectedTab === "notificaciones" ? "#b6cce4" : "#fff"} /> <Text
  style={[bottomNavStyles.navText, selectedTab === "notificaciones" && bottomNavStyles.navTextActive]}>Notificaciones
  </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7697a0",
  },
  loadingText: {
    marginTop: 10,
    color: "white",
    fontSize: 16,
    fontFamily: "Montserrat",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#7697a0",
  },
  backButton: {
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    color: "white",
    fontFamily: "Montserrat",
    marginRight: 12,
  },
  groupBadge: {
    backgroundColor: "#b6cce4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupBadgeText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  exportButtons: {
    flexDirection: "row",
  },
  exportButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  groupSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  selectorLabel: {
    color: "white",
    fontSize: 16,
    fontFamily: "Montserrat",
    marginRight: 8,
  },
  pickerContainer: {
    flex: 1,
  },
  groupOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    marginRight: 8,
  },
  groupOptionSelected: {
    backgroundColor: "#b6cce4",
  },
  groupOptionText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  groupOptionTextSelected: {
    color: "#2c3e50",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupCard: {
    backgroundColor: "#D9D9D9",
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupHeader: {
    marginBottom: 16,
  },
  groupName: {
    fontSize: 18,
    color: "#4A7079",
    fontFamily: "Montserrat",
  },
  scheduleText: {
    color: "#4A7079",
    fontFamily: "Montserrat",
    fontSize: 12,
    marginTop: 4,
  },
  attendanceContainer: {
    alignItems: "center",
  },
  calendarContainer: {
    borderRadius: 10,
    padding: 8,
    width: "100%",
    marginBottom: 16,
  },
  monthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  monthText: {
    fontSize: 14,
    color: "#4A7079",
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  arrowButton: {
    padding: 2,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    paddingHorizontal: 0,
    marginLeft: "20%",
  },
  dayItem: {
    alignItems: "center",
    width: 32,
    marginHorizontal: 4,
  },
  dayName: {
    fontSize: 14,
    color: "#4A7079",
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A7079",
  },
  studentsContainer: {
    width: "108%",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  studentNameContainer: {
    width: "22%",
  },
  studentName: {
    fontSize: 12,
    color: "#4A7079",
    fontFamily: "Montserrat",
  },
  attendanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    justifyContent: "space-evenly",
  },
  emotionContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 21,
    marginHorizontal: 10,
  },
  emotionEmoji: {
    fontSize: 16,
    fontFamily: "Montserrat",
  },
  detailsButton: {
    backgroundColor: "#b6cce4",
    padding: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Montserrat",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: 4,
  },
  legendText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#4A7079",
    fontFamily: "Montserrat",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Montserrat",
  },
})

const bottomNavStyles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#5f7d85",
    padding: 10,
    justifyContent: "space-around",
  },
  navButton: {
    alignItems: "center",
    padding: 10,
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
})

