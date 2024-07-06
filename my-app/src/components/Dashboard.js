import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebaseConfig.json'; // Adjust the path if needed
import './Dashboard.css'; // Import the CSS file

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const functions = getFunctions(app);
const db = getFirestore(app);

export const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [temperatureData, setTemperatureData] = useState([]);
  const [filteredTemperatureData, setFilteredTemperatureData] = useState([]);
  const [medicationData, setMedicationData] = useState([]);
  const [scale, setScale] = useState('1M');

  useEffect(() => {
    const fetchPatients = async () => {
      const getPatientData = httpsCallable(functions, 'getPatientData');
      try {
        const result = await getPatientData();
        setPatients(result.data.patients);
        setSelectedPatient(result.data.patients[0]);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      // Fetch temperature data for the selected patient
      const fetchTemperatureData = async () => {
        const patientDocRef = doc(db, 'patients', selectedPatient.id);
        const bodyTemperaturesColRef = collection(patientDocRef, 'body_temperatures');
        const bodyTemperaturesSnapshot = await getDocs(bodyTemperaturesColRef);
        const temperatures = bodyTemperaturesSnapshot.docs.map(doc => {
          const data = doc.data();
          return { date: new Date(data.date), temperature: data.temperature };
        });
        temperatures.sort((a, b) => b.date - a.date); // Sort by date descending
        setTemperatureData(temperatures);
        filterTemperatureData(temperatures, scale);
      };

      fetchTemperatureData();

      // Fetch medication data for the selected patient
      const fetchMedicationData = async () => {
        const patientDocRef = doc(db, 'patients', selectedPatient.id);
        const medicationsColRef = collection(patientDocRef, 'medications');
        const medicationsSnapshot = await getDocs(medicationsColRef);
        const medications = medicationsSnapshot.docs.map(doc => doc.data());
        setMedicationData(medications);
      };

      fetchMedicationData();
    }
  }, [selectedPatient, scale]);

  const filterTemperatureData = (data, scale) => {
    if (data.length === 0) return;

    const mostRecentDate = new Date(data[0].date);
    let filteredData;
    switch (scale) {
      case '1M':
        filteredData = data.filter(d => new Date(d.date) >= new Date(mostRecentDate.setMonth(mostRecentDate.getMonth() - 1)));
        break;
      case '3M':
        filteredData = data.filter(d => new Date(d.date) >= new Date(mostRecentDate.setMonth(mostRecentDate.getMonth() - 3)));
        break;
      case '6M':
        filteredData = data.filter(d => new Date(d.date) >= new Date(mostRecentDate.setMonth(mostRecentDate.getMonth() - 6)));
        break;
      default:
        filteredData = data;
    }
    setFilteredTemperatureData(filteredData);
  };

  const handleScaleChange = (newScale) => {
    setScale(newScale);
    filterTemperatureData(temperatureData, newScale);
  };

  const chartData = {
    labels: filteredTemperatureData.map(d => d.date),
    datasets: [
      {
        label: 'Temperature',
        data: filteredTemperatureData.map(d => d.temperature),
        fill: false,
        backgroundColor: 'rgba(75,192,192,1)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MM/dd/yyyy',
          displayFormats: {
            day: 'MMM dd, yyyy',
          },
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>Patients</h2>
        {patients.map((patient) => (
          <div key={patient.id} className="patient-container" onClick={() => setSelectedPatient(patient)}>
            {patient.first_name} {patient.last_name}, Age: {patient.age}
          </div>
        ))}
      </div>
      <div className="content">
        <div className="patient-info">
          <h2>Patient Basic Information</h2>
          {selectedPatient && (
            <div>
              <p>Name: {selectedPatient.first_name} {selectedPatient.last_name}</p>
              <p>Age: {selectedPatient.age}</p>
            </div>
          )}
        </div>
        <div className="highlights">
          <h2>Highlights</h2>
          {/* Add highlight details here */}
        </div>
        <div className="temperature-graphic">
          <h2>Temperature Graphic</h2>
          <div>
            <button onClick={() => handleScaleChange('1M')}>1 Month</button>
            <button onClick={() => handleScaleChange('3M')}>3 Months</button>
            <button onClick={() => handleScaleChange('6M')}>6 Months</button>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="medication">
          <h2>Medication</h2>
          {medicationData.map((med, index) => (
            <div key={index} className="medication-row">
              <p>Name: {med.name}</p>
              <p>Dosage: {med.dosage}</p>
              <p>Start Date: {med.start_date}</p>
              <p>End Date: {med.end_date || 'Ongoing'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;








