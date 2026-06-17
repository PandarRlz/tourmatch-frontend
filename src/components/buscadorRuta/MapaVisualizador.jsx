import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Usamos tu token validado
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmVsaXBldmlsbGFsb24yMDAwIiwiYSI6ImNtcWViaTA5bDFicHYycnBvaDU3Zm9rcmYifQ.sTcpWBClWgQy4u8ziJOKYg';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapaVisualizador = ({ origen, destino }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerOrigen = useRef(null);
  const markerDestino = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!origen || !destino) return;

    if (!map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/navigation-day-v1', 
        center: [-70.6483, -33.4569],
        zoom: 11,
        interactive: true 
      });
    }

    const cargarRuta = async () => {
      try {
        const geoOrigenRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origen + ', Santiago')}.json?access_token=${MAPBOX_TOKEN}&country=cl&limit=1`);
        const geoOrigenData = await geoOrigenRes.json();
        
        const geoDestinoRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destino + ', Santiago')}.json?access_token=${MAPBOX_TOKEN}&country=cl&limit=1`);
        const geoDestinoData = await geoDestinoRes.json();

        if (geoOrigenData.features.length === 0 || geoDestinoData.features.length === 0) {
          setError(true);
          return;
        }

        const coordOrigen = geoOrigenData.features[0].center;
        const coordDestino = geoDestinoData.features[0].center;

        const dirRes = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordOrigen[0]},${coordOrigen[1]};${coordDestino[0]},${coordDestino[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);
        const dirData = await dirRes.json();

        if (dirData.routes && dirData.routes.length > 0) {
          const ruta = dirData.routes[0];

          // 🛑 SOLUCIÓN AL ERROR: Verificamos si el mapa terminó de cargar y manejamos la capa
          const updateLayer = () => {
             if (map.current.getSource('route')) {
               map.current.getSource('route').setData({ type: 'Feature', properties: {}, geometry: ruta.geometry });
             } else {
               map.current.addLayer({
                 id: 'route',
                 type: 'line',
                 source: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: ruta.geometry } },
                 layout: { 'line-join': 'round', 'line-cap': 'round' },
                 paint: { 'line-color': '#ff5252', 'line-width': 6 } 
               });
             }
          };

          if (map.current.isStyleLoaded()) {
             updateLayer();
          } else {
             map.current.once('load', updateLayer);
          }

          // 🛑 Limpiamos marcadores antiguos si existen
          if (markerOrigen.current) markerOrigen.current.remove();
          if (markerDestino.current) markerDestino.current.remove();

          markerOrigen.current = new mapboxgl.Marker({ color: '#28a745' }).setLngLat(coordOrigen).addTo(map.current); 
          markerDestino.current = new mapboxgl.Marker({ color: '#dc3545' }).setLngLat(coordDestino).addTo(map.current);

          const bounds = new mapboxgl.LngLatBounds().extend(coordOrigen).extend(coordDestino);
          map.current.fitBounds(bounds, { padding: 50 });
        }
      } catch (err) {
        console.error("Error cargando la ruta:", err);
        setError(true);
      }
    };

    cargarRuta();
    
    // Función de limpieza para desmontar el mapa correctamente si el componente se destruye
    return () => {
        if (map.current && !mapContainer.current) {
            map.current.remove();
            map.current = null;
        }
    }
  }, [origen, destino]);

  if (error) return <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '5px' }}>⚠️ No se pudo trazar la ruta exacta en el mapa.</div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '250px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
    </div>
  );
};

export default MapaVisualizador;