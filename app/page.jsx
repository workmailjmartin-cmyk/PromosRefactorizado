'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // <-- Importamos el enrutador
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

// ACÁ SUMAMOS LA VISTA NUEVA PARA EL HEADER
import EnlatadosInternalPage from '@/app/internal/enlatados/page'; 

const TITULOS_VISTA = {
  users: '⚙️ Configuración',
  marketing: '📋 Calendario de Contenidos',
  agentes: '🌟 Calendario @viajafelizcon',
  enlatados: '✈️ Grupales y Enlatados',
};

export default function InternalPanel() {
  const router = useRouter(); // <-- Inicializamos el enrutador
  const { status, currentUser, userData, login, logout, loading: authLoading } = useStaffAuth();
  const ready = status === 'logged-in';
  const rol = userData?.rol;
  const esGestor = esRolGestor(rol);

  // REDIRECCIÓN AUTOMÁTICA DEL PROVEEDOR
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
  const [actionLoader, setActionLoader] = useState(null); // string (texto) | null

  const handleActionBusy = (textOrFalse) => setActionLoader(textOrFalse || null);

  const handleLogoClick = async () => {
    setCurrentView('search');
    setEditingPackage(null);
    await refetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // La vista completa del calendario de marketing se migra en una fase
  // siguiente; por ahora, ir "al día tal" solo navega a esa vista placeholder.
  const handleIrACalendarioMarketing = (diaObjetivo = null) => {
    setMarketingScrollDay(diaObjetivo);
    setCurrentView('marketing');
  };

  // "➕ Cargar" (nuevo) vs "✏️ Editar" (desde el modal) comparten el mismo
  // formulario — la diferencia es si hay o no un paquete precargado.
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

  // Si el usuario es proveedor, mostramos el Loader mientras el router lo patea a su zona
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
    <div id="app-container">
      <Header
        userData={userData}
        esGestor={esGestor}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogoClick={handleLogoClick}
        onLogout={logout}
      />

      <div className="container">
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

        {/* ACÁ ENGANCHAMOS LA NUEVA PESTAÑA DEL BACKOFFICE DE ENLATADOS */}
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
          <AgentesCalendarView userData={userData} currentUser={currentUser} franquicias={franquicias} etiquetasMarketing={etiquetasMarketing} onActionBusy={handleActionBusy} />
        )}

        {currentView !== 'search' && currentView !== 'enlatados' && currentView !== 'upload' && currentView !== 'users' && currentView !== 'marketing' && currentView !== 'agentes' && (
          <ComingSoonView titulo={TITULOS_VISTA[currentView] || 'Cargar paquete'} />
        )}
      </div>

      <Loader visible={loaderVisible} text={loaderText} />

      <FloatingCalculator dbCalculadora={dbCalculadora} />
    </div>
  );
}