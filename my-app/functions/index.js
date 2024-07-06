/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const patientData = require('./patient_data.json');

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

exports.populatePatientDataOnCall = functions.https.onCall(async (data, context) => {
    try {
        // Iterate over each patient in the data
        for (const patient of patientData) {
            const patientRef = db.collection('patients').doc(patient.name);
            await patientRef.set({
                first_name: patient.first_name,
                age: patient.age,
                height: patient.height,
                weight: patient.weight,
                gender: patient.gender
            });

            // Add medications subcollection
            const medicationsRef = patientRef.collection('medications');
            for (const medication of patient.medications) {
                await medicationsRef.add(medication);
            }

            // Add body temperatures subcollection
            const bodyTemperaturesRef = patientRef.collection('body_temperatures');
            for (const bodyTemperature of patient.body_temperatures) {
                await bodyTemperaturesRef.add(bodyTemperature);
            }
        }
        return { success: true, message: 'Patient data populated successfully' };
    } catch (error) {
        console.error('Error populating patient data:', error);
        throw new functions.https.HttpsError('internal', 'Error populating patient data');
    }
});

exports.getPatientData = functions.https.onCall(async (data, context) => {
    try {
        const patientsSnapshot = await db.collection('patients').get();
        const patients = [];
        patientsSnapshot.forEach(doc => {
            const patient = doc.data();
            patient.id = doc.id;
            patients.push(patient);
        });

        return { success: true, patients };
    } catch (error) {
        console.error('Error fetching patient data:', error);
        throw new functions.https.HttpsError('internal', 'Error fetching patient data');
    }
});