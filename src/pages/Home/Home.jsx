import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Home.module.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      {/* 1. SECCIÓN HERO DE BIENVENIDA */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Tu traslado privado y seguro en Santiago</h1>
          <p>
            Conectamos a pasajeros exigentes con conductores profesionales. 
            Viaja cómodo, viaja confiado, viaja con TourMatch.
          </p>
          
          <div className={styles.heroButtons}>
            {/* 🎯 CORREGIDO: Redirige directamente al catálogo unificado de Panoramas */}
            <Link to="/panoramas" className={styles.primaryBtn}>
              Ver Panoramas y Rutas 🚗
            </Link>
            {!user && (
              <Link to="/registro" className={styles.secondaryBtn}>
                Regístrate Ahora
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN DE BENEFICIOS CLAVE */}
      <section className={styles.features}>
        <h2>¿Cómo funciona TourMatch?</h2>
        <p className={styles.sectionSubtitle}>La forma más inteligente de moverte por la capital</p>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🗺️</div>
            <h3>Rutas Planificadas</h3>
            <p>Elige entre nuestros panoramas prehechos diseñados por expertos para optimizar tu tiempo en la ciudad.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🛡️</div>
            <h3>Máxima Seguridad</h3>
            <p>Todos nuestros conductores pasan por rigurosos filtros de antecedentes y conducen vehículos de alto estándar.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⏱️</div>
            <h3>Sin Preocupaciones</h3>
            <p>Olvídate del tráfico, del mapa o de buscar estacionamiento. Tu chofer privado se encarga de todo.</p>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN SEPARADA PARA CONDUCTORES (POSTULACIÓN) */}
      <section className={styles.driverCta}>
        <div className={styles.driverCtaContent}>
          <h2>¿Eres conductor profesional?</h2>
          <p>Aumenta tus ingresos estables realizando traslados ejecutivos y circuitos turísticos exclusivos en Santiago.</p>
          <Link to="/registro" className={styles.driverBtn}>
            Postular como Conductor ➔
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;