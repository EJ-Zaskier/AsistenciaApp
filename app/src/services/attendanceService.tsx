import axios from 'axios';
import API_URL from "../config/config" // Asegúrate de que la ruta sea correcta

export const registerAttendance = async (userId: string, date: string, status: string) => {
  try {
    const response = await axios.post(`${API_URL}/attendance`, { userId, date, status });
    return response.data;
  } catch (error) {
    console.error('Error registering attendance:', error);
    throw error;
  }
};

export const getAttendanceRecords = async (userId: string, startDate: string, endDate: string) => {
  try {
    const response = await axios.get(`${API_URL}/attendance`, { params: { userId, startDate, endDate } });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};