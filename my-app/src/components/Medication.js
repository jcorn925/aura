import React, { useState } from 'react';
import { collection, doc, addDoc, getDocs } from 'firebase/firestore';
import './styles.css';

const Medication = ({ medicationData, selectedPatient, db, onNewMedicationAdded }) => {
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleAddMedication = async () => {
    if (!medicationName || !dosage || !startDate) {
      setError('Please fill out all required fields.');
      return;
    }

    if (selectedPatient) {
      const patientDocRef = doc(db, 'patients', selectedPatient.id);
      const medicationsColRef = collection(patientDocRef, 'medications');
      await addDoc(medicationsColRef, {
        name: medicationName,
        dosage,
        startDate,
        endDate: endDate || 'Ongoing',
      });
      setMedicationName('');
      setDosage('');
      setStartDate('');
      setEndDate('');
      setError('');

      const medicationsSnapshot = await getDocs(medicationsColRef);
      const medications = medicationsSnapshot.docs.map(doc => doc.data());
      onNewMedicationAdded(medications);
    }
  };

  return (
    <div className="medication-container">
      <h2>Medication</h2>
      <div className="medication">
        {medicationData.map((med, index) => (
          <div key={index} className="medication-row">
            <div>{med.name}</div>
            <div>{med.dosage}</div>
            <div>Start Date: {med.startDate}</div>
            <div>End Date: {med.endDate}</div>
          </div>
        ))}
      </div>
      <div className="medication-form">
        <label>
          Medication Name
          <input
            type="text"
            placeholder="Medication Name"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
          />
        </label>
        <label>
          Dosage
          <input
            type="text"
            placeholder="Dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
          />
        </label>
        <label>
          Start Date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button onClick={handleAddMedication}>Add Medication</button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Medication;






