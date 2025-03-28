import Config from '../config/config'

// Función para realizar peticiones a la API con manejo de errores y timeout
export const fetchWithTimeout = async (endpoint, options = {}) => {
  const url = `${Config.API_URL}${endpoint}`

  // Configurar timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), Config.TIMEOUT)

  try {
    console.log(`URL de la solicitud: ${url}`)

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en la respuesta: ${response.status}`, errorText)

      try {
        // Intentar parsear como JSON
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error || `Error ${response.status}`)
      } catch (e) {
        // Si no es JSON, usar el texto completo
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === "AbortError") {
      throw new Error("La solicitud ha excedido el tiempo de espera")
    }

    console.error(`Error en fetchWithTimeout:`, error)
    throw error
  }
}

// Función de login mejorada
export const login = async (matricula, password) => {
  try {
    const response = await fetchWithTimeout("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ matricula, password }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error en el login:", error)
    return { error: error.message || "No se pudo conectar con el servidor" }
  }
}

// Función para obtener datos del usuario
export const getUserData = async (token) => {
  try {
    const response = await fetchWithTimeout("/api/auth/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.json()
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error)
    throw error
  }
}

// Función para obtener grupos
export const getGrupos = async () => {
  try {
    const response = await fetchWithTimeout("/api/grupos")
    return response.json()
  } catch (error) {
    console.error("Error al obtener grupos:", error)
    throw error
  }
}

// Función para obtener alumnos de un grupo
export const getAlumnosGrupo = async (grupoId) => {
  try {
    const response = await fetchWithTimeout(`/api/alumnos?grupo=${grupoId}`)
    return response.json()
  } catch (error) {
    console.error("Error al obtener alumnos del grupo:", error)
    throw error
  }
}

// Función para obtener emociones
export const getEmociones = async (grupoId, fechaInicio, fechaFin) => {
  try {
    const response = await fetchWithTimeout(
      `/api/emociones?grupo=${grupoId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
    )
    return response.json()
  } catch (error) {
    console.error("Error al obtener emociones:", error)
    throw error
  }
}

// Función para exportar emociones a HTML
export const exportEmocionesHTML = async (grupoId, fechaInicio, fechaFin) => {
  try {
    // En un entorno real, esta función llamaría a una API para generar el PDF
    // Para esta implementación, generaremos HTML localmente

    // Obtener datos necesarios
    const [grupo, alumnos, emociones] = await Promise.all([
      getGrupoInfo(grupoId),
      getAlumnosGrupo(grupoId),
      getEmociones(grupoId, fechaInicio, fechaFin),
    ])

    // Generar HTML
    return generateEmocionesHTML(grupo, alumnos, emociones, fechaInicio, fechaFin)
  } catch (error) {
    console.error("Error al exportar emociones:", error)
    throw error
  }
}

// Función auxiliar para obtener información de un grupo
export const getGrupoInfo = async (grupoId) => {
  try {
    const response = await fetchWithTimeout(`/api/grupos/${grupoId}`)
    return response.json()
  } catch (error) {
    console.error("Error al obtener información del grupo:", error)
    throw error
  }
}

// Función para generar HTML de reporte de emociones
const generateEmocionesHTML = (grupo, alumnos, emociones, fechaInicio, fechaFin) => {
  // Mapear emociones por alumno y fecha
  const emocionesMap = {}
  emociones.forEach((emocion) => {
    if (!emocionesMap[emocion.id_alumno]) {
      emocionesMap[emocion.id_alumno] = {}
    }
    emocionesMap[emocion.id_alumno][emocion.fecha] = emocion.tipo_emocion
  })

  // Generar filas de la tabla
  let tablasAlumnos = ""
  alumnos.forEach((alumno) => {
    const emocionesAlumno = emocionesMap[alumno._id] || {}

    // Contar emociones
    const conteoEmociones = {
      feliz: 0,
      triste: 0,
      enojado: 0,
      ansioso: 0,
      tranquilo: 0,
    }

    Object.values(emocionesAlumno).forEach((emocion) => {
      if (conteoEmociones[emocion] !== undefined) {
        conteoEmociones[emocion]++
      }
    })

    // Calcular emoción predominante
    let emocionPredominante = "tranquilo"
    let maxConteo = 0

    Object.entries(conteoEmociones).forEach(([emocion, conteo]) => {
      if (conteo > maxConteo) {
        maxConteo = conteo
        emocionPredominante = emocion
      }
    })

    tablasAlumnos += `
      <div class="alumno-card">
        <h3>${alumno.nombre_completo}</h3>
        <p>Matrícula: ${alumno.matricula}</p>
        
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
        
        <p>Emoción predominante: <strong>${getEmocionEmoji(emocionPredominante)} ${emocionPredominante.charAt(0).toUpperCase() + emocionPredominante.slice(1)}</strong></p>
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
        <h2>${grupo.nombre || "Grupo"}</h2>
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
}

// Función auxiliar para obtener emoji según emoción
const getEmocionEmoji = (emocion) => {
  switch (emocion) {
    case "feliz":
      return "😊"
    case "triste":
      return "😢"
    case "enojado":
      return "😠"
    case "ansioso":
      return "😰"
    case "tranquilo":
      return "😌"
    default:
      return "😐"
  }
}

export default {
  fetchWithTimeout,
  login,
  getUserData,
  getGrupos,
  getAlumnosGrupo,
  getEmociones,
  exportEmocionesHTML,
  getGrupoInfo,
};

