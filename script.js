// 🔑 Configuración de Firebase (usa tus credenciales reales aquí)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "barra-chuy-eventos.firebaseapp.com",
  projectId: "barra-chuy-eventos",
  storageBucket: "barra-chuy-eventos.appspot.com",
  messagingSenderId: "XXXXXXX",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Conectar con Firestore
const db = firebase.firestore();

// Inicializar mapa con Leaflet
let map;
function initMap() {
  map = L.map('map').setView([-33.7, -53.45], 14); // Barra del Chuy
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  map.on('click', function(e) {
    L.marker(e.latlng).addTo(map);
    document.getElementById("location").value =
      e.latlng.lat + "," + e.latlng.lng;
  });
}
initMap();

// Mostrar lista de eventos
function showEvents() {
  document.getElementById('event-list').style.display = 'block';
  renderEvents();
}

// Mostrar formulario
function showForm() {
  document.getElementById('event-form').style.display = 'block';
}

// Guardar evento en Firestore
function saveEvent() {
  const title = document.getElementById('title').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const description = document.getElementById('description').value;
  const location = document.getElementById('location').value;

  db.collection("eventos").add({
    title, category, date, time, description, location
  }).then(() => {
    alert("Evento guardado correctamente");
    renderEvents();
  }).catch(err => {
    console.error("Error al guardar evento:", err);
    alert("No se pudo guardar el evento. Revisa la consola.");
  });
}

// Renderizar eventos desde Firestore
function renderEvents() {
  db.collection("eventos").orderBy("date").onSnapshot(snapshot => {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    snapshot.forEach(doc => {
      const ev = doc.data();
      list.innerHTML += `
        <p><strong>${ev.date} ${ev.time}</strong> - ${ev.title} (${ev.category})<br>
        ${ev.description}<br>
        📍 ${ev.location}</p>`;
    });
  });
}
