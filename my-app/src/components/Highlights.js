import React, { useState, useEffect } from 'react';
import { collection, doc, addDoc, getDocs } from 'firebase/firestore';

const Highlights = ({ selectedPatient, db, onNewTemperatureAdded, mostRecentTemperatureDate }) => {
  const [newTemperature, setNewTemperature] = useState('');
  const [newTemperatureDate, setNewTemperatureDate] = useState('');

  useEffect(() => {
    if (mostRecentTemperatureDate) {
      const nextDate = new Date(mostRecentTemperatureDate);
      nextDate.setDate(nextDate.getDate() + 1);
      setNewTemperatureDate(nextDate.toISOString().split('T')[0]);
    }
  }, [mostRecentTemperatureDate]);

  const handleAddTemperature = async () => {
    if (newTemperature && newTemperatureDate && selectedPatient) {
      const patientDocRef = doc(db, 'patients', selectedPatient.id);
      const bodyTemperaturesColRef = collection(patientDocRef, 'body_temperatures');
      await addDoc(bodyTemperaturesColRef, {
        date: new Date(newTemperatureDate).toISOString().split('T')[0], // Ensure correct date format
        temperature: parseFloat(newTemperature),
      });
      setNewTemperature('');
      const nextDate = new Date(newTemperatureDate);
      nextDate.setDate(nextDate.getDate() + 1);
      setNewTemperatureDate(nextDate.toISOString().split('T')[0]);

      const bodyTemperaturesSnapshot = await getDocs(bodyTemperaturesColRef);
      const temperatures = bodyTemperaturesSnapshot.docs.map(doc => {
        const data = doc.data();
        return { date: data.date, temperature: data.temperature };
      });
      temperatures.sort((a, b) => new Date(a.date) - new Date(b.date));
      onNewTemperatureAdded(temperatures);
    }
  };

  return (
    <div className="highlights">
      <h2>Highlights</h2>
      <div>
        <input
          type="number"
          placeholder="New Temperature"
          value={newTemperature}
          onChange={(e) => setNewTemperature(e.target.value)}
        />
        <input
          type="date"
          value={newTemperatureDate}
          onChange={(e) => setNewTemperatureDate(e.target.value)}
        />
        <button onClick={handleAddTemperature}>Add Temperature</button>
      </div>
    </div>
  );
};

export default Highlights;




