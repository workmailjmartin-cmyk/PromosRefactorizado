'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MetaChatwootAutomation from '@/components/internal/marketing/MetaChatwootAutomation';
import { useStaffAuth } from '@/hooks/useStaffAuth'; // <-- AJUSTÁ ESTA RUTA SI ES NECESARIO
import Loader from '@/components/shared/Loader';

export default function ChatwootAutomationPage() {
  const { userData, loading: authLoading } = useStaffAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.push('/login'); // O la ruta a tu login
      } else if (userData.rol !== 'admin' && userData.rol !== 'marketing') {
        // Si no es admin ni marketing, lo pateamos al listado general
        router.push('/internal/encuotas'); 
      } else {
        setIsAuthorized(true);
      }
    }
  }, [userData, authLoading, router]);

  if (authLoading || !isAuthorized) {
    return <Loader visible={true} text="Verificando permisos..." />;
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', paddingBottom: '50px' }}>
      <MetaChatwootAutomation />
    </div>
  );
}