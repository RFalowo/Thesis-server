import {
  PlayerConnectedMessage,
  PlayerMovedMessage,
  PlayerUpdate,
  EmailSubmit,
  GetOrder,
} from "../src-shared/messages";
import { StayAliveSocket } from "./StayAliveSocket";
import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "@three-ts/orbit-controls";
import { DesignerType, Email, Player } from "../src-shared/api";
//import { Light } from "three";
import Freeverb from "freeverb";
import { parameters } from "./parameters";

var uniqid = require("uniqid");
let procedureStep = "trainingSound1";
let numberOfParticipants;

interface ITrialConfiguration {
  firstModality: DesignerType;
  trialConfig: any;
}
let config: ITrialConfiguration;

let container, camera, scene, renderer, mesh;

let params = {
  color: "#44aa88",
  Spherify: 0,
  Twist: 0,
  length: 1,
  depth: 1,
  Segments: 30,
  Submit: () => {
    submit();
  },
};

const canvas = document.createElement("canvas");

const fov = 100;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 5;
camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const light = new THREE.DirectionalLight(0xffffff, 0.6);
const light2 = new THREE.DirectionalLight(0xffffff, 0.6);

const listener = new THREE.AudioListener();

const formGui = new GUI();
const soundGui = new GUI();
formGui.hide();
soundGui.hide();
const formFolder = formGui.addFolder("3d controls");
const soundFolder = soundGui.addFolder("Sound controls");

const sound = new THREE.PositionalAudio(listener);
const oscList = [];
const gainList = [];
var normGain = listener.context.createGain();

var amps = [];
var fRatios = [1, 1, 1, 1];
var shapes = [];
var normGainAmount = 0;
normGain.gain.value = normGainAmount;

var attackTime = 0.01;
var decayTime = 0.1;
var sustainTime = 0.1;
var releaseTime = 0.1;

const frequency = 440.0;
var spectrum = 5;

const MAX_BRIGHTNESS = 255;
let brightToFcTable = [],
  minLPFc = 50,
  maxLPFc = 20000,
  minHPFc = 0,
  maxHPFc = 15000,
  allPassZone = 0.05,
  brThresholdLP = MAX_BRIGHTNESS * (0.5 - allPassZone),
  brThresholdHP = MAX_BRIGHTNESS * (0.5 + allPassZone),
  allpass = false,
  filterFc,
  filterType,
  brightness = 0;

const SoundControls = function () {
  this.master = listener.getMasterVolume();
  this.spectrum = spectrum;
  this.brightness = brightness;
  this.attack = attackTime;
  this.sustain = sustainTime;
  this.release = releaseTime;
};

const soundcontrols = new SoundControls();

const socket = new StayAliveSocket("ws://localhost:8080");
///const socket = new WebSocket("ws://localhost:8080");
socket.onOpen = (event) => {
  console.log("open");
  const message3: GetOrder = {
    type: "GetOrd",
    data: null,
  };
  socket.sendMessage(message3);

  // const message: PlayerConnectedMessage = {
  //     type: "PlayerConnected",
  //     data: { id: "qwert" },
  // };
  // const message2: PlayerMovedMessage = {
  //     type: "PlayerMoved",
  //     data: { id: "qwert" },
  // };
  // socket.sendMessage(message2);
};

socket.onError = (event) => {
  console.error(event);
};

socket.openConnection();

socket.onMessage = (event) => {
  const message = JSON.parse(event.data.toString());
  if (message.type === "Ord") {
    console.log(message);
    if (localStorage.getItem("trialConfiguration") !== null) {
      config = JSON.parse(localStorage.getItem("trialConfiguration"));
    } else {
      config = {
        firstModality: message.data,
        trialConfig:
          message.data === "Sound"
            ? [gen3DTrials(), genSoundTrials()]
            : [genSoundTrials(), gen3DTrials()],
      };

      localStorage.setItem("trialConfiguration", JSON.stringify(config));
    }
  }

  main(config);
};

var userState: Player = {
  userID: uniqid(),
  trials: [{ designerType: "N/A", stim: [], resp: [] }],
  consent: false,
  participantInfo: {
    age: 0,
    gender: "N/A",
    country_childhood: "N/A",
    country_current: "N/A",
    musicianship: "N/A",
    synth_familiarity: {
      piano: 0,
      timbre: 0,
      soundsynth: 0,
      freqfilters: 0,
      freqDomain: 0,
    },
    threedDesign_familiarity: 0,
  },
};

if (localStorage.getItem("Player") !== null) {
  userState = JSON.parse(localStorage.getItem("Player"));
}

var emailObj: Email = {
  Email: "",
};

// pop up box for info and consent

