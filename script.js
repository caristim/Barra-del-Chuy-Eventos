// ==================== CONFIGURACIÓN DE FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyAbO_rEyrHMhAC68Qflr6ZXByVdYKSA2Ao",
  authDomain: "barra-del-chuy-eventos.firebaseapp.com",
  projectId: "barra-del-chuy-eventos",
  storageBucket: "barra-del-chuy-eventos.firebasestorage.app",
  messagingSenderId: "414247219366",
  appId: "1:414247219366:web:4fb5d257effc6ed2db0467",
  measurementId: "G-2L680N3SE9"
};

// Inicializar Firebase (versión compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==================== VARIABLES GLOBALES ====================
let map = null;
let marker = null;
const DEFAULT_LAT = -33.749;
const DEFAULT_LNG = -53.347;

// ==================== FUNCIONES DE INTERFAZ ====================

function showEvents() {
  const listDiv = document.getElementById('event-list');
  const formDiv = document.getElementById('event-form');
  listDiv.style.display = 'block';
  formDiv.style.display = 'none';
  listDiv.innerHTML = '<p>Cargando eventos...</p>';

  db.collection('eventos')
    .orderBy('fecha', 'desc')
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        listDiv.innerHTML = '<p>No hay eventos aún. ¡Sé el primero en agregar uno!</p>';
        return;
      }
      let html = '';
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fecha = data.fecha ? data.fecha.toDate ? data.fecha.toDate().toLocaleString() : data.fecha : 'Sin fecha';
        const titulo = data.titulo || 'Sin título';
        const categoria = data.categoria || 'General';
        const desc = data.descripcion || '';
        const ubicacion = data.ubicacion || 'No especificada';
        html += `
          <div class="event-item">
            <div class="event-title">${titulo}</div>
            <div class="event-meta">
              <span>📅 ${fecha}</span> &bull; 
              <span>📂 ${categoria}</span> &bull; 
              <span>📍 ${ubicacion}</span>
            </div>
            ${desc ? `<div class="event-desc">${desc}</div>` : ''}
          </div>
        `;
      });
      listDiv.innerHTML = html;
    })
    .catch((error) => {
      console.error('Error al obtener eventos:', error);
      listDiv.innerHTML = '<p>Error al cargar eventos. Intenta de nuevo más tarde.</p>';
    });
}

function showForm() {
  const listDiv = document.getElementById('event-list');
  const formDiv = document.getElementById('event-form');
  listDiv.style.display = 'none';
  formDiv.style.display = 'block';

  if (map) {
    setTimeout(() => {
      map.invalidateSize();
      const locInput = document.getElementById('location');
      const coords = locInput.value.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        marker.setLatLng([coords[0], coords[1]]);
        map.setView([coords[0], coords[1]], 13);
      }
    }, 300);
  } else {
    initMap();
  }
}

function hideForm() {
  document.getElementById('event-form').style.display = 'none';
  document.getElementById('event-list').style.display = 'block';
  showEvents();
}

// ==================== MAPA (Leaflet) ====================
function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('Contenedor del mapa no encontrado');
    return;
  }

  if (map) {
    map.invalidateSize();
    return;
  }

  map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LNG], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map);

  marker.on('dragend', function () {
    const pos = marker.getLatLng();
    document.getElementById('location').value = `${pos.lat}, ${pos.lng}`;
  });

  map.on('click', function (e) {
    const latlng = e.latlng;
    marker.setLatLng(latlng);
    document.getElementById('location').value = `${latlng.lat}, ${latlng.lng}`;
  });

  const locationInput = document.getElementById('location');
  locationInput.addEventListener('change', function () {
    const coords = this.value.trim().split(',').map(Number);
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      marker.setLatLng([coords[0], coords[1]]);
      map.setView([coords[0], coords[1]], 13);
    }
  });

  locationInput.value = `${DEFAULT_LAT}, ${DEFAULT_LNG}`;

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 500);
}

// ==================== GUARDAR EVENTO (MEJORADO) ====================
function saveEvent() {
  console.log("🔍 Iniciando guardado de evento...");

  // Obtener valores
  const titulo = document.getElementById('title').value.trim();
  const categoria = document.getElementById('category').value;
  const fechaInput = document.getElementById('date').value;
  const horaInput = document.getElementById('time').value;
  const descripcion = document.getElementById('description').value.trim();
  const ubicacionStr = document.getElementById('location').value.trim();

  console.log("📋 Datos del formulario:", { titulo, categoria, fechaInput, horaInput, descripcion, ubicacionStr });

  // Validaciones
  if (!titulo) {
    alert('Por favor, escribe un título para el evento.');
    console.warn("⚠️ Falta título");
    return;
  }
  if (!fechaInput) {
    alert('Selecciona una fecha.');
    console.warn("⚠️ Falta fecha");
    return;
  }
  if (!horaInput) {
    alert('Selecciona una hora.');
    console.warn("⚠️ Falta hora");
    return;
  }
  if (!ubicacionStr) {
    alert('Indica una ubicación (lat, lng) o selecciona en el mapa.');
    console.warn("⚠️ Falta ubicación");
    return;
  }

  // Parsear ubicación
  const coords = ubicacionStr.split(',').map(s => parseFloat(s.trim()));
  if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
    alert('La ubicación debe tener el formato: latitud, longitud (ej: -33.749, -53.347)');
    console.warn("⚠️ Ubicación inválida:", ubicacionStr);
    return;
  }

  // Combinar fecha y hora
  const fechaHora = new Date(`${fechaInput}T${horaInput}:00`);
  if (isNaN(fechaHora.getTime())) {
    alert('Fecha u hora inválida. Por favor revisa los valores.');
    console.error("❌ Fecha/hora inválida:", fechaInput, horaInput);
    return;
  }

  // Preparar datos
  const data = {
    titulo: titulo,
    categoria: categoria,
    fecha: fechaHora,
    fechaStr: fechaInput,
    hora: horaInput,
    descripcion: descripcion,
    ubicacion: `${coords[0]}, ${coords[1]}`,
    lat: coords[0],
    lng: coords[1],
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  console.log("📦 Datos a guardar en Firestore:", data);

  // Guardar en Firestore
  db.collection('eventos')
    .add(data)
    .then((docRef) => {
      console.log("✅ Evento guardado con ID:", docRef.id);
      alert('✅ Evento guardado con éxito.');
      // Limpiar formulario
      document.getElementById('title').value = '';
      document.getElementById('description').value = '';
      document.getElementById('location').value = `${DEFAULT_LAT}, ${DEFAULT_LNG}`;
      if (marker) {
        marker.setLatLng([DEFAULT_LAT, DEFAULT_LNG]);
        map.setView([DEFAULT_LAT, DEFAULT_LNG], 13);
      }
      hideForm();
    })
    .catch((error) => {
      console.error("❌ Error al guardar en Firestore:", error);
      alert('❌ Error al guardar el evento. Revisa la consola para más detalles.');
    });
}

// ==================== INICIO ====================
document.addEventListener('DOMContentLoaded', function () {
  initMap();
  showEvents();
});
