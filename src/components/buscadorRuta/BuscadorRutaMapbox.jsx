import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// REGÍSTRATE EN MAPBOX.COM Y PEGA TU TOKEN GRATUITO AQUÍ
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmVsaXBldmlsbGFsb24yMDAwIiwiYSI6ImNtcWViaTA5bDFicHYycnBvaDU3Zm9rcmYifQ.sTcpWBClWgQy4u8ziJOKYg'; 
mapboxgl.accessToken = MAPBOX_TOKEN;

const BuscadorRutaMapbox = ({ onRutaCalculada }) => {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [distancia, setDistancia] = useState(0);
  const [precioTotal, setPrecioTotal] = useState(0);
  const [cargando, setCargando] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerOrigen = useRef(null);
  const markerDestino = useRef(null);

  // Inicializar mapa básico centrado en Santiago de Chile
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-70.6483, -33.4569], // Santiago Centro
      zoom: 11
    });
  }, []);

  // Función para convertir texto (dirección) a coordenadas
  const geocodificar = async (direccion) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(direccion)}.json?access_token=${MAPBOX_TOKEN}&country=cl&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].center; // Retorna [longitud, latitud]
    }
    throw new Error('Dirección no encontrada');
  };

  const calcularRuta = async (e) => {
    e.preventDefault();
    if (!origen || !destino) return;
    setCargando(true);

    try {
      // 1. Obtener coordenadas
      const coordOrigen = await geocodificar(origen + ", Santiago");
      const coordDestino = await geocodificar(destino + ", Santiago");

      // 2. Obtener la ruta y distancia desde la API de Mapbox
      const urlDirections = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordOrigen[0]},${coordOrigen[1]};${coordDestino[0]},${coordDestino[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const resDirections = await fetch(urlDirections);
      const dataDirections = await resDirections.json();

      if (dataDirections.routes && dataDirections.routes.length > 0) {
        const ruta = dataDirections.routes[0];
        const distanciaKm = (ruta.distance / 1000).toFixed(1); // Convertir metros a KM
        
        // REGLA DE NEGOCIO FRONTEND: $1.200 pesos por kilómetro recorrido
        const valorCalculado = Math.round(distanciaKm * 1200);

        setDistancia(distanciaKm);
        setPrecioTotal(valorCalculado);

        // Enviar datos al componente padre (ej. Formulario de Reserva)
        if (onRutaCalculada) {
          onRutaCalculada({
            precioTotal: valorCalculado,
            waypoints: [
              { direccion: origen, orden: 1 },
              { direccion: destino, orden: 2 }
            ]
          });
        }

        // 3. Dibujar en el mapa
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: ruta.geometry
        };

        // Si ya existía la línea de una ruta anterior, la actualizamos
        if (map.current.getSource('route')) {
          map.current.getSource('route').setData(geojson);
        } else {
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: { type: 'geojson', data: geojson },
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#007bff', 'line-width': 5 }
          });
        }

        // Posicionar marcadores visuales
        if (markerOrigen.current) markerOrigen.current.remove();
        if (markerDestino.current) markerDestino.current.remove();

        markerOrigen.current = new mapboxgl.Marker({ color: 'green' }).setLngLat(coordOrigen).addTo(map.current);
        markerDestino.current = new mapboxgl.Marker({ color: 'red' }).setLngLat(coordDestino).addTo(map.current);

        // Ajustar la cámara para que se vean ambos puntos
        const bounds = new mapboxgl.LngLatBounds().extend(coordOrigen).extend(coordDestino);
        map.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (err) {
      alert('Error al trazar la ruta. Por favor, verifica las direcciones.');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', margin: '20px 0' }}>
      <form onSubmit={calcularRuta} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Dirección de Origen (Ej: Alameda 440)" 
          value={origen} 
          onChange={(e) => setOrigen(e.target.value)}
          required
          style={{ padding: '10px', flex: 1, borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <input 
          type="text" 
          placeholder="Dirección de Destino (Ej: Costanera Center)" 
          value={destino} 
          onChange={(e) => setDestino(e.target.value)}
          required
          style={{ padding: '10px', flex: 1, borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={cargando} style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {cargando ? 'Calculando...' : 'Trazar Ruta 🗺️'}
        </button>
      </form>

      {distancia > 0 && (
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #007bff' }}>
          <p style={{ margin: '5px 0' }}><strong>Distancia estimada:</strong> {distancia} KM</p>
          <p style={{ margin: '5px 0', fontSize: '1.2rem', color: '#28a745' }}><strong>Valor total del Tour:</strong> ${precioTotal.toLocaleString('es-CL')}</p>
          <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#6c757d' }}>*(A los conductores se les asignará el 85% neto de este valor)*</p>
        </div>
      )}

      <div ref={mapContainer} style={{ width: '100%', height: '400px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
    </div>
  );
};

export default BuscadorRutaMapbox;