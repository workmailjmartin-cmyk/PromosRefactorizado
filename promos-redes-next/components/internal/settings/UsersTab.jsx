'use client';

import { useEffect, useState } from 'react';
import FranquiciasManager from './FranquiciasManager';
import UserForm from './UserForm';
import UsersList from './UsersList';
import { useFranquicias } from '@/hooks/useFranquicias';
import { useUsersAdmin } from '@/hooks/useUsersAdmin';
import { useAlert } from '@/contexts/AlertContext';

export default function UsersTab({ rol, franquicias, refetchConfig, onActionBusy }) {
  const { showAlert } = useAlert();
  const { usuarios, loading, loadUsersList, guardarUsuario, confirmDeleteUser } = useUsersAdmin({ onActionBusy });
  const franquiciasHook = useFranquicias({ franquicias, refetchConfig, onActionBusy, refetchUsers: loadUsersList });
  const [editTrigger, setEditTrigger] = useState(null);

  // Igual al original: la lista de usuarios solo se descarga automáticamente
  // para el rol admin (es la misma limitación que ya tenía el sistema).
  useEffect(() => {
    if (rol === 'admin') loadUsersList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  const handleEditar = (u) => {
    setEditTrigger({ ...u, __t: Date.now() });
    showAlert(`Editando: ${u.email}`, 'info');
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <FranquiciasManager
        franquicias={franquicias}
        modoEdicion={franquiciasHook.modoEdicion}
        onToggleModoEdicion={franquiciasHook.toggleModoEdicion}
        onAgregar={franquiciasHook.agregarFranquicia}
        onGestionar={franquiciasHook.gestionarFranquicia}
      />
      <UserForm franquicias={franquicias} onGuardar={guardarUsuario} editTrigger={editTrigger} />
      <UsersList usuarios={usuarios} loading={loading} onEditar={handleEditar} onBorrar={confirmDeleteUser} />
    </div>
  );
}
