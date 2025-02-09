import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import SignInPrompt from '../SignInPrompt';
import Sidebar from '../Dash/Sidebar';
import CoachSidebar from '../Dash/CoachSidebar';
import ErrorMessage from '../ErrorMessage';

interface AssessmentProps {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  u?: string;
}

interface FormData {
  // General Information
  height: string;
  weight: number;
  age: number;
  primarySport: string;
  currentTrainingReg: string;
  goals: string;
  primaryPosition: string;
  hopeToGain: string;
  injuryHistory: string;
  coachingStyle: string;
  daysTraining: number;
  priorSC: boolean;

  // Mobility Assessment
  overHeadSquat: number;
  trunkStability: number;
  sidePlank: number;
  spinalFlexion: number;
  activeLegRaise: number;
  goodMorning: number;
  lungeOverhead: number;
  lateralTrunkTilt: number;

  // Hitting Mechanics Breakdown
  weighShift: number;
  torsoRot: number;
  pelvisLoad: number;
  forwardMove: number;
  hipShoulder: number;
  upperRot: number;
  lowerRot: number;
  frontArm: number;
  shoulderConn: number;
  barrelExt: number;
  batShoulderAng: number;

  // Pitching Mechanics Breakdown
  startingPos: number;
  legLiftInitWeightShift: number;
  engageGlute: number;
  pushBackLeg: number;
  vertShinAngViR: number;
  stayHeel: number;
  driveDirection: number;
  outDriveEarly: number;
  latVertGround: number;
  backKneeDrive: number;
  hipClear: number;
  rotDown: number;
  movesIndependent: number;
  excessiveRot: number;
  earlyTorsoRot: number;
  torsoNotSegment: number;
  bowFlexBow: number;
  scapularDig: number;
  reflexivePecFire: number;
  armSlotTorsoRot: number;
  rotPerpSpine: number;
  excessiveTilt: number;
  throwUpHill: number;
  armSwingCapMom: number;
  overlyPronOrSup: number;
  overlyFlexOrExtWrist: number;
  elbowInLine: number;
  lateEarlyFlipUp: number;
  elbowFlexionHundred: number;
  fullScapRetractAbduct: number;
  armDrag: number;
  limitedLayback: number;
  elbowPushForward: number;
  straightElbowNeutral: number;
  armWorksInd: number;
  earlySup: number;
  workOppGlove: number;
  retractAbductLanding: number;
  rotatesIntoPlane: number;
  leaks: number;
  frontFootContact: number;
  pawback: number;
  kneeStabTran: number;
  kneeStabFron: number;
  forearmPron: number;
  shoulderIntern: number;
  scapRelease: number;
  thoracicFlex: number;
  noViolentRecoil: number;
  overallTempo: number;
  overallRhythm: number;
  propTimedIntent: number;
  cervPos: number;
}

