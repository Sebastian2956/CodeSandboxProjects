import React, { useState } from "react";

interface BMIResult {
  value: number;
  category: string;
  color: string;
}

interface VitalSigns {
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
}

interface VitalAssessment {
  text: string;
  color: string;
}

interface DosageInfo {
  dosage: string;
  frequency: string;
}

const MedicalDashboard: React.FC = () => {
  const [bmiResult, setBmiResult] = useState<BMIResult | null>(null);
  const [dosageResult, setDosageResult] = useState<DosageInfo | null>(null);
  const [vitalAssessments, setVitalAssessments] = useState<{
    bp: VitalAssessment | null;
    hr: VitalAssessment | null;
    temp: VitalAssessment | null;
  }>({ bp: null, hr: null, temp: null });

  const calculateBMI = () => {
    const heightInput = document.getElementById("height") as HTMLInputElement;
    const weightInput = document.getElementById("weight") as HTMLInputElement;

    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);

    if (!height || !weight) {
      alert("Please enter both height and weight");
      return;
    }

    const bmi = weight / (height / 100) ** 2;
    const result = getBMICategory(bmi);
    setBmiResult({ value: bmi, ...result });
  };

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) {
      return { category: "Underweight", color: "text-blue-600" };
    } else if (bmi < 25) {
      return { category: "Normal weight", color: "text-green-600" };
    } else if (bmi < 30) {
      return { category: "Overweight", color: "text-yellow-600" };
    } else {
      return { category: "Obese", color: "text-red-600" };
    }
  };

  const calculateDosage = () => {
    const weightInput = document.getElementById(
      "child-weight"
    ) as HTMLInputElement;
    const medicationSelect = document.getElementById(
      "medication"
    ) as HTMLSelectElement;

    const weight = parseFloat(weightInput.value);
    const medication = medicationSelect.value;

    if (!weight || !medication) {
      alert("Please enter weight and select medication");
      return;
    }

    const dosageInfo = getMedicationDosage(medication, weight);
    setDosageResult(dosageInfo);
  };

  const getMedicationDosage = (
    medication: string,
    weight: number
  ): DosageInfo => {
    switch (medication) {
      case "paracetamol":
        const paracetamolDose = weight * 10;
        return {
          dosage: `${paracetamolDose}-${weight * 15} mg per dose`,
          frequency: "Every 4-6 hours, maximum 4 doses per day",
        };
      case "ibuprofen":
        const ibuprofenDose = weight * 5;
        return {
          dosage: `${ibuprofenDose}-${weight * 10} mg per dose`,
          frequency: "Every 6-8 hours, maximum 3 doses per day",
        };
      case "amoxicillin":
        const amoxicillinDose = weight * 20;
        return {
          dosage: `${amoxicillinDose}-${weight * 40} mg per day`,
          frequency: "Divided into 2-3 doses per day",
        };
      default:
        return { dosage: "Unknown medication", frequency: "" };
    }
  };

  const assessVitals = () => {
    const systolicInput = document.getElementById(
      "systolic"
    ) as HTMLInputElement;
    const diastolicInput = document.getElementById(
      "diastolic"
    ) as HTMLInputElement;
    const heartRateInput = document.getElementById(
      "heart-rate"
    ) as HTMLInputElement;
    const temperatureInput = document.getElementById(
      "temperature"
    ) as HTMLInputElement;

    const systolic = parseFloat(systolicInput.value);
    const diastolic = parseFloat(diastolicInput.value);
    const heartRate = parseFloat(heartRateInput.value);
    const temperature = parseFloat(temperatureInput.value);

    if (!systolic || !diastolic || !heartRate || !temperature) {
      alert("Please enter all vital signs");
      return;
    }

    const bpAssessment = assessBloodPressure(systolic, diastolic);
    const hrAssessment = assessHeartRate(heartRate);
    const tempAssessment = assessTemperature(temperature);

    setVitalAssessments({
      bp: bpAssessment,
      hr: hrAssessment,
      temp: tempAssessment,
    });
  };

  const assessBloodPressure = (
    systolic: number,
    diastolic: number
  ): VitalAssessment => {
    if (systolic < 90 || diastolic < 60) {
      return {
        text: "Blood Pressure: Low (Hypotension)",
        color: "bg-blue-100 text-blue-800",
      };
    } else if (systolic <= 120 && diastolic <= 80) {
      return {
        text: "Blood Pressure: Normal",
        color: "bg-green-100 text-green-800",
      };
    } else if (systolic <= 139 || diastolic <= 89) {
      return {
        text: "Blood Pressure: High Normal/Pre-hypertension",
        color: "bg-yellow-100 text-yellow-800",
      };
    } else {
      return {
        text: "Blood Pressure: High (Hypertension)",
        color: "bg-red-100 text-red-800",
      };
    }
  };

  const assessHeartRate = (hr: number): VitalAssessment => {
    if (hr < 60) {
      return {
        text: "Heart Rate: Low (Bradycardia)",
        color: "bg-blue-100 text-blue-800",
      };
    } else if (hr <= 100) {
      return {
        text: "Heart Rate: Normal",
        color: "bg-green-100 text-green-800",
      };
    } else {
      return {
        text: "Heart Rate: High (Tachycardia)",
        color: "bg-red-100 text-red-800",
      };
    }
  };

  const assessTemperature = (temp: number): VitalAssessment => {
    if (temp < 36.1) {
      return {
        text: "Temperature: Low (Hypothermia)",
        color: "bg-blue-100 text-blue-800",
      };
    } else if (temp <= 37.2) {
      return {
        text: "Temperature: Normal",
        color: "bg-green-100 text-green-800",
      };
    } else if (temp <= 38.0) {
      return {
        text: "Temperature: Mild Fever",
        color: "bg-yellow-100 text-yellow-800",
      };
    } else {
      return {
        text: "Temperature: High Fever",
        color: "bg-red-100 text-red-800",
      };
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Medical Dashboard
          </h1>
          <p className="text-gray-600">
            Essential tools for healthcare professionals
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* BMI Calculator */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              BMI Calculator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  id="height"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="170"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="70"
                />
              </div>
              <button
                onClick={calculateBMI}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Calculate BMI
              </button>
              {bmiResult && (
                <div className="p-3 bg-gray-100 rounded-md">
                  <p className="font-semibold">
                    BMI: {bmiResult.value.toFixed(1)}
                  </p>
                  <p className={`text-sm ${bmiResult.color}`}>
                    Category: {bmiResult.category}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medication Dosage Calculator */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Pediatric Dosage Calculator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child Weight (kg)
                </label>
                <input
                  type="number"
                  id="child-weight"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication
                </label>
                <select
                  id="medication"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select medication</option>
                  <option value="paracetamol">Paracetamol (10-15 mg/kg)</option>
                  <option value="ibuprofen">Ibuprofen (5-10 mg/kg)</option>
                  <option value="amoxicillin">
                    Amoxicillin (20-40 mg/kg/day)
                  </option>
                </select>
              </div>
              <button
                onClick={calculateDosage}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Calculate Dosage
              </button>
              {dosageResult && (
                <div className="p-3 bg-gray-100 rounded-md">
                  <p className="font-semibold">{dosageResult.dosage}</p>
                  <p className="text-sm text-gray-600">
                    {dosageResult.frequency}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vital Signs Tracker */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Vital Signs Assessment
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Systolic BP
                  </label>
                  <input
                    type="number"
                    id="systolic"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diastolic BP
                  </label>
                  <input
                    type="number"
                    id="diastolic"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="80"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    id="heart-rate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="temperature"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="36.5"
                  />
                </div>
              </div>
              <button
                onClick={assessVitals}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Assess Vitals
              </button>
              {(vitalAssessments.bp ||
                vitalAssessments.hr ||
                vitalAssessments.temp) && (
                <div className="space-y-2">
                  {vitalAssessments.bp && (
                    <div
                      className={`p-2 rounded-md ${vitalAssessments.bp.color}`}
                    >
                      {vitalAssessments.bp.text}
                    </div>
                  )}
                  {vitalAssessments.hr && (
                    <div
                      className={`p-2 rounded-md ${vitalAssessments.hr.color}`}
                    >
                      {vitalAssessments.hr.text}
                    </div>
                  )}
                  {vitalAssessments.temp && (
                    <div
                      className={`p-2 rounded-md ${vitalAssessments.temp.color}`}
                    >
                      {vitalAssessments.temp.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Medical Reference */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Quick Medical Reference
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Normal Vital Ranges (Adult)
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Blood Pressure: 90-120/60-80 mmHg</li>
                  <li>• Heart Rate: 60-100 bpm</li>
                  <li>• Temperature: 36.1-37.2°C</li>
                  <li>• Respiratory Rate: 12-20/min</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Emergency Numbers
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Emergency: 911</li>
                  <li>• Poison Control: 1-800-222-1222</li>
                  <li>• Crisis Text Line: Text HOME to 741741</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  BMI Categories
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Underweight: &lt; 18.5</li>
                  <li>• Normal: 18.5-24.9</li>
                  <li>• Overweight: 25-29.9</li>
                  <li>• Obese: ≥ 30</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalDashboard;
