'use client';

import EtiquetasManager from './EtiquetasManager';
import TiposPromocionManager from './TiposPromocionManager';
import ListonManager from './ListonManager';
import VidrieraManager from './VidrieraManager';
import { useMarketingConfig } from '@/hooks/useMarketingConfig';

export default function MarketingTab({ etiquetasMarketing, tiposPromocion, textoListon, vidriera, bancoImagenes, uniquePackages, refetchConfig, onActionBusy }) {
  const { agregarEtiqueta, borrarEtiqueta, agregarPromo, borrarPromo, guardarListon, agregarImagenBanco, borrarImagenBanco, guardarVidriera } = useMarketingConfig({
    etiquetasMarketing,
    tiposPromocion,
    vidriera,
    bancoImagenes,
    refetchConfig,
    onActionBusy,
  });

  return (
    <div style={{ marginTop: '20px' }}>
      <EtiquetasManager etiquetas={etiquetasMarketing} onAgregar={agregarEtiqueta} onBorrar={borrarEtiqueta} />
      <TiposPromocionManager tiposPromocion={tiposPromocion} onAgregar={agregarPromo} onBorrar={borrarPromo} />
      <ListonManager textoListon={textoListon} onGuardar={guardarListon} />
      <VidrieraManager
        vidriera={vidriera}
        bancoImagenes={bancoImagenes}
        uniquePackages={uniquePackages}
        onGuardarVidriera={guardarVidriera}
        onAgregarImagen={agregarImagenBanco}
        onBorrarImagen={borrarImagenBanco}
      />
    </div>
  );
}
