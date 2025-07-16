import React from 'react';
import logoSvg from '../assets/Logo.svg';
import styles from './Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <img src={logoSvg} alt="Videoflix Logo" />
      <div className={styles.headerContent}>
        <h1>Videoflix Dashboard</h1>
      </div>
    </header>
  );
};

export default Header;
