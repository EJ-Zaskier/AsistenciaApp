import { useEffect, useState, useCallback } from "react"
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    Modal,
    FlatList,
  } from "react-native"
  import { MaterialIcons, Ionicons, FontAwesome5, AntDesign } from "@expo/vector-icons"
  import { router, useLocalSearchParams } from "expo-router"
  import AsyncStorage from "@react-native-async-storage/async-storage"
  import { BarChart, PieChart } from "react-native-chart-kit"
  import * as FileSystem from "expo-file-system"
  import * as Sharing from "expo-sharing"
  import * as Print from 'expo-print';
  import { Svg, Circle, Rect } from 'react-native-svg';
  import { captureRef } from 'react-native-view-shot';
  import React from "react"

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

  interface Materia {
    _id: string
    nombre: string
  }

  interface Alumno {
    _id: string
    nombre_completo: string
    matricula: string
  }

  interface Grupo {
    _id: string
    grupo: string
    descripcion: string
  }

  export default function EstadisticasScreen() {
    const { materiaId, type } = useLocalSearchParams<{ materiaId: string; type: string }>()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [chartData, setChartData] = useState<ChartData | null>(null)
    const [pieData, setPieData] = useState<PieChartData[]>([])
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [title, setTitle] = useState("")
    const [subtitle, setSubtitle] = useState("")
    const [statsType, setStatsType] = useState<"asistencias" | "emociones">("asistencias")
    const [filterType, setFilterType] = useState<"mes" | "semana">("mes")
    const [materias, setMaterias] = useState<Materia[]>([])
    const [selectedMateria, setSelectedMateria] = useState<string | null>(null)
    const [alumnos, setAlumnos] = useState<Alumno[]>([])
    const [selectedAlumno, setSelectedAlumno] = useState<string | null>(null)
    const [grupos, setGrupos] = useState<Grupo[]>([])
    const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null)
    const [showMateriaModal, setShowMateriaModal] = useState(false)
    const [showAlumnoModal, setShowAlumnoModal] = useState(false)
    const [showGrupoModal, setShowGrupoModal] = useState(false)
    const [summaryData, setSummaryData] = useState<{ label: string; value: number; color: string }[]>([])
    const [totalRegistros, setTotalRegistros] = useState(0)

    const screenWidth = Dimensions.get("window").width - 40

    useEffect(() => {
      fetchInitialData()
    }, [])

    useEffect(() => {
      if (!loading) {
        fetchStatisticsData()
      }
    }, [
      materiaId,
      type,
      selectedMonth,
      selectedYear,
      filterType,
      selectedMateria,
      selectedAlumno,
      selectedGrupo,
      statsType,
    ])

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchMaterias(), fetchAlumnos(), fetchGrupos()])

        // Determinar si estamos viendo estadísticas de asistencias o emociones
        const storedType = await AsyncStorage.getItem("statsType")
        if (storedType === "emociones") {
          setStatsType("emociones")
        } else {
          setStatsType("asistencias")
        }

        // Inicializar materia seleccionada si se proporciona en los parámetros
        if (materiaId) {
          setSelectedMateria(materiaId)
        }

        await fetchStatisticsData()
      } catch (error) {
        console.error("Error fetching initial data:", error)
        setError("Error al cargar los datos iniciales")
      } finally {
        setLoading(false)
      }
    }

    const fetchMaterias = async () => {
      try {
        const response = await fetch("http://3.142.210.221:5000/api/materias")
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
        const response = await fetch("http://3.142.210.221:5000/api/alumnos")
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setAlumnos(data)
      } catch (error) {
        console.error("Error fetching alumnos:", error)
        setError("Error al cargar los alumnos")
      }
    }

    const fetchGrupos = async () => {
      try {
        const response = await fetch("http://3.142.210.221:5000/api/grupos")
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setGrupos(data)
      } catch (error) {
        console.error("Error fetching grupos:", error)
        setError("Error al cargar los grupos")
      }
    }

    const fetchStatisticsData = async () => {
      try {
        setError(null)

        if (statsType === "asistencias") {
          await fetchAsistenciasData()
        } else {
          await fetchEmocionesData()
        }
      } catch (error) {
        console.error("Error fetching statistics data:", error)
        setError("Error al cargar los datos estadísticos")
      }
    }

    const fetchAsistenciasData = async () => {
      try {
        let endpoint = ""
        let queryParams = `mes=${selectedMonth + 1}&anio=${selectedYear}`

        // Construir la URL base según el tipo de estadística
        if (type === "grupo" || selectedGrupo) {
          const grupoId = selectedGrupo || (type === "grupo" ? materiaId : null)
          if (grupoId) {
            endpoint = `http://3.142.210.221:5000/api/Asistencia/estadisticas/grupo/${grupoId}`

            // Obtener información del grupo
            const grupo = grupos.find((g) => g._id === grupoId)
            if (grupo) {
              setTitle(`Estadísticas de Grupo: ${grupo.grupo}`)
              setSubtitle(grupo.descripcion || "")
            } else {
              setTitle("Estadísticas de Grupo")
              setSubtitle("")
            }
          }
        } else if (selectedAlumno) {
          endpoint = `http://3.142.210.221:5000/api/Asistencia/estadisticas/alumno/${selectedAlumno}`

          // Obtener información del alumno
          const alumno = alumnos.find((a) => a._id === selectedAlumno)
          if (alumno) {
            setTitle(`Estadísticas de Alumno: ${alumno.nombre_completo}`)
            setSubtitle(`Matrícula: ${alumno.matricula}`)
          } else {
            setTitle("Estadísticas de Alumno")
            setSubtitle("")
          }
        } else if (selectedMateria) {
          endpoint = `http://3.142.210.221:5000/api/Asistencia/estadisticas/materia/${selectedMateria}`

          // Obtener información de la materia
          const materia = materias.find((m) => m._id === selectedMateria)
          if (materia) {
            setTitle(`Estadísticas de Materia: ${materia.nombre}`)
            setSubtitle("")
          } else {
            setTitle("Estadísticas de Materia")
            setSubtitle("")
          }
        } else {
          // Estadísticas generales por mes
          endpoint = `http://3.142.210.221:5000/api/Asistencia/estadisticas/mes`
          setTitle("Estadísticas Generales")
          setSubtitle(`${getMonthName(selectedMonth)} ${selectedYear}`)
        }

        // Agregar parámetros adicionales
        if ((selectedMateria && endpoint.includes("alumno")) || endpoint.includes("grupo")) {
          queryParams += `&materia=${selectedMateria}`
        }

        // Realizar la petición
        const response = await fetch(`${endpoint}?${queryParams}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()

        // Procesar datos para gráficos
        processAsistenciasData(data)
      } catch (error) {
        console.error("Error fetching asistencias data:", error)
        setError("Error al cargar los datos de asistencia")

        // Limpiar datos de gráficos
        setChartData(null)
        setPieData([])
        setSummaryData([])
        setTotalRegistros(0)
      }
    }

    const processAsistenciasData = (data: any) => {
      // Colores para los diferentes estados de asistencia
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

      let estadisticasPorEstado = []

      // Determinar la estructura de los datos según el endpoint
      if (data.estadisticasPorEstado) {
        // Formato para endpoints de alumno, materia o grupo
        estadisticasPorEstado = data.estadisticasPorEstado
      } else if (data.porEstado) {
        // Formato para endpoint de mes
        estadisticasPorEstado = data.porEstado
      } else {
        // Si no hay datos estructurados, usar los datos directamente
        estadisticasPorEstado = Array.isArray(data) ? data : []
      }

      // Calcular días laborables del mes (excluyendo fines de semana)
      const diasLaborables = calcularDiasLaborables(selectedMonth, selectedYear)

      // Obtener los días con registro de asistencia
      let diasConRegistro: number[] = []
      if (data.diasRegistrados) {
        diasConRegistro = data.diasRegistrados
      } else if (data.estadisticasPorAlumno) {
        // Extraer días únicos de las estadísticas por alumno - CORREGIDO PARA MANEJAR UNDEFINED
        const todosLosDias = data.estadisticasPorAlumno.flatMap((alumno: any) => {
          if (Array.isArray(alumno.asistencias)) {
            return alumno.asistencias.map((a: any) => new Date(a.fecha).getDate())
          }
          return []
        })
        diasConRegistro = [...new Set(todosLosDias)] as number[]
      }

      // Calcular días sin registro (faltas automáticas)
      const diasSinRegistro = diasLaborables.filter((dia) => !diasConRegistro.includes(dia))

      // Buscar el índice de las faltas en las estadísticas
      const faltasIndex = estadisticasPorEstado.findIndex((item: any) => item._id === "falta")

      // Si no hay entrada para faltas, crearla
      if (faltasIndex === -1) {
        estadisticasPorEstado.push({ _id: "falta", count: diasSinRegistro.length })
      } else {
        // Sumar las faltas automáticas a las existentes
        estadisticasPorEstado[faltasIndex].count += diasSinRegistro.length
      }

      // Asegurarse de que todos los estados estén representados
      const estadosCompletos = ["asistencia", "falta", "justificada", "retardo"]
      const estadosPresentes = estadisticasPorEstado.map((item: any) => item._id)

      estadosCompletos.forEach((estado) => {
        if (!estadosPresentes.includes(estado)) {
          estadisticasPorEstado.push({ _id: estado, count: 0 })
        }
      })

      // Preparar datos para gráficos
      const labels: string[] = []
      const values: number[] = []
      const pieChartData: PieChartData[] = []
      const summaryItems: { label: string; value: number; color: string }[] = []

      let total = 0

      estadisticasPorEstado.forEach((item: any) => {
        const count = item.count || 0
        const label = item._id.charAt(0).toUpperCase() + item._id.slice(1)
        const color = colors[item._id as keyof typeof colors] || "#999"

        labels.push(label)
        values.push(count)
        total += count

        pieChartData.push({
          name: label,
          population: count,
          color: color,
          legendFontColor: legendColors[item._id as keyof typeof legendColors] || "#000",
          legendFontSize: 12,
        })

        summaryItems.push({
          label: label,
          value: count,
          color: color,
        })
      })

      // Actualizar estado
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
      setSummaryData(summaryItems)
      setTotalRegistros(total)
    }

    const calcularDiasLaborables = (mes: number, anio: number) => {
      const diasEnMes = new Date(anio, mes + 1, 0).getDate()
      const diasLaborables = []

      for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(anio, mes, dia)
        const diaSemana = fecha.getDay() // 0 es domingo, 6 es sábado

        // Excluir sábados (6) y domingos (0)
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasLaborables.push(dia)
        }
      }

      return diasLaborables
    }

    const fetchEmocionesData = async () => {
      try {
        // Implementación similar a fetchAsistenciasData pero para emociones
        // Por ahora, mostraremos un mensaje de que esta funcionalidad está en desarrollo
        setError("La funcionalidad de estadísticas de emociones está en desarrollo")
        setChartData(null)
        setPieData([])
        setSummaryData([])
        setTotalRegistros(0)
      } catch (error) {
        console.error("Error fetching emociones data:", error)
        setError("Error al cargar los datos de emociones")
      }
    }

    const onRefresh = useCallback(async () => {
      setRefreshing(true)
      try {
        await fetchStatisticsData()
      } catch (error) {
        console.error("Error refreshing data:", error)
      } finally {
        setRefreshing(false)
      }
    }, [selectedMonth, selectedYear, filterType, selectedMateria, selectedAlumno, selectedGrupo, statsType])

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
      const newType = statsType === "asistencias" ? "emociones" : "asistencias";
      setStatsType(newType);
      AsyncStorage.setItem("statsType", newType);
      if (newType === "emociones") {
        navigateToEmociones();
      }
    };

    const toggleFilterType = () => {
      const newFilterType = filterType === "mes" ? "semana" : "mes"
      setFilterType(newFilterType)
    }

    const exportToPDF = async () => {
      try {
        setLoading(true);

        // Determinar el tipo de exportación y título
        let tipo = "grupo";
        let id = selectedGrupo || materiaId;
        let tituloReporte = "Estadísticas de Grupo";

        if (selectedAlumno) {
          tipo = "alumno";
          id = selectedAlumno;
          const alumno = alumnos.find((a) => a._id === selectedAlumno);
          tituloReporte = `Estadísticas de Alumno: ${alumno?.nombre_completo || "Desconocido"}`;
        } else if (selectedMateria && !selectedGrupo) {
          tipo = "materia";
          id = selectedMateria;
          const materia = materias.find((m) => m._id === selectedMateria);
          tituloReporte = `Estadísticas de Materia: ${materia?.nombre || "Desconocida"}`;
        } else if (selectedGrupo) {
          const grupo = grupos.find((g) => g._id === selectedGrupo);
          tituloReporte = `Estadísticas de Grupo: ${grupo?.grupo || "Desconocido"}`;
        }

        // Verificar que tenemos un ID válido
        if (!id) {
          alert("Por favor selecciona un grupo, alumno o materia para exportar estadísticas");
          setLoading(false);
          return;
        }

        // Generar HTML para el PDF
        const htmlContent = await generatePDFContent(tituloReporte);

        // Imprimir el contenido HTML
        await Print.printAsync({ html: htmlContent });

        // Mostrar mensaje de éxito
        alert("Se ha generado un reporte HTML. En una implementación completa, esto sería un PDF.");
      } catch (error) {
        console.error("Error exportando reporte:", error);
        if (error instanceof Error) {
          alert("No se pudo exportar el reporte. " + (error.message || ""));
        } else {
          alert("No se pudo exportar el reporte.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Función para generar el contenido HTML del reporte
    interface SummaryItem {
      label: string
      value: number
      color: string
    }

    const generatePDFContent = async (titulo: string): Promise<string> => {
      const fechaActual = new Date().toLocaleDateString()
      
      // Generar las imágenes de los gráficos primero
      const pieChartImage = pieData.length > 0 ? await generateChartImage(pieData) : '';
      const barChartImage = chartData ? await generateChartImage(chartData) : '';
      
      let tablaSummary = ""
      summaryData.forEach((item: SummaryItem) => {
        const porcentaje = totalRegistros > 0 ? Math.round((item.value / totalRegistros) * 100) : 0
        tablaSummary += `
          <div class="summary-card">
            <div class="color-bar" style="background-color: ${item.color}"></div>
            <div class="summary-content">
              <div class="summary-label">${item.label}</div>
              <div class="summary-value">${item.value}</div>
              <div class="summary-percentage">${porcentaje}%</div>
            </div>
          </div>
        `
      })

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Estadísticas</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              background-color: #f5f5f5;
            }
            .header { 
              background-color: #7697a0; 
              color: white; 
              padding: 20px;
              border-radius: 15px 15px 0 0;
            }
            .content { 
              background-color: white;
              border-radius: 0 0 15px 15px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .title { 
              font-size: 24px; 
              font-weight: bold;
              margin: 0;
            }
            .subtitle { 
              font-size: 16px;
              opacity: 0.8;
            }
            .date { 
              text-align: right;
              font-size: 14px;
              color: #666;
              margin: 10px 0;
            }
            .charts-container {
              margin: 20px 0;
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .chart-wrapper {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 10px;
            }
            .chart-title {
              font-size: 16px;
              font-weight: bold;
              color: #2c3e50;
              text-align: center;
              margin-bottom: 10px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin: 20px 0;
            }
            .summary-card {
              background: white;
              border-radius: 8px;
              padding: 12px;
              position: relative;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .color-bar {
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              border-radius: 4px 0 0 4px;
            }
            .summary-content {
              margin-left: 8px;
            }
            .summary-label {
              font-size: 14px;
              color: #2c3e50;
            }
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              color: #2c3e50;
            }
            .summary-percentage {
              font-size: 12px;
              color: #7f8c8d;
            }
            .total-container {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 16px;
              color: #2c3e50;
            }
            .total-value {
              font-size: 18px;
              font-weight: bold;
              color: #2c3e50;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .chart-image {
              width: 100%;
              max-width: 800px;
              margin: 20px auto;
              display: block;
            }
            .chart-container {
              background: white;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${titulo}</h1>
            <div class="subtitle">${getMonthName(selectedMonth)} ${selectedYear}</div>
          </div>
          
          <div class="content">
            <div class="date">
              Fecha del reporte: ${fechaActual}
            </div>
            
            <div class="charts-container">
              ${pieChartImage ? `
                <div class="chart-container">
                  <div class="chart-title">Distribución por Estado</div>
                  <img src="${pieChartImage}" alt="Distribución por Estado" class="chart-image" />
                </div>
              ` : ''}
              
              ${barChartImage ? `
                <div class="chart-container">
                  <div class="chart-title">Cantidad por Estado</div>
                  <img src="${barChartImage}" alt="Cantidad por Estado" class="chart-image" />
                </div>
              ` : ''}
            </div>
            
            <div class="summary-grid">
              ${tablaSummary}
            </div>
            
            <div class="total-container">
              <span class="total-label">Total de registros:</span>
              <span class="total-value">${totalRegistros}</span>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const generateChartImage = async (chartData: any): Promise<string> => {
      try {
        const viewRef = React.createRef<View>();
    
        const renderChart = new Promise<string>((resolve, reject) => {
          setTimeout(async () => {
            try {
              if (!viewRef.current) {
                reject(new Error("View reference not found"));
                return;
              }
    
              // Aumentar el tamaño y calidad de la captura
              const uri = await captureRef(viewRef.current, {
                format: 'png',
                quality: 1,
                result: 'base64',
                width: 800, // Ancho fijo para mejor calidad
                height: 400, // Alto fijo para mejor calidad
              });
    
              resolve(`data:image/png;base64,${uri}`);
            } catch (e) {
              reject(e);
            }
          }, 1000);
        });
    
        // Vista temporal con el gráfico
        const ChartComponent = () => (
          <View 
            ref={viewRef} 
            style={{ 
              width: 800, // Tamaño fijo para mejor calidad
              height: 400,
              backgroundColor: 'white',
              padding: 20,
            }}
          >
            {chartData.datasets ? (
              <BarChart
                data={chartData}
                width={760} // Ajustado para el padding
                height={360}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(118, 151, 160, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  barPercentage: 0.8,
                  propsForLabels: {
                    fontSize: 14,
                    fontWeight: 'bold',
                  },
                  propsForVerticalLabels: {
                    fontSize: 12,
                  },
                }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 10,
                }}
                showValuesOnTopOfBars={true}
                fromZero={true}
              />
            ) : (
              <PieChart
                data={chartData}
                width={760}
                height={360}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(118, 151, 160, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForLabels: {
                    fontSize: 14,
                    fontWeight: 'bold',
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={true}
                center={[380, 180]} // Centrar el gráfico
              />
            )}
          </View>
        );
    
        return await renderChart;
      } catch (error) {
        console.error("Error generating chart image:", error);
        return "";
      }
    };

    const getMonthName = (month: number) => {
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
      return monthNames[month]
    }

    const renderMateriaItem = ({ item }: { item: Materia }) => (
      <TouchableOpacity
        style={[styles.modalItem, selectedMateria === item._id && styles.modalItemSelected]}
        onPress={() => {
          setSelectedMateria(item._id)
          setShowMateriaModal(false)
        }}
      >
        <Text style={styles.modalItemText}>{item.nombre}</Text>
        {selectedMateria === item._id && <AntDesign name="check" size={18} color="#4CAF50" />}
      </TouchableOpacity>
    )

    const renderAlumnoItem = ({ item }: { item: Alumno }) => (
      <TouchableOpacity
        style={[styles.modalItem, selectedAlumno === item._id && styles.modalItemSelected]}
        onPress={() => {
          setSelectedAlumno(item._id)
          setSelectedGrupo(null) // Deseleccionar grupo al seleccionar alumno
          setShowAlumnoModal(false)
        }}
      >
        <Text style={styles.modalItemText}>{item.nombre_completo}</Text>
        <Text style={styles.modalItemSubtext}>{item.matricula}</Text>
        {selectedAlumno === item._id && <AntDesign name="check" size={18} color="#4CAF50" />}
      </TouchableOpacity>
    )

    const renderGrupoItem = ({ item }: { item: Grupo }) => (
      <TouchableOpacity
        style={[styles.modalItem, selectedGrupo === item._id && styles.modalItemSelected]}
        onPress={() => {
          setSelectedGrupo(item._id)
          setSelectedAlumno(null) // Deseleccionar alumno al seleccionar grupo
          setShowGrupoModal(false)
        }}
      >
        <Text style={styles.modalItemText}>Grupo {item.grupo}</Text>
        <Text style={styles.modalItemSubtext}>{item.descripcion}</Text>
        {selectedGrupo === item._id && <AntDesign name="check" size={18} color="#4CAF50" />}
      </TouchableOpacity>
    )

    const navigateToEmociones = () => {
      router.push("/Emociones")
    }

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

          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleStatsType}>
              <MaterialIcons
                name={statsType === "asistencias" ? "emoji-emotions" : "event-available"}
                size={20}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton} onPress={exportToPDF}>
              <FontAwesome5 name="file-pdf" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>{title}</Text>

              {/* Filtros */}
              <View style={styles.filtersContainer}>
                {/* Selector de Mes */}
                <View style={styles.monthSelector}>
                  <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#2c3e50" />
                  </TouchableOpacity>

                  <Text style={styles.monthText}>
                    {getMonthName(selectedMonth)} {selectedYear}
                  </Text>

                  <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
                    <MaterialIcons name="arrow-forward-ios" size={20} color="#2c3e50" />
                  </TouchableOpacity>
                </View>

                {/* Botones de filtro */}
                <View style={styles.filterButtons}>
                  <TouchableOpacity style={styles.filterButton} onPress={() => setShowMateriaModal(true)}>
                    <MaterialIcons name="book" size={18} color="#2c3e50" />
                    <Text style={styles.filterButtonText}>
                      {selectedMateria
                        ? materias.find((m) => m._id === selectedMateria)?.nombre?.substring(0, 15) + "..."
                        : "Materia"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.filterButton} onPress={() => setShowAlumnoModal(true)}>
                    <MaterialIcons name="person" size={18} color="#2c3e50" />
                    <Text style={styles.filterButtonText}>{selectedAlumno ? "Alumno" : "Alumno"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.filterButton} onPress={() => setShowGrupoModal(true)}>
                    <MaterialIcons name="group" size={18} color="#2c3e50" />
                    <Text style={styles.filterButtonText}>{selectedGrupo ? "Grupo" : "Grupo"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Botones de acción */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.clearButton]}
                    onPress={() => {
                      setSelectedMateria(null)
                      setSelectedAlumno(null)
                      setSelectedGrupo(null)
                    }}
                  >
                    <Text style={styles.actionButtonText}>Limpiar filtros</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Gráficos */}
              {chartData && chartData.labels.length > 0 ? (
                <View style={styles.chartsContainer}>
                  {/* Gráfico de Pastel */}
                  {pieData.length > 0 && (
                    <View style={styles.chartWrapper}>
                      <Text style={styles.chartTitle}>Distribución por Estado</Text>
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
                  )}

                  {/* Gráfico de Barras */}
                  <View style={styles.chartWrapper}>
                    <Text style={styles.chartTitle}>Cantidad por Estado</Text>
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
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <MaterialIcons name="bar-chart" size={48} color="#ccc" />
                  <Text style={styles.noDataText}>No hay datos disponibles para este período</Text>
                  <Text style={styles.noDataSubtext}>Prueba con diferentes filtros o períodos</Text>
                </View>
              )}

              {/* Resumen de Datos */}
              {summaryData.length > 0 && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>Resumen</Text>

                  <View style={styles.summaryGrid}>
                    {summaryData.map((item, index) => (
                      <View key={index} style={styles.summaryCard}>
                        <View style={[styles.summaryColorBar, { backgroundColor: item.color }]} />
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={styles.summaryValue}>{item.value}</Text>
                        {totalRegistros > 0 && (
                          <Text style={styles.summaryPercentage}>{Math.round((item.value / totalRegistros) * 100)}%</Text>
                        )}
                      </View>
                    ))}
                  </View>

                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total de registros:</Text>
                    <Text style={styles.totalValue}>{totalRegistros}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Modal para seleccionar Materia */}
        <Modal
          visible={showMateriaModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMateriaModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Materia</Text>
                <TouchableOpacity onPress={() => setShowMateriaModal(false)}>
                  <AntDesign name="close" size={24} color="#2c3e50" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.modalItem, !selectedMateria && styles.modalItemSelected]}
                onPress={() => {
                  setSelectedMateria(null)
                  setShowMateriaModal(false)
                }}
              >
                <Text style={styles.modalItemText}>Todas las materias</Text>
                {!selectedMateria && <AntDesign name="check" size={18} color="#4CAF50" />}
              </TouchableOpacity>

              <FlatList
                data={materias}
                renderItem={renderMateriaItem}
                keyExtractor={(item) => item._id}
                style={styles.modalList}
              />
            </View>
          </View>
        </Modal>

        {/* Modal para seleccionar Alumno */}
        <Modal
          visible={showAlumnoModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAlumnoModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Alumno</Text>
                <TouchableOpacity onPress={() => setShowAlumnoModal(false)}>
                  <AntDesign name="close" size={24} color="#2c3e50" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.modalItem, !selectedAlumno && styles.modalItemSelected]}
                onPress={() => {
                  setSelectedAlumno(null)
                  setShowAlumnoModal(false)
                }}
              >
                <Text style={styles.modalItemText}>Todos los alumnos</Text>
                {!selectedAlumno && <AntDesign name="check" size={18} color="#4CAF50" />}
              </TouchableOpacity>

              <FlatList
                data={alumnos}
                renderItem={renderAlumnoItem}
                keyExtractor={(item) => item._id}
                style={styles.modalList}
              />
            </View>
          </View>
        </Modal>

        {/* Modal para seleccionar Grupo */}
        <Modal
          visible={showGrupoModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGrupoModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Grupo</Text>
                <TouchableOpacity onPress={() => setShowGrupoModal(false)}>
                  <AntDesign name="close" size={24} color="#2c3e50" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.modalItem, !selectedGrupo && styles.modalItemSelected]}
                onPress={() => {
                  setSelectedGrupo(null)
                  setShowGrupoModal(false)
                }}
              >
                <Text style={styles.modalItemText}>Todos los grupos</Text>
                {!selectedGrupo && <AntDesign name="check" size={18} color="#4CAF50" />}
              </TouchableOpacity>

              <FlatList
                data={grupos}
                renderItem={renderGrupoItem}
                keyExtractor={(item) => item._id}
                style={styles.modalList}
              />
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
      fontWeight: "bold",
    },
    subtitleText: {
      fontSize: 14,
      color: "white",
      fontFamily: "Montserrat",
      opacity: 0.8,
    },
    headerButtons: {
      flexDirection: "row",
    },
    headerButton: {
      padding: 8,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      marginLeft: 8,
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
    filtersContainer: {
      marginBottom: 16,
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
    filterButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f0f0f0",
      borderRadius: 8,
      padding: 8,
      flex: 1,
      marginHorizontal: 4,
      justifyContent: "center",
    },
    filterButtonText: {
      fontSize: 14,
      color: "#2c3e50",
      fontFamily: "Montserrat",
      marginLeft: 4,
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "center",
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      marginHorizontal: 4,
    },
    clearButton: {
      backgroundColor: "#f0f0f0",
    },
    actionButtonText: {
      fontSize: 14,
      color: "#2c3e50",
      fontFamily: "Montserrat",
    },
    chartsContainer: {
      marginBottom: 16,
    },
    chartWrapper: {
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
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9f9f9",
      borderRadius: 10,
      marginBottom: 20,
    },
    noDataText: {
      fontSize: 16,
      color: "#666",
      fontFamily: "Montserrat",
      textAlign: "center",
      marginTop: 16,
    },
    noDataSubtext: {
      fontSize: 14,
      color: "#999",
      fontFamily: "Montserrat",
      textAlign: "center",
      marginTop: 8,
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
      marginBottom: 16,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    summaryCard: {
      width: "48%",
      backgroundColor: "white",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      position: "relative",
      overflow: "hidden",
    },
    summaryColorBar: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 4,
      height: "100%",
    },
    summaryLabel: {
      fontSize: 14,
      color: "#2c3e50",
      fontFamily: "Montserrat",
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 20,
      color: "#2c3e50",
      fontWeight: "bold",
      fontFamily: "Montserrat",
    },
    summaryPercentage: {
      fontSize: 12,
      color: "#7f8c8d",
      fontFamily: "Montserrat",
    },
    totalContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
    },
    totalLabel: {
      fontSize: 16,
      color: "#2c3e50",
      fontFamily: "Montserrat",
    },
    totalValue: {
      fontSize: 18,
      color: "#2c3e50",
      fontWeight: "bold",
      fontFamily: "Montserrat",
    },
    errorContainer: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "white",
      borderRadius: 15,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 16,
      color: "#F44336",
      fontFamily: "Montserrat",
      textAlign: "center",
      marginTop: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      backgroundColor: "white",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    modalTitle: {
      fontSize: 18,
      color: "#2c3e50",
      fontWeight: "bold",
      fontFamily: "Montserrat",
    },
    modalList: {
      maxHeight: 400,
    },
    modalItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalItemSelected: {
      backgroundColor: "#f9f9f9",
    },
    modalItemText: {
      fontSize: 16,
      color: "#2c3e50",
      fontFamily: "Montserrat",
      flex: 1,
    },
    modalItemSubtext: {
      fontSize: 12,
      color: "#7f8c8d",
      fontFamily: "Montserrat",
    },
  })
