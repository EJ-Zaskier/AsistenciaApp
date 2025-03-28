import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"
import * as IntentLauncher from 'expo-intent-launcher'
import * as MediaLibrary from 'expo-media-library'
// import * as Permissions from 'expo-permissions'
import { Platform } from 'react-native'

type AttendanceType = "asistencia" | "falta" | "justificada" | "retardo"

interface Alumno {
  _id: string
  nombre_completo: string
  matricula: string
  id_grupo: string
  carrera: string
}

interface Grupo {
  _id: string
  grupo: string
  descripcion: string
  id_carrera: string
  alumnos: string[]
}

interface Asistencia {
  _id: string
  fecha: string
  estado: AttendanceType
  id_salon: string
  id_horario: string
  id_alumno: string
  id_materia: string
}

interface Materia {
  _id: string
  nombre: string
  id_grupos: string[]
  id_carrera: string
  alumnos: string[]
}

interface User {
  _id: string
  nombre_completo: string
  rol: string
}

export default function MateriaAsistenciasScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
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

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // Primero obtener información del grupo
        if (groupId) {
          await fetchGrupoInfo(groupId)
        } else {
          setError("No se especificó un grupo")
        }
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

  const fetchGrupoInfo = async (grupoId: string) => {
    try {
      const response = await fetch(`http://3.142.210.221:5000/api/grupos?id=${groupId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setGrupo(data)

      // Después de obtener el grupo, obtener las materias relacionadas
      await fetchMateriasForGrupo(grupoId)

      // También obtener los alumnos del grupo
      await fetchAlumnosForGrupo(grupoId)
    } catch (error) {
      console.error("Error al cargar información del grupo:", error)
      setError("Error al cargar información del grupo")
    }
  }

  const fetchMateriasForGrupo = async (grupoId: string) => {
    try {
      // Obtener materias que tienen este grupo en su array id_grupos
      const response = await fetch(`http://3.142.210.221:5000/api/materias?grupo=${grupoId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setMaterias(data)

      // Si hay materias, seleccionar la primera por defecto
      if (data.length > 0) {
        setMateria(data[0])
        await fetchAttendances(data[0]._id, grupoId)
      }
    } catch (error) {
      console.error("Error al cargar las materias:", error)
      setError("Error al cargar las materias")
    }
  }

  const fetchAlumnosForGrupo = async (grupoId: string) => {
    try {
      const response = await fetch(`http://3.142.210.221:5000/api/alumnos?grupo=${grupoId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setAlumnos(data)
    } catch (error) {
      console.error("Error al cargar los alumnos:", error)
      setError("Error al cargar los alumnos")
    }
  }

  const fetchAttendances = async (materiaId: string, grupoId: string) => {
    try {
      // Obtener asistencias filtradas por materia y mes/año
      const fechaInicio = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0]
      const fechaFin = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split("T")[0]

      const response = await fetch(
        `http://3.142.210.221:5000/api/Asistencia?materia=${materiaId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      )
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
      console.error("Error al cargar las asistencias:", error)
      setError("Error al cargar las asistencias")
    }
  }

  const handleMateriaChange = async (newMateriaId: string) => {
    const selectedMateria = materias.find((m) => m._id === newMateriaId)
    if (selectedMateria) {
      setMateria(selectedMateria)
      await fetchAttendances(newMateriaId, groupId as string)
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

    // Actualizar asistencias para el nuevo mes
    if (materia) {
      fetchAttendances(materia._id, groupId as string)
    }
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

  // Modificar la función exportToPDF para usar la nueva implementación HTML
  const exportToPDF = async () => {
    try {
      setExporting(true)

      // Verificar que tenemos un ID de materia válido
      if (!materia?._id) {
        Alert.alert("Error", "No se pudo identificar la materia para exportar")
        setExporting(false)
        return
      }

      // Generar HTML para el reporte
      const htmlContent = generateReportHTML()

      // Imprimir el contenido HTML
      await Print.printAsync({ html: htmlContent })

      // Mostrar mensaje de éxito
      Alert.alert("Éxito", "Se ha generado un reporte HTML. En una implementación completa, esto sería un PDF.")
    } catch (error) {
      console.error("Error exportando reporte:", error)
      Alert.alert("Error", "No se pudo exportar el reporte. Verifica la conexión con el servidor.")
    } finally {
      setExporting(false)
    }
  }

  // Función para generar el contenido HTML del reporte
  const generateReportHTML = () => {
    // Generar encabezados de los días
    const daysHeaders = monthDays.map(day => `
      <th>${day}</th>
    `).join('')

    // Generar filas con asistencias
    let tableRows = ''
    alumnos.forEach((alumno) => {
      const percentage = calculateAttendancePercentage(alumno._id)
      const percentageColor = getAttendanceColor(percentage)

      // Generar celdas de asistencia para cada día
      const attendanceCells = monthDays.map(day => {
        const dateObj = new Date(selectedYear, selectedMonth, day)
        const dateStr = dateObj.toISOString().split('T')[0]
        const attendance = attendances[alumno._id]?.find(a => {
          const aDate = new Date(a.fecha)
          return aDate.getDate() === day && 
                 aDate.getMonth() === selectedMonth && 
                 aDate.getFullYear() === selectedYear
        })

        // Determinar el símbolo y color basado en el estado
        let symbol = '⚪' // Por defecto
        let color = '#ccc'
        
        if (attendance) {
          switch(attendance.estado) {
            case 'asistencia':
              symbol = '✓'
              color = '#4CAF50'
              break
            case 'falta':
              symbol = '✗'
              color = '#F44336'
              break
            case 'justificada':
              symbol = 'J'
              color = '#FF9800'
              break
            case 'retardo':
              symbol = 'R'
              color = '#FFC107'
              break
          }
        }

        return `<td style="text-align: center; color: ${color}; font-weight: bold;">${symbol}</td>`
      }).join('')

      tableRows += `
        <tr>
          <td>${alumno.nombre_completo}</td>
          ${attendanceCells}
          <td style="background-color: ${percentageColor}; color: white; text-align: center;">${percentage}%</td>
        </tr>
      `
    })

    // Generar HTML completo
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Asistencias</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #2c3e50; }
          .header { text-align: center; margin-bottom: 30px; }
          .date { text-align: right; color: #7f8c8d; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { 
            padding: 10px; 
            text-align: left; 
            border: 1px solid #ddd;
            font-size: 12px;
          }
          th { 
            background-color: #f2f2f2;
            text-align: center;
          }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #7f8c8d; }
          .legend {
            margin: 20px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .legend-item {
            display: inline-block;
            margin-right: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Asistencias</h1>
          <h2>${materia?.nombre || "Materia"}</h2>
          <h3>Grupo: ${grupo?.grupo || ""} - ${grupo?.descripcion || ""}</h3>
          <h3>Periodo: ${monthNames[selectedMonth]} ${selectedYear}</h3>
        </div>
        
        <div class="date">
          <p>Fecha del reporte: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="legend">
          <div class="legend-item">✓ : Asistencia</div>
          <div class="legend-item">✗ : Falta</div>
          <div class="legend-item">J : Justificada</div>
          <div class="legend-item">R : Retardo</div>
          <div class="legend-item">⚪ : Sin registro</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              ${daysHeaders}
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Este reporte fue generado automáticamente por el sistema FACEGUARD.</p>
        </div>
      </body>
      </html>
    `
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

      let url = "http://3.142.210.221:5000/api/Asistencia"
      let method = "POST"
      let body: any = {
        fecha: dateStr,
        estado: status,
        id_alumno: studentId,
        id_materia: materia?._id || "",
      }

      if (existingAttendance) {
        url = `http://3.142.210.221:5000/api/Asistencia/${existingAttendance._id}`
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
            id_salon: body.id_salon || "",
            id_horario: body.id_horario || "",
            id_alumno: studentId,
            id_materia: materia?._id || "",
          })
        }
        return updatedAttendances
      })

      // Forzar la actualización de la pantalla
      if (materia) {
        await fetchAttendances(materia._id, groupId as string)
      }

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

  // Navegar a estadísticas directamente por grupo
  const navigateToStats = () => {
    // Guardar el tipo de estadística como "asistencias"
    AsyncStorage.setItem("statsType", "asistencias")

    // Navegar directamente a la pantalla de estadísticas con tipo "grupo"
    router.push({
      pathname: "/Estadisticas",
      params: {
        materiaId: materia?._id,
        type: "grupo",
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
          <Text style={styles.subtitleText}>
            {grupo?.grupo} - {grupo?.descripcion}
          </Text>
        </View>

        {/* Botones de exportación y estadísticas */}
        <View style={styles.exportButtons}>
          <TouchableOpacity style={styles.exportButton} onPress={navigateToStats}>
            <MaterialIcons name="bar-chart" size={20} color="white" />
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
                {alumnos.length > 0 ? (
                  alumnos.map((alumno) => {
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
                  })
                ) : (
                  <View style={styles.noDataRow}>
                    <Text style={styles.noDataText}>No hay alumnos registrados en este grupo</Text>
                  </View>
                )}
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
  noDataRow: {
    padding: 20,
    alignItems: "center",
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
})