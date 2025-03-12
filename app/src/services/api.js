import config from "../config/config"; // Asegúrate de que la ruta sea correcta

export const login = async (matricula, password) => {
    try {
        console.log("URL de la solicitud:", `${config.API_URL}/api/auth/login`);
        const response = await fetch(`${config.API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ matricula, password }),
        });

        console.log("Estado de la respuesta:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error en la respuesta:", errorData);
            return { error: errorData.message || "Error en las credenciales" };
        }

        const data = await response.json();
        console.log("Respuesta del servidor:", data);

        // Asegúrate de que el backend devuelva un campo 'rol' en la respuesta
        if (!data.rol) {
            console.error("El backend no devolvió un rol válido:", data);
            return { error: "Rol de usuario no definido en la respuesta del servidor" };
        }

        return { ...data, rol: data.rol }; // Devuelve los datos con el rol
    } catch (error) {
        console.error("Error en el login:", error);
        return { error: "No se pudo conectar con el servidor" };
    }
};

// Default export of a React component
import React from 'react';

const ApiComponent = () => {
    return <div>API Service Component</div>;
};

export default ApiComponent;