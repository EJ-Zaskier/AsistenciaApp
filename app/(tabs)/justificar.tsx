import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const handnotificaciones = () => {
  router.push("./notificaciones")
}
const handEstadistica = () =>{
    router.push("./inicio")
}

export default function JustificanteScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Justificante</Text>
        <View style={styles.userBox}>
          <Text style={styles.userName}>Enrique Gracia</Text>
        </View>
      </View>

      {/* Main Form Card */}
      <View style={styles.card}>
        <View style={styles.formRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput 
              style={styles.input}
              placeholder="DD/MM/YYYY"
            />
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Razón</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ingrese razón"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Materia</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ingrese materia"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navButton} onPress={handEstadistica}>
          <MaterialIcons name="analytics" size={24} color="white" />
          <Text style={styles.buttonText}>Estadísticas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={handnotificaciones}>
          <MaterialIcons name="notifications" size={24} color="white" />
          <Text style={styles.buttonText}>Notificaciones</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7697A0',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userBox: {
    backgroundColor: '#B6CCE4',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  card: {
    backgroundColor: '#D9D9D9',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  labelContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4A7079',
  },
  input: {
    borderWidth: 1,
    borderColor: '#7697A0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: '#7697A0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 20,
  },
  navButton: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
});