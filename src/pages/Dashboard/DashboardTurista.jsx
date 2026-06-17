import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './DashboardTurista.module.css';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard/StatsCard';

// INTEGRACIÓN DE MAPBOX DIRECTA
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmVsaXBldmlsbGFsb24yMDAwIiwiYSI6ImNtcWViaTA5bDFicHYycnBvaDU3Zm9rcmYifQ.sTcpWBClWgQy4u8ziJOKYg';
mapboxgl.accessToken = MAPBOX_TOKEN;

const DashboardTurista = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('buscar');
  const [historialViajes, setHistorialViajes] = useState([]);
  const [cantidadPasajeros, setCantidadPasajeros] = useState(1);
  
  const calcularFechaManana = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    return fecha.toISOString().slice(0, 16); 
  };
  const [fechaViaje, setFechaViaje] = useState(calcularFechaManana());

  const [waypoints, setWaypoints] = useState([
    { direccion: '', tipo: 'ORIGEN', latitud: null, longitud: null },
    { direccion: '', tipo: 'DESTINO', latitud: null, longitud: null }
  ]);

  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // ESTADOS DEL MAPA Y CÁLCULOS
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]); // Para limpiar los marcadores anteriores
  const [precioCalculado, setPrecioCalculado] = useState(0);
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [calculando, setCalculando] = useState(false);
  const [rutaTrazada, setRutaTrazada] = useState(false);

  // 1. Inicializar el mapa vacío
  useEffect(() => {
    if (activeTab === 'buscar' && !map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-70.6483, -33.4569], // Santiago Centro
        zoom: 11
      });
    }
  }, [activeTab]);

  const consultarHistorial = useCallback(async () => {
    if (!user?.token) return;
    setLoadingHistorial(true);
    try {
      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/reservas/mis-reservas", { 
        method: "GET",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistorialViajes(data);
      }
    } catch (error) {
      console.error("Error al obtener historial:", error);
    } finally { 
      setLoadingHistorial(false);
    }
  }, [user?.token]);

  useEffect(() => {
    if (activeTab === 'historial') consultarHistorial();
  }, [activeTab, consultarHistorial]);

  const handleWaypointChange = (index, value) => {
    const nuevosWaypoints = [...waypoints];
    nuevosWaypoints[index].direccion = value;
    setWaypoints(nuevosWaypoints);
    setRutaTrazada(false); // Si cambia una dirección, obliga a recalcular
  };

  const agregarParadaIntermedia = () => {
    const nuevosWaypoints = [...waypoints];
    nuevosWaypoints.splice(nuevosWaypoints.length - 1, 0, { direccion: '', tipo: 'PARADA', latitud: null, longitud: null });
    setWaypoints(nuevosWaypoints);
    setRutaTrazada(false);
  };

  const eliminarParada = (index) => {
    if (waypoints[index].tipo === 'PARADA') {
      setWaypoints(waypoints.filter((_, i) => i !== index));
      setRutaTrazada(false);
    }
  };

  // 2. Lógica para trazar la ruta en Mapbox, aplicar tarifa y GUARDAR COORDENADAS
  const calcularRutaEnMapa = async () => {
    setMensaje({ texto: '', tipo: '' });

    // 🛑 ESCUDO 1: Validación estricta de pasajeros antes de consultar el mapa
    if (cantidadPasajeros < 1 || cantidadPasajeros > 12) {
      return setMensaje({ texto: "Capacidad excedida. El máximo permitido es de 12 pasajeros por reserva.", tipo: 'error' });
    }

    if (waypoints.some(wp => wp.direccion.trim() === '')) {
      return setMensaje({ texto: "Debes completar todas las direcciones antes de trazar la ruta.", tipo: 'error' });
    }

    setCalculando(true);
    try {
      const coordenadas = [];
      const waypointsConCoordenadas = [...waypoints]; // Clonamos para inyectar lat/lng
      
      // Limpiar marcadores viejos
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Obtener Lat y Lng para cada dirección
      for (let i = 0; i < waypointsConCoordenadas.length; i++) {
        const wp = waypointsConCoordenadas[i];
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(wp.direccion + ", Santiago")}.json?access_token=${MAPBOX_TOKEN}&country=cl&limit=1`);
        const data = await res.json();
        
        if (data.features.length === 0) throw new Error(`No encontramos la dirección: ${wp.direccion}`);
        
        const coord = data.features[0].center; // Mapbox devuelve [longitud, latitud]
        coordenadas.push(coord);
        
        // ¡LA MAGIA AQUÍ!: Guardamos las coordenadas reales en nuestro arreglo
        waypointsConCoordenadas[i].longitud = coord[0];
        waypointsConCoordenadas[i].latitud = coord[1];
      }

      // Actualizamos el estado para que handleSolicitarViaje tenga las coordenadas
      setWaypoints(waypointsConCoordenadas);

      // Trazar línea de ruta
      const coordString = coordenadas.map(c => c.join(',')).join(';');
      const dirRes = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);
      const dirData = await dirRes.json();

      if (dirData.routes && dirData.routes.length > 0) {
        const ruta = dirData.routes[0];
        const distKm = (ruta.distance / 1000).toFixed(1);
        
        // REGLA DE NEGOCIO ESTRICTA: $1.850 CLP por cada Kilómetro
        const valorFinal = Math.round(distKm * 1850);
        
        setDistanciaTotal(distKm);
        setPrecioCalculado(valorFinal);

        // Dibujar ruta
        if (map.current.getSource('route')) {
          map.current.getSource('route').setData({ type: 'Feature', properties: {}, geometry: ruta.geometry });
        } else {
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: ruta.geometry } },
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#3b82f6', 'line-width': 5 }
          });
        }

        // Agregar Pines de colores
        const bounds = new mapboxgl.LngLatBounds();
        coordenadas.forEach((coord, idx) => {
          bounds.extend(coord);
          const color = idx === 0 ? '#10b981' : (idx === coordenadas.length - 1 ? '#ef4444' : '#f59e0b');
          const marker = new mapboxgl.Marker({ color }).setLngLat(coord).addTo(map.current);
          markersRef.current.push(marker);
        });

        map.current.fitBounds(bounds, { padding: 40 });
        setRutaTrazada(true);
      }
    } catch (error) {
      setMensaje({ texto: error.message || "Error al calcular la ruta en el mapa.", tipo: 'error' });
    } finally {
      setCalculando(false);
    }
  };

  // 3. Enviar a Java con coordenadas reales
  const handleSolicitarViaje = async () => {
    if (!rutaTrazada) return setMensaje({ texto: "Debes calcular la ruta en el mapa primero.", tipo: 'error' });

    // 🛑 ESCUDO 2: Validación estricta antes de enviar el POST al Backend
    if (cantidadPasajeros < 1 || cantidadPasajeros > 12) {
      return setMensaje({ texto: "Capacidad excedida. El máximo permitido es de 12 pasajeros.", tipo: 'error' });
    }

    // Armamos el payload tomando latitud y longitud reales del estado
    const waypointsFormateados = waypoints.map((wp, index) => ({
      direccion: wp.direccion,
      orden: index + 1,
      latitud: wp.latitud,   // Coordenada real capturada
      longitud: wp.longitud  // Coordenada real capturada
    }));

    const nuevaReserva = {
      fechaViaje: fechaViaje, 
      cantidadPasajeros: parseInt(cantidadPasajeros),
      precioTotal: precioCalculado, // El valor ya generado por Mapbox (1850 x KM)
      estado: "PENDIENTE", 
      waypoints: waypointsFormateados
    };

    try {
      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/reservas/crear", { 
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(nuevaReserva)
      });

      if (response.ok) {
        setMensaje({ texto: "¡Ruta solicitada con éxito! Buscando un conductor cercano.", tipo: 'success' });
        setWaypoints([{ direccion: '', tipo: 'ORIGEN', latitud: null, longitud: null }, { direccion: '', tipo: 'DESTINO', latitud: null, longitud: null }]);
        setRutaTrazada(false);
        setPrecioCalculado(0);
        if (map.current && map.current.getSource('route')) {
          map.current.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
          markersRef.current.forEach(m => m.remove());
        }
      } else {
        const errorText = await response.text();
        setMensaje({ texto: errorText, tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: "Error de comunicación con el servidor.", tipo: 'error' });
    }
  };

  const nombreFormateado = user?.nombre ? user.nombre.charAt(0).toUpperCase() + user.nombre.slice(1).toLowerCase() : "Pasajero";

  // Determinación visual del tipo de vehículo
  const tipoVehiculoRequerido = cantidadPasajeros > 4 ? "Categoría XL (Minivan)" : "Categoría Confort (Sedán)";

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h3>TourMatch</h3>
        <p className={styles.welcome}>Bienvenido, <strong>{nombreFormateado}</strong> 🌎</p>
        <nav>
          <ul>
            <li className={activeTab === 'buscar' ? styles.active : ''} onClick={() => setActiveTab('buscar')}>Solicitar Traslado</li>
            <li className={activeTab === 'historial' ? styles.active : ''} onClick={() => setActiveTab('historial')}>Mis Viajes</li>
          </ul>
        </nav>
      </aside>

      <main className={styles.content}>
        <h1>Panel de Pasajero</h1>

        <div className={styles.statsGrid}>
          <StatsCard title="Viajes Realizados" value={historialViajes.length.toString()} icon="🗺️" color="#2563eb" />
          <StatsCard title="Estado de Cuenta" value="Activa" icon="✓" color="#10b981" />
        </div>

        {activeTab === 'buscar' && (
          <div className={styles.card} style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div style={{ flex: '1 1 400px' }}>
              <h2>Personaliza tu Ruta Multi-Parada</h2>
              <p style={{color: '#64748b', marginBottom: '20px'}}>Agrega las paradas, nosotros calculamos el trayecto.</p>
              
              <div className={styles.form}>
                {waypoints.map((wp, index) => (
                  <div key={index} className={styles.inputGroup} style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {wp.tipo === 'ORIGEN' && "📍 Punto de Inicio (Verde)"}
                        {wp.tipo === 'PARADA' && `🛑 Parada Intermedia (Naranja)`}
                        {wp.tipo === 'DESTINO' && "🏁 Destino Final (Rojo)"}
                      </span>
                      {wp.tipo === 'PARADA' && (
                        <button type="button" onClick={() => eliminarParada(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>(Remover)</button>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={wp.direccion} 
                      onChange={(e) => handleWaypointChange(index, e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder={wp.tipo === 'ORIGEN' ? "Ej: Costanera Center" : wp.tipo === 'PARADA' ? "Ej: Parque Bicentenario" : "Ej: Aeropuerto SCL"} 
                    />
                  </div>
                ))}

                <button type="button" onClick={agregarParadaIntermedia} style={{ background: '#f8fafc', color: '#0f172a', border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '25px', width: '100%', fontWeight: '600' }}>
                  ➕ Agregar otra Parada
                </button>

                <div className={styles.inputGroup} style={{ marginBottom: '15px' }}>
                  <label>Fecha y Hora del Viaje (Min. 10 horas antes)</label>
                  <input type="datetime-local" value={fechaViaje} onChange={(e) => setFechaViaje(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>

                <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                  <label>Cantidad de Pasajeros</label>
                  {/* 🛑 ESCUDO 3: Límite max="12" aplicado en el HTML */}
                  <input type="number" value={cantidadPasajeros} onChange={(e) => {setCantidadPasajeros(e.target.value); setRutaTrazada(false);}} required min="1" max="12" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>Se asignará vehículo: <strong>{tipoVehiculoRequerido}</strong></small>
                </div>

                {/* BOTÓN PASO 1: MAPEAR */}
                <button 
                  type="button" 
                  onClick={calcularRutaEnMapa}
                  disabled={calculando}
                  style={{ width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
                >
                  {calculando ? 'Calculando GPS...' : '1. Trazar Ruta y Calcular Tarifa 🗺️'}
                </button>
              </div>
            </div>

            {/* COLUMNA DERECHA: MAPA Y BOTÓN DE CONFIRMACIÓN */}
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
              <div ref={mapContainer} style={{ width: '100%', height: '350px', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '15px' }} />
              
              {rutaTrazada && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#166534' }}>Distancia Total: <strong>{distanciaTotal} km</strong></p>
                  <p style={{ margin: '0 0 15px 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#15803d' }}>
                    Total a pagar: ${precioCalculado.toLocaleString('es-CL')}
                  </p>
                  
                  {/* BOTÓN PASO 2: SOLICITAR (LLAMA A JAVA) */}
                  <button 
                    onClick={handleSolicitarViaje}
                    style={{ width: '100%', padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
                  >
                    2. Confirmar y Solicitar Vehículo ✅
                  </button>
                </div>
              )}
              
              {mensaje.texto && (
                <div style={{ marginTop: '15px', padding: '15px', borderRadius: '8px', backgroundColor: mensaje.tipo === 'success' ? '#dcfce7' : '#fee2e2', color: mensaje.tipo === 'success' ? '#166534' : '#991b1b', fontWeight: 'bold', textAlign: 'center' }}>
                  {mensaje.texto}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ... PESTAÑA DE HISTORIAL MANTIENE TU CÓDIGO ORIGINAL ... */}
        {activeTab === 'historial' && (
          <div className={styles.card}>
            <h2>Historial de Rutas Tomadas</h2>
            <div className={styles.tripList}>
              {loadingHistorial ? (
                <p>Cargando tus viajes desde el servidor...</p>
              ) : historialViajes.length > 0 ? (
                historialViajes.map(viaje => (
                  <div key={viaje.id} className={styles.tripItem}>
                    <div>
                      <span className={styles.date}>{new Date(viaje.fechaViaje).toLocaleString('es-CL')}</span>
                      <p style={{ marginTop: '5px' }}>
                        <strong>Ruta asignada:</strong>
                        {viaje.waypoints?.map((w, idx) => (
                          <span key={w.id} style={{ fontSize: '0.88rem', display: 'block', color: '#475569', paddingLeft: '10px' }}>
                            {idx + 1}. {w.direccion}
                          </span>
                        ))}
                      </p>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Pasajeros: {viaje.cantidadPasajeros} | Total: ${viaje.precioTotal.toLocaleString('es-CL')}</span>
                    </div>
                    <span className={styles.statusBadge}>{viaje.estado}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}><p>Aún no registras viajes históricos en tu cuenta.</p></div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardTurista;