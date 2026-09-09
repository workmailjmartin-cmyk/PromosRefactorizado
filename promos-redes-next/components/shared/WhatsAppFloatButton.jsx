export default function WhatsAppFloatButton({
  phoneNumber,
  tooltip = (
    <>
      ¿No encontrás lo que estas buscando?
      <br />
      ¡Nuestro asesor tiene una promo para vos!
    </>
  ),
}) {
  return (
    <div className="whatsapp-float-container">
      <div className="wa-tooltip">{tooltip}</div>
      <a href={`https://wa.me/${phoneNumber}`} target="_blank" rel="noopener noreferrer" className="wa-float-btn">
        <svg viewBox="0 0 32 32" width="35" height="35" fill="white">
          <path d="M16.05 2.15c-7.6 0-13.8 6.2-13.8 13.8 0 2.4.6 4.8 1.8 6.9L2 29.8l7.2-2.1c2 .1 4.2 1.8 6.8 1.8 7.6 0 13.8-6.2 13.8-13.8s-6.2-13.8-13.8-13.8zm0 25.2c-2 0-4-.5-5.8-1.5l-.4-.2-4.3 1.2 1.2-4.2-.3-.5c-1.1-1.8-1.7-3.9-1.7-6 0-6.6 5.4-12 12-12s12 5.4 12 12-5.4 12-12 12zm6.6-8.9c-.4-.2-2.1-1-2.5-1.2-.3-.1-.6-.2-.8.2-.2.4-.9 1.2-1.1 1.4-.2.2-.5.2-.8.1-2.1-1-3.6-2.2-5-4.5-.2-.3 0-.5.2-.7.2-.2.4-.4.5-.6.2-.2.2-.4.3-.6.1-.2 0-.4 0-.5-.2-.4-1-2.5-1.4-3.4-.3-.9-.7-.8-1-.8h-.8c-.3 0-.8.1-1.2.6-.4.5-1.5 1.5-1.5 3.6s1.6 4.2 1.8 4.4c.2.3 3 4.6 7.3 6.4 1 .4 1.8.7 2.4.8.9.3 1.8.2 2.5.1.8-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.2-.2-.5-.3-.9-.5z" />
        </svg>
      </a>
    </div>
  );
}