const openModalButtons = document.querySelectorAll("[data-welcome-target]");
const closeModalButtons = document.querySelectorAll("[data-close-button]");
const welcomeNextButton = document.querySelectorAll("[next-welcome-button]");
const userIDNextButton = document.querySelectorAll("[next-id-button]");
const infoConsentYes = document.querySelectorAll("[yes-info-button]");
const infoConsentNo = document.querySelectorAll("[no-info-button]");
const practise1NextButton = document.querySelectorAll(
  "[next-practise-1-button]"
);
const practise2NextButton = document.querySelectorAll(
  "[next-practise-2-button]"
);
const trial1NextButton = document.querySelectorAll("[next-trial-1-button]");
const trial2NextButton = document.querySelectorAll("[next-trial-2-button]");
const trial3NextButton = document.querySelectorAll("[next-trial-3-button]");
const trial4NextButton = document.querySelectorAll("[next-trial-4-button]");
const trial5NextButton = document.querySelectorAll("[next-trial-5-button]");
const trial6NextButton = document.querySelectorAll("[next-trial-6-button]");
const trial7NextButton = document.querySelectorAll("[next-trial-7-button]");
const trial8NextButton = document.querySelectorAll("[next-trial-8-button]");
const trial9NextButton = document.querySelectorAll("[next-trial-9-button]");
const trial10NextButton = document.querySelectorAll("[next-trial-10-button]");

const thankyouNextButton = document.querySelectorAll("[next-thankyou-button]");
const participantinfo1NextButton = document.querySelectorAll(
  "[next-participant-info-1-button]"
);
const participantinfo2NextButton = document.querySelectorAll(
  "[next-participant-info-2-button]"
);
const headphoneTestNextButton = document.querySelectorAll(
  "[next-headphone-test]"
);
const prizedrawNextButton = document.querySelectorAll("[next-prize-draw]");
const overlay = document.getElementById("overlay"); // change this for each overlay
let usingHeadphones;

const userCode = userState.userID; // change to userState.id

if (userState.consent == false) {
  window.addEventListener("load", (event) => {
    const welcome = document.querySelector(".welcome");
    openModal(welcome);
  });

  welcomeNextButton.forEach((button) => {
    button.addEventListener("click", () => {
      const welcome = button.closest(".welcome");
      const userID = document.querySelector(".user-id");
      closeModal(welcome);
      var idBody = document.querySelector(".id-body");
      idBody.textContent += "ID: " + userCode;
      openModal(userID);
    });
  });

  userIDNextButton.forEach((button) => {
    button.addEventListener("click", () => {
      const userID = document.querySelector(".user-id");
      const infoConsent = document.querySelector(".infoconsent");
      closeModal(userID);
      openModal(infoConsent);
    });
  });
}

if (userState.consent == true) {
  const headphoneTest = document.querySelector(".headphonetest");
  openModal(headphoneTest);
}

infoConsentYes.forEach((button) => {
  button.addEventListener("click", () => {
    const infoConsent = document.querySelector(".infoconsent");
    const headphoneTest = document.querySelector(".headphonetest");

    closeModal(infoConsent);
    userState.consent = true;
    updateUserDB(userState);
    openModal(headphoneTest);
  });
});

infoConsentNo.forEach((button) => {
  button.addEventListener("click", () => {
    const infoConsent = document.querySelector(".infoconsent");
    const sorry = document.querySelector(".sorry");
    closeModal(infoConsent);
    openModal(sorry);
  });
});

headphoneTestNextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const headphoneTest = document.querySelector(".headphonetest");
    const headphonesCheck = new HeadphonesCheck();
    console.log(headphonesCheck);
    headphonesCheck.checkHeadphones(showResult);
    const practise1 = document.querySelector(".practise1");

    if (userState.trials[0].designerType === "N/A") {
      openModal(practise1);
    } else if (userState.trials.length === 1) {
      const trial2 = document.querySelector(".trial2");
      openModal(trial2);
    } else if (userState.trials.length === 2) {
      const trial3 = document.querySelector(".trial3");
      openModal(trial3);
    } else if (userState.trials.length === 3) {
      const trial4 = document.querySelector(".trial4");
      openModal(trial4);
    } else if (userState.trials.length === 4) {
      const trial5 = document.querySelector(".trial5");
      openModal(trial5);
    } else if (userState.trials.length === 5) {
      const trial6 = document.querySelector(".trial6");
      openModal(trial6);
    } else if (userState.trials.length === 6) {
      const trial7 = document.querySelector(".trial7");
      openModal(trial7);
    } else if (userState.trials.length === 7) {
      const trial8 = document.querySelector(".trial8");
      openModal(trial8);
    } else if (userState.trials.length === 8) {
      const trial9 = document.querySelector(".trial9");
      openModal(trial9);
    } else if (userState.trials.length === 9) {
      const trial10 = document.querySelector(".trial10");
      openModal(trial10);
    }

    closeModal(headphoneTest);
  });
});

practise1NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const practise1 = document.querySelector(".practise1");
    closeModal(practise1);
    startAudio();
    updateGUI("Sound");
    genRand3D();
    resetSound();
    procedureStep = "trainingSound1";
  });
});

