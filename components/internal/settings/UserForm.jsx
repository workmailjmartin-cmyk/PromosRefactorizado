'use client';

import { useEffect, useState } from 'react';

export default function UserForm({ franquicias, onGuardar, editTrigger }) {
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('usuario');
  const [franquicia, setFranquicia] = useState('');

  // editUser() del original: precarga el form para "editar" (mismo email = mismo doc).
  // editTrigger cambia de referencia cada vez que se toca "✏️" en la lista.
  useEffect(() => {
    if (!editTrigger) return;
    setEmail(editTrigger.email);
    setRol(editTrigger.rol);
    setFranquicia(editTrigger.franquicia);
  }, [editTrigger]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onGuardar({ email, rol, franquicia });
    if (ok) {
      setEmail('');
      setFranquicia('');
    }
  };

  return (
    <div className="user-create-card" style={{ marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0, color: '#11173d' }}>Crear Nuevo Usuario</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Rol</label>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="usuario">Usuario</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label>Franquicia</label>
          <select required value={franquicia} onChange={(e) => setFranquicia(e.target.value)}>
            <option value="">Seleccioná de la lista...</option>
            {franquicias.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primario" style={{ height: '45px' }}>
          Guardar
        </button>
      </form>
    </div>
  );
}
