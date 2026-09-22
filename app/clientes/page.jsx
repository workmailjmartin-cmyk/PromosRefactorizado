'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    document.title = 'Feliz Viaje - Promociones';
  }, []);

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
        
        {/* BOTÓN / LLAMADO A LA ACCIÓN A LOS PAQUETES FINANCIADOS */}
        <div style={{ background: 'linear-gradient(90deg, #11173d 0%, #0369a1 100%)', borderRadius: '12px', padding: '20px 30px', margin: '20px auto 30px', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.3rem', fontWeight: '900' }}>¿Buscás facilidades de pago?</h3>
            <p style={{ margin: 0, color: '#bae6fd', fontSize: '0.95rem' }}>Conocé nuestros paquetes de cupo limitado con financiación exclusiva al 100%.</p>
          </div>
          <Link href="/clientes/enlatados" style={{ background: '#ef5a1a', color: '#fff', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', transition: 'background 0.3s' }}>
            Ver Paquetes Financiados ✈️
          </Link>
        </div>

        <div id="view-search" className="view active">
          {authError && <p style={{ textAlign: 'center' }}>Error al conectar con el servidor.</p>}
          {!authError && dataError && <p style={{ textAlign: 'center' }}>No se pudieron cargar las promociones.</p>}

          {!authError && !dataError && (
            <>
              {/* 1. PRIMERO: OFERTAS DESTACADAS */}
              <FeaturedOffers
                vidriera={vidriera}
                allPackages={allPackages}
                bancoImagenes={bancoImagenes}
                onSelect={setSelectedPackage}
              />

              {/* 2. SEGUNDO: EL BUSCADOR/FILTROS */}
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

              {/* TÍTULO SEPARADOR */}
              {/* <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '30px' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#11173d', margin: 0, fontWeight: 900 }}>Conocé todas nuestras promociones:</h2>
              </div> */}

              {/* 3. TERCERO: LA GRILLA GENERAL DE PROMOCIONES */}
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