import { useState, useEffect, useCallback } from 'react';
import styles from './DashboardConductor.module.css';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard/StatsCard';
import RegistrarVehiculo from '../Registro/RegistrarVehiculo';
import MapaVisualizador from '../../components/buscadorRuta/MapaVisualizador';

const DashboardConductor = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('viajes'); 
  const [viajesDisponibles, setViajesDisponibles] = useState([]);
  const [viajesActivos, setViajesActivos] = useState([]); 
  const [vehiculoRegistrado, setVehiculoRegistrado] = useState(null);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);
  const [loadingViajes, setLoadingViajes] = useState(false);

  const [metricas, setMetricas] = useState({ viajesMes: 0, gananciasAcumuladas: 0, calificacion: 5.0 });

  const consultarVehiculo = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/vehiculos/mi-vehiculo", {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.status === 200) {
        const data = await response.json();
        setVehiculoRegistrado(data); 
      }
    } catch (error) {} finally { setLoadingVehiculo(false); }
  }, [user?.token]);

  const consultarViajesDisponibles = useCallback(async () => {
    if (!user?.token) return;
    setLoadingViajes(true);
    try {
      const response = await fetch(`https://tourmatchterminar-1.onrender.com/api/reservas/disponibles?capacidad=4`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) setViajesDisponibles(await response.json());
    } catch (error) {} finally { setLoadingViajes(false); }
  }, [user?.token]);

  const consultarViajesActivos = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`https://tourmatchterminar-1.onrender.com/api/reservas/mis-viajes-conductor`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) setViajesActivos(await response.json());
    } catch (error) {}
  }, [user?.token]);

  useEffect(() => {
    consultarVehiculo();
  }, [consultarVehiculo]);

  useEffect(() => {
    if (activeTab === 'viajes') consultarViajesDisponibles();
    if (activeTab === 'activos') consultarViajesActivos();
  }, [activeTab, consultarViajesDisponibles, consultarViajesActivos]);

  const handleAceptarViaje = async (id) => {
    if (!user?.token) return;
    try {
      const response = await fetch(`https://tourmatchterminar-1.onrender.com/api/reservas/${id}/aceptar`, {
        method: "PUT", headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setViajesDisponibles(prev => prev.filter(v => v.id !== id));
        alert("¡Viaje aceptado con éxito! Iniciando mapa y hoja de ruta...");
        setActiveTab('activos'); 
      } else {
         const errorMsg = await response.text();
         alert(`No se pudo aceptar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error al aceptar el traslado:", error);
    }
  };

  const handleFinalizarViaje = async (id, ganancia) => {
    if (!user?.token) return;
    try {
      const response = await fetch(`https://tourmatchterminar-1.onrender.com/api/reservas/${id}/finalizar`, {
        method: "PUT", headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setViajesActivos(prev => prev.filter(v => v.id !== id));
        alert("¡Viaje finalizado con éxito! El cobro se ha registrado en tu cuenta.");
        setMetricas(prev => ({ 
          ...prev, 
          viajesMes: prev.viajesMes + 1,
          gananciasAcumuladas: prev.gananciasAcumuladas + ganancia 
        }));
      }
    } catch (error) {}
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h3>TourMatch</h3>
        <p className={styles.welcome}>Bienvenido, <strong>{user?.nombre || "Conductor"}</strong> 🚐</p>
        <nav>
          <ul>
            <li className={activeTab === 'vehiculo' ? styles.active : ''} onClick={() => setActiveTab('vehiculo')}>Mi Vehículo</li>
            <li className={activeTab === 'viajes' ? styles.active : ''} onClick={() => setActiveTab('viajes')}>1. Viajes Disponibles</li>
            <li className={activeTab === 'activos' ? styles.active : ''} onClick={() => setActiveTab('activos')}>2. Viajes en Curso 📍</li>
          </ul>
        </nav>
      </aside>

      <main className={styles.content}>
        <h1>Panel de Conductor</h1>

        <div className={styles.statsGrid}>
          <StatsCard title="Viajes Finalizados" value={metricas.viajesMes.toString()} icon="🚐" color="#2563eb" />
          <StatsCard title="Ganancias Reales" value={`$${metricas.gananciasAcumuladas.toLocaleString('es-CL')}`} icon="💰" color="#10b981" />
          <StatsCard title="Calificación" value={metricas.calificacion.toFixed(1)} icon="⭐" color="#f59e0b" />
        </div>

        {activeTab === 'vehiculo' && (
          <div className={styles.grid}>
            {loadingVehiculo ? (
              <div className={styles.card}><p>Cargando información...</p></div>
            ) : vehiculoRegistrado ? (
              <div className={styles.card}>
                <h2>Vehículo Registrado</h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                  <p><strong>Marca:</strong> {vehiculoRegistrado.marca}</p>
                  <p><strong>Modelo:</strong> {vehiculoRegistrado.modelo}</p>
                  <p><strong>Patente:</strong> {vehiculoRegistrado.patente?.toUpperCase()}</p>
                  <p><strong>Capacidad:</strong> {vehiculoRegistrado.capacidad} pasajeros</p>
                </div>
              </div>
            ) : (
              <RegistrarVehiculo onRegistroExitoso={consultarVehiculo} />
            )}
          </div>
        )}

        {activeTab === 'viajes' && (
          <div className={styles.card}>
            <h2>Nuevas Solicitudes (Por Aceptar)</h2>
            <div className={styles.tripList}>
              {loadingViajes ? (
                <p>Buscando solicitudes...</p>
              ) : viajesDisponibles.length > 0 ? (
                viajesDisponibles.map(viaje => (
                  <div key={viaje.id} className={styles.tripItem} style={{ padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#1e293b', display: 'block', marginBottom: '6px' }}>🗺️ Puntos a recorrer:</strong>
                      <div style={{ paddingLeft: '8px', borderLeft: '3px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {viaje.waypoints?.sort((a, b) => a.orden - b.orden).map((wp, index) => (
                          <span key={wp.id || index} style={{ fontSize: '0.92rem', color: '#475569' }}>
                            {index === 0 ? "📍 Origen: " : index === viaje.waypoints.length - 1 ? "🏁 Destino: " : `🛑 Parada ${index}: `} 
                            <strong>{wp.direccion}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                        👤 Turista: <strong>{viaje.nombreTurista}</strong> <br/>👥 Pasajeros: <strong>{viaje.cantidadPasajeros}</strong>
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Ganancia (85%):</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#16a34a' }}>${viaje.gananciaConductor?.toLocaleString('es-CL') || '0'}</span>
                      </div>
                    </div>

                    {/* 🛑 ESCUDO VISUAL: Si ya tiene un viaje activo, ocultamos el botón de aceptar */}
                    {viajesActivos.length > 0 ? (
                      <div style={{ marginTop: '15px', padding: '14px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #fde68a' }}>
                        ⚠️ Finaliza tu viaje actual para aceptar otro.
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAceptarViaje(viaje.id)} 
                        style={{ marginTop: '15px', width: '100%', padding: '14px', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Aceptar Solicitud
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b' }}>No hay solicitudes pendientes.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activos' && (
          <div className={styles.card}>
            <h2>Tus Viajes en Curso 📍</h2>
            <p style={{color: '#64748b', marginBottom: '20px'}}>Sigue la ruta en el mapa. Al llegar al destino final, presiona el botón para cobrar el servicio.</p>
            
            <div className={styles.tripList}>
              {viajesActivos.length > 0 ? (
                viajesActivos.map(viaje => (
                  <div key={viaje.id} className={styles.tripItem} style={{ padding: '20px', marginBottom: '20px', border: '2px solid #3b82f6', borderRadius: '12px', backgroundColor: '#f0f9ff' }}>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#1e293b', display: 'block', marginBottom: '6px' }}>📋 Hoja de Ruta Activa:</strong>
                      <div style={{ paddingLeft: '8px', borderLeft: '3px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {viaje.waypoints?.sort((a, b) => a.orden - b.orden).map((wp, index) => (
                          <span key={wp.id || index} style={{ fontSize: '0.92rem', color: '#475569' }}>
                            {index === 0 ? "📍 Inicio: " : index === viaje.waypoints.length - 1 ? "🏁 Fin: " : `🛑 Parada ${index}: `} 
                            <strong>{wp.direccion}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* MAPA NAVEGADOR PARA EL CONDUCTOR */}
                    {viaje.waypoints && viaje.waypoints.length >= 2 && (
                      <div style={{ height: '300px', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #93c5fd' }}>
                        <MapaVisualizador 
                          origen={viaje.waypoints.sort((a, b) => a.orden - b.orden)[0].direccion} 
                          destino={viaje.waypoints.sort((a, b) => a.orden - b.orden)[viaje.waypoints.length - 1].direccion} 
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <span style={{ fontSize: '0.9rem', color: '#475569' }}>👤 Turista a Bordo: <strong>{viaje.nombreTurista}</strong></span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#16a34a' }}>Cobro a recibir: ${viaje.gananciaConductor?.toLocaleString('es-CL')}</span>
                    </div>

                    <button 
                      onClick={() => handleFinalizarViaje(viaje.id, viaje.gananciaConductor)} 
                      style={{ marginTop: '15px', width: '100%', padding: '14px', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      ✅ Llegamos al Destino (Finalizar Viaje)
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b' }}>No tienes ningún viaje en curso. Ve a "Viajes Disponibles" para aceptar uno.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardConductor;