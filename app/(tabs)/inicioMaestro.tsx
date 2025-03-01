import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"

type AttendanceType = "present" | "absent" | "justified" | "late"

interface AttendanceDays {
  [key: string]: AttendanceType
}

interface Student {
  id: string
  name: string
  attendance_days: AttendanceDays
  attendance_percentage: number
}

interface Group {
  id: string
  name: string
  schedule: string
  students: Student[]
}

export default function GroupAttendanceScreen() {
  const [selectedTab, setSelectedTab] = useState("attendance")
  const [currentDate, setCurrentDate] = useState(new Date())

  //const handleNotifications = () => {
   // router.push("/notificaciones")
  //}

  const handleJustify = () => {
    router.push("./justificantes")
  }

  const handleVer = () => {
    router.push("/VerMas")
  }

  const handleEmociones = () => {
    router.push("./Emociones")
  }

  const getAttendanceColor = (percentage: number) => {
    return percentage >= 80 ? "#4CAF50" : "#F44336"
  }

  const getAttendanceIcon = (type: AttendanceType) => {
    switch (type) {
      case "present":
        return <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
      case "absent":
        return <MaterialIcons name="cancel" size={20} color="#F44336" />
      case "justified":
        return <Text style={styles.justifiedText}>J</Text>
      case "late":
        return <Text style={styles.lateText}>R</Text>
    }
  }

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const groups: Group[] = [
    {
      id: "1",
      name: "Grupo A - Matemáticas",
      schedule: "Lunes y Miércoles 9:00 AM",
      students: [
        {
          id: "1",
          name: "Ana García",
          attendance_percentage: 95,
          attendance_days: {
            "2024-02-05": "present",
            "2024-02-06": "present",
            "2024-02-07": "late",
            "2024-02-08": "present",
            "2024-02-09": "justified",
          },
        },
        {
          id: "2",
          name: "Carlos Pérez",
          attendance_percentage: 75,
          attendance_days: {
            "2024-02-05": "present",
            "2024-02-06": "absent",
            "2024-02-07": "absent",
            "2024-02-08": "justified",
            "2024-02-09": "present",
          },
        },
        {
          id: "3",
          name: "María Rodríguez",
          attendance_percentage: 88,
          attendance_days: {
            "2024-02-05": "present",
            "2024-02-06": "present",
            "2024-02-07": "present",
            "2024-02-08": "late",
            "2024-02-09": "present",
          },
        },
      ],
    },
    {
      id: "2",
      name: "Grupo B - Física",
      schedule: "Martes y Jueves 11:00 AM",
      students: [
        {
          id: "4",
          name: "Juan Martínez",
          attendance_percentage: 92,
          attendance_days: {
            "2024-02-05": "present",
            "2024-02-06": "present",
            "2024-02-07": "present",
            "2024-02-08": "present",
            "2024-02-09": "late",
          },
        },
        {
          id: "5",
          name: "Laura Sánchez",
          attendance_percentage: 70,
          attendance_days: {
            "2024-02-05": "absent",
            "2024-02-06": "justified",
            "2024-02-07": "present",
            "2024-02-08": "absent",
            "2024-02-09": "present",
          },
        },
        {
          id: "6",
          name: "Pedro González",
          attendance_percentage: 85,
          attendance_days: {
            "2024-02-05": "present",
            "2024-02-06": "late",
            "2024-02-07": "present",
            "2024-02-08": "present",
            "2024-02-09": "justified",
          },
        },
      ],
    },
  ]

  return (
    <View style={styles.container}>      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={handleEmociones}>
          <Text style={styles.justifyButtonText}>Emociones</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Asistencias por Grupo</Text>
        <TouchableOpacity style={styles.profileButton} onPress={handleJustify}>
          <Text style={styles.justifyButtonText}>Justificantes</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.content}>
        {groups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.scheduleText}>{group.schedule}</Text>
              </View>
              <TouchableOpacity style={styles.viewMoreButton} onPress={handleVer}>
                <Text style={styles.viewMoreText}>Ver más</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.attendanceContainer}>
              <View style={styles.attendanceHeader}>
                <View style={styles.studentsColumn}>
                  <Text style={{fontWeight: 'bold', color: '#2c3e50', marginBottom: 8}}>ALUMNOS</Text>
                </View>
                <View style={styles.attendanceColumn}>
                  <View style={styles.calendarContainer}>
                    <View style={styles.monthContainer}>
                      <TouchableOpacity onPress={handlePrevWeek} style={styles.arrowButton}>
                        <FontAwesome name="chevron-left" size={14} color="#2c3e50" />
                      </TouchableOpacity>
                      <Text style={styles.monthText}>Febrero</Text>
                      <TouchableOpacity onPress={handleNextWeek} style={styles.arrowButton}>
                        <FontAwesome name="chevron-right" size={14} color="#2c3e50" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.daysContainer}>
                      {['L', 'M', 'M', 'J', 'V'].map((day, index) => (
                        <View key={index} style={styles.dayItem}>
                          <Text style={styles.dayName}>{day}</Text>
                          <Text style={styles.dayText}>{5 + index}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {group.students.map((student) => (
                <View key={student.id} style={styles.studentRow}>
                  <View style={styles.studentsColumn}>
                    <Text style={styles.studentName}>{student.name}</Text>
                  </View>
                  <View style={styles.attendanceColumn}>
                    <View style={styles.attendanceInfo}>
                      {["2024-02-05", "2024-02-06", "2024-02-07", "2024-02-08", "2024-02-09"].map((date) => (
                        <View key={date} style={styles.attendanceIcon}>
                          {getAttendanceIcon(student.attendance_days[date] || "absent")}
                        </View>
                      ))}
                      <View
                        style={[
                          styles.attendancePercentage,
                          { backgroundColor: getAttendanceColor(student.attendance_percentage) },
                        ]}
                      >                        <Text style={styles.percentageText}>{student.attendance_percentage}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Barra de navegación inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}> //onPreshandleNotifications
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
  titleText: {
    fontSize: 22,
    color: "white",
    textAlign: "center",
    fontFamily: "Montserrat",
    flex: 1,
  },
  profileButton: {
    backgroundColor: "#b6cce4",
    padding: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  justifyButtonText: {
    color: "white",
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  groupName: {
    fontSize: 18,
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
  scheduleText: {
    color: "#666",
    fontFamily: "Montserrat",
    fontSize: 12,
    marginTop: 4,
  },
  viewMoreButton: {
    backgroundColor: "#b6cce4",
    padding: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  viewMoreText: {
    color: "white",
    fontFamily: "Montserrat",
    fontSize: 12,
  },
  attendanceContainer: {
    marginTop: 1,
  },
  attendanceHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  studentsColumn: {
    width: '40%',
  },
  attendanceColumn: {
    width: '64%',
    alignItems: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  studentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  studentsList: {
    marginTop: 5,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  studentName: {
    fontSize: 14,
    color: "#2c3e50",
    fontFamily: "Montserrat",
  },
  attendanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: 222,
    justifyContent: "flex-start",
  },
  attendanceIcon: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
  },
  attendancePercentage: {
    padding: 6,
    borderRadius: 12,
    minWidth: 44,
    alignItems: "center",
    marginLeft: 6,
  },
  percentageText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  justifiedText: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  lateText: {
    color: "#FFC107",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#5f7d85",
    padding: 1,
    justifyContent: "space-around",
  },
  navButton: {
    alignItems: "center",
    padding: 1,
  },
  navButtonActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
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
  calendarContainer: {
    borderRadius: 1,
    padding: 2,
    width: 222,
    marginLeft: "auto",
  },
  monthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  monthText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  arrowButton: {
    padding:1,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "77%",
    paddingHorizontal: 2,
  },
  dayItem: {
    alignItems: "center",
    width: 29,
    marginHorizontal: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  dayName: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 1,
  },
})