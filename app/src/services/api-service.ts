// Tipos
export type AttendanceType = "asistencia" | "falta" | "justificada" | "retardo"

export interface AttendanceDays {
  [key: string]: AttendanceType
}

export interface Alumno {
  _id: string
  nombre_completo: string
  matricula: string
  grupo: string
  carrera: string
}

export interface Grupo {
  _id: string
  nombre: string
  descripcion: string
  id_carrera: string
  alumnos: string[] // Array de IDs de alumnos
}

export interface Asistencia {
  _id: string
  fecha: string
  estado: AttendanceType
  id_salon: string
  id_horario: string
  id_alumno: string
}

// URL base de la API
const API_BASE_URL = "http://192.168.56.1:5000/api"

// Obtener todos los grupos
export const fetchGrupos = async (): Promise<Grupo[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos`)
    if (!response.ok) {
      throw new Error("Error al obtener grupos")
    }
    return await response.json()
  } catch (error) {
    console.error("Error al obtener grupos:", error)
    throw error
  }
}

// Obtener todos los alumnos
export const fetchAlumnos = async (): Promise<Alumno[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/alumnos`)
    if (!response.ok) {
      throw new Error("Error al obtener alumnos")
    }
    return await response.json()
  } catch (error) {
    console.error("Error al obtener alumnos:", error)
    throw error
  }
}

// Obtener asistencias de un alumno
export const fetchAlumnoAttendance = async (alumnoId: string): Promise<Asistencia[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/asistencias/${alumnoId}`)
    if (!response.ok) {
      throw new Error("Error al obtener asistencias")
    }
    return await response.json()
  } catch (error) {
    console.error(`Error al obtener asistencias del alumno ${alumnoId}:`, error)
    throw error
  }
}

// Función auxiliar para formatear fechas
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

// Exporting an empty React component as default
import React from 'react';

const ApiServiceComponent: React.FC = () => {
  return null;
};

export default ApiServiceComponent;