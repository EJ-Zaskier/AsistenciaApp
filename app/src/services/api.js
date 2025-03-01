import API_URL from "../config/config" // Asegúrate de que la ruta sea correcta

export const login = async (matricula, password) => {
  try {
    console.log("URL de la solicitud:", `${API_URL}/api/auth/login`)
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matricula, password }),
    })

    console.log("Estado de la respuesta:", response.status)
    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.message || "Error en las credenciales" }
    }

    const data = await response.json()
    // Assuming the backend now includes a 'role' field in the response
    return { ...data, rol: data.rol }
  } catch (error) {
    console.error("Error en el login:", error)
    return { error: "No se pudo conectar con el servidor" }
  }
}
