// app/internal/marketing/chatwoot/page.jsx
import MetaChatwootAutomation from '@/components/internal/marketing/MetaChatwootAutomation';

export const metadata = {
  title: 'Automatización Meta ➔ Chatwoot',
  description: 'Generador de mensajes y webhooks para campañas',
};

export default function ChatwootAutomationPage() {
  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', paddingBottom: '50px' }}>
      <MetaChatwootAutomation />
    </div>
  );
}