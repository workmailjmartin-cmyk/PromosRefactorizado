'use client';

import { useState } from 'react';
import UsersTab from './UsersTab';
import MarketingTab from './MarketingTab';
import CalculadoraTab from './CalculadoraTab';
import { esRolGestor } from '@/lib/internal/constants';

const TAB_ACTIVO = { background: '#11173d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const TAB_INACTIVO = { background: '#f3f4f6', color: '#6b7280', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' };

export default function SettingsView({ userData, franquicias, etiquetasMarketing, tiposPromocion, textoListon, vidriera, bancoImagenes, uniquePackages, refetchConfig, onActionBusy }) {
  const rol = userData?.rol;
  // Igual a configureUIByRole(): el editor entra directo a "Marketing", el
  // admin entra directo a "Usuarios".
  const [tab, setTab] = useState(rol === 'editor' ? 'marketing' : 'usuarios');

  const tabsVisibles = {
    usuarios: rol === 'admin', // el editor no ve la pestaña de Usuarios ni Calculadora
    marketing: true,
    calculadora: rol === 'admin',
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
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
        </div>
      </div>

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
    </div>
  );
}
