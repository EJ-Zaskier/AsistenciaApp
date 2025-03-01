import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native"
import { FontAwesome, MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"

interface Event {
  id: string
  title: string
  time: string
  description: string
  imageUrl: string
  type: 'reunion' | 'evento' | 'recordatorio'
}

const handleCalendar = () => {
  router.push("./Calendario")
}

export default function NotificationsScreen() {
  const [events] = useState<Event[]>([
    {
      id: "1",
      title: "Junta de Padres",
      time: "09:00 AM",
      description: "Reunión general con padres de familia para discutir el progreso del primer trimestre",
      imageUrl: "https://api.a0.dev/assets/image?text=parent%20teacher%20meeting&seed=123",
      type: 'reunion'
    },
    {
      id: "2",
      title: "Competencia Deportiva",
      time: "11:30 AM",
      description: "Final del torneo interescolar de fútbol",
      imageUrl: "https://api.a0.dev/assets/image?text=school%20sports%20competition&seed=456",
      type: 'evento'
    },
    {
      id: "3",
      title: "Entrega de Calificaciones",
      time: "02:00 PM",
      description: "Fecha límite para la entrega de calificaciones del período",
      imageUrl: "https://api.a0.dev/assets/image?text=report%20cards%20deadline&seed=789",
      type: 'recordatorio'
    },
    {
      id: "4",
      title: "Taller de Arte",
      time: "03:30 PM",
      description: "Taller especial de pintura para estudiantes de primaria",
      imageUrl: "https://api.a0.dev/assets/image?text=art%20workshop%20children&seed=101",
      type: 'evento'
    }
  ])

  const getIconForType = (type: string) => {
    switch(type) {
      case 'reunion':
        return <MaterialIcons name="groups" size={24} color="#e67e22" />
      case 'evento':
        return <MaterialIcons name="event" size={24} color="#3498db" />
      case 'recordatorio':
        return <MaterialIcons name="notification-important" size={24} color="#e74c3c" />
      default:
        return <MaterialIcons name="event-note" size={24} color="#7f8c8d" />
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titleText}>NOTIFICACIONES Y EVENTOS</Text>
        <Text style={styles.dateText}>Hoy, {new Date().toLocaleDateString()}</Text>
      </View>

      {/* Events List */}
      <ScrollView style={styles.eventsList}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.eventImage}
            />
            <View style={styles.eventContent}>
              <View style={styles.eventHeader}>
                {getIconForType(event.type)}
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDescription}>{event.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Calendar Button */}
      <TouchableOpacity style={styles.calendarButton} onPress={handleCalendar}>
        <MaterialIcons name="calendar-today" size={24} color="white" />
        <Text style={styles.calendarButtonText}>Ver Calendario Completo</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  header: {
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#7697a0",
  },
  titleText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  eventsList: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventImage: {
    width: "100%",
    height: 150,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5f7d85",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calendarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})