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

// Inicializar Firebase (compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==================== VARIABLES GLOBALES ====================
let map = null;
let marker = null;
let mapInitialized = false;

// Coordenadas por defecto: Barra del Chuy (aproximado)
const DEFAULT_LAT = -33.749;
const DEFAULT_LNG = -53.347;

// ==================== FUNCIONES DE INTERFAZ ====================

// Mostrar la lista de eventos
function showEvents() {
  const listDiv = document.getElementById('event-list');
  const formDiv = document.getElementById('event-form');
  listDiv.style.display = 'block';
  formDiv.style.display = 'none';
  listDiv.innerHTML = '<p>Cargando eventos...</p>';

  db.collection('eventos')
    .orderBy('fecha', 'desc') // ordenar por fecha (más reciente primero)
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

// Mostrar el formulario y ocultar la lista
function showForm() {
  const listDiv = document.getElementById('event-list');
  const formDiv = document.getElementById('event-form');
  listDiv.style.display = 'none';
  formDiv.style.display = 'block';

  // Inicializar el mapa si no lo está
  if (!mapInitialized) {
    initMap();
  }
}

// Ocultar formulario
function hideForm() {
  document.getElementById('event-form').style.display = 'none';
  document.getElementById('event-list').style.display = 'block';
  // Volver a mostrar la lista
  showEvents();
}

// ==================== MAPA (Leaflet) ====================
function initMap() {
  // El contenedor del mapa debe estar visible para que Leaflet lo renderice bien
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Crear el mapa
  map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LNG], 13);

  // Capa de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Marcador arrastrable
  marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map);

  // Actualizar campo de ubicación al arrastrar
  marker.on('dragend', function () {
    const pos = marker.getLatLng();
    document.getElementById('location').value = `${pos.lat}, ${pos.lng}`;
  });

  // Al hacer clic en el mapa, mover el marcador
  map.on('click', function (e) {
    const latlng = e.latlng;
    marker.setLatLng(latlng);
    document.getElementById('location').value = `${latlng.lat}, ${latlng.lng}`;
  });

  // Si el usuario escribe manualmente en el campo, actualizar el marcador
  const locationInput = document.getElementById('location');
  locationInput.addEventListener('change', function () {
    const coords = this.value.trim().split(',').map(Number);
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      const lat = coords[0];
      const lng = coords[1];
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 13);
    }
  });

  mapInitialized = true;

  // Ajustar el tamaño del mapa cuando se muestra (después de un pequeño retraso)
  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

// ==================== GUARDAR EVENTO ====================
function saveEvent() {
  // Obtener valores
  const titulo = document.getElementById('title').value.trim();
  const categoria = document.getElementById('category').value;
  const fechaInput = document.getElementById('date').value;
  const horaInput = document.getElementById('time').value;
  const descripcion = document.getElementById('description').value.trim();
  const ubicacionStr = document.getElementById('location').value.trim();

  // Validaciones
  if (!titulo) {
    alert('Por favor, escribe un título para el evento.');
    return;
  }
  if (!fechaInput) {
    alert('Selecciona una fecha.');
    return;
  }
  if (!horaInput) {
    alert('Selecciona una hora.');
    return;
  }
  if (!ubicacionStr) {
    alert('Indica una ubicación (lat, lng) o selecciona en el mapa.');
    return;
  }

  // Parsear ubicación
  const coords = ubicacionStr.split(',').map(s => parseFloat(s.trim()));
  if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
    alert('La ubicación debe tener el formato: latitud, longitud (ej: -33.749, -53.347)');
    return;
  }

  // Combinar fecha y hora en un objeto Date (para ordenar)
  const fechaHora = new Date(`${fechaInput}T${horaInput}:00`);

  // Preparar datos para Firestore
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

  // Guardar en Firestore
  db.collection('eventos')
    .add(data)
    .then(() => {
      alert('✅ Evento guardado con éxito.');
      // Limpiar formulario
      document.getElementById('title').value = '';
      document.getElementById('description').value = '';
      document.getElementById('location').value = `${DEFAULT_LAT}, ${DEFAULT_LNG}`;
      // Resetear marcador a la posición por defecto
      if (marker) {
        marker.setLatLng([DEFAULT_LAT, DEFAULT_LNG]);
        map.setView([DEFAULT_LAT, DEFAULT_LNG], 13);
      }
      // Ocultar formulario y mostrar lista actualizada
      hideForm();
    })
    .catch((error) => {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar el evento. Revisa la consola para más detalles.');
    });
}

// ==================== INICIO ====================
// Al cargar la página, mostrar los eventos automáticamente
window.addEventListener('DOMContentLoaded', function () {
  showEvents();
});
