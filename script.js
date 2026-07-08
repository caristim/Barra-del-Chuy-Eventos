// 🔑 Configuración Firebase (reemplaza con tus credenciales)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Coordenadas Barra del Chuy
const barraChuyCoords = [-33.713, -53.459];
let map, marker;

// Mostrar formulario
function showForm() {
  document.getElementById('event-form').style.display = 'block';

  // Inicializar mapa si no existe
  if (!map) {
    map = L.map('map').setView(barraChuyCoords, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker(barraChuyCoords, {draggable:true}).addTo(map);

    marker.on('dragend', function(e) {
      const coords = marker.getLatLng();
      document.getElementById('location').value = `${coords.lat},${coords.lng}`;
    });

    // Guardar coordenadas iniciales
    document.getElementById('location').value = `${barraChuyCoords[0]},${barraChuyCoords[1]}`;
  }
}

// Ocultar formulario
function hideForm() {
  document.getElementById('event-form').style.display = 'none';
}

// Guardar evento en Firestore
function saveEvent() {
  const title = document.getElementById('title').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const description = document.getElementById('description').value;
  const location = document.getElementById('location').value;

  if (!title || !date || !time) {
    alert("Por favor completa título, fecha y hora.");
    return;
  }

  db.collection("eventos").add({
    title, category, date, time, description, location
  }).then(() => {
    alert("Evento guardado correctamente.");
    hideForm();
    loadEvents();
  }).catch((error) => {
    console.error("Error al guardar: ", error);
  });
}

// Cargar eventos desde Firestore
function loadEvents() {
  const list = document.getElementById('event-list');
  list.innerHTML = "";

  db.collection("eventos").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const ev = doc.data();
      const li = document.createElement("li");
      li.textContent = `${ev.date} ${ev.time} - ${ev.title} (${ev.category})`;
      list.appendChild(li);
    });
  });
}

// Inicial carga
loadEvents();