const Assessment: React.FC<AssessmentProps> = ({
  _id,
  firstName,
  lastName,
  email,
  level,
  u,
}) => {
  const [urlResponse, setUrlResponse] = useState<boolean>(false);
  const [url, setUrl] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    // General Information
    height: '',
    weight: 0,
    age: 0,
    primarySport: '',
    currentTrainingReg: '',
    goals: '',
    primaryPosition: '',
    hopeToGain: '',
    injuryHistory: '',
    coachingStyle: '',
    daysTraining: 1,
    priorSC: false,

    // Mobility Assessment
    overHeadSquat: 0,
    trunkStability: 0,
    sidePlank: 0,
    spinalFlexion: 0,
    activeLegRaise: 0,
    goodMorning: 0,
    lungeOverhead: 0,
    lateralTrunkTilt: 0,

    // Hitting Mechanics Breakdown
    weighShift: 0,
    torsoRot: 0,
    pelvisLoad: 0,
    forwardMove: 0,
    hipShoulder: 0,
    upperRot: 0,
    lowerRot: 0,
    frontArm: 0,
    shoulderConn: 0,
    barrelExt: 0,
    batShoulderAng: 0,

    // Pitching Mechanics Breakdown
    startingPos: 0,
    legLiftInitWeightShift: 0,
    engageGlute: 0,
    pushBackLeg: 0,
    vertShinAngViR: 0,
    stayHeel: 0,
    driveDirection: 0,
    outDriveEarly: 0,
    latVertGround: 0,
    backKneeDrive: 0,
    hipClear: 0,
    rotDown: 0,
    movesIndependent: 0,
    excessiveRot: 0,
    earlyTorsoRot: 0,
    torsoNotSegment: 0,
    bowFlexBow: 0,
    scapularDig: 0,
    reflexivePecFire: 0,
    armSlotTorsoRot: 0,
    rotPerpSpine: 0,
    excessiveTilt: 0,
    throwUpHill: 0,
    armSwingCapMom: 0,
    overlyPronOrSup: 0,
    overlyFlexOrExtWrist: 0,
    elbowInLine: 0,
    lateEarlyFlipUp: 0,
    elbowFlexionHundred: 0,
    fullScapRetractAbduct: 0,
    armDrag: 0,
    limitedLayback: 0,
    elbowPushForward: 0,
    straightElbowNeutral: 0,
    armWorksInd: 0,
    earlySup: 0,
    workOppGlove: 0,
    retractAbductLanding: 0,
    rotatesIntoPlane: 0,
    leaks: 0,
    frontFootContact: 0,
    pawback: 0,
    kneeStabTran: 0,
    kneeStabFron: 0,
    forearmPron: 0,
    shoulderIntern: 0,
    scapRelease: 0,
    thoracicFlex: 0,
    noViolentRecoil: 0,
    overallTempo: 0,
    overallRhythm: 0,
    propTimedIntent: 0,
    cervPos: 0,
  });

  useEffect(() => {
    console.log('url useEffect', url);
    console.log('url useEffect bool', urlResponse);
  }, [url, urlResponse]);

  const { user } = useUser();
  if (!user) {
    return <SignInPrompt />;
  }
  if (!_id) {
    console.log('No ID');
  }
  if (!u) {
    console.log('No U');
  }

  const role = user.publicMetadata?.role;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    const response = await fetch(`/api/assesment/${_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        ...formData,
      }),
    });
    if (!response.ok) {
      return (
        <ErrorMessage role={role as string} message="Failed to upload data" />
      );
    } else {
      setFormData({
        height: '',
        weight: 0,
        age: 0,
        primarySport: '',
        currentTrainingReg: '',
        goals: '',
        primaryPosition: '',
        hopeToGain: '',
        injuryHistory: '',
        coachingStyle: '',
        daysTraining: 1,
        priorSC: false,

        // Mobility Assessment
        overHeadSquat: 0,
        trunkStability: 0,
        sidePlank: 0,
        spinalFlexion: 0,
        activeLegRaise: 0,
        goodMorning: 0,
        lungeOverhead: 0,
        lateralTrunkTilt: 0,

        // Hitting Mechanics Breakdown
        weighShift: 0,
        torsoRot: 0,
        pelvisLoad: 0,
        forwardMove: 0,
        hipShoulder: 0,
        upperRot: 0,
        lowerRot: 0,
        frontArm: 0,
        shoulderConn: 0,
        barrelExt: 0,
        batShoulderAng: 0,

        // Pitching Mechanics Breakdown
        startingPos: 0,
        legLiftInitWeightShift: 0,
        engageGlute: 0,
        pushBackLeg: 0,
        vertShinAngViR: 0,
        stayHeel: 0,
        driveDirection: 0,
        outDriveEarly: 0,
        latVertGround: 0,
        backKneeDrive: 0,
        hipClear: 0,
        rotDown: 0,
        movesIndependent: 0,
        excessiveRot: 0,
        earlyTorsoRot: 0,
        torsoNotSegment: 0,
        bowFlexBow: 0,
        scapularDig: 0,
        reflexivePecFire: 0,
        armSlotTorsoRot: 0,
        rotPerpSpine: 0,
        excessiveTilt: 0,
        throwUpHill: 0,
        armSwingCapMom: 0,
        overlyPronOrSup: 0,
        overlyFlexOrExtWrist: 0,
        elbowInLine: 0,
        lateEarlyFlipUp: 0,
        elbowFlexionHundred: 0,
        fullScapRetractAbduct: 0,
        armDrag: 0,
        limitedLayback: 0,
        elbowPushForward: 0,
        straightElbowNeutral: 0,
        armWorksInd: 0,
        earlySup: 0,
        workOppGlove: 0,
        retractAbductLanding: 0,
        rotatesIntoPlane: 0,
        leaks: 0,
        frontFootContact: 0,
        pawback: 0,
        kneeStabTran: 0,
        kneeStabFron: 0,
        forearmPron: 0,
        shoulderIntern: 0,
        scapRelease: 0,
        thoracicFlex: 0,
        noViolentRecoil: 0,
        overallTempo: 0,
        overallRhythm: 0,
        propTimedIntent: 0,
        cervPos: 0,
      });
      const data = await response.json();
      console.log(data.pdfUrl);
      setUrl(data.pdfUrl);
      setUrlResponse(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Modal Popup */}
      {urlResponse && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black opacity-50"></div>
          {/* Modal content */}
          <div className="bg-white p-8 rounded shadow-lg z-10 relative max-w-sm mx-auto">
            <h2 className="text-xl font-bold mb-4 text-black">
              Assessment Ready
            </h2>
            <p className="mb-4 text-black">
              Your assessment PDF is ready for download.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setUrlResponse(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
              >
                Close
              </button>
              <a
                href={url}
                download={`${firstName}_${lastName}_Assesment_${Date.now()}.pdf`}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white min-h-screen">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      {/* Mobile Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex-1 p-6 bg-white shadow rounded space-y-8"
      >
        <h1 className="text-black font-bold text-2xl">
          Athlete Assessment for {firstName + ' ' + lastName}
        </h1>
        <h1 className="text-black font-bold text-xl">Email: {email}</h1>
        <h1 className="text-black font-bold text-xl">Level : {level}</h1>
        {/* General Information Section */}
        <fieldset className="border border-gray-300 p-4 rounded">
          <legend className="text-lg font-bold text-gray-700">
            General Information
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="height"
              >
                Height
              </label>
              <input
                id="height"
                name="height"
                type="text"
                placeholder="e.g., 5'10&quot;"
                value={formData.height}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="weight"
              >
                Weight (lbs)
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="age"
              >
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="primarySport"
              >
                Primary Sport
              </label>
              <input
                id="primarySport"
                name="primarySport"
                type="text"
                value={formData.primarySport}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="currentTrainingReg"
              >
                Current Training Regimen
              </label>
              <textarea
                id="currentTrainingReg"
                name="currentTrainingReg"
                value={formData.currentTrainingReg}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="goals"
              >
                Goals
              </label>
              <textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="primaryPosition"
              >
                Primary Position
              </label>
              <input
                id="primaryPosition"
                name="primaryPosition"
                type="text"
                value={formData.primaryPosition}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="hopeToGain"
              >
                Hope To Gain
              </label>
              <textarea
                id="hopeToGain"
                name="hopeToGain"
                value={formData.hopeToGain}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="injuryHistory"
              >
                Injury History
              </label>
              <textarea
                id="injuryHistory"
                name="injuryHistory"
                value={formData.injuryHistory}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="coachingStyle"
              >
                Coaching Style
              </label>
              <textarea
                id="coachingStyle"
                name="coachingStyle"
                value={formData.coachingStyle}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="daysTraining"
              >
                Days Training Per Week
              </label>
              <input
                id="daysTraining"
                name="daysTraining"
                type="number"
                value={formData.daysTraining}
                onChange={handleChange}
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="priorSC"
              >
                Prior Strength &amp; Conditioning Experience
              </label>
              <select
                id="priorSC"
                name="priorSC"
                value={formData.priorSC ? 'true' : 'false'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priorSC: e.target.value === 'true',
                  }))
                }
                className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Mobility Assessment Section */}
        <fieldset className="border border-gray-300 p-4 rounded">
          <legend className="text-lg font-bold text-gray-700">
            Mobility Assessment
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Overhead Squat', name: 'overHeadSquat' },
              { label: 'Trunk Stability', name: 'trunkStability' },
              { label: 'Side Plank', name: 'sidePlank' },
              { label: 'Spinal Flexion', name: 'spinalFlexion' },
              { label: 'Active Leg Raise', name: 'activeLegRaise' },
              { label: 'Good Morning', name: 'goodMorning' },
              { label: 'Lunge Overhead', name: 'lungeOverhead' },
              { label: 'Lateral Trunk Tilt', name: 'lateralTrunkTilt' },
            ].map(({ label, name }) => (
              <div key={name}>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor={name}
                >
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* Hitting Mechanics Breakdown Section */}
        <fieldset className="border border-gray-300 p-4 rounded">
          <legend className="text-lg font-bold text-gray-700">
            Hitting Mechanics Breakdown
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Weight Shift', name: 'weighShift' },
              { label: 'Torso Rotation', name: 'torsoRot' },
              { label: 'Pelvis Load', name: 'pelvisLoad' },
              { label: 'Forward Move', name: 'forwardMove' },
              { label: 'Hip/Shoulder Separation', name: 'hipShoulder' },
              { label: 'Upper Rotation', name: 'upperRot' },
              { label: 'Lower Rotation', name: 'lowerRot' },
              { label: 'Front Arm', name: 'frontArm' },
              { label: 'Shoulder Connection', name: 'shoulderConn' },
              { label: 'Barrel Extension', name: 'barrelExt' },
              { label: 'Bat Shoulder Angle', name: 'batShoulderAng' },
            ].map(({ label, name }) => (
              <div key={name}>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor={name}
                >
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* Pitching Mechanics Breakdown Section */}
        <fieldset className="border border-gray-300 p-4 rounded">
          <legend className="text-lg font-bold text-gray-700">
            Pitching Mechanics Breakdown
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Starting Position', name: 'startingPos' },
              {
                label: 'Leg Lift / Initial Weight Shift',
                name: 'legLiftInitWeightShift',
              },
              { label: 'Engage Glute', name: 'engageGlute' },
              { label: 'Push Back Leg', name: 'pushBackLeg' },
              { label: 'Vertical Shin Angle (ViR)', name: 'vertShinAngViR' },
              { label: 'Stay Heel', name: 'stayHeel' },
              { label: 'Drive Direction', name: 'driveDirection' },
              { label: 'Out-Drive Early', name: 'outDriveEarly' },
              {
                label: 'Lateral/Vertical Ground Contact',
                name: 'latVertGround',
              },
              { label: 'Back Knee Drive', name: 'backKneeDrive' },
              { label: 'Hip Clear', name: 'hipClear' },
              { label: 'Rotation Down', name: 'rotDown' },
              { label: 'Moves Independently', name: 'movesIndependent' },
              { label: 'Excessive Rotation', name: 'excessiveRot' },
              { label: 'Early Torso Rotation', name: 'earlyTorsoRot' },
              { label: 'Torso Not Segmenting', name: 'torsoNotSegment' },
              { label: 'Bow Flex / Bow', name: 'bowFlexBow' },
              { label: 'Scapular Dig', name: 'scapularDig' },
              { label: 'Reflexive Pec Fire', name: 'reflexivePecFire' },
              { label: 'Arm Slot / Torso Rotation', name: 'armSlotTorsoRot' },
              { label: 'Rotation Perp to Spine', name: 'rotPerpSpine' },
              { label: 'Excessive Tilt', name: 'excessiveTilt' },
              { label: 'Throw Up Hill', name: 'throwUpHill' },
              { label: 'Arm Swing Captures Momentum', name: 'armSwingCapMom' },
              {
                label: 'Overly Pronated or Supinated',
                name: 'overlyPronOrSup',
              },
              {
                label: 'Overly Flexed or Extended Wrist',
                name: 'overlyFlexOrExtWrist',
              },
              { label: 'Elbow In-Line', name: 'elbowInLine' },
              { label: 'Late/Early Flip Up', name: 'lateEarlyFlipUp' },
              {
                label: 'Elbow Flexion at Hundred',
                name: 'elbowFlexionHundred',
              },
              {
                label: 'Full Scap Retract & Abduct',
                name: 'fullScapRetractAbduct',
              },
              { label: 'Arm Drag', name: 'armDrag' },
              { label: 'Limited Layback', name: 'limitedLayback' },
              { label: 'Elbow Push Forward', name: 'elbowPushForward' },
              { label: 'Straight Elbow Neutral', name: 'straightElbowNeutral' },
              { label: 'Arm Works Independently', name: 'armWorksInd' },
              { label: 'Early Supination', name: 'earlySup' },
              { label: 'Works Opposite Glove', name: 'workOppGlove' },
              {
                label: 'Retract & Abduct on Landing',
                name: 'retractAbductLanding',
              },
              { label: 'Rotates Into Plane', name: 'rotatesIntoPlane' },
              { label: 'Leaks', name: 'leaks' },
              { label: 'Front Foot Contact', name: 'frontFootContact' },
              { label: 'Pawback', name: 'pawback' },
              { label: 'Knee Stab (Transverse)', name: 'kneeStabTran' },
              { label: 'Knee Stab (Frontal)', name: 'kneeStabFron' },
              { label: 'Forearm Pronation', name: 'forearmPron' },
              { label: 'Shoulder Internal Rotation', name: 'shoulderIntern' },
              { label: 'Scapular Release', name: 'scapRelease' },
              { label: 'Thoracic Flexion', name: 'thoracicFlex' },
              { label: 'No Violent Recoil', name: 'noViolentRecoil' },
              { label: 'Overall Tempo', name: 'overallTempo' },
              { label: 'Overall Rhythm', name: 'overallRhythm' },
              { label: 'Proper Timing & Intent', name: 'propTimedIntent' },
              { label: 'Cervical Position', name: 'cervPos' },
            ].map(({ label, name }) => (
              <div key={name}>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor={name}
                >
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  className="text-black mt-1 block w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default Assessment;