practise2NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const practise2 = document.querySelector(".practise2");
    reset3D();
    genRandSound();
    updateGUI("3D");
    listener.setMasterVolume(1);
    procedureStep = "training3D1";
    closeModal(practise2);
  });
});

trial1NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial1 = document.querySelector(".trial1");
    closeModal(trial1);

    if (config.firstModality === "Sound") {
      assign3D(config.trialConfig[0][0]);
      resetSound();
      updateGUI("Sound");
    } else {
      assignSounds(config.trialConfig[0][0]);
      reset3D();
      updateGUI("3D");
    }

    procedureStep = "trial1";
    listener.setMasterVolume(1);
  });
});

trial2NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial2 = document.querySelector(".trial2");
    closeModal(trial2);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assign3D(config.trialConfig[0][1]);
      resetSound();
      updateGUI("Sound");
    } else {
      assignSounds(config.trialConfig[0][1]);
      reset3D();
      updateGUI("3D");
    }
    procedureStep = "trial2";
  });
});

trial3NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial3 = document.querySelector(".trial3");
    closeModal(trial3);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assign3D(config.trialConfig[0][2]);
      resetSound();
      updateGUI("Sound");
    } else {
      assignSounds(config.trialConfig[0][2]);
      reset3D();
      updateGUI("3D");
    }
    procedureStep = "trial3";
  });
});

trial4NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial4 = document.querySelector(".trial4");
    closeModal(trial4);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assign3D(config.trialConfig[0][3]);
      resetSound();
      updateGUI("Sound");
    } else {
      assignSounds(config.trialConfig[0][3]);
      reset3D();
      updateGUI("3D");
    }
    procedureStep = "trial4";
  });
});

trial5NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial5 = document.querySelector(".trial5");
    closeModal(trial5);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assign3D(config.trialConfig[0][4]);
      resetSound();
      updateGUI("Sound");
    } else {
      assignSounds(config.trialConfig[0][4]);
      reset3D();
      updateGUI("3D");
    }
    procedureStep = "trial5";
  });
});

trial6NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial6 = document.querySelector(".trial6");
    closeModal(trial6);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assignSounds(config.trialConfig[1][0]);
      reset3D();
      updateGUI("3D");
    } else {
      assign3D(config.trialConfig[1][0]);
      resetSound();
      updateGUI("Sound");
    }
    procedureStep = "trial6";
  });
});

trial7NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial7 = document.querySelector(".trial7");
    closeModal(trial7);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assignSounds(config.trialConfig[1][1]);
      reset3D();
      updateGUI("3D");
    } else {
      assign3D(config.trialConfig[1][1]);
      resetSound();
      updateGUI("Sound");
    }
    procedureStep = "trial7";
  });
});

trial8NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial8 = document.querySelector(".trial8");
    closeModal(trial8);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assignSounds(config.trialConfig[1][2]);
      reset3D();
      updateGUI("3D");
    } else {
      assign3D(config.trialConfig[1][2]);
      resetSound();
      updateGUI("Sound");
    }
    procedureStep = "trial8";
  });
});

trial9NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial9 = document.querySelector(".trial9");
    closeModal(trial9);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assignSounds(config.trialConfig[1][3]);
      reset3D();
      updateGUI("3D");
    } else {
      assign3D(config.trialConfig[1][3]);
      resetSound();
      updateGUI("Sound");
    }
    procedureStep = "trial9";
  });
});

trial10NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const trial10 = document.querySelector(".trial10");
    closeModal(trial10);
    listener.setMasterVolume(1);
    if (config.firstModality === "Sound") {
      assignSounds(config.trialConfig[1][4]);
      reset3D();
      updateGUI("3D");
    } else {
      assign3D(config.trialConfig[1][4]);
      resetSound();
      updateGUI("Sound");
    }
    procedureStep = "trial10";
  });
});

thankyouNextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const thankyou = document.querySelector(".thankyou");
    closeModal(thankyou);
    const participantinfo1 = document.querySelector(".participantinfo1");
    openModal(participantinfo1);
  });
});

participantinfo1NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const age = (<HTMLInputElement>document.getElementById("age-select")).value;
    const gender = (<HTMLInputElement>document.getElementById("gender-select"))
      .value;
    const countryChildhod = (<HTMLInputElement>(
      document.getElementById("childcountry")
    )).value;
    const countryCurrent = (<HTMLInputElement>(
      document.getElementById("currentcountry")
    )).value;
    userState.participantInfo.age = parseInt(age);
    userState.participantInfo.gender = gender;
    userState.participantInfo.country_childhood = countryChildhod;
    userState.participantInfo.country_current = countryCurrent;
    updateUserDB(userState);
    const participantinfo1 = document.querySelector(".participantinfo1");
    closeModal(participantinfo1);
    const participantinfo2 = document.querySelector(".participantinfo2");
    openModal(participantinfo2);
  });
});

participantinfo2NextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const musicianship = (<HTMLInputElement>(
      document.getElementById("musicianship")
    )).value;
    const piano = (<HTMLInputElement>document.getElementById("piano")).value;
    const timbre = (<HTMLInputElement>document.getElementById("timbre")).value;
    const synthesis = (<HTMLInputElement>document.getElementById("synthesis"))
      .value;
    const filters = (<HTMLInputElement>document.getElementById("filters"))
      .value;
    const fourier = (<HTMLInputElement>document.getElementById("Fourier"))
      .value;
    const threed_experience = (<HTMLInputElement>(
      document.getElementById("3d-experience")
    )).value;
    userState.participantInfo.musicianship = musicianship;
    userState.participantInfo.synth_familiarity.piano = parseInt(piano);
    userState.participantInfo.synth_familiarity.timbre = parseInt(timbre);
    userState.participantInfo.synth_familiarity.soundsynth =
      parseInt(synthesis);
    userState.participantInfo.synth_familiarity.freqfilters = parseInt(filters);
    userState.participantInfo.synth_familiarity.freqDomain = parseInt(fourier);
    userState.participantInfo.threedDesign_familiarity =
      parseInt(threed_experience);
    updateUserDB(userState);
    const prizedraw = document.querySelector(".prizedraw");
    const participantinfo2 = document.querySelector(".participantinfo2");
    closeModal(participantinfo2);
    openModal(prizedraw);
  });
});

prizedrawNextButton.forEach((button) => {
  button.addEventListener("click", () => {
    const prizedraw = document.querySelector(".prizedraw");
    const extratrials = document.querySelector(".extratrials");
    const email = (<HTMLInputElement>document.getElementById("email-input"))
      .value;
    emailObj.Email = email;
    updateEmailDB(emailObj);
    closeModal(prizedraw);
    localStorage.removeItem("trialConfiguration");
    localStorage.removeItem("Player");
    openModal(extratrials);

    // TODO add server communication and database handling for user email
  });
});

overlay.addEventListener("click", () => {
  const welcomes = document.querySelectorAll(".welcome.active");
  welcomes.forEach((welcome) => {
    closeModal(welcome);
  });
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const welcome = button.closest(".welcome");
    closeModal(welcome);
  });
});

function openModal(welcome) {
  if (welcome == null) return;
  welcome.classList.add("active");
  overlay.classList.add("active");
}

function closeModal(welcome) {
  if (welcome == null) return;
  welcome.classList.remove("active");
  overlay.classList.remove("active");
}

function showResult(result) {
  const sorry = document.querySelector(".sorry");
  const practise1 = document.querySelector(".practise1");
  usingHeadphones = result;
  if (usingHeadphones == false) {
    openModal(sorry);
  } else {
    updateUserDB(userState);
    startAudio();
    initGUI();

    //openModal(practise1);
  }
}

// websockets

// update user functions

const updateUserDB = (user: Player) => {
  console.log("updated user");
  const message2: PlayerUpdate = {
    type: "PlayerUpdate",
    data: user,
  };
  localStorage.setItem("Player", JSON.stringify(user));
  socket.sendMessage(message2);
};

const updateEmailDB = (email: Email) => {
  console.log("email submitted");
  const message3: EmailSubmit = {
    type: "EmailSubmit",
    data: email,
  };
  socket.sendMessage(message3);
};

// mongoose/mongodb init

//ongoose.connect("mongodb+srv://Remi:TJQvAr9SnEDGU2D@cluster0.43i0s.mongodb.net/Thesis?retryWrites=true&w=majority")

// three.js and webaudio

function renderScene() {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(function () {
    renderer.render(scene, camera);
  });
}

function createGeometry() {
  // var geometry = new THREE.BoxGeometry( 2, 2, 2, 4, 4, 4 );
  var geometry = new THREE.BoxGeometry(
    // params.width,
    // params.height,
    // params.depth,
    2,
    2,
    2,
    params.Segments,
    params.Segments,
    params.Segments
  );
  // create an empty array to  hold targets for the attribute we want to morph
  // morphing positions and normals is supported
  geometry.morphAttributes.position = [];

  // the original positions of the cube's vertices
  const positionAttribute = geometry.attributes.position;

  // for the first morph target we'll move the cube's vertices onto the surface of a sphere
  const spherePositions = [];

  // for the second morph target, we'll twist the cubes vertices
  const twistPositions = [];
  const direction = new THREE.Vector3(1, 0, 0);
  const vertex = new THREE.Vector3();

  // third target test
  const sinpositions = [];
  const vertex2 = new THREE.Vector3();

  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    spherePositions.push(
      x * Math.sqrt(1 - (y * y) / 2 - (z * z) / 2 + (y * y * z * z) / 3),
      y * Math.sqrt(1 - (z * z) / 2 - (x * x) / 2 + (z * z * x * x) / 3),
      z * Math.sqrt(1 - (x * x) / 2 - (y * y) / 2 + (x * x * y * y) / 3)
    );

    // stretch along the x-axis so we can see the twist better
    vertex.set(x, y, z);

    vertex
      .applyAxisAngle(direction, (Math.PI * x) / 2)
      .toArray(twistPositions, twistPositions.length);

    vertex2
      .set(x, y, z * Math.sin(x * y))
      .toArray(sinpositions, sinpositions.length);
  }

  // add the spherical positions as the first morph target
  geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(
    spherePositions,
    3
  );

  // add the twisted positions as the second morph target
  geometry.morphAttributes.position[1] = new THREE.Float32BufferAttribute(
    twistPositions,
    3
  );

  geometry.morphAttributes.position[2] = new THREE.Float32BufferAttribute(
    sinpositions,
    3
  );

  return geometry;
}

function initGUI() {
  // Set up dat.GUI to control targets

  //const gui = new GUI;

  var masterControl = formFolder
    .add(soundcontrols, "master", 0.0, 1.0)
    .onChange(function () {
      listener.setMasterVolume(soundcontrols.master);
    });
  var colourControl = formFolder
    .addColor(params, "color")
    .onChange(function () {
      mesh.material.color.set(params.color);
    });
  var SphericityControl = formFolder
    .add(params, "Spherify", 0, 1)
    .step(0.01)
    .onChange(function (value) {
      params.Spherify = value;
      mesh.morphTargetInfluences[0] = value;
    });
  var contortionControl = formFolder
    .add(params, "Twist", 0, 1)
    .step(0.01)
    .name("Contortion")
    .onChange(function (value) {
      params.Twist = value;
      mesh.morphTargetInfluences[1] = value;
    });
  // formFolder.add( params, 'Rand', 0, 1 ).step( 0.01 ).onChange( function ( value ) {

  //     mesh.morphTargetInfluences[ 2 ] = value;

  // } );
  var lengthControl = formFolder
    .add(params, "length", 0.1, 1.5)
    .onChange(function (value) {
      params.length = value;
      mesh.scale.set(params.length, params.depth, 1);
    })
    .name("Length");

  var depthControl = formFolder
    .add(params, "depth", 0.1, 1.5)
    .onChange(function (value) {
      params.depth = value;
      mesh.scale.set(params.length, params.depth, 1);
    })
    .name("Depth");

  var segmentControl = formFolder
    .add(params, "Segments", 1, 60)
    .step(1)
    .onChange(generateGeometry);
  generateGeometry();
  formFolder.add(params, "Submit");
  formFolder.open();

  var masterControl = soundFolder
    .add(soundcontrols, "master", 0.0, 1.0)
    .onChange(function () {
      listener.setMasterVolume(soundcontrols.master);
    });
  var spectrumControl = soundFolder
    .add(soundcontrols, "spectrum", 1, 300)
    .onChange(function (value) {
      soundcontrols.spectrum = value;
      updateSpectrum(value);
    });
  var brightnessControl = soundFolder
    .add(soundcontrols, "brightness", 0, 255)
    .step(1)
    .onChange(function (value) {
      soundcontrols.brightness = value;
      updateBrightness(value);
    });
  var attackControl = soundFolder
    .add(soundcontrols, "attack", 0.0001, 0.3)
    .onChange(function (value) {
      soundcontrols.attackTime = value;
      attackTime = value;
    });
  var sustainControl = soundFolder
    .add(soundcontrols, "sustain", 0.0001, 0.6)
    .onChange(function (value) {
      soundcontrols.sustainTime = value;
      sustainTime = value;
    });
  var releaseControl = soundFolder
    .add(soundcontrols, "release", 0.0001, 1)
    .onChange(function (value) {
      soundcontrols.releaseTime = value;
      releaseTime = value;
    });
  soundFolder.add(params, "Submit");
  soundFolder.open();
}

function updateGUI(designerType) {
  if (designerType === "3D") {
    formGui.show();
    soundGui.hide();
  } else if (designerType === "Sound") {
    formGui.hide();
    soundGui.show();
  } else {
    console.log("Unknown Designer Type for GUI");
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateGroupGeometry(mesh, geometry) {
  //mesh.children[ 0 ].geometry.dispose();
  mesh.geometry.dispose();

  //mesh.children[ 0 ].geometry = new THREE.WireframeGeometry( geometry );
  mesh.geometry = geometry;

  // these do not update nicely together if shared
}

function generateGeometry() {
  var geometry = createGeometry();
  updateGroupGeometry(mesh, geometry);
}

function startAudio() {
  for (var i = 0; i < 4; i++) {
    oscList[i].start();
  }
  listener.context.resume();
}

function stopAudio() {
  listener.setMasterVolume(0);
}

function setFrequency(frequency) {
  for (var i = 0; i < oscList.length; i++) {
    oscList[i].frequency.value = fRatios[i] * frequency;
  }
}

function updateSpectrum(newValue) {
  // if (newValue == this.spectrum) {
  //     return;
  //   }

  if (newValue >= 200) {
    // Add increasing inharmonicity as spectrum goes above 200
    let inharmonicity = 1 + (newValue - 200) * 0.0002;
    // only first operator as a saw wave
    amps = [1, 0, 0, 0];
    fRatios = [inharmonicity, inharmonicity, inharmonicity, inharmonicity];
    shapes = ["sawtooth", "sawtooth", "sawtooth", "sawtooth"];
    normGainAmount = 0.25;
  } else if (newValue >= 100) {
    let evenOddRatio = (newValue - 100) * 0.01;
    let oddEvenRatio = 1 - evenOddRatio;
    // change balance between sawtooth (all harmonics) and square wave (odd harmonics)
    // don't need other 2 operators
    amps = [evenOddRatio, oddEvenRatio, 0, 0];
    fRatios = [1, 1, 1, 1];
    shapes = ["sawtooth", "square", "sine", "sine"];
    normGainAmount = 0.125;
  } else if (newValue >= 50) {
    // convert range of 0-50 to 0-1
    let evenOddRatio = (newValue - 50) * 0.02;
    let oddEvenRatio = 1 - evenOddRatio;
    // Change balance between square wave (odd harmonics) and Triangle (quieter odd harmonics)
    // don't need other 2 operators
    amps = [oddEvenRatio, evenOddRatio, 0, 0];
    fRatios = [1, 1, 1, 1];
    shapes = ["triangle", "square", "sine", "sine"];
    normGainAmount = 0.125;
  } else if (newValue >= 40) {
    let evenOddRatio = (newValue - 40) * 0.1;
    let oddEvenRatio = 1 - evenOddRatio;
    amps = [evenOddRatio, oddEvenRatio, 0, 0];
    fRatios = [1, 1, 1, 1];
    shapes = ["triangle", "sine", "sine", "sine"];
    normGainAmount = 0.125;
  } else if (newValue >= 30) {
    amps = [1, 0.8, 0.6, 0.4];
    fRatios = [1, 1.5, 1.98, 2.44];
    shapes = ["sine", "sine", "sine", "sine"];
    normGainAmount = 0.125;
  } else if (newValue >= 20) {
    amps = [1, 0.8, 0.8, 0];
    fRatios = [1, 4, 9.2, 1];
    shapes = ["sine", "sine", "sine", "sine"];
    normGainAmount = 0.125;
  } else if (newValue >= 10) {
    amps = [1, 0.8, 0, 0];
    fRatios = [1, 3, 1, 1];
    shapes = ["sine", "sine", "sine", "sine"];
    normGainAmount = 0.125;
  } else {
    amps = [1, 0, 0, 0];
    fRatios = [1, 1, 1, 1];
    shapes = ["sine", "sine", "sine", "sine"];
    normGainAmount = 0.125;
  }
  for (var i = 0; i < oscList.length; i++) {
    gainList[i].gain.value = amps[i];
    oscList[i].frequency.value = fRatios[i] * frequency;
    oscList[i].type = shapes[i];
  }
}

function initBrightnessTable() {
  var br;
  for (br = 0; br <= MAX_BRIGHTNESS; br++) {
    if (br <= brThresholdLP) {
      brightToFcTable[br] =
        minLPFc + Math.pow(maxLPFc - minLPFc, br / brThresholdLP);
    } else if (br >= brThresholdHP) {
      brightToFcTable[br] =
        minHPFc +
        Math.pow(
          maxHPFc - minHPFc,
          (br - brThresholdHP) / (MAX_BRIGHTNESS - brThresholdLP)
        );
    } else {
      brightToFcTable[br] = 0;
    }
  }
}

function updateBrightness(newValue) {
  let brightness = newValue;
  var targetFc = brightToFcTable[brightness];

  // add transition zone for High-Pass where cutoff frequency starts at 0
  // this smoothes out the sound when making the transition
  if (brightness >= brThresholdHP && brightness < brThresholdHP + 10)
    filterFc = 0.1 * (brightness - brThresholdHP) * targetFc;
  // if not in transition zone, no need to make further changes
  else filterFc = targetFc;

  // check brightness to determine filter type
  if (brightness <= brThresholdLP) {
    filterType = "lowpass";
    allpass = false;
  } else if (brightness >= brThresholdHP) {
    filterType = "highpass";
    allpass = false;
  } else {
    allpass = true;
  }

  var filter = listener.getFilter();
  filter.type = filterType;
  const frequency = newValue + filterFc;
  if (Number.isFinite(frequency)) {
    filter.frequency.value = newValue + filterFc;
  } else {
    //console.log(frequency)
  }

  //------ use this to sanitise inputs Math.max(0, Math.min(frequency, 20000));

  // filter.frequency.value = newValue + filterFc;
}

function updateEnv(attackT, decayT, sustainT, releaseT) {
  attackTime = attackT;
  decayTime = decayT;
  sustainTime = sustainT;
  releaseTime = releaseT;
}

function createEnv() {
  this.onsetTime = listener.context.currentTime;
  this.attackTime = this.onsetTime + attackTime;
  this.decayTime = this.onsetTime + this.attackTime + decayTime;
  this.sustainTime =
    this.onsetTime + this.attackTime + this.decayTime + sustainTime;
  this.releaseTime =
    this.onsetTime +
    attackTime +
    this.decayTime +
    this.sustainTime +
    releaseTime;

  normGain.gain.setValueAtTime(0, this.onsetTime);
  normGain.gain.linearRampToValueAtTime(1 / 4, this.onsetTime + attackTime);
  normGain.gain.linearRampToValueAtTime(
    0.8 / 4,
    this.onsetTime + attackTime + decayTime
  );
  normGain.gain.setValueAtTime(
    0.8 / 4,
    this.onsetTime + attackTime + decayTime + sustainTime
  );
  normGain.gain.linearRampToValueAtTime(
    0,
    this.onsetTime + attackTime + decayTime + sustainTime + releaseTime
  );
}

function gen3DTrials() {
  const ThreeDParams = parameters.ThreeD;
  for (var i = ThreeDParams.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = ThreeDParams[i];
    ThreeDParams[i] = ThreeDParams[j];
    ThreeDParams[j] = temp;
  }
  return ThreeDParams;
}

function genSoundTrials() {
  const soundParams = parameters.sound;
  for (var i = soundParams.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = soundParams[i];
    soundParams[i] = soundParams[j];
    soundParams[j] = temp;
  }
  return soundParams;
}

const assignSounds = (parameters) => {
  soundcontrols.spectrum = parameters[0];
  updateSpectrum(soundcontrols.spectrum);
  soundcontrols.brightness = parameters[1];
  updateBrightness(soundcontrols.brightness);
  attackTime = parameters[2];
  soundcontrols.attackTime = attackTime;
  sustainTime = parameters[3];
  soundcontrols.sustainTime = sustainTime;
  releaseTime = parameters[4];
  soundcontrols.releaseTime = releaseTime;
};

const assign3D = (parameters) => {
  params.color = parameters[0];
  params.Spherify = parameters[1];
  mesh.morphTargetInfluences[0] = params.Spherify;
  params.Twist = parameters[2];
  mesh.morphTargetInfluences[1] = params.Twist;
  params.length = parameters[3];
  params.depth = parameters[4];
  params.Segments = parameters[5];
  mesh.scale.set(params.length, params.depth, 1);
  generateGeometry();
  mesh.material.color.set(params.color);
};

function genRand3D() {
  var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
  params.color = randomColor;
  params.Spherify = Math.random();
  mesh.morphTargetInfluences[0] = params.Spherify;
  params.Segments = Math.random() * 60;
  params.Twist = Math.random();
  mesh.morphTargetInfluences[1] = params.Twist;
  params.length = Math.random() * 1.5;
  params.depth = Math.random() * 1.5;
  mesh.scale.set(params.length, params.depth, 1);
  generateGeometry();
  mesh.material.color.set(params.color);
}

function genRandSound() {
  soundcontrols.spectrum = Math.random() * 300;
  updateSpectrum(soundcontrols.spectrum);
  soundcontrols.brightness = Math.random() * 255;
  updateBrightness(soundcontrols.brightness);
  attackTime = Math.random() * 0.2999 + 0.0001;
  soundcontrols.attackTime = attackTime;
  sustainTime = Math.random() * 0.5999 + 0.0001;
  soundcontrols.sustainTime = sustainTime;
  releaseTime = Math.random() * 0.9999 + 0.0001;
  soundcontrols.releaseTime = releaseTime;
}

function reset3D() {
  mesh.material.color.set("#FFFFFF");
  params.Spherify = 0;
  mesh.morphTargetInfluences[0] = params.Spherify;
  params.Segments = 25;
  params.Twist = 0;
  mesh.morphTargetInfluences[1] = params.Twist;
  mesh.scale.set(1, 1, 1);
  generateGeometry();
}

function resetSound() {
  updateSpectrum(0);
  updateBrightness(255);
  attackTime = 0.15;
  sustainTime = 0.1;
  releaseTime = 0.3;
}

function submit() {
  const practise2 = document.querySelector(".practise2");
  const trial1 = document.querySelector(".trial1");
  const trial2 = document.querySelector(".trial2");
  const trial3 = document.querySelector(".trial3");
  const trial4 = document.querySelector(".trial4");
  const trial5 = document.querySelector(".trial5");
  const trial6 = document.querySelector(".trial6");
  const trial7 = document.querySelector(".trial7");
  const trial8 = document.querySelector(".trial8");
  const trial9 = document.querySelector(".trial9");
  const trial10 = document.querySelector(".trial10");
  const thankyou = document.querySelector(".thankyou");
  if (procedureStep === "trainingSound1") {
    console.log("traingingsound1 complete");
    genRand3D();
    resetSound();
    procedureStep = "trainingSound2";
  } else if (procedureStep === "trainingSound2") {
    console.log("traingingsound2 complete");
    openModal(practise2);
    stopAudio();
    procedureStep = "inactive";
  } else if (procedureStep === "training3D1") {
    console.log("training3d1 complete");
    genRandSound();
    reset3D();
    procedureStep = "training3D2";
  } else if (procedureStep === "training3D2") {
    console.log("training3d2 complete");
    // closeModal(practise2)
    stopAudio();
    procedureStep = "inactive";
    openModal(trial1);
  } else if (procedureStep === "trial1") {
    console.log("trial1 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "Sound") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;
      console.log(userState.trials);
      userState.trials.pop();
      console.log(userState.trials);
      updateUserDB(userState);

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      console.log(userState.trials);
      userState.trials.pop();
      console.log(userState.trials);
      updateUserDB(userState);
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial2);
  } else if (procedureStep === "trial2") {
    console.log("trial2 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "Sound") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial3);
  } else if (procedureStep === "trial3") {
    console.log("trial3 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "Sound") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial4);
  } else if (procedureStep === "trial4") {
    console.log("trial4 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "Sound") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial5);
  } else if (procedureStep === "trial5") {
    console.log("trial5 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "Sound") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial6);
  } else if (procedureStep === "trial6") {
    console.log("trial6 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "3D") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial7);
  } else if (procedureStep === "trial7") {
    console.log("trial7 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "3D") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial8);
  } else if (procedureStep === "trial8") {
    console.log("trial8 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "3D") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial9);
  } else if (procedureStep === "trial9") {
    console.log("trial9 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "3D") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(trial10);
  } else if (procedureStep === "trial10") {
    console.log("trial10 submitted");
    const trial = { designerType: "N/A", stim: [], resp: [] };
    const stimuli = [];
    const responses = [];
    trial.designerType = config.firstModality;

    if (config.firstModality === "3D") {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        stimuli.push(params[key]);
      });
      stimuli.pop();
      trial.stim = stimuli;

      responses.push(soundcontrols.spectrum);
      responses.push(soundcontrols.brightness);
      responses.push(soundcontrols.attackTime);
      responses.push(soundcontrols.sustainTime);
      responses.push(soundcontrols.releaseTime);
      trial.resp = responses;

      userState.trials.push(trial);
    } else {
      var parameters3d = Object.keys(params);
      parameters3d.forEach((key, index) => {
        responses.push(params[key]);
      });

      responses.pop();

      stimuli.push(soundcontrols.spectrum);
      stimuli.push(soundcontrols.brightness);
      stimuli.push(soundcontrols.attackTime);
      stimuli.push(soundcontrols.sustainTime);
      stimuli.push(soundcontrols.releaseTime);
      trial.stim = stimuli;
      trial.resp = responses;
      userState.trials.push(trial);
    }

    updateUserDB(userState);
    procedureStep = "inactive";
    stopAudio();
    openModal(thankyou);
  }
}

function main(config) {
  //add to HTML
  console.log(canvas);
  document.body.appendChild(canvas);
  //create scene
  scene = new THREE.Scene();

  camera.position.z = 2;

  camera.add(listener);

  const reverb = Freeverb(listener.context);

  for (var i = 0; i < 4; i++) {
    oscList[i] = listener.context.createOscillator();
    gainList[i] = listener.context.createGain();
    oscList[i].connect(gainList[i]);
    gainList[i].connect(reverb);
  }
  reverb.roomSize = 0.5;

  reverb.wet.value = 1;
  reverb.dry.value = 0;
  reverb.dampening = 5000;
  reverb.connect(normGain);
  sound.setNodeSource(normGain as any); //typescript getting confused by threejs audio types
  sound.setRefDistance(20);

  listener.setFilter(listener.context.createBiquadFilter());
  initBrightnessTable();

  setFrequency(frequency);

  updateSpectrum(spectrum);

  scene.add(camera);
  var ambiLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambiLight);

  light.position.set(-1, 2, 4);
  light2.position.set(1, -2, -4);
  scene.add(light, light2);

  const material = new THREE.MeshPhongMaterial({
    color: 0x44aa88,
    flatShading: true,
    morphTargets: true,
  }); // greenish blue

  var geometree = createGeometry();

  mesh = new THREE.Mesh(geometree, material);
  mesh.add(sound);
  scene.add(mesh);

  //initGUI();
  //startAudio();

  setInterval(createEnv, 2500);

  renderScene();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  setInterval(() => {
    ambiLight.intensity = normGain.gain.value + 0.75;
  }, 10);
  window.addEventListener("resize", onWindowResize);
}
// within the spectrum system, operator algorithm is always additive
