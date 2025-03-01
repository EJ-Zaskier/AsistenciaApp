import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router, useRouter } from "expo-router"
import { useState } from 'react';

type AttendanceStatus = 'present' | 'absent';
interface AttendanceDays {
  [key: string]: AttendanceStatus | undefined;
}


export default function AttendanceScreen() {
  const userName = "Usuario";
  const [selectedTab, setSelectedTab] = useState('attendance');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Placeholder functions for navigation
  const handleJustify = () => {
    router.push("./justificar")
  };

  const handleNotifications = () => {
    router.push("./notificaciones")
  };

  const getAttendanceColor = (percentage: string) => {
    const numericPercentage = parseInt(percentage);
    return numericPercentage >= 80 ? '#4CAF50' : '#F44336';
  };

  const subjects = [
    {
      name: 'Matemáticas',
      attendance: '90%',
      schedule: 'Lunes y Miércoles 9:00 AM',
      attendance_days: {
        '2024-02-01': 'present',
        '2024-02-05': 'present',
        '2024-02-07': 'absent',
        '2024-02-12': 'present',
        '2024-02-14': 'present',
        '2024-02-19': 'absent',
      } as const
    },
    {
      name: 'Física',
      attendance: '75%',
      schedule: 'Martes y Jueves 11:00 AM',
      attendance_days: {
        '2024-02-01': 'present',
        '2024-02-06': 'absent',
        '2024-02-08': 'present',
        '2024-02-13': 'present',
        '2024-02-15': 'present',
        '2024-02-20': 'present',
      } as const
    },
    {
      name: 'Química',
      attendance: '95%',
      schedule: 'Viernes 10:00 AM',
      attendance_days: {
        '2024-02-02': 'present',
        '2024-02-09': 'present',
        '2024-02-16': 'present',
        '2024-02-23': 'present',
      } as const
    }
  ];

  // Refactored WeekCalendar as a component to use hooks properly
  const WeekCalendar = ({ attendanceDays }: { attendanceDays: AttendanceDays }) => {
    const [weekOffset, setWeekOffset] = useState(0);

    const getWeekDays = () => {
      const today = new Date();
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay() + weekOffset * 7);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(firstDay);
        currentDate.setDate(firstDay.getDate() + i);
        days.push(currentDate);
      }
      return days;
    };

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const weekDays = getWeekDays();
    const currentMonthName = monthNames[weekDays[0].getMonth()];
    const weekDayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
      <View style={styles.weekCalendarContainer}>
        <Text style={styles.monthText}>{currentMonthName}</Text>
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            onPress={() => setWeekOffset(prev => prev - 1)}
            style={styles.arrowButton}
          >
            <MaterialIcons name="chevron-left" size={24} color="#b6cce4" />
          </TouchableOpacity>
          
          <View style={styles.daysContainer}>
            {weekDayLabels.map((label, index) => (
              <View key={`header-${index}`} style={styles.dayLabelContainer}>
                <Text style={styles.dayLabel}>{label}</Text>
              </View>
            ))}
            
            {weekDays.map((date, index) => {
              const dateString = date.toISOString().split('T')[0];
              const status = attendanceDays[dateString];
              return (
                <View key={index} style={styles.dayContainer}>
                  <Text style={styles.dayNumber}>{date.getDate()}</Text>
                  {status && (
                    <View style={styles.attendanceIndicator}>
                      {status === 'present' ? (
                        <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                      ) : (
                        <MaterialIcons name="cancel" size={14} color="#F44336" />
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <TouchableOpacity 
            onPress={() => setWeekOffset(prev => prev + 1)}
            style={styles.arrowButton}
          >
            <MaterialIcons name="chevron-right" size={24} color="#b6cce4" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.justifyButton}
          onPress={handleJustify}
        >
          <MaterialIcons name="note-add" size={20} color="white" />
          <Text style={styles.justifyText}>Justificar</Text>
        </TouchableOpacity>

        <Text style={styles.titleText}>Asistencias</Text>

        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.userName}>{userName}</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.content}>
        {subjects.map((subject, index) => (
          <View key={index} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <View style={[styles.attendancePercentage, { backgroundColor: getAttendanceColor(subject.attendance) }]}>
                <Text style={styles.percentageText}>{subject.attendance}</Text>
              </View>
            </View>
            
            <Text style={styles.scheduleText}>{subject.schedule}</Text>
            <WeekCalendar attendanceDays={subject.attendance_days} />
          </View>
        ))}
      </ScrollView>

      {/* Barra de navegación inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, selectedTab === 'attendance' && styles.navButtonActive]}
          onPress={() => setSelectedTab('attendance')}
        >
          <MaterialIcons name="assessment" size={24} color={selectedTab === 'attendance' ? '#b6cce4' : '#fff'} />
          <Text style={[styles.navText, selectedTab === 'attendance' && styles.navTextActive]}>Estadísticas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={handleNotifications}
        >
          <Ionicons name="notifications" size={24} color="#fff" />
          <Text style={styles.navText}>Notificaciones</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7697a0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#7697a0',
  },
  titleText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  justifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b6cce4',
    padding: 8,
    borderRadius: 20,
  },
  justifyText: {
    marginLeft: 4,
    color: 'white',
    fontFamily: 'Montserrat',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b6cce4',
    padding: 8,
    borderRadius: 20,
  },
  userName: {
    color: 'white',
    fontFamily: 'Montserrat',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subjectCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 18,
    color: '#2c3e50',
    fontFamily: 'Montserrat',
  },
  attendancePercentage: {
    padding: 6,
    borderRadius: 12,
  },
  percentageText: {
    color: 'white',
    fontFamily: 'Montserrat',
  },
  scheduleText: {
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  weekCalendarContainer: {
    marginTop: 8,
  },
  monthText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  arrowButton: {
    padding: 8,
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  dayLabelContainer: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  dayContainer: {
    width: '14.28%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 12,
    color: '#2c3e50',
    fontFamily: 'Montserrat',
  },
  attendanceIndicator: {
    position: 'absolute',
    bottom: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#5f7d85',
    padding: 10,
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    padding: 10,
  },
  navButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  navText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  navTextActive: {
    color: '#b6cce4',
    fontFamily: 'Montserrat',
  },
});
