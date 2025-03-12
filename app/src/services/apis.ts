import AsyncStorage from "@react-native-async-storage/async-storage"

export const login = async (matricula: string, password: string) => {
  try {
    const response = await fetch("http://192.168.56.1:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matricula, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error de autenticación")
    }

    const data = await response.json()
    await AsyncStorage.setItem("user", JSON.stringify(data.user))
    await AsyncStorage.setItem("token", data.token)
    return data
  } catch (error: any) {
    return { error: error.message }
  }
}

export default {
  login,
}

