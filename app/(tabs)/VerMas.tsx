import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from "react-native"
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"

type AttendanceType = "asistencia" | "falta" | "justificada" | "retardo"

interface Alumno {
  id_grupo: string | undefined
  _id: string
  nombre_completo: string
  matricula: string
  grupo: string
  carrera: string
}

interface Asistencia {
  _id: string
  fecha: string
  estado: AttendanceType
  id_salon: string
  id_horario: string
  id_alumno: string
  id_materia: string // Agregar esta línea
}

interface Materia {
  _id: string
  nombre: string
  grado: string
  id_carrera: string
  alumnos: Alumno[] // Agregar esta línea
}

interface User {
  _id: string
  nombre_completo: string
  rol: string
}

export default function MateriaAsistenciasScreen() {
  const { materiaId } = useLocalSearchParams<{ materiaId: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [materia, setMateria] = useState<Materia | null>(null)
  const [materias, setMaterias] = useState<Materia[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [attendances, setAttendances] = useState<{ [key: string]: Asistencia[] }>({})
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [visibleDayRange, setVisibleDayRange] = useState({ start: 1, end: 10 })
  const [showStatsModal, setShowStatsModal] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        await fetchMaterias(parsedUser._id)
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

  const fetchMaterias = async (userId: string) => {
    try {
      const response = await fetch(`http://192.168.56.1:5000/api/materias?profesor=${userId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setMaterias(data)

      // Si hay un materiaId en los parámetros, seleccionar esa materia
      // Si no, seleccionar la primera materia
      const selectedMateria = materiaId ? data.find((m: Materia) => m._id === materiaId) : data[0]

      if (selectedMateria) {
        setMateria(selectedMateria)
        setAlumnos(selectedMateria.alumnos) // Establecer los alumnos de la materia seleccionada
        await fetchAttendances(selectedMateria._id)
      }
    } catch (error) {
      console.error("Error fetching materias:", error)
      setError("Error al cargar las materias")
    }
  }

  const fetchAlumnos = async (materiaId: string) => {
    try {
      const response = await fetch(`http://192.168.56.1:5000/api/alumnos?materia=${materiaId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log("Alumnos obtenidos:", data)

      // Filtrar alumnos por id_grupo de la materia seleccionada
      const filteredAlumnos = data.filter((alumno: Alumno) => alumno.id_grupo === materia?.id_carrera)

      setAlumnos(filteredAlumnos)
    } catch (error) {
      console.error("Error fetching alumnos:", error)
      setError("Error al cargar los alumnos")
    }
  }

  const fetchAttendances = async (materiaId: string) => {
    try {
      const response = await fetch(`http://192.168.56.1:5000/api/Asistencia?materia=${materiaId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      // Transformar los datos recibidos al formato esperado
      const transformedData = data.map((attendance: any) => ({
        _id: attendance._id,
        fecha: attendance.fecha,
        estado: attendance.estado,
        id_salon: attendance.id_salon,
        id_horario: attendance.id_horario,
        id_alumno: attendance.id_alumno._id,
        id_materia: attendance.id_materia._id,
      }))

      // Organizar asistencias por alumno
      const attendancesByStudent: { [key: string]: Asistencia[] } = {}
      transformedData.forEach((attendance: Asistencia) => {
        if (!attendancesByStudent[attendance.id_alumno]) {
          attendancesByStudent[attendance.id_alumno] = []
        }
        attendancesByStudent[attendance.id_alumno].push(attendance)
      })

      setAttendances(attendancesByStudent)
    } catch (error) {
      console.error("Error fetching attendances:", error)
      setError("Error al cargar las asistencias")
    }
  }

  const handleMateriaChange = async (newMateriaId: string) => {
    const selectedMateria = materias.find((m) => m._id === newMateriaId)
    if (selectedMateria) {
      setMateria(selectedMateria)
      setAlumnos(selectedMateria.alumnos) // Establecer los alumnos de la materia seleccionada
      await fetchAttendances(newMateriaId)
      router.setParams({ materiaId: newMateriaId })
    }
  }

  const handleBack = () => {
    router.back()
  }

  const changeMonth = (increment: number) => {
    let newMonth = selectedMonth + increment
    let newYear = selectedYear

    if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    } else if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    }

    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
    // Resetear el rango visible de días al cambiar de mes
    setVisibleDayRange({ start: 1, end: 10 })
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "#4CAF50"
    if (percentage >= 80) return "#8BC34A"
    if (percentage >= 70) return "#FFC107"
    if (percentage >= 60) return "#FF9800"
    return "#F44336"
  }

  const getAttendanceIcon = (type: AttendanceType | null, date: Date) => {
    // Si es una fecha futura, mostrar un círculo vacío
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date > today) {
      return <FontAwesome name="circle-thin" size={20} color="#ccc" />
    }

    // Si no hay registro y es una fecha pasada, mostrar como falta por defecto
    if (type === null) {
      return <MaterialIcons name="cancel" size={20} color="#F44336" />
    }

    // Si hay registro, mostrar el icono correspondiente
    switch (type) {
      case "asistencia":
        return <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
      case "falta":
        return <MaterialIcons name="cancel" size={20} color="#F44336" />
      case "justificada":
        return <Text style={styles.justifiedText}>J</Text>
      case "retardo":
        return <Text style={styles.lateText}>R</Text>
    }
  }

  const calculateAttendancePercentage = (studentId: string) => {
    const studentAttendances = attendances[studentId] || []
    if (studentAttendances.length === 0) return 0

    // Filtrar asistencias del mes seleccionado
    const monthAttendances = studentAttendances.filter((a) => {
      const date = new Date(a.fecha)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })

    // Contar días pasados en el mes (no incluir días futuros)
    const today = new Date()
    const lastDay = Math.min(
      getDaysInMonth().length,
      selectedYear === today.getFullYear() && selectedMonth === today.getMonth()
        ? today.getDate()
        : getDaysInMonth().length,
    )

    // Si estamos viendo un mes futuro, no hay días para contar
    if (
      selectedYear > today.getFullYear() ||
      (selectedYear === today.getFullYear() && selectedMonth > today.getMonth())
    ) {
      return 0
    }

    // Contar asistencias y retardos como presentes
    const presentCount = monthAttendances.filter((a) => a.estado === "asistencia" || a.estado === "retardo").length

    // Si no hay registros, contar los días pasados como faltas
    const totalDays = lastDay

    return Math.round((presentCount / totalDays) * 100)
  }

  // Generar días del mes seleccionado
  const getDaysInMonth = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const days = []

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(selectedYear, selectedMonth, i)
      const dayOfWeek = date.getDay() // 0 es domingo, 6 es sábado

      // Excluir sábados (6) y domingos (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(i)
      }
    }

    return days
  }

  const monthDays = getDaysInMonth()

  // Obtener nombre del mes
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

  // Exportar a Excel (CSV)
  const exportToExcel = async () => {
    try {
      setExporting(true)

      // Crear encabezados
      let csvContent = `Alumno,${monthDays.join(",")},Porcentaje\n`

      // Agregar datos de cada alumno
      alumnos.forEach((alumno) => {
        const percentage = calculateAttendancePercentage(alumno._id)
        let row = `"${alumno.nombre_completo}",`

        // Agregar estado de asistencia para cada día
        monthDays.forEach((day) => {
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const attendance = attendances[alumno._id]?.find((a) => {
            const aDate = new Date(a.fecha)
            return aDate.getDate() === day && aDate.getMonth() === selectedMonth && aDate.getFullYear() === selectedYear
          })

          if (attendance) {
            switch (attendance.estado) {
              case "asistencia":
                row += "A,"
                break
              case "falta":
                row += "F,"
                break
              case "justificada":
                row += "J,"
                break
              case "retardo":
                row += "R,"
                break
              default:
                row += "-,"
            }
          } else {
            row += "-,"
          }
        })

        // Agregar porcentaje
        row += `${percentage}%\n`
        csvContent += row
      })

      // Guardar archivo
      const fileName = `asistencias_${materia?.nombre}_${monthNames[selectedMonth]}_${selectedYear}.csv`
      const fileUri = `${FileSystem.documentDirectory}${fileName}`

      await FileSystem.writeAsStringAsync(fileUri, csvContent)

      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri)
      } else {
        Alert.alert("Error", "El compartir archivos no está disponible en este dispositivo")
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      Alert.alert("Error", "No se pudo exportar a Excel")
    } finally {
      setExporting(false)
    }
  }

  // Exportar a PDF
  const exportToPDF = async () => {
    try {
      setExporting(true)

      // En un entorno real, aquí se generaría un PDF
      // Para esta demo, mostraremos un mensaje
      Alert.alert(
        "Exportar a PDF",
        "Esta funcionalidad requiere una biblioteca adicional como 'react-native-html-to-pdf' o un servicio de backend para generar PDFs",
        [{ text: "OK" }],
      )
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      Alert.alert("Error", "No se pudo exportar a PDF")
    } finally {
      setExporting(false)
    }
  }

  // Función para editar el estado de asistencia
  const handleAttendanceEdit = (studentId: string, day: number, currentStatus: AttendanceType | null) => {
    // Crear la fecha completa
    const dateObj = new Date(selectedYear, selectedMonth, day)
    const dateStr = dateObj.toISOString().split("T")[0]

    // Si es una fecha futura, no permitir edición
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dateObj > today) {
      Alert.alert("No permitido", "No se puede editar la asistencia de fechas futuras")
      return
    }

    // Mostrar opciones para cambiar el estado
    Alert.alert(
      "Editar Asistencia",
      `Alumno: ${alumnos.find((a) => a._id === studentId)?.nombre_completo || "Desconocido"}\nFecha: ${day}/${selectedMonth + 1}/${selectedYear}`,
      [
        {
          text: "Asistencia",
          onPress: () => updateAttendance(studentId, dateStr, "asistencia"),
          style: "default",
        },
        {
          text: "Falta",
          onPress: () => updateAttendance(studentId, dateStr, "falta"),
          style: "destructive",
        },
        {
          text: "Justificada",
          onPress: () => updateAttendance(studentId, dateStr, "justificada"),
          style: "default",
        },
        {
          text: "Retardo",
          onPress: () => updateAttendance(studentId, dateStr, "retardo"),
          style: "default",
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true },
    )
  }

  // Función para actualizar la asistencia en la API
  const updateAttendance = async (studentId: string, dateStr: string, status: AttendanceType) => {
    try {
      setLoading(true)

      const existingAttendance = attendances[studentId]?.find((a) => {
        const aDate = new Date(a.fecha)
        const aDateStr = aDate.toISOString().split("T")[0]
        return aDateStr === dateStr
      })

      let url = "http://192.168.56.1:5000/api/Asistencia"
      let method = "POST"
      let body: any = {
        fecha: dateStr,
        estado: status,
        id_alumno: studentId,
        id_materia: materia?._id || "",
      }

      if (existingAttendance) {
        url = `http://192.168.56.1:5000/api/Asistencia/${existingAttendance._id}`
        method = "PUT"
        body = {
          estado: status,
        }
      }

      console.log(`Enviando ${method} a ${url} con datos:`, body)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const textResponse = await response.text()
        console.error("Respuesta del servidor:", textResponse)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log("Respuesta de la API:", responseData)

      // Actualizar los datos locales
      setAttendances((prevAttendances) => {
        const updatedAttendances = { ...prevAttendances }
        if (existingAttendance) {
          // Actualizar el estado de la asistencia existente
          const index = updatedAttendances[studentId].findIndex((a) => a._id === existingAttendance._id)
          if (index !== -1) {
            updatedAttendances[studentId][index].estado = status
          }
        } else {
          // Agregar una nueva asistencia
          if (!updatedAttendances[studentId]) {
            updatedAttendances[studentId] = []
          }
          updatedAttendances[studentId].push({
            _id: responseData._id,
            fecha: dateStr,
            estado: status,
            id_salon: body.id_salon,
            id_horario: body.id_horario,
            id_alumno: studentId,
            id_materia: materia?._id || "",
          })
        }
        return updatedAttendances
      })

      // Forzar la actualización de la pantalla
      await fetchAttendances(materia?._id || "")

      Alert.alert("Éxito", "Asistencia actualizada correctamente")
    } catch (error) {
      console.error("Error updating attendance:", error)
      if (error instanceof Error) {
        Alert.alert("Error", `No se pudo actualizar la asistencia: ${error.message}`)
      } else {
        Alert.alert("Error", "No se pudo actualizar la asistencia")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Este efecto se ejecutará cada vez que cambie el estado de attendances
    // Puedes agregar cualquier lógica adicional aquí si es necesario
  }, [attendances])

  // Función para navegar entre los días visibles
  const navigateDays = (direction: "prev" | "next") => {
    const daysPerPage = 10
    const totalDays = monthDays.length

    if (direction === "prev") {
      const newStart = Math.max(1, visibleDayRange.start - daysPerPage)
      setVisibleDayRange({
        start: newStart,
        end: Math.min(newStart + daysPerPage - 1, totalDays),
      })
    } else {
      const newStart = Math.min(totalDays - daysPerPage + 1, visibleDayRange.end + 1)
      setVisibleDayRange({
        start: newStart,
        end: Math.min(newStart + daysPerPage - 1, totalDays),
      })
    }
  }

  // Navegar a estadísticas
  const navigateToStats = (type: "grupo" | "alumno") => {
    setShowStatsModal(false)

    // Guardar el tipo de estadística seleccionado
    AsyncStorage.setItem("statsType", type)

    // Navegar a la pantalla de estadísticas
    router.push({
      pathname: "/Estadisticas",
      params: {
        materiaId: materia?._id,
        type: type,
      },
    })
  }

  // Filtrar los días visibles
  const visibleDays = monthDays.filter((day) => day >= visibleDayRange.start && day <= visibleDayRange.end)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b6cce4" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Asistencias</Text>
          <Text style={styles.subtitleText}>{user?.nombre_completo}</Text>
        </View>

        {/* Botones de exportación y estadísticas */}
        <View style={styles.exportButtons}>
          <TouchableOpacity style={styles.exportButton} onPress={() => setShowStatsModal(true)}>
            <MaterialIcons name="bar-chart" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportButton} onPress={exportToExcel} disabled={exporting}>
            <FontAwesome name="file-excel-o" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportButton} onPress={exportToPDF} disabled={exporting}>
            <FontAwesome name="file-pdf-o" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector de Materia */}
      <View style={styles.materiaSelector}>
        <Text style={styles.selectorLabel}>Materia:</Text>
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {materias.map((m) => (
              <TouchableOpacity
                key={m._id}
                style={[styles.materiaOption, materia?._id === m._id && styles.materiaOptionSelected]}
                onPress={() => handleMateriaChange(m._id)}
              >
                <Text style={[styles.materiaOptionText, materia?._id === m._id && styles.materiaOptionTextSelected]}>
                  {m.nombre}
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
          <View style={styles.attendanceCard}>
            {/* Selector de Mes */}
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
                <MaterialIcons name="arrow-back-ios" size={20} color="#2c3e50" />
              </TouchableOpacity>

              <Text style={styles.monthText}>
                {monthNames[selectedMonth]} {selectedYear}
              </Text>

              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
                <MaterialIcons name="arrow-forward-ios" size={20} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            {/* Navegación de días */}
            <View style={styles.daysNavigation}>
              <TouchableOpacity
                onPress={() => navigateDays("prev")}
                style={[styles.dayNavButton, visibleDayRange.start <= 1 && styles.dayNavButtonDisabled]}
                disabled={visibleDayRange.start <= 1}
              >
                <MaterialIcons name="chevron-left" size={24} color={visibleDayRange.start <= 1 ? "#ccc" : "#fff"} />
              </TouchableOpacity>

              <Text style={styles.daysRangeText}>
                Días {visibleDayRange.start}-{visibleDayRange.end} de {monthDays.length}
              </Text>

              <TouchableOpacity
                onPress={() => navigateDays("next")}
                style={[styles.dayNavButton, visibleDayRange.end >= monthDays.length && styles.dayNavButtonDisabled]}
                disabled={visibleDayRange.end >= monthDays.length}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={visibleDayRange.end >= monthDays.length ? "#ccc" : "#fff"}
                />
              </TouchableOpacity>
            </View>

            {/* Tabla de Asistencias */}
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                {/* Encabezado de la tabla */}
                <View style={styles.tableHeader}>
                  <View style={styles.studentNameHeader}>
                    <Text style={styles.headerText}>Alumno</Text>
                  </View>

                  {/* Días visibles del mes */}
                  {visibleDays.map((day) => (
                    <View key={day} style={styles.dayHeader}>
                      <Text style={styles.dayText}>{day}</Text>
                    </View>
                  ))}

                  {/* Columna de porcentaje */}
                  <View style={styles.percentageHeader}>
                    <Text style={styles.headerText}>%</Text>
                  </View>
                </View>

                {/* Filas de alumnos */}
                {alumnos.map((alumno) => {
                  const percentage = calculateAttendancePercentage(alumno._id)

                  return (
                    <View key={alumno._id} style={styles.studentRow}>
                      {/* Nombre del alumno */}
                      <View style={styles.studentNameCell}>
                        <Text style={styles.studentName}>{alumno.nombre_completo}</Text>
                      </View>

                      {/* Celdas de asistencia por día */}
                      {visibleDays.map((day) => {
                        const dateObj = new Date(selectedYear, selectedMonth, day)
                        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        const attendance = attendances[alumno._id]?.find((a) => {
                          const aDate = new Date(a.fecha)
                          return (
                            aDate.getDate() === day &&
                            aDate.getMonth() === selectedMonth &&
                            aDate.getFullYear() === selectedYear
                          )
                        })

                        return (
                          <TouchableOpacity
                            key={day}
                            style={styles.attendanceCell}
                            onPress={() => handleAttendanceEdit(alumno._id, day, attendance?.estado || null)}
                          >
                            {getAttendanceIcon(attendance?.estado || null, dateObj)}
                          </TouchableOpacity>
                        )
                      })}

                      {/* Celda de porcentaje */}
                      <View style={[styles.percentageCell, { backgroundColor: getAttendanceColor(percentage) }]}>
                        <Text style={styles.percentageText}>{percentage}%</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </ScrollView>

            {/* Leyenda */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.legendText}>Asistencia</Text>
              </View>
              <View style={styles.legendItem}>
                <MaterialIcons name="cancel" size={16} color="#F44336" />
                <Text style={styles.legendText}>Falta</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.justifiedText}>J</Text>
                <Text style={styles.legendText}>Justificada</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.lateText}>R</Text>
                <Text style={styles.legendText}>Retardo</Text>
              </View>
            </View>

            {/* Instrucciones */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>Toca una celda para cambiar el estado de asistencia</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Estadísticas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStatsModal}
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tipo de estadísticas</Text>

            <TouchableOpacity style={styles.modalOption} onPress={() => navigateToStats("grupo")}>
              <MaterialIcons name="group" size={24} color="#7697a0" />
              <Text style={styles.modalOptionText}>Estadísticas por Grupo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => navigateToStats("alumno")}>
              <MaterialIcons name="person" size={24} color="#7697a0" />
              <Text style={styles.modalOptionText}>Estadísticas por Alumno</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowStatsModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  titleText: {
    fontSize: 20,
    color: "white",
    fontFamily: "Montserrat",
  },
  subtitleText: {
    fontSize: 14,
    color: "white",
    fontFamily: "Montserrat",
    opacity: 0.8,
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
  materiaSelector: {
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
  materiaOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    marginRight: 8,
  },
  materiaOptionSelected: {
    backgroundColor: "#b6cce4",
  },
  materiaOptionText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  materiaOptionTextSelected: {
    color: "#2c3e50",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  attendanceCard: {
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
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 8,
  },
  arrowButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  daysNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#5f7d85",
    borderRadius: 8,
    padding: 8,
  },
  dayNavButton: {
    padding: 8,
    backgroundColor: "#7697a0",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNavButtonDisabled: {
    backgroundColor: "#e0e0e0",
    opacity: 0.7,
  },
  daysRangeText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Montserrat",
    fontWeight: "bold",
  },
  tableContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  studentNameHeader: {
    width: 150,
    padding: 10,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  dayHeader: {
    width: 40,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  percentageHeader: {
    width: 60,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
  studentRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  studentNameCell: {
    width: 150,
    padding: 10,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  studentName: {
    fontSize: 14,
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
  attendanceCell: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  percentageCell: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  justifiedText: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  lateText: {
    color: "#FFC107",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  noDataText: {
    color: "#bbb",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Montserrat",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
    fontFamily: "Montserrat",
  },
  instructionsContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#b6cce4",
  },
  instructionsText: {
    fontSize: 14,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
    fontFamily: "Montserrat",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginBottom: 10,
  },
  modalOptionText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#7697a0",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Montserrat",
  },
})
