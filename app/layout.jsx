import './globals.css';
import MainFooter from '@/components/shared/MainFooter';
import { AlertProvider } from '@/contexts/AlertContext';

export const metadata = {
  title: 'Feliz Viaje - Gestión',
  icons: { icon: '/favicon.ico' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Misma fuente que el proyecto original, cargada igual (vía Google Fonts) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* AlertProvider vive acá porque el panel interno (y a futuro el panel de
            proveedores) necesitan mostrar sus alertas/confirmaciones personalizadas
            desde cualquier componente, sin repetir el modal en cada página. */}
        <AlertProvider>
          {children}
          {/* Este footer es el único elemento realmente compartido por TODAS las páginas
              (index.html y clientes.html lo tenían idéntico), así que vive acá en el
              layout global en lugar de repetirse en cada page.jsx. */}
          <MainFooter />
        </AlertProvider>
      </body>
    </html>
  );
}
