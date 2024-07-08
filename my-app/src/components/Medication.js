import React, { useState } from 'react';
import { collection, doc, addDoc, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './styles.css';

const Medication = ({ medicationData, selectedPatient, db, onNewMedicationAdded }) => {
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const functions = getFunctions();

  const handleAddMedication = async () => {
    if (!medicationName || !dosage || !startDate) {
      setError('Please fill out all required fields.');
      return;
    }

    if (selectedPatient) {
      try {
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
        setShowForm(false);

        const medicationsSnapshot = await getDocs(medicationsColRef);
        const medications = medicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onNewMedicationAdded(medications);
      } catch (err) {
        console.error('Error adding medication:', err);
        setError('Failed to add medication.');
      }
    }
  };

  const handleRemoveMedication = async (medId) => {
    if (selectedPatient) {
      const deleteMedication = httpsCallable(functions, 'deleteMedication');
      try {
        await deleteMedication({ patientId: selectedPatient.id, medicationId: medId });

        const patientDocRef = doc(db, 'patients', selectedPatient.id);
        const medicationsColRef = collection(patientDocRef, 'medications');
        const medicationsSnapshot = await getDocs(medicationsColRef);
        const medications = medicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onNewMedicationAdded(medications);
      } catch (err) {
        console.error('Error removing medication:', err);
        setError('Failed to remove medication.');
      }
    }
  };

  return (
    <div className="medication-container">
      <h2>Medication</h2>
      <div className="medication">
        {medicationData.map((med) => (
          <div key={med.id} className="medication-row">
            <div>{med.name}</div>
            <div>{med.dosage}</div>
            <div>Start Date: {med.startDate}</div>
            <div>End Date: {med.endDate}</div>
            <button
              className="remove-button"
              onClick={() => handleRemoveMedication(med.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {showForm ? (
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
          <button onClick={handleAddMedication}>Submit</button>
          <button onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      ) : (
        <button className="add-medication-button" onClick={() => setShowForm(true)}>Add Medication</button>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Medication;


