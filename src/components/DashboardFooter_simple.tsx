import React from 'react';
import styles from './DashboardFooter.module.css';

const DashboardFooter: React.FC = () => (
  <footer className={styles.footer}>
    <div className={styles.footerContent}>
      <div className={styles.footerLinks}>
        <a href="/datenschutz" className={styles.footerLink}>
          Datenschutz
        </a>
        <a href="/impressum" className={styles.footerLink}>
          Impressum
        </a>
      </div>
    </div>
  </footer>
);

export default DashboardFooter;
