import styles from './Nosotros.module.css';

const Nosotros = () => {
  return (
    <div className={styles.container}>
      {/* 1. SECCIÓN HERO DE BIENVENIDA */}
      <header className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <h1>Sobre TourMatch</h1>
          <p className={styles.subtitle}>
            Redefiniendo el transporte privado a través de la tecnología, la exclusividad y la máxima seguridad.
          </p>
        </div>
      </header>

      {/* 2. NUESTRA MISIÓN & HISTORIA */}
      <section className={styles.mainContent}>
        <div className={styles.gridTwoColumns}>
          <div className={styles.textBlock}>
            <span className={styles.tagline}>QUIÉNES SOMOS</span>
            <h2>Seguridad y Confianza en cada kilómetro</h2>
            <p>
              En <strong>TourMatch</strong>, no solo te llevamos a tu destino; nos aseguramos de 
              brindar una experiencia de traslado premium de inicio a fin. Nacimos con el objetivo de 
              conectar a pasajeros exigentes con conductores profesionales mediante una plataforma 
              intuitiva, transparente y rigurosa.
            </p>
            <p>
              Nuestros conductores cuentan con años de trayectoria comprobable y pasan por filtros de 
              selección y antecedentes estrictos para garantizar tu absoluta tranquilidad.
            </p>
          </div>
          
          <div className={styles.statsBlock}>
            <div className={styles.statCard}>
              <h3>100%</h3>
              <p>Conductores Profesionales</p>
            </div>
            <div className={styles.statCard}>
              <h3>24/7</h3>
              <p>Soporte y Monitoreo</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TARJETAS DE VALORES PRINCIPALES */}
      <section className={styles.valuesSection}>
        <h3 className={styles.sectionTitle}>¿Por qué elegir TourMatch?</h3>
        
        <div className={styles.cardsGrid}>
          <div className={styles.valueCard}>
            <div className={styles.iconWrapper}>🛡️</div>
            <h4>Conductores Verificados</h4>
            <p>Filtros de seguridad estrictos, licencias profesionales y capacitaciones en servicio al cliente premium.</p>
          </div>

          <div className={styles.valueCard}>
            <div className={styles.iconWrapper}>✨</div>
            <h4>Vehículos de Alto Estándar</h4>
            <p>Flota moderna, sanitizada y categorizada según tus necesidades de espacio, equipaje y confort.</p>
          </div>

          <div className={styles.valueCard}>
            <div className={styles.iconWrapper}>📍</div>
            <h4>Monitoreo en Tiempo Real</h4>
            <p>Tus viajes están respaldados por nuestro centro de control integrado con seguimiento GPS continuo.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Nosotros;