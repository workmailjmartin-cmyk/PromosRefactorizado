'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginScreen from '@/components/internal/LoginScreen';
import Header from '@/components/internal/Header';
import SearchView from '@/components/internal/SearchView';
import UploadView from '@/components/internal/upload/UploadView';
import SettingsView from '@/components/internal/settings/SettingsView';
import MarketingCalendarView from '@/components/internal/marketing/MarketingCalendarView';
import AgentesCalendarView from '@/components/internal/agentes/AgentesCalendarView';
import ComingSoonView from '@/components/internal/ComingSoonView';
import FloatingCalculator from '@/components/internal/FloatingCalculator';
import Loader from '@/components/shared/Loader';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useInternalPackages } from '@/hooks/useInternalPackages';
import { useCalculadoraData } from '@/hooks/useCalculadoraData';
import { esRolGestor } from '@/lib/internal/constants';

import EnlatadosInternalPage from '@/app/internal/enlatados/page'; 

const TITULOS_VISTA = {
  users: '⚙️ Configuración',
  marketing: '📋 Calendario de Contenidos',
  agentes: '🌟 Calendario @viajafelizcon',
  enlatados: '✈️ Grupales y Enlatados',
};

export default function InternalPanel() {
  const router = useRouter();
  const { status, currentUser, userData, login, logout, loading: authLoading } = useStaffAuth();
  const ready = status === 'logged-in';
  const rol = userData?.rol;
  const esGestor = esRolGestor(rol);

  useEffect(() => {
    if (ready && rol === 'proveedor') {
      router.push('/proveedor');
    }
  }, [ready, rol, router]);

  const {
    franquiciasFiltro,
    franquicias,
    tiposPromocion,
    tiposPromocionVisibles,
    promosSecretas,
    etiquetasMarketing,
    textoListon,
    vidriera,
    bancoImagenes,
    loaded: configLoaded,
    refetch: refetchConfig,
  } = useAppConfig(ready, rol);
  
  const { uniquePackages, loading: packagesLoading, refetch } = useInternalPackages(ready, rol);
  const { dbCalculadora } = useCalculadoraData(ready);

  const [currentView, setCurrentView] = useState('search');
  const [editingPackage, setEditingPackage] = useState(null);
  const [marketingScrollDay, setMarketingScrollDay] = useState(null);
  const [actionLoader, setActionLoader] = useState(null);

  const handleActionBusy = (textOrFalse) => setActionLoader(textOrFalse || null);

  const handleLogoClick = async () => {
    setCurrentView('search');
    setEditingPackage(null);
    await refetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIrACalendarioMarketing = (diaObjetivo = null) => {
    setMarketingScrollDay(diaObjetivo);
    setCurrentView('marketing');
  };

  const handleAbrirCarga = () => {
    setEditingPackage(null);
    setCurrentView('upload');
  };
  const handleStartEditing = (pkg) => {
    setEditingPackage(pkg);
    setCurrentView('upload');
  };
  const handleVolverABuscar = () => {
    setEditingPackage(null);
    setCurrentView('search');
  };

  if (ready && rol === 'proveedor') {
    return <Loader visible text="Redirigiendo al portal de proveedor..." />;
  }

  if (status === 'loading') {
    return <Loader visible text="Iniciando..." />;
  }

  if (status === 'logged-out') {
    return (
      <>
        <LoginScreen onLogin={login} />
        <Loader visible={authLoading} text="Iniciando..." />
      </>
    );
  }

  const loaderVisible = authLoading || packagesLoading || !!actionLoader || !configLoaded;
  const loaderText = actionLoader || (packagesLoading ? 'Cargando paquetes...' : 'Iniciando...');

  return (
    <div id="app-container" className="internal-panel-root">
      <Header
        userData={userData}
        esGestor={esGestor}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogoClick={handleLogoClick}
        onLogout={logout}
      />

      <main className="container main-content-wrapper">
        {currentView === 'search' && (
          <SearchView
            uniquePackages={uniquePackages}
            loading={packagesLoading}
            refetch={refetch}
            currentUser={currentUser}
            userData={userData}
            esGestor={esGestor}
            franquiciasFiltro={franquiciasFiltro}
            tiposPromocionVisibles={tiposPromocionVisibles}
            promosSecretas={promosSecretas}
            onIrACalendarioMarketing={handleIrACalendarioMarketing}
            onAbrirCarga={handleAbrirCarga}
            onStartEditing={handleStartEditing}
            onActionBusy={handleActionBusy}
          />
        )}

        {currentView === 'enlatados' && (
          <EnlatadosInternalPage />
        )}

        {currentView === 'upload' && (
          <UploadView
            editingPackage={editingPackage}
            currentUser={currentUser}
            userData={userData}
            tiposPromocionVisibles={tiposPromocionVisibles}
            refetch={refetch}
            onVolverABuscar={handleVolverABuscar}
            onDone={handleVolverABuscar}
            onActionBusy={handleActionBusy}
          />
        )}

        {currentView === 'users' && (
          <SettingsView
            userData={userData}
            franquicias={franquicias}
            etiquetasMarketing={etiquetasMarketing}
            tiposPromocion={tiposPromocion}
            textoListon={textoListon}
            vidriera={vidriera}
            bancoImagenes={bancoImagenes}
            uniquePackages={uniquePackages}
            refetchConfig={refetchConfig}
            onActionBusy={handleActionBusy}
          />
        )}

        {currentView === 'marketing' && (
          <MarketingCalendarView
            userData={userData}
            currentUser={currentUser}
            franquicias={franquicias}
            etiquetasMarketing={etiquetasMarketing}
            onActionBusy={handleActionBusy}
            scrollToDay={marketingScrollDay}
            forcePropios={!!marketingScrollDay}
          />
        )}

        {currentView === 'agentes' && (
          <AgentesCalendarView 
            userData={userData} 
            currentUser={currentUser} 
            franquicias={franquicias} 
            etiquetasMarketing={etiquetasMarketing} 
            onActionBusy={handleActionBusy} 
          />
        )}

        {currentView !== 'search' && currentView !== 'enlatados' && currentView !== 'upload' && currentView !== 'users' && currentView !== 'marketing' && currentView !== 'agentes' && (
          <ComingSoonView titulo={TITULOS_VISTA[currentView] || 'Cargar paquete'} />
        )}
      </main>

      <Loader visible={loaderVisible} text={loaderText} />

      <div className="calculator-mobile-safe">
        <FloatingCalculator dbCalculadora={dbCalculadora} />
      </div>

      {/* 🔥 CSS DE RESCATE RESPONSIVE PARA MÓVILES 🔥 */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Candado general: Prohíbe terminantemente el desplazamiento horizontal */
        html, body {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
          position: relative;
          margin: 0;
          padding: 0;
        }

        .internal-panel-root {
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          min-height: 100dvh;
        }

        .main-content-wrapper {
          width: 100% !important;
          max-width: 100% !important;
          padding: 12px 14px !important;
          box-sizing: border-box !important;
        }

        /* REGLAS ESPECÍFICAS PARA CELULARES */
        @media (max-width: 768px) {
          
          /* 1. Header: Permite que los botones del menú no desborden y scrolleen suave */
          header nav, header .menu-container, [class*="nav"] {
            overflow-x: auto !important;
            white-space: nowrap !important;
            max-width: 100% !important;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }

          /* 2. Carrusel de la Semana (Lunes, Martes...):
             Le da scroll propio a los días para que NO estiren la pantalla */
          [class*="semana"], [class*="tareas"], [class*="dias"], .grid-cols-7 {
            display: flex !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            gap: 10px !important;
            width: 100% !important;
            max-width: 100% !important;
            -webkit-overflow-scrolling: touch;
            padding: 8px 4px 14px 4px !important;
          }

          /* Cada tarjeta de día mide un tamaño fijo cómodo en el celu */
          [class*="semana"] > div, [class*="dias"] > div {
            min-width: 140px !important;
            flex-shrink: 0 !important;
          }

          /* 3. Filtros (Destino, Salida, etc.): Se apilan verticalmente */
          .filter-bar, [class*="filter"], [class*="search-bar"] {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 8px !important;
          }

          .filter-bar > div, [class*="filter"] > div, select, input {
            width: 100% !important;
            min-width: 0 !important;
          }

          /* 4. Tarjetas de paquetes (Cartagena, Buzios...): 
             Ocupan el 100% del ancho del celular, mostrando el precio sin cortes */
          .package-card, [class*="card"], [class*="paquete"] {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }

          /* 5. Acomodar los dos botones flotantes para que no se pisen */
          /* Calculadora abajo a la derecha */
          .calculator-mobile-safe {
            position: fixed !important;
            bottom: 16px !important;
            right: 16px !important;
            z-index: 50 !important;
            transform: scale(0.9) !important;
            transform-origin: bottom right;
          }

          /* Botón del Robot de IA justo arriba de la calculadora */
          [class*="bot"], [class*="robot"], [class*="floating-ai"] {
            position: fixed !important;
            bottom: 76px !important; /* 60px más arriba */
            right: 16px !important;
            z-index: 50 !important;
            transform: scale(0.9) !important;
            transform-origin: bottom right;
          }
        }
      `}} />
    </div>
  );
}