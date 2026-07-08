// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAbO_rEyrHMhAC68Qflr6ZXByVdYKSA2Ao",
  authDomain: "barra-del-chuy-eventos.firebaseapp.com",
  projectId: "barra-del-chuy-eventos",
  storageBucket: "barra-del-chuy-eventos.firebasestorage.app",
  messagingSenderId: "414247219366",
  appId: "1:414247219366:web:4fb5d257effc6ed2db0467",
  measurementId: "G-2L680N3SE9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Coordenadas exactas Barra del Chuy
const barraChuyCoords = [-33.7556, -53.3889];
let map, marker;

// Mostrar formulario
function showForm() {
  document.getElementById('event-form').style.display = 'block';

  if (!map) {
    map = L.map('map').setView(barraChuyCoords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker(barraChuyCoords, {draggable:true}).addTo(map);

    marker.on('dragend', function(e) {
      const coords = marker.getLatLng();
      document.getElementById('location').value = `${coords.lat},${coords.lng}`;
    });

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

// Mostrar lista de eventos
function showEvents() {
  document.getElementById('event-list').style.display = 'block';
  loadEvents();
}

// Cargar eventos desde Firestore
function loadEvents() {
  const list = document.getElementById('event-list');
  list.innerHTML = "";

  const hoy = new Date();

  db.collection("eventos").orderBy("date").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const ev = doc.data();
      const fechaEvento = new Date(ev.date + "T" + ev.time);

      let html = `
        <p>
          <strong>${ev.date} ${ev.time}</strong> - ${ev.title} (${ev.category})<br>
          ${ev.description}<br>
          📍 ${ev.location}
      `;

      // Mostrar botón de borrar solo si el evento ya pasó
      if (fechaEvento < hoy) {
        html += `<br><button onclick="deleteEvent('${doc.id}')">🗑️ Borrar evento</button>`;
      }

      html += `</p>`;
      list.innerHTML += html;
    });
  });
}

// Función para borrar evento
function deleteEvent(id) {
  db.collection("eventos").doc(id).delete().then(() => {
    alert("Evento borrado correctamente.");
    loadEvents();
  }).catch((error) => {
    console.error("Error al borrar: ", error);
  });
}

// Inicial carga
loadEvents();
