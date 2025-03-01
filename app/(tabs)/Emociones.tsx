import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"

type TipoEmocion = "feliz" | "triste" | "enojado" | "ansioso" | "tranquilo"

interface DiasEmociones {
  [key: string]: TipoEmocion
}

interface Estudiante {
  id: string
  nombre: string
  dias_emociones: DiasEmociones
}

interface Grupo {
  id: string
  nombre: string
  horario: string
  estudiantes: Estudiante[]
}

export default function PantallaEmocionesGrupo() {
  const [pestanaSeleccionada, setPestanaSeleccionada] = useState("emociones")
  const [fechaActual, setFechaActual] = useState(new Date())

  const manejarNotificaciones = () => {
    router.push("./notificaciones")
  }

  const manejarEstadisticas = () => {
    router.push("/inicioMaestro")
  }

  const obtenerTextoEmocion = (emocion: TipoEmocion) => {
    const estilosEmocion: { [key in TipoEmocion]: { texto: string; color: string } } = {
      "feliz": { texto: "Feliz", color: "#4CAF50" },
      "triste": { texto: "Triste", color: "#2196F3" },
      "enojado": { texto: "Enojado", color: "#F44336" },
      "ansioso": { texto: "Ansioso", color: "#FF9800" },
      "tranquilo": { texto: "Tranquilo", color: "#9C27B0" }
    }
    return (
      <Text style={[estilos.textoEmocion, { color: estilosEmocion[emocion].color }]}>
        {estilosEmocion[emocion].texto}
      </Text>
    )
  }

  const manejarSemanaPrev = () => {
    const nuevaFecha = new Date(fechaActual)
    nuevaFecha.setDate(nuevaFecha.getDate() - 7)
    setFechaActual(nuevaFecha)
  }

  const manejarSemanaSig = () => {
    const nuevaFecha = new Date(fechaActual)
    nuevaFecha.setDate(nuevaFecha.getDate() + 7)
    setFechaActual(nuevaFecha)
  }

  const grupo: Grupo = {
    id: "1",
    nombre: "Grupo 1",
    horario: "Semana del 5 al 9 de Febrero",
    estudiantes: [
      {
        id: "1",
        nombre: "Ana García",
        dias_emociones: {
          "2024-02-05": "feliz",
          "2024-02-06": "tranquilo",
          "2024-02-07": "ansioso",
          "2024-02-08": "feliz",
          "2024-02-09": "triste",
        },
      },
      {
        id: "2",
        nombre: "Carlos Pérez",
        dias_emociones: {
          "2024-02-05": "enojado",
          "2024-02-06": "triste",
          "2024-02-07": "ansioso",
          "2024-02-08": "tranquilo",
          "2024-02-09": "feliz",
        },
      },
      {
        id: "3",
        nombre: "María Rodríguez",
        dias_emociones: {
          "2024-02-05": "tranquilo",
          "2024-02-06": "feliz",
          "2024-02-07": "feliz",
          "2024-02-08": "ansioso",
          "2024-02-09": "tranquilo",
        },
      },
    ],
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <View style={estilos.contenedorTitulo}>
          <Text style={estilos.textoTitulo}>EMOCIONES</Text>
          <View style={estilos.insigniaGrupo}>
            <Text style={estilos.textoInsigniaGrupo}>Grupo A</Text>
          </View>
        </View>
        <TouchableOpacity style={estilos.botonPerfil}>
          <Text style={estilos.textoBotonJustificar}>Pacheco</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={estilos.contenido}>
        <View style={estilos.tarjetaGrupo}>
          <View style={estilos.encabezadoGrupo}>
            <View>
              <Text style={estilos.nombreGrupo}>{grupo.nombre}</Text>
              <Text style={estilos.textoHorario}>{grupo.horario}</Text>
            </View>
          </View>

          <View style={estilos.contenedorAsistencia}>
            <View style={estilos.contenedorCalendario}>
              <View style={estilos.contenedorMes}>
                <TouchableOpacity onPress={manejarSemanaPrev} style={estilos.botonFlecha}>
                  <FontAwesome name="chevron-left" size={14} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={estilos.textoMes}>Febrero</Text>
                <TouchableOpacity onPress={manejarSemanaSig} style={estilos.botonFlecha}>
                  <FontAwesome name="chevron-right" size={14} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              <View style={estilos.contenedorDias}>
                {['L', 'M', 'M', 'J', 'V'].map((dia, indice) => (
                  <View key={indice} style={estilos.itemDia}>
                    <Text style={estilos.nombreDia}>{dia}</Text>
                    <Text style={estilos.textoDia}>{5 + indice}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={estilos.contenedorEstudiantes}>
              {grupo.estudiantes.map((estudiante) => (
                <View key={estudiante.id} style={estilos.filaEstudiante}>
                  <View style={estilos.contenedorNombreEstudiante}>
                    <Text style={estilos.nombreEstudiante}>{estudiante.nombre}</Text>
                  </View>
                  <View style={estilos.infoAsistencia}>
                    {["2024-02-05", "2024-02-06", "2024-02-07", "2024-02-08", "2024-02-09"].map((fecha) => (
                      <View key={fecha} style={estilos.contenedorEmocion}>
                        {obtenerTextoEmocion(estudiante.dias_emociones[fecha] || "tranquilo")}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={estilos.botonDetalles}
                      onPress={() => console.log('Ver detalles de', estudiante.nombre)}
                    >
                      <Text style={estilos.textoBotonDetalles}>Detalles</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.navInferior}>
        <TouchableOpacity
          style={[estilos.botonNav, pestanaSeleccionada === "emociones" && estilos.botonNavActivo]}
          onPress={manejarEstadisticas}
        >
          <MaterialIcons name="assessment" size={24} color={pestanaSeleccionada === "emociones" ? "#b6cce4" : "#fff"} />
          <Text style={[estilos.textoNav, pestanaSeleccionada === "emociones" && estilos.textoNavActivo]}>Estadísticas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.botonNav} onPress={manejarNotificaciones}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <Text style={estilos.textoNav}>Notificaciones</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#7697a0",
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#7697a0",
  },
  contenedorTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textoTitulo: {
    fontSize: 20,
    color: "white",
    fontFamily: "Montserrat",
    marginRight: 12,
  },
  insigniaGrupo: {
    backgroundColor: "#b6cce4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textoInsigniaGrupo: {
    color: "white",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  botonPerfil: {
    backgroundColor: "#b6cce4",
    padding: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  textoBotonJustificar: {
    color: "white",
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  contenido: {
    flex: 1,
    padding: 16,
  },
  tarjetaGrupo: {
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
  encabezadoGrupo: {
    marginBottom: 16,
  },
  nombreGrupo: {
    fontSize: 18,
    color: "#4A7079",
    fontFamily: "Montserrat",
  },
  textoHorario: {
    color: "#4A7079",
    fontFamily: "Montserrat",
    fontSize: 12,
    marginTop: 4,
  },
  contenedorAsistencia: {
    alignItems: 'center',
  },
  contenedorCalendario: {
   
    borderRadius: 10,
    padding: 8,
    width: '100%',
    marginBottom: 16,
  },
  contenedorMes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  textoMes: {
    fontSize: 14,
    color: "#4A7079",
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  botonFlecha: {
    padding: 2,
  },
  contenedorDias: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    paddingHorizontal: 0,
    marginLeft: "20%",
  },
  itemDia: {
    alignItems: "center",
    width: 32,
    marginHorizontal: 4,
  },
  nombreDia: {
    fontSize: 14,
    color: "#4A7079",
    marginBottom: 4,
  },
  textoDia: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A7079",
  },
  contenedorEstudiantes: {
    width: '108%',
  },
  filaEstudiante: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  contenedorNombreEstudiante: {
    width: '22%',
  },
  nombreEstudiante: {
    fontSize: 12,
    color: "#4A7079",
    fontFamily: "Montserrat",
  },
  infoAsistencia: {
    flexDirection: "row",
    alignItems: "center",
    width: '50%',
    justifyContent: "space-evenly",
  },
  contenedorEmocion: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 21,
    marginHorizontal: 10,
  },
  textoEmocion: {
    fontSize: 9,
    fontFamily: "Montserrat",
    fontWeight: "normal",
  },
  botonDetalles: {
    backgroundColor: "#b6cce4",
    padding: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
  },
  textoBotonDetalles: {
    color: "white",
    fontSize: 10,
    fontFamily: "Montserrat",
  },
  navInferior: {
    flexDirection: "row",
    backgroundColor: "#5f7d85",
    padding: 10,
    justifyContent: "space-around",
  },
  botonNav: {
    alignItems: "center",
    padding: 10,
  },
  botonNavActivo: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  textoNav: {
    color: "#fff",
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  textoNavActivo: {
    color: "#b6cce4",
    fontFamily: "Montserrat",
  },
})