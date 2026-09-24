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

      {/* 🔥 REGLAS CSS PARA ADAPTACIÓN MÓVIL INMEDIATA 🔥 */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Asegura que nada desborde horizontalmente la pantalla */
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
        }

        .internal-panel-root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background-color: #f8fafc;
          width: 100%;
          overflow-x: hidden;
        }

        .main-content-wrapper {
          flex: 1;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 24px;
          box-sizing: border-box;
        }

        /* AJUSTES PARA SMARTPHONES Y TABLETS */
        @media (max-width: 768px) {
          .main-content-wrapper {
            padding: 10px 12px !important;
          }

          /* Hace que las tablas no rompan el ancho y tengan scroll lateral limpio */
          table {
            display: block !important;
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }

          /* Cuadrículas que pasan a 1 sola columna en el celular */
          .grid, [class*="grid-cols-"] {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          /* Formularios y filtros apilados verticalmente */
          form, .filter-container, .search-bar {
            flex-direction: column !important;
            width: 100% !important;
          }

          /* Botones con tamaño táctil adecuado para dedos */
          button, input, select {
            min-height: 42px;
          }

          /* Reposiciona la calculadora flotante para que no tape botones principales */
          .calculator-mobile-safe {
            position: fixed;
            bottom: 12px;
            right: 12px;
            z-index: 40;
            transform: scale(0.88);
            transform-origin: bottom right;
          }
        }
      `}} />
    </div>
  );
}