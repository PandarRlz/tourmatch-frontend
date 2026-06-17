import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './DashboardAdmin.module.css';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard/StatsCard'; // Asegúrate de tener este componente

const DashboardAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('conductores');
  const [conductores, setConductores] = useState([]);
  const [turistas, setTuristas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para controlar la ventana modal de edición
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [emailEditado, setEmailEditado] = useState('');
  
  // Estados para controlar los inputs de vehículos
  const [marcaEditada, setMarcaEditada] = useState('');
  const [modeloEditado, setModeloEditado] = useState('');
  const [patenteEditada, setPatenteEditada] = useState('');
  const [capacidadEditada, setCapacidadEditada] = useState(0);

  const cargarConductores = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/admin/conductores", {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConductores(data);
      }
    } catch (error) {
      console.error("Error cargando conductores:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const cargarTuristas = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/admin/turistas", {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTuristas(data);
      }
    } catch (error) {
      console.error("Error cargando turistas:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const cargarReservas = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/admin/reservas", {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReservas(data);
      }
    } catch (error) {
      console.error("Error cargando reservas:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    if (activeTab === 'conductores') cargarConductores();
    if (activeTab === 'turistas') cargarTuristas();
    if (activeTab === 'reservas') cargarReservas();
  }, [activeTab, cargarConductores, cargarTuristas, cargarReservas]);

  // 💰 LÓGICA DE NEGOCIO: Calculamos la comisión de la plataforma (15%)
  // Usamos useMemo para que no se recalcule innecesariamente si no cambian las reservas
// 💰 LÓGICA DE NEGOCIO: Calculamos la comisión SOLO de viajes terminados y cobrados
  const gananciasTourMatch = useMemo(() => {
    return reservas
      .filter(reserva => reserva.estado === 'FINALIZADA') // EL FILTRO CLAVE
      .reduce((acumulador, reserva) => {
        return acumulador + (reserva.precioTotal * 0.15);
      }, 0);
  }, [reservas]);

  const ejecutarEliminar = async (id, tipo) => {
    if (!window.confirm(`¿Estás completamente seguro de eliminar el registro #${id}?`)) return;
    const url = tipo === 'reserva' ? `https://tourmatchterminar-1.onrender.com/api/admin/reservas/${id}` : `https://tourmatchterminar-1.onrender.com/api/admin/usuarios/${id}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        alert("Eliminado exitosamente del sistema.");
        if (tipo === 'conductor') setConductores(prev => prev.filter(item => item.id !== id));
        if (tipo === 'turista') setTuristas(prev => prev.filter(item => item.id !== id));
        if (tipo === 'reserva') setReservas(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      alert("Error en la conexión con el servidor backend.");
    }
  };

  const abrirModalEdicion = (usuario, tipoTab) => {
    setUsuarioAEditar({ ...usuario, tipoTab });
    setNombreEditado(usuario.nombre || '');
    setEmailEditado(usuario.email || '');
    
    if (tipoTab === 'conductores') {
      setMarcaEditada(usuario.marca || '');
      setModeloEditado(usuario.modelo || '');
      setPatenteEditada(usuario.patente || '');
      setCapacidadEditada(usuario.capacidadNum || 0); 
    }
  };

  const ejecutarGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!usuarioAEditar) return;

    const cuerpoPeticion = {
      nombre: nombreEditado,
      email: emailEditado
    };

    if (usuarioAEditar.tipoTab === 'conductores') {
      cuerpoPeticion.marca = marcaEditada;
      cuerpoPeticion.modelo = modeloEditado;
      cuerpoPeticion.patente = patenteEditada;
      cuerpoPeticion.capacidad = parseInt(capacidadEditada, 10);
    }

    try {
      const response = await fetch(`https://tourmatchterminar-1.onrender.com/api/admin/usuarios/${usuarioAEditar.id}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cuerpoPeticion)
      });

      if (response.ok) {
        alert("Información guardada de forma exitosa.");
        
        if (usuarioAEditar.tipoTab === 'conductores') {
          setConductores(prev => prev.map(c => c.id === usuarioAEditar.id ? { 
            ...c, 
            nombre: nombreEditado, 
            email: emailEditado,
            marca: marcaEditada,
            modelo: modeloEditado,
            patente: patenteEditada,
            capacidadNum: parseInt(capacidadEditada, 10),
            capacidad: capacidadEditada + " pasajeros",
            vehiculo: `${marcaEditada} ${modeloEditado}`
          } : c));
        } else if (usuarioAEditar.tipoTab === 'turistas') {
          setTuristas(prev => prev.map(t => t.id === usuarioAEditar.id ? { ...t, name: nombreEditado, email: emailEditado } : t));
        }
        
        setUsuarioAEditar(null);
      } else {
        alert("El servidor no pudo procesar la actualización.");
      }
    } catch (error) {
      console.error("Error en PUT:", error);
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h3>TourMatch Admin</h3>
        <p className={styles.welcome}>Panel de Control 🔐</p>
        <nav>
          <ul>
            <li className={activeTab === 'conductores' ? styles.active : ''} onClick={() => setActiveTab('conductores')}>Conductores</li>
            <li className={activeTab === 'turistas' ? styles.active : ''} onClick={() => setActiveTab('turistas')}>Turistas Registrados</li>
            <li className={activeTab === 'reservas' ? styles.active : ''} onClick={() => setActiveTab('reservas')}>Historial de Viajes</li>
          </ul>
        </nav>
      </aside>

      <main className={styles.content}>
        <h1>Vista Administrativa Global</h1>

        {loading ? (
          <p>Cargando datos desde Neon.tech...</p>
        ) : (
          <>
            {activeTab === 'conductores' && (
              <div className={styles.card}>
                <h2>Lista de Conductores Registrados</h2>
                <div className={styles.tableContainer}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Vehículo Asignado</th>
                        <th>Patente</th>
                        <th>Capacidad</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conductores.map(c => (
                        <tr key={c.id}>
                          <td>#{c.id}</td>
                          <td><strong>{c.nombre}</strong></td>
                          <td>{c.email}</td>
                          <td>{c.vehiculo}</td>
                          <td><strong style={{ color: '#2b6cb0' }}>{c.patente}</strong></td>
                          <td>{c.capacidad}</td>
                          <td>
                            <button onClick={() => abrirModalEdicion(c, 'conductores')} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => ejecutarEliminar(c.id, 'conductor')} style={{ padding: '4px 8px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'turistas' && (
              <div className={styles.card}>
                <h2>Clientes / Turistas en la Plataforma</h2>
                <div className={styles.tableContainer}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>ID Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Correo Electrónico</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turistas.map(t => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td><strong>{t.nombre}</strong></td>
                          <td>{t.email}</td>
                          <td>
                            <button onClick={() => abrirModalEdicion(t, 'turistas')} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => ejecutarEliminar(t.id, 'turista')} style={{ padding: '4px 8px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reservas' && (
              <>
                {/* 🌟 AQUÍ ESTÁ LA MAGIA: EL DASHBOARD DE GANANCIAS */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <StatsCard 
                    title="Viajes Procesados" 
                    value={reservas.length.toString()} 
                    icon="🚙" 
                    color="#3182ce" 
                  />
                  <StatsCard 
                    title="Comisión TourMatch (15%)" 
                    value={`$${Math.round(gananciasTourMatch).toLocaleString('es-CL')}`} 
                    icon="💰" 
                    color="#48bb78" 
                  />
                </div>

                <div className={styles.card}>
                  <h2>Historial y Control de Viajes</h2>
                  <div className={styles.tableContainer}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>ID Viaje</th>
                          <th>Turista</th>
                          <th>Pasajeros</th>
                          <th>Ruta</th>
                          <th>Monto Total</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.map(r => (
                          <tr key={r.id}>
                            <td>#{r.id}</td>
                            <td>{r.turistaNombre}</td>
                            <td>{r.cantidadPasajeros}</td>
                            <td>{r.ruta}</td>
                            <td><strong>${r.precioTotal?.toLocaleString('es-CL')}</strong></td>
                            <td>
                              <button onClick={() => ejecutarEliminar(r.id, 'reserva')} style={{ padding: '4px 8px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Cancelar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* VENTANA MODAL FLOTANTE CORRECTAMENTE VINCULADA */}
      {usuarioAEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '380px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Editar Registro #{usuarioAEditar.id}</h3>
            <form onSubmit={ejecutarGuardarEdicion}>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Nombre:</label>
                <input type="text" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Email:</label>
                <input type="email" value={emailEditado} onChange={(e) => setEmailEditado(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              {/* CAMPOS VEHICULARES YA CARGAN AUTOMÁTICAMENTE */}
              {usuarioAEditar.tipoTab === 'conductores' && (
                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '12px', marginTop: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#2b6cb0' }}>Información del Vehículo</h4>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Marca:</label>
                      <input type="text" value={marcaEditada} onChange={(e) => setMarcaEditada(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Modelo:</label>
                      <input type="text" value={modeloEditado} onChange={(e) => setModeloEditado(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Patente:</label>
                      <input type="text" value={patenteEditada} onChange={(e) => setPatenteEditada(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', textTransform: 'uppercase' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Capacidad:</label>
                      <input type="number" value={capacidadEditada} onChange={(e) => setCapacidadEditada(e.target.value)} required min="1" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'end', marginTop: '20px' }}>
                <button type="button" onClick={() => setUsuarioAEditar(null)} style={{ marginRight: '8px', padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#48bb78', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;