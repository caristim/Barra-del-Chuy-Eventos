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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==================== VARIABLES GLOBALES ====================
let map = null;
let marker = null;
let mapList = null;
let markerGroup = null;
const DEFAULT_LAT = -33.749;
const DEFAULT_LNG = -53.347;

// ==================== FUNCIONES DE INTERFAZ ====================

function showEvents() {
  const listDiv = document.getElementById('event-list');
  const formDiv = document.getElementById('event-form');
  listDiv.style.display = 'block';
  formDiv.style.display = 'none';

  document.getElementById('event-items').innerHTML = '<p>🔄 Cargando eventos...</p>';
  const mapListContainer = document.getElementById('map-list');
  mapListContainer.style.display = 'none';

  console.log('📡 Leyendo eventos de Firestore...');

  db.collection('eventos')
    .orderBy('fecha', 'desc')
    .get()
    .then((querySnapshot) => {
      console.log('✅ Eventos obtenidos:', querySnapshot.size);
      const itemsContainer = document.getElementById('event-items');

      if (querySnapshot.empty) {
        itemsContainer.innerHTML = '<p>📭 No hay eventos aún. ¡Sé el primero en agregar uno!</p>';
        mapListContainer.style.display = 'none';
        return;
      }

      let html = '';
      const eventosConCoords = [];
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
        
        if (data.lat && data.lng) {
          eventosConCoords.push({
            lat: data.lat,
            lng: data.lng,
            titulo: titulo,
            desc: desc || ''
          });
        }
      });
      itemsContainer.innerHTML = html;

      if (eventosConCoords.length > 0) {
        mapListContainer.style.display = 'block';
        initMapList(eventosConCoords);
      } else {
        mapListContainer.style.display = 'none';
      }
    })
    .catch((error) => {
      console.error('❌ Error al obtener eventos:', error);
      let mensajeError = '❌ Error al cargar eventos: ';
      if (error.code === 'permission-denied') {
        mensajeError += 'No tienes permisos para leer los eventos. Verifica las reglas de Firestore en la consola de Firebase.';
      } else {
        mensajeError += error.message;
      }
      document.getElementById('event-items').innerHTML = `<p>${mensajeError}</p>`;
      document.getElementById('map-list').style.display = 'none';
    });
}

function initMapList(eventos) {
  const container = document.getElementById('map-list');
  if (!container) return;

  if (mapList) {
    if (markerGroup) mapList.removeLayer(markerGroup);
  } else {
    mapList = L.map('map-list', {
      maxZoom: 15
    }).setView([DEFAULT_LAT, DEFAULT_LNG], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapList);
  }

  markerGroup = L.layerGroup().addTo(mapList);
  const bounds = [];
  eventos.forEach(ev => {
    const latlng = [ev.lat, ev.lng];
    bounds.push(latlng);
    const popupText = `<strong>${ev.titulo}</strong>${ev.desc ? '<br>' + ev.desc : ''}`;
    L.marker(latlng).bindPopup(popupText).addTo(markerGroup);
  });

  if (bounds.length > 0) {
    mapList.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  } else {
    mapList.setView([DEFAULT_LAT, DEFAULT_LNG], 12);
  }

  setTimeout(() => { if (mapList) mapList.invalidateSize(); }, 300);
}

function showForm() {
  document.getElementById('event-list').style.display = 'none';
  document.getElementById('event-form').style.display = 'block';
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
    initMapForm();
  }
}

function hideForm() {
  document.getElementById('event-form').style.display = 'none';
  document.getElementById('event-list').style.display = 'block';
  showEvents();
}

function initMapForm() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;
  if (map) { map.invalidateSize(); return; }

  map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LNG], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
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

  const locInput = document.getElementById('location');
  locInput.addEventListener('change', function () {
    const coords = this.value.trim().split(',').map(Number);
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      marker.setLatLng([coords[0], coords[1]]);
      map.setView([coords[0], coords[1]], 13);
    }
  });
  locInput.value = `${DEFAULT_LAT}, ${DEFAULT_LNG}`;
  setTimeout(() => { if (map) map.invalidateSize(); }, 500);
}

function saveEvent() {
  const titulo = document.getElementById('title').value.trim();
  const categoria = document.getElementById('category').value;
  const fechaInput = document.getElementById('date').value;
  const horaInput = document.getElementById('time').value;
  const descripcion = document.getElementById('description').value.trim();
  const ubicacionStr = document.getElementById('location').value.trim();

  if (!titulo) { alert('⚠️ Escribe un título.'); return; }
  if (!fechaInput) { alert('⚠️ Selecciona una fecha.'); return; }
  if (!horaInput) { alert('⚠️ Selecciona una hora.'); return; }
  if (!ubicacionStr) { alert('⚠️ Indica una ubicación.'); return; }

  const coords = ubicacionStr.split(',').map(s => parseFloat(s.trim()));
  if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
    alert('⚠️ Ubicación debe ser: lat, lng (ej: -33.749, -53.347)');
    return;
  }

  const fechaHora = new Date(`${fechaInput}T${horaInput}:00`);
  if (isNaN(fechaHora.getTime())) { alert('⚠️ Fecha u hora inválida.'); return; }

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

  console.log('📤 Guardando evento:', data);
  
  db.collection('eventos').add(data)
    .then((docRef) => {
      console.log('✅ Evento guardado con ID:', docRef.id);
      alert('✅ Evento guardado con éxito.');
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
      console.error('❌ Error al guardar:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    });
}

// Inicio
document.addEventListener('DOMContentLoaded', function () {
  initMapForm();
  showEvents();
});
