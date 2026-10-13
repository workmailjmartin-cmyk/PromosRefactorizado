'use client';

import { useState } from 'react';
import UsersTab from './UsersTab';
import MarketingTab from './MarketingTab';
import CalculadoraTab from './CalculadoraTab';
import GrupalesTab from './GrupalesTab';
import ConfigChatwoot from '@/components/internal/settings/ConfigChatwoot';
import { esRolGestor } from '@/lib/internal/constants';

const TAB_ACTIVO = { background: '#11173d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const TAB_INACTIVO = { background: '#f3f4f6', color: '#6b7280', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' };

export default function SettingsView({ userData, franquicias, etiquetasMarketing, tiposPromocion, textoListon, vidriera, bancoImagenes, uniquePackages, refetchConfig, onActionBusy }) {
  const rol = userData?.rol;
  
  // UNIFICAMOS EL ESTADO: Controlamos todas las pestañas desde acá
  const [tab, setTab] = useState(rol === 'editor' ? 'marketing' : 'usuarios');

  // Definimos qué pestañas puede ver cada rol
  const tabsVisibles = {
    usuarios: rol === 'admin', 
    marketing: true,
    calculadora: rol === 'admin',
    grupales: rol === 'admin', 
    chatwoot: rol === 'admin', // <-- Sumamos Chatwoot al control de visibilidad
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      
      {/* --- BOTONERA --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#11173d', margin: 0 }}>Panel de Configuración</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          
          {tabsVisibles.usuarios && (
            <button style={tab === 'usuarios' ? TAB_ACTIVO : TAB_INACTIVO} onClick={() => setTab('usuarios')}>
              👥 Usuarios
            </button>
          )}
          
          {tabsVisibles.marketing && (
            <button style={tab === 'marketing' ? TAB_ACTIVO : TAB_INACTIVO} onClick={() => setTab('marketing')}>
              🏷️ Marketing
            </button>
          )}
          
          {tabsVisibles.calculadora && (
            <button style={tab === 'calculadora' ? TAB_ACTIVO : TAB_INACTIVO} onClick={() => setTab('calculadora')}>
              🧮 Calculadora
            </button>
          )}
          
          {tabsVisibles.grupales && (
            <button style={tab === 'grupales' ? TAB_ACTIVO : TAB_INACTIVO} onClick={() => setTab('grupales')}>
              ✈️ Grupales
            </button>
          )}

          {/* BOTÓN CHATWOOT UNIFICADO */}
          {tabsVisibles.chatwoot && (
            <button style={tab === 'chatwoot' ? TAB_ACTIVO : TAB_INACTIVO} onClick={() => setTab('chatwoot')}>
              📩 Chatwoot
            </button>
          )}

        </div>
      </div>

      {/* --- RENDERIZADO DE PESTAÑAS --- */}
      {tab === 'usuarios' && esRolGestor(rol) && (
        <UsersTab rol={rol} franquicias={franquicias} refetchConfig={refetchConfig} onActionBusy={onActionBusy} />
      )}
      
      {tab === 'marketing' && (
        <MarketingTab
          etiquetasMarketing={etiquetasMarketing}
          tiposPromocion={tiposPromocion}
          textoListon={textoListon}
          vidriera={vidriera}
          bancoImagenes={bancoImagenes}
          uniquePackages={uniquePackages}
          refetchConfig={refetchConfig}
          onActionBusy={onActionBusy}
        />
      )}
      
      {tab === 'calculadora' && tabsVisibles.calculadora && <CalculadoraTab ready />}
      
      {tab === 'grupales' && tabsVisibles.grupales && <GrupalesTab />}
      
      {/* RENDERIZADO CHATWOOT UNIFICADO */}
      {tab === 'chatwoot' && tabsVisibles.chatwoot && <ConfigChatwoot />}
      
    </div>
  );
}