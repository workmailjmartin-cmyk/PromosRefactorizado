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

      {/* 🔥 ESTILOS MAESTROS: PC CENTRADA Y MOBILE ADAPTADO 🔥 */}
      <style dangerouslySetInnerHTML={{__html: `
        /* ================= ESTILOS COMPUTADORA (DESKTOP) ================= */
        .internal-panel-root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background-color: #f8fafc;
          width: 100%;
        }

        /* 👈 ESTO CENTRA TODO EN COMPUTADORA Y EVITA QUE SE ESTIRE */
        .main-content-wrapper {
          width: 100%;
          max-width: 1280px; 
          margin: 0 auto;
          padding: 24px 20px;
          box-sizing: border-box;
        }

        /* ================= ESTILOS EXCLUSIVOS PARA CELULAR ================= */
        @media (max-width: 768px) {
          html, body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }

          .main-content-wrapper {
            padding: 10px 12px !important;
            max-width: 100% !important;
          }

          /* 1. FILTROS EN CELULAR: Se apilan en 2 columnas o 100% para que NO desborden */
          .filter-bar, [class*="filter"], [class*="filtros"], [class*="search-bar"] {
            display: flex !important;
            flex-wrap: wrap !important;
            width: 100% !important;
            gap: 8px !important;
          }

          .filter-bar > div, [class*="filter"] > div, [class*="filtros"] > div {
            flex: 1 1 calc(50% - 6px) !important; /* 2 filtros por fila */
            min-width: 140px !important;
          }

          /* 2. TARJETAS DE PAQUETES: Ancho completo sin cortes */
          .package-card, [class*="package-card"], [class*="card"] {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* 3. 🔥 MODAL DE PAQUETE (ISLA BARÚ / SANTA MARTA): 
             OBLIGA A QUE "ITINERARIO" QUEDE ARRIBA Y "RESUMEN" QUEDE ABAJO */
          [class*="modal"] [class*="content"] > div,
          [class*="modal"] [class*="grid"],
          [class*="modal"] [class*="body"] {
            display: flex !important;
            flex-direction: column !important; /* Columna vertical */
            width: 100% !important;
          }

          /* Itinerario (Lo que incluye) arriba ocupando el 100% */
          [class*="itinerario"], [class*="left"] {
            width: 100% !important;
            max-width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding-bottom: 15px !important;
          }

          /* Resumen y Costos abajo ocupando el 100% */
          [class*="resumen"], [class*="costos"], [class*="right"] {
            width: 100% !important;
            max-width: 100% !important;
            padding-top: 15px !important;
          }

          /* 4. BOTONES FLOTANTES: Separados para que no se pisen */
          .calculator-mobile-safe {
            position: fixed !important;
            bottom: 16px !important;
            right: 16px !important;
            z-index: 40 !important;
            transform: scale(0.9) !important;
          }

          [class*="bot"], [class*="floating-ai"] {
            position: fixed !important;
            bottom: 74px !important; /* Arriba de la calculadora */
            right: 16px !important;
            z-index: 40 !important;
            transform: scale(0.9) !important;
          }
        }
      `}} />
    </div>
  );
}