import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from "react-native"
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons"

interface Event {
  id: string
  title: string
  date: string
  description: string
  imageUrl: string 
}

export default function CalendarScreen() {
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    description: "",
    imageUrl: "https://api.a0.dev/assets/image?text=calendar%20event%20placeholder"
  })
  
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Junta Escolar",
      date: "2024-02-20",
      description: "Reunión general con padres de familia",
      imageUrl: "https://api.a0.dev/assets/image?text=school%20meeting%20with%20parents"
    },
    {
      id: "2",
      title: "Día Deportivo",
      date: "2024-02-25",
      description: "Competencias deportivas interescolares",
      imageUrl: "https://api.a0.dev/assets/image?text=school%20sports%20day%20event"
    },
  ])

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date) {
      setEvents(prev => [...prev, { ...newEvent, id: Date.now().toString() }])
      setNewEvent({
        title: "",
        date: "",
        description: "",
        imageUrl: "https://api.a0.dev/assets/image?text=calendar%20event%20placeholder"
      })
    }
  }


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titleText}>CALENDARIO</Text>
      </View>

      {/* Add Event Section */}
      <View style={styles.addEventSection}>
        <Text style={styles.sectionTitle}>Agregar Evento</Text>
        <TextInput
          style={styles.input}
          placeholder="Título del evento"
          value={newEvent.title}
          onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          value={newEvent.date}
          onChangeText={(text) => setNewEvent(prev => ({ ...prev, date: text }))}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descripción"
          multiline
          numberOfLines={3}
          value={newEvent.description}
          onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
        />
        
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: newEvent.imageUrl }}
            style={styles.previewImage}
          />
      
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
          <Text style={styles.addButtonText}>Agregar Evento</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Eventos Programados</Text>
        <ScrollView style={styles.eventsList}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Image
              
              />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7697a0",
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
  },
  addEventSection: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2c3e50",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5f7d85",
    padding: 8,
    borderRadius: 8,
  },
  regenerateText: {
    color: "white",
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: "#5f7d85",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventsSection: {
    flex: 1,
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventInfo: {
    flex: 1,
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  eventDate: {
    fontSize: 14,
    color: "#7f8c8d",
    marginVertical: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#34495e",
  },
})