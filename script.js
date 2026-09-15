/* =========================================================
   Fly & Listen — script.js
   Logique de l'application : lecteurs YouTube, radio, UI
========================================================= */

// -------------------- BASE DE DONNÉES DES VOLS --------------------
const flights = [
  {
    destination: "Tokyo (Survol de nuit)",
    videoUrl: "Fst8Fsh6Ew0", // ID YouTube du vol
    ambientSound: "co7KgV2u7yA", // ID YouTube du bruit de cabine (Airbus A350)
    radios: [
      { name: "Tokyo Lofi Chill", streamUrl: "https://zeno.fm" },
      { name: "J-Pop Powerplay", streamUrl: "https://torontocast.com" }
    ]
  },
  {
    destination: "Alpes Suisses & Paris (Vol de jour)",
    videoUrl: "hZ9Vv9X_LpM",
    ambientSound: "co7KgV2u7yA",
    radios: [
      { name: "FIP (Jazz/Chill France)", streamUrl: "https://radiofrance.fr" },
      { name: "Chante France (Variété)", streamUrl: "https://infomaniak.ch" }
    ]
  },
  {
    destination: "New York (Coucher de soleil sur Manhattan)",
    videoUrl: "M_9Zf99kEwM",
    ambientSound: "co7KgV2u7yA",
    radios: [
      { name: "WQXR (Classique New York)", streamUrl: "https://wqxr.org" }
    ]
  }
];

// -------------------- ÉTAT GLOBAL --------------------
let mainPlayer = null;
let ambientPlayer = null;
let playersReady = { main: false, ambient: false };
let currentFlightIndex = 0;
let seatbeltOn = false;
let audioCtx = null;

const radioAudio = document.getElementById("radio-audio");
const destinationSelect = document.getElementById("destination-select");
const radioSelect = document.getElementById("radio-select");
const radioStatus = document.getElementById("radio-status");
const radioVolumeInput = document.getElementById("radio-volume");
const ambientVolumeInput = document.getElementById("ambient-volume");
const radioVolumeValue = document.getElementById("radio-volume-value");
const ambientVolumeValue = document.getElementById("ambient-volume-value");
const speedButtons = document.getElementById("speed-buttons");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const seatbeltToggle = document.getElementById("seatbelt-toggle");

// -------------------- INITIALISATION YOUTUBE IFRAME API --------------------
// Appelée automatiquement par l'API YouTube une fois chargée (voir index.html)
function onYouTubeIframeAPIReady() {
  const currentFlight = flights[currentFlightIndex];

  mainPlayer = new YT.Player("main-player", {
    videoId: currentFlight.videoUrl,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      loop: 1,
      modestbranding: 1,
      playlist: currentFlight.videoUrl,
      rel: 0,
      showinfo: 0,
      mute: 1
    },
    events: {
      onReady: (e) => {
        playersReady.main = true;
        e.target.mute(); // le son natif de la vidéo est toujours coupé
        e.target.playVideo();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          e.target.seekTo(0);
          e.target.playVideo();
        }
      }
    }
  });

  ambientPlayer = new YT.Player("ambient-player", {
    videoId: currentFlight.ambientSound,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      loop: 1,
      modestbranding: 1,
      playlist: currentFlight.ambientSound,
      rel: 0,
      showinfo: 0
    },
    events: {
      onReady: (e) => {
        playersReady.ambient = true;
        e.target.setVolume(Number(ambientVolumeInput.value));
        e.target.playVideo();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          e.target.seekTo(0);
          e.target.playVideo();
        }
      }
    }
  });
}

// -------------------- SIDEBAR : DESTINATIONS & RADIOS --------------------
function populateDestinations() {
  destinationSelect.innerHTML = "";
  flights.forEach((flight, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = flight.destination;
    destinationSelect.appendChild(option);
  });
  destinationSelect.value = currentFlightIndex;
}

function populateRadios(flightIndex) {
  const flight = flights[flightIndex];
  radioSelect.innerHTML = "";
  flight.radios.forEach((radio, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = radio.name;
    radioSelect.appendChild(option);
  });
  radioSelect.value = 0;
  playRadio(flight.radios[0]);
}

function playRadio(radio) {
  if (!radio) return;
  radioStatus.textContent = `Connexion à ${radio.name}…`;
  radioAudio.pause();
  radioAudio.src = radio.streamUrl;
  radioAudio.volume = Number(radioVolumeInput.value) / 100;

  const playPromise = radioAudio.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise
      .then(() => { radioStatus.textContent = `▶ En direct : ${radio.name}`; })
      .catch(() => { radioStatus.textContent = `Flux indisponible pour ${radio.name}`; });
  }
}

radioAudio.addEventListener("error", () => {
  radioStatus.textContent = "Flux radio indisponible pour le moment.";
});

// -------------------- CHANGEMENT DE DESTINATION --------------------
function changeDestination(flightIndex) {
  currentFlightIndex = flightIndex;
  const flight = flights[flightIndex];

  if (playersReady.main && mainPlayer && mainPlayer.loadVideoById) {
    mainPlayer.loadVideoById(flight.videoUrl);
    mainPlayer.mute();
  }
  if (playersReady.ambient && ambientPlayer && ambientPlayer.loadVideoById) {
    ambientPlayer.loadVideoById(flight.ambientSound);
    ambientPlayer.setVolume(Number(ambientVolumeInput.value));
  }

  populateRadios(flightIndex);
}

// -------------------- ÉVÉNEMENTS UI --------------------
destinationSelect.addEventListener("change", (e) => {
  changeDestination(Number(e.target.value));
});

radioSelect.addEventListener("change", (e) => {
  const flight = flights[currentFlightIndex];
  const radio = flight.radios[Number(e.target.value)];
  playRadio(radio);
});

radioVolumeInput.addEventListener("input", (e) => {
  const value = Number(e.target.value);
  radioAudio.volume = value / 100;
  radioVolumeValue.textContent = `${value}%`;
});

ambientVolumeInput.addEventListener("input", (e) => {
  const value = Number(e.target.value);
  ambientVolumeValue.textContent = `${value}%`;
  if (playersReady.ambient && ambientPlayer && ambientPlayer.setVolume) {
    ambientPlayer.setVolume(value);
  }
});

speedButtons.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-speed]");
  if (!btn) return;
  const rate = Number(btn.dataset.speed);

  [...speedButtons.children].forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  if (playersReady.main && mainPlayer && mainPlayer.setPlaybackRate) {
    mainPlayer.setPlaybackRate(rate);
  }
});

sidebarToggle.addEventListener("click", () => {
  const isClosed = sidebar.classList.toggle("closed");
  sidebarToggle.setAttribute("aria-expanded", String(!isClosed));
});

// -------------------- PANNEAU CEINTURE : DING SONORE --------------------
function playDing() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    // Deux notes façon "ding-dong" de cabine d'avion
    [{ freq: 880, start: 0 }, { freq: 660, start: 0.28 }].forEach(({ freq, start }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.35, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + start);
      osc.stop(now + start + 1);
    });
  } catch (err) {
    console.warn("Impossible de jouer le son du ding :", err);
  }
}

seatbeltToggle.addEventListener("click", () => {
  seatbeltOn = !seatbeltOn;
  seatbeltToggle.classList.toggle("is-on", seatbeltOn);
  seatbeltToggle.setAttribute("aria-pressed", String(seatbeltOn));
  playDing();
});

// -------------------- INITIALISATION GÉNÉRALE --------------------
populateDestinations();
populateRadios(currentFlightIndex);
radioVolumeValue.textContent = `${radioVolumeInput.value}%`;
ambientVolumeValue.textContent = `${ambientVolumeInput.value}%`;
