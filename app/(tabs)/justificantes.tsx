import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"

interface Justification {
  id: string
  studentName: string
  date: string
  reason: string
  status: "pending" | "approved"
}

export default function JustificationsScreen() {
  const [selectedTab, setSelectedTab] = useState("justifications")
  const [justifications, setJustifications] = useState<Justification[]>([
    {
      id: "1",
      studentName: "Ana García",
      date: "2024-02-12",
      reason: "Cita médica - Consulta general",
      status: "approved",
    },
    {
      id: "2",
      studentName: "Carlos Pérez",
      date: "2024-02-13",
      reason: "Evento familiar - Boda de hermana",
      status: "pending",
    },
    {
      id: "3",
      studentName: "María Rodríguez",
      date: "2024-02-14",
      reason: "Problemas de transporte - Huelga de autobuses",
      status: "pending",
    },
    {
      id: "4",
      studentName: "Juan Martínez",
      date: "2024-02-15",
      reason: "Enfermedad - Gripe",
      status: "approved",
    },
    {
      id: "5",
      studentName: "Laura Sánchez",
      date: "2024-02-15",
      reason: "Competencia deportiva - Torneo regional",
      status: "pending",
    },
  ])

  const handleNotifications = () => {
    router.push("./notificaciones")
  }

  const handleEstadisticas = () => {
      router.push("/inicioMaestro")
    }

  const toggleStatus = (id: string) => {
    setJustifications(prevJustifications =>
      prevJustifications.map(justification =>
        justification.id === id
          ? {
              ...justification,
              status: justification.status === "pending" ? "approved" : "pending",
            }
          : justification
      )
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Justificantes</Text>
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>Grupo A</Text>
          </View>
        </View>
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.content}>
        {justifications.map((justification) => (
          <View key={justification.id} style={styles.justificationCard}>
            <View style={styles.justificationHeader}>
              <Text style={styles.studentName}>{justification.studentName}</Text>
              <Text style={styles.dateText}>{justification.date}</Text>
            </View>
            <Text style={styles.reasonText}>{justification.reason}</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  {
                    backgroundColor:
                      justification.status === "approved" ? "#4CAF50" : "#F44336",
                  },
                ]}
                onPress={() => toggleStatus(justification.id)}
              >
                <Text style={styles.statusText}>
                  {justification.status === "approved" ? "Enterado" : "Pendiente"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Barra de navegación inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, selectedTab === "justifications" && styles.navButtonActive]}
          onPress={ handleEstadisticas}
        >
          <MaterialIcons
            name="assignment"
            size={24}
            color={selectedTab === "justifications" ? "#b6cce4" : "#fff"}
          />
          <Text
            style={[styles.navText, selectedTab === "justifications" && styles.navTextActive]}
          >
            Estadisticas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={handleNotifications}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <Text style={styles.navText}>Notificaciones</Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#7697a0",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    color: "white",
    fontFamily: "Montserrat",
    marginRight: 12,
  },
  groupBadge: {
    backgroundColor: "#b6cce4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupBadgeText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  justificationCard: {
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
  justificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    color: "#2c3e50",
    fontFamily: "Montserrat",
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 14,
    color: "#7f8c8d",
    fontFamily: "Montserrat",
  },
  reasonText: {
    fontSize: 14,
    color: "#34495e",
    fontFamily: "Montserrat",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#5f7d85",
    padding: 10,
    justifyContent: "space-around",
  },
  navButton: {
    alignItems: "center",
    padding: 10,
  },
  navButtonActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  navText: {
    color: "#fff",
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  navTextActive: {
    color: "#b6cce4",
    fontFamily: "Montserrat",
  },
})