import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { BarChart, PieChart } from "react-native-chart-kit"

interface ChartData {
  labels: string[]
  datasets: {
    data: number[]
    color?: (opacity: number) => string
    strokeWidth?: number
  }[]
  legend?: string[]
}

interface PieChartData {
  name: string
  population: number
  color: string
  legendFontColor: string
  legendFontSize: number
}

export default function EstadisticasScreen() {
  const { materiaId, type } = useLocalSearchParams<{ materiaId: string; type: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [pieData, setPieData] = useState<PieChartData[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [statsType, setStatsType] = useState<"asistencias" | "emociones">("asistencias")
  const [additionalInfo, setAdditionalInfo] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"mes" | "semana">("mes")
  const [materias, setMaterias] = useState<{ id: string; nombre: string }[]>([])
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null)
  const [alumnos, setAlumnos] = useState<{ id: string; nombre_completo: string }[]>([])
  const [selectedAlumno, setSelectedAlumno] = useState<string | null>(null)

  const screenWidth = Dimensions.get("window").width - 40

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const response = await fetch("http://192.168.56.1:5000/api/materias")
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setMaterias(data)
      } catch (error) {
        console.error("Error fetching materias:", error)
        setError("Error al cargar las materias")
      }
    }

    const fetchAlumnos = async () => {
      try {
        const response = await fetch("http://192.168.56.1:5000/api/alumnos")
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setAlumnos(data)
      } catch (error) {
        console.error("Error fetching alumnos:", error)
        setError("Error al cargar los alumnos")
      }
    }

    fetchMaterias()
    fetchAlumnos()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Determinar si estamos viendo estadísticas de asistencias o emociones
        const storedType = await AsyncStorage.getItem("statsType")
        if (storedType === "emociones") {
          setStatsType("emociones")
          await fetchEmocionesData()
        } else {
          setStatsType("asistencias")
          await fetchAsistenciasData()
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Error al cargar los datos estadísticos")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [materiaId, type, selectedMonth, selectedYear, filterType, selectedMateria, selectedAlumno])

  const fetchAsistenciasData = async () => {
    try {
      let endpoint = ""

      if (type === "grupo") {
        endpoint = `http://192.168.56.1:5000/api/Asistencia/estadisticas/grupo/${selectedMateria || materiaId}?${filterType}=${selectedMonth + 1}&anio=${selectedYear}`
        setTitle(`Estadísticas de Asistencia por Grupo - ${selectedMateria ? materias.find(m => m.id === selectedMateria)?.nombre : "Todas las Materias"}`)

        // Obtener nombre de la materia
        const materiaResponse = await fetch(`http://192.168.56.1:5000/api/materias/${selectedMateria || materiaId}`)
        if (materiaResponse.ok) {
          const materiaData = await materiaResponse.json()
          setSubtitle(materiaData.nombre || "Materia")
        }
      } else {
        // Obtener el alumno seleccionado del storage
        const alumnoData = await AsyncStorage.getItem("selectedAlumno")
        if (alumnoData) {
          const alumno = JSON.parse(alumnoData)
          endpoint = `http://192.168.56.1:5000/api/Asistencia/estadisticas/alumno/${selectedAlumno || alumno._id}?${filterType}=${selectedMonth + 1}&anio=${selectedYear}`
          setTitle(`Estadísticas de Asistencia por Alumno - ${selectedAlumno ? alumnos.find(a => a.id === selectedAlumno)?.nombre_completo : alumno.nombre_completo}`)

          // Obtener nombre de la materia
          const materiaResponse = await fetch(`http://192.168.56.1:5000/api/materias/${selectedMateria || materiaId}`)
          if (materiaResponse.ok) {
            const materiaData = await materiaResponse.json()
            setSubtitle(materiaData.nombre || "Materia")
          }
        } else {
          throw new Error("No se ha seleccionado un alumno")
        }
      }

      const response = await fetch(endpoint)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      // Procesar datos para gráficos
      const labels: string[] = []
      const values: number[] = []
      const pieChartData: PieChartData[] = []

      const colors = {
        asistencia: "#4CAF50",
        falta: "#F44336",
        justificada: "#FF9800",
        retardo: "#FFC107",
      }

      const legendColors = {
        asistencia: "#000",
        falta: "#000",
        justificada: "#000",
        retardo: "#000",
      }

      let totalAsistencias = 0
      let totalFaltas = 0

      // Asegurarse de que siempre haya una entrada para "falta"
      const asistenciaTypes = ["asistencia", "falta", "justificada", "retardo"]
      asistenciaTypes.forEach(type => {
        if (!data.some((item: { _id: string }) => item._id === type)) {
          data.push({ _id: type, count: 0 })
        }
      })

      // Agregar faltas para días sin registro
      const diasEnMes = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      const diasRegistrados = data.reduce((acc: number[], item: { _id: string; dias: number[] }) => {
        return acc.concat(item.dias || [])
      }, [])
      for (let dia = 1; dia <= diasEnMes; dia++) {
        if (!diasRegistrados.includes(dia)) {
          totalFaltas += 1
        }
      }

      data.forEach((item: { _id: string; count: number }) => {
        if (item._id === "falta") {
          item.count += totalFaltas
        }
        const label = item._id.charAt(0).toUpperCase() + item._id.slice(1)
        labels.push(label)
        values.push(item.count)
        totalAsistencias += item.count

        pieChartData.push({
          name: label,
          population: item.count,
          color: colors[item._id as keyof typeof colors] || "#999",
          legendFontColor: legendColors[item._id as keyof typeof legendColors] || "#000",
          legendFontSize: 12,
        })
      })

      // Calcular el porcentaje de faltas
      const faltas = data.find((item: { _id: string }) => item._id === "falta")
      const porcentajeFaltas = faltas ? (faltas.count / totalAsistencias) * 100 : 0

      setChartData({
        labels,
        datasets: [
          {
            data: values,
            color: (opacity = 1) => `rgba(118, 151, 160, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      })

      setPieData(pieChartData)

      // Agregar información sobre el porcentaje de faltas
      setAdditionalInfo(`Porcentaje de faltas: ${porcentajeFaltas.toFixed(2)}%`)
    } catch (error) {
      console.error("Error fetching asistencias data:", error)
      setError("Error al cargar los datos de asistencia")
    }
  }

  const fetchEmocionesData = async () => {
    try {
      let endpoint = ""

      if (type === "grupo") {
        endpoint = `http://192.168.56.1:5000/api/emociones/estadisticas/grupo/${materiaId}`
        setTitle("Estadísticas de Emociones por Grupo")

        // Obtener nombre del grupo
        const grupoResponse = await fetch(`http://192.168.56.1:5000/api/grupos/${materiaId}`)
        if (grupoResponse.ok) {
          const grupoData = await grupoResponse.json()
          setSubtitle(grupoData.nombre || "Grupo")
        }
      } else {
        // Obtener el alumno seleccionado del storage
        const alumnoData = await AsyncStorage.getItem("selectedAlumno")
        if (alumnoData) {
          const alumno = JSON.parse(alumnoData)
          endpoint = `http://192.168.56.1:5000/api/emociones/estadisticas/alumno/${alumno._id}`
          setTitle("Estadísticas de Emociones por Alumno")
          setSubtitle(alumno.nombre_completo || "Alumno")
        } else {
          throw new Error("No se ha seleccionado un alumno")
        }
      }

      // Agregar fechas si es necesario
      const fechaInicio = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0]
      const fechaFin = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split("T")[0]
      endpoint += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`

      const response = await fetch(endpoint)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      // Procesar datos para gráficos
      const labels: string[] = []
      const values: number[] = []
      const pieChartData: PieChartData[] = []

      const colors = {
        feliz: "#4CAF50",
        triste: "#2196F3",
        enojado: "#F44336",
        ansioso: "#FF9800",
        tranquilo: "#9C27B0",
      }

      const legendColors = {
        feliz: "#000",
        triste: "#000",
        enojado: "#000",
        ansioso: "#000",
        tranquilo: "#000",
      }

      let maxEmocion = { nombre: "", count: 0 }

      data.forEach((item: { _id: string; count: number }) => {
        const label = item._id.charAt(0).toUpperCase() + item._id.slice(1)
        labels.push(label)
        values.push(item.count)

        pieChartData.push({
          name: label,
          population: item.count,
          color: colors[item._id as keyof typeof colors] || "#999",
          legendFontColor: legendColors[item._id as keyof typeof legendColors] || "#000",
          legendFontSize: 12,
        })

        if (item.count > maxEmocion.count) {
          maxEmocion = { nombre: label, count: item.count }
        }
      })

      setChartData({
        labels,
        datasets: [
          {
            data: values,
            color: (opacity = 1) => `rgba(118, 151, 160, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      })

      setPieData(pieChartData)

      // Agregar información sobre la emoción más frecuente
      setAdditionalInfo(`Emoción más frecuente: ${maxEmocion.nombre}`)
    } catch (error) {
      console.error("Error fetching emociones data:", error)
      setError("Error al cargar los datos de emociones")
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
  }

  const toggleStatsType = () => {
    const newType = statsType === "asistencias" ? "emociones" : "asistencias"
    setStatsType(newType)
    AsyncStorage.setItem("statsType", newType)

    // Recargar datos
    if (newType === "emociones") {
      fetchEmocionesData()
    } else {
      fetchAsistenciasData()
    }
  }

  const toggleFilterType = () => {
    const newFilterType = filterType === "mes" ? "semana" : "mes"
    setFilterType(newFilterType)
    fetchAsistenciasData()
  }

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b6cce4" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
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
          <Text style={styles.titleText}>Estadísticas</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>

        <TouchableOpacity style={styles.toggleButton} onPress={toggleStatsType}>
          <MaterialIcons
            name={statsType === "asistencias" ? "emoji-emotions" : "event-available"}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>{title}</Text>

            {/* Selector de Materia */}
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Materia:</Text>
              <TouchableOpacity onPress={() => setSelectedMateria(null)} style={styles.selectorButton}>
                <Text style={styles.selectorText}>Todas</Text>
              </TouchableOpacity>
              {materias.map((materia) => (
                <TouchableOpacity key={materia.id} onPress={() => setSelectedMateria(materia.id)} style={styles.selectorButton}>
                  <Text style={styles.selectorText}>{materia.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selector de Alumno */}
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Alumno:</Text>
              <TouchableOpacity onPress={() => setSelectedAlumno(null)} style={styles.selectorButton}>
                <Text style={styles.selectorText}>Ninguno</Text>
              </TouchableOpacity>
              {alumnos.map((alumno) => (
                <TouchableOpacity key={alumno.id} onPress={() => setSelectedAlumno(alumno.id)} style={styles.selectorButton}>
                  <Text style={styles.selectorText}>{alumno.nombre_completo}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selector de Filtro */}
            <View style={styles.selectorContainer}>
              <TouchableOpacity onPress={toggleFilterType} style={styles.selectorButton}>
                <Text style={styles.selectorText}>
                  {filterType === "mes" ? "Ver por Semana" : "Ver por Mes"}
                </Text>
              </TouchableOpacity>
            </View>

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

            {/* Gráfico de Barras */}
            {chartData && chartData.labels.length > 0 ? (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>
                  Distribución por {statsType === "asistencias" ? "Estado" : "Emoción"}
                </Text>
                <BarChart
                  data={chartData}
                  width={screenWidth}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(118, 151, 160, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    barPercentage: 0.8,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No hay datos disponibles para este período</Text>
              </View>
            )}

            {/* Gráfico de Pastel */}
            {pieData.length > 0 ? (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>
                  Porcentaje por {statsType === "asistencias" ? "Estado" : "Emoción"}
                </Text>
                <PieChart
                  data={pieData}
                  width={screenWidth}
                  height={220}
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(118, 151, 160, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            ) : null}

            {/* Resumen de Datos */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Resumen</Text>

              {pieData.length > 0 ? (
                <View style={styles.summaryContent}>
                  {pieData.map((item, index) => (
                    <View key={index} style={styles.summaryItem}>
                      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                      <Text style={styles.summaryLabel}>{item.name}:</Text>
                      <Text style={styles.summaryValue}>{item.population}</Text>
                    </View>
                  ))}

                  <View style={styles.summaryItem}>
                    <View style={styles.colorIndicator} />
                    <Text style={styles.summaryLabel}>Total:</Text>
                    <Text style={styles.summaryValue}>{pieData.reduce((sum, item) => sum + item.population, 0)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noDataText}>No hay datos disponibles para este período</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Mostrar información adicional */}
      {additionalInfo && (
        <View style={styles.additionalInfoContainer}>
          <Text style={styles.additionalInfoText}>{additionalInfo}</Text>
        </View>
      )}
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
  toggleButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
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
  cardTitle: {
    fontSize: 18,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
    marginBottom: 16,
    textAlign: "center",
  },
  filterSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  filterButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  filterText: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
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
  chartContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  chartTitle: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
    marginBottom: 10,
    textAlign: "center",
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Montserrat",
    textAlign: "center",
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
    marginBottom: 10,
  },
  summaryContent: {
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Montserrat",
  },
  additionalInfoContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  additionalInfoText: {
    fontSize: 14,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    textAlign: "center",
  },
  selectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
    marginRight: 8,
  },
  selectorButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    margin: 4,
  },
  selectorText: {
    fontSize: 14,
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
  alumnoSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  alumnoLabel: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
    marginRight: 8,
  },
  alumnoButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    margin: 4,
  },
  alumnoText: {
    fontSize: 14,
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
})

