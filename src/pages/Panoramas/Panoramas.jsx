import { useState } from 'react';
import styles from './Panoramas.module.css';
import Card from '../../components/Card/Card';
import { useAuth } from '../../context/AuthContext';

const Panoramas = () => {
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [tourDetalle, setTourDetalle] = useState(null); // Controla el modal flotante de paradas

  // Rutas turísticas optimizadas listas para enviar a Neon.tech
  const rutasPrehechas = [
    {
      id: 1,
      title: "Cajón del Maipo: Naturaleza e Inmensidad",
      price: "65000",
      duration: "Full Day (9 hrs)",
      image: "https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?q=80&w=800&auto=format&fit=crop",
      description: "San José de Maipo • Mirador de la Cordillera • Embalse El Yeso",
      waypoints: [
        { direccion: "San José de Maipo", orden: 1 },
        { direccion: "Mirador de la Cordillera", orden: 2 },
        { direccion: "Embalse El Yeso", orden: 3 }
      ]
    },
    {
      id: 2,
      title: "Valparaíso y Viña del Mar: Costa y Color",
      price: "75000",
      duration: "Full Day (10 hrs)",
      image: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?q=80&w=800&auto=format&fit=crop",
      description: "Reloj de Flores • Paseo Atkinson • Puerto de Valparaíso",
      waypoints: [
        { direccion: "Reloj de Flores, Viña del Mar", orden: 1 },
        { direccion: "Paseo Atkinson, Valparaíso", orden: 2 },
        { direccion: "Puerto de Valparaíso", orden: 3 }
      ]
    },
    {
      id: 3,
      title: "Santiago Moderno: Vistas y Altura",
      price: "45000",
      duration: "Full Day (8 hrs)",
      image: "https://images.unsplash.com/photo-1590055531920-0081e749e7bd?auto=format&fit=crop&q=80&w=800",
      description: "Parque Bicentenario • Sky Costanera • Barrio El Golf",
      waypoints: [
        { direccion: "Parque Bicentenario, Vitacura", orden: 1 },
        { direccion: "Sky Costanera, Providencia", orden: 2 },
        { direccion: "Barrio El Golf, Las Condes", orden: 3 }
      ]
    },
    {
      id: 4,
      title: "Valle de Casablanca: Ruta del Vino Blanco",
      price: "60000",
      duration: "Full Day (7 hrs)",
      image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=800&auto=format&fit=crop",
      description: "Degustación de Cepas • Recorrido Viñedos • Almuerzo Gourmet",
      waypoints: [
        { direccion: "Viña Emiliana, Casablanca", orden: 1 },
        { direccion: "Viña Casas del Bosque", orden: 2 },
        { direccion: "Restaurante Valle de Casablanca", orden: 3 }
      ]
    },
    {
      id: 5,
      title: "Aventura en la Cordillera: Farellones",
      price: "80000",
      duration: "Full Day (8 hrs)",
      image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=800&auto=format&fit=crop",
      description: "Camino a la Montaña • Pueblo de Farellones • Miradores",
      waypoints: [
        { direccion: "Curva 1, Camino a Farellones", orden: 1 },
        { direccion: "Pueblo de Farellones", orden: 2 },
        { direccion: "Mirador Los Cóndores", orden: 3 }
      ]
    },
    {
      id: 6,
      title: "Santiago Patrimonial e Histórico",
      price: "35000",
      duration: "Media Jornada (5 hrs)",
      image: "https://images.unsplash.com/photo-1578922756046-7a72680f729b?q=80&w=800&auto=format&fit=crop",
      description: "Palacio de La Moneda • Plaza de Armas • Cerro San Cristóbal",
      waypoints: [
        { direccion: "Palacio de La Moneda", orden: 1 },
        { direccion: "Plaza de Armas, Santiago", orden: 2 },
        { direccion: "Cumbre Cerro San Cristóbal", orden: 3 }
      ]
    }
  ];

  const handleReservarTour = async (ruta) => {
    if (!user || !user.token) {
      setMensaje({ texto: "⚠️ Debes iniciar sesión como Turista para reservar un panorama.", tipo: "error" });
      return;
    }

    // 1. Preguntamos la cantidad de pasajeros de forma interactiva
    const inputPasajeros = prompt("¿Para cuántos pasajeros deseas reservar este tour? (Máximo 12 personas):", "1");
    
    // Si el usuario cancela el prompt o no escribe nada, detenemos la operación de forma segura
    if (inputPasajeros === null) return;

    const cantidad = parseInt(inputPasajeros);

    // Validamos el límite de 12 pasajeros que establecimos como regla
    if (isNaN(cantidad) || cantidad < 1 || cantidad > 12) {
      alert("⚠️ Cantidad inválida. Debes ingresar un número entre 1 y 12 pasajeros.");
      return;
    }

    // 2. Calculamos el precio base y aplicamos la regla de negocio
    let precioFinal = parseFloat(ruta.price);
    let mensajeRecargo = "";

    // REGLA DE NEGOCIO: Si son más de 4 personas, se suman $10.000 por concepto de vehículo XL
    if (cantidad > 4) {
      precioFinal += 10000;
      mensajeRecargo = " (Incluye recargo de $10.000 por categoría XL)";
    }

    const fechaManana = new Date();
    fechaManana.setDate(fechaManana.getDate() + 1);
    fechaManana.setHours(12, 0, 0, 0);

    // 🛡️ CORRECCIÓN: Inyectamos latitud y longitud fijas a cada waypoint para satisfacer a PostgreSQL
    const waypointsFormateados = ruta.waypoints.map(wp => ({
      direccion: wp.direccion,
      orden: wp.orden,
      latitud: -33.4489,  // Coordenada de seguridad
      longitud: -70.6693  // Coordenada de seguridad
    }));

    const reservaData = {
      fechaViaje: fechaManana.toISOString(),
      precioTotal: precioFinal, // Precio con recargo incluido si corresponde
      cantidadPasajeros: cantidad,
      estado: "PENDIENTE",
      waypoints: waypointsFormateados // Usamos los waypoints formateados con lat/lng
    };

    try {
      setLoadingId(ruta.id);
      setMensaje({ texto: '', tipo: '' });

      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/reservas/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(reservaData)
      });

      if (response.ok) {
        setMensaje({ 
          texto: `🎉 ¡Tour "${ruta.title}" solicitado correctamente para ${cantidad} pasajeros! Total: $${precioFinal.toLocaleString('es-CL')}${mensajeRecargo}. Ya está disponible para los conductores.`, 
          tipo: "success" 
        });
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Error al procesar la reserva.");
      }
    } catch (error) {
      console.error(error);
      setMensaje({ texto: `❌ Hubo un fallo: ${error.message}`, tipo: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.headerSection}>
        <div className={styles.heroOverlay}>
          <h1>Panoramas Exclusivos</h1>
          <p className={styles.subtitle}>
            Rutas turísticas prediseñadas por expertos locales con chofer privado.
          </p>
        </div>
      </header>

      {/* ALERTAS */}
      {mensaje.texto && (
        <div style={{
          padding: '15px', margin: '20px auto', maxWidth: '1200px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold',
          backgroundColor: mensaje.tipo === 'success' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${mensaje.tipo === 'success' ? '#bbf7d0' : '#fca5a5'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* VENTANA FLOTANTE DE DETALLES (ACTIVADA POR EL BOTÓN INTERNO DE LA CARD) */}
      {tourDetalle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(3px)'
        }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '10px', color: '#0f172a' }}>{tourDetalle.title}</h2>
            <p style={{ color: '#64748b', marginBottom: '15px' }}><strong>⏱ Duración Estimada:</strong> {tourDetalle.duration}</p>
            <h4 style={{ marginBottom: '8px', color: '#1e293b' }}>📍 Hoja de ruta (Paradas):</h4>
            <ol style={{ paddingLeft: '25px', marginBottom: '25px', lineHeight: '1.8', color: '#334155' }}>
              {/* Optional Chaining para evitar errores si no hay waypoints */}
              {tourDetalle.waypoints?.map((wp) => (
                <li key={wp.orden}><strong>{wp.direccion}</strong></li>
              ))}
            </ol>
            <button 
              onClick={() => setTourDetalle(null)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              Cerrar Detalles
            </button>
          </div>
        </div>
      )}

      {/* GRIDS DE SELECCIÓN */}
      <main className={styles.mainContent}>
        <div className={styles.grid}>
          {rutasPrehechas.map((ruta) => (
            <div key={ruta.id} className={styles.panoramaItem}>
              
              <div className={styles.cardWrapper}>
                
                {/* 🌟 SINCRONIZADO: Pasamos los campos requeridos por Card.jsx, formateando el precio sin el "$" duplicado y vinculando el evento real */}
                <Card 
                  title={ruta.title}
                  image={ruta.image}
                  duration={ruta.duration}
                  price={parseFloat(ruta.price).toLocaleString('es-CL')} 
                  onDetailClick={() => setTourDetalle(ruta)} // ◄--- El botón interno de la Card ahora ejecutará esto
                />

                {/* BOTÓN INFERIOR DE RESERVA DIRECTA */}
                <div className={styles.actionContainer} style={{ padding: '0 15px 15px 15px' }}>
                  <button 
                    className={styles.bookBtn}
                    onClick={() => handleReservarTour(ruta)}
                    disabled={loadingId !== null}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      opacity: loadingId !== null ? 0.6 : 1,
                      cursor: loadingId !== null ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loadingId === ruta.id ? "Procesando..." : "Reservar Tour Completo ➔"}
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Panoramas;