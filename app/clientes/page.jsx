'use client';

import { useMemo, useState } from 'react';
import HeaderB2C from '@/components/clientes/HeaderB2C';
import FooterB2C from '@/components/clientes/FooterB2C';
import FilterBar from '@/components/clientes/FilterBar';
import FeaturedOffers from '@/components/clientes/FeaturedOffers';
import PackageCard from '@/components/clientes/PackageCard';
import PackageDetailModal from '@/components/clientes/PackageDetailModal';
import Loader from '@/components/shared/Loader';
import WhatsAppFloatButton from '@/components/shared/WhatsAppFloatButton';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { usePackagesData } from '@/hooks/usePackagesData';
import { WPP_NUMBER } from '@/lib/constants';

const normalizeText = (text) => (text ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '');

export default function ClientesPage() {
  const { ready, error: authError } = useAnonymousAuth();
  const {
    loading,
    error: dataError,
    allPackages,
    vidriera,
    textoListon,
    bancoImagenes,
    salidasDisponibles,
    salidasCargadas,
  } = usePackagesData(ready);

  const [destinoDraft, setDestinoDraft] = useState('');
  const [filtros, setFiltros] = useState({ destino: '', salida: '', orden: 'reciente' });
  const [selectedPackage, setSelectedPackage] = useState(null);

  const filteredPackages = useMemo(() => {
    const fDestino = normalizeText(filtros.destino);

    let result = allPackages.filter((pkg) => {
      if (fDestino && !normalizeText(pkg.destino).includes(fDestino)) return false;
      if (filtros.salida && pkg.salida !== filtros.salida) return false;
      return true;
    });

    if (filtros.orden === 'reciente') {
      result = [...result].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (filtros.orden === 'menor_precio') {
      result = [...result].sort((a, b) => parseFloat(a.tarifa) - parseFloat(b.tarifa));
    } else if (filtros.orden === 'mayor_precio') {
      result = [...result].sort((a, b) => parseFloat(b.tarifa) - parseFloat(a.tarifa));
    }

    return result;
  }, [allPackages, filtros]);

  const handleBuscar = () => setFiltros((f) => ({ ...f, destino: destinoDraft }));
  const handleSalidaChange = (v) => setFiltros((f) => ({ ...f, destino: destinoDraft, salida: v }));
  const handleOrdenChange = (v) => setFiltros((f) => ({ ...f, destino: destinoDraft, orden: v }));
  const handleLimpiar = () => {
    setDestinoDraft('');
    setFiltros({ destino: '', salida: '', orden: 'reciente' });
  };

  return (
    <div id="app-container" style={{ display: 'block' }}>
      <HeaderB2C />

      <div className="container">
        
        {/* NUEVO BANNER EXPLICATIVO PARA CLIENTES */}
        <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '12px', padding: '20px', margin: '20px auto 40px', maxWidth: '1200px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#0284c7', fontSize: '1.4rem', fontWeight: '900' }}>Paquetes Pre-Comprados con Financiación Exclusiva</h2>
          <p style={{ margin: 0, color: '#0369a1', fontSize: '1rem', lineHeight: '1.5' }}>
            Estas son ofertas de cupo limitado que te permiten financiar tu viaje en cómodas cuotas. 
            <br /><b>¿Buscás la tarifa más económica posible?</b> <a href={`https://wa.me/${WPP_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ef5a1a', textDecoration: 'underline', fontWeight: 'bold' }}>Contactá a un asesor</a> para cotizar un paquete a medida.
          </p>
        </div>

        <div id="view-search" className="view active">
          
          <FilterBar
            destinoDraft={destinoDraft}
            onDestinoDraftChange={setDestinoDraft}
            salida={filtros.salida}
            onSalidaChange={handleSalidaChange}
            orden={filtros.orden}
            onOrdenChange={handleOrdenChange}
            salidasDisponibles={salidasDisponibles}
            salidasCargadas={salidasCargadas}
            onBuscar={handleBuscar}
            onLimpiar={handleLimpiar}
          />

          {authError && <p style={{ textAlign: 'center' }}>Error al conectar con el servidor.</p>}

          {!authError && dataError && <p style={{ textAlign: 'center' }}>No se pudieron cargar las promociones.</p>}

          {!authError && !dataError && (
            <>
              <FeaturedOffers
                vidriera={vidriera}
                allPackages={allPackages}
                bancoImagenes={bancoImagenes}
                onSelect={setSelectedPackage}
              />

              <div id="grilla-paquetes" className="grilla-resultados">
                {filteredPackages.length === 0 ? (
                  <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666' }}>
                    No encontramos viajes para esa búsqueda.
                  </p>
                ) : (
                  filteredPackages.map((pkg) => (
                    <PackageCard key={pkg.id_paquete} pkg={pkg} onSelect={setSelectedPackage} textoListon={textoListon} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <PackageDetailModal pkg={selectedPackage} onClose={() => setSelectedPackage(null)} wppNumber={WPP_NUMBER} />

      <Loader visible={loading} />

      <FooterB2C />

      <WhatsAppFloatButton phoneNumber={WPP_NUMBER} />
    </div>
  );
}