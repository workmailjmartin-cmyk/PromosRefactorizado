'use client';

import { createContext, useCallback, useContext, useState } from 'react';

const AlertContext = createContext(null);

// Mismo mapeo de icono/color/título que el original showAlert().
const CONFIG_ALERTA = {
  success: { icon: '✅', title: '¡Éxito!', color: '#4caf50' },
  info: { icon: 'ℹ️', title: 'Información', color: '#3498db' },
  error: { icon: '⚠️', title: 'Atención', color: '#ef5a1a' },
};

export function AlertProvider({ children }) {
  // null = cerrado. Si no, { message, mode: 'alert'|'confirm', type, resolve }
  const [dialog, setDialog] = useState(null);

  const showAlert = useCallback((message, type = 'error') => {
    return new Promise((resolve) => {
      setDialog({ message, type, mode: 'alert', resolve });
    });
  }, []);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ message, mode: 'confirm', resolve });
    });
  }, []);

  const cerrar = (resultado) => {
    dialog?.resolve?.(resultado);
    setDialog(null);
  };

  const esConfirm = dialog?.mode === 'confirm';
  const cfg = esConfirm ? { icon: '❓', title: 'Confirmación', color: '#11173d' } : CONFIG_ALERTA[dialog?.type] || CONFIG_ALERTA.error;

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <div className="custom-alert-overlay" style={{ display: dialog ? 'flex' : 'none' }}>
        <div className="custom-alert-box">
          <div style={{ fontSize: '3em', marginBottom: '15px' }}>{cfg.icon}</div>
          <h3 style={{ margin: '0 0 10px 0', color: cfg.color }}>{cfg.title}</h3>
          <p style={{ color: '#555', marginBottom: '25px' }}>{dialog?.message}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {esConfirm && (
              <button className="btn btn-secundario" onClick={() => cerrar(false)}>
                Cancelar
              </button>
            )}
            <button className="btn btn-primario" onClick={() => cerrar(esConfirm ? true : undefined)}>
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </AlertContext.Provider>
  );
}

// showAlert(message, 'success'|'info'|'error') => Promise<void>
// showConfirm(message) => Promise<boolean>
export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert debe usarse dentro de <AlertProvider>');
  return ctx;
}
