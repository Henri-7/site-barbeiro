import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminProfilePage() {
  const { session, signOut } = useAdminAuth();
  return <section className="admin-card"><h2>Perfil</h2><p>E-mail: {session?.user.email}</p><p>Nome e avatar sao definidos na tabela `admin_profiles`.</p><button className="admin-button secondary" type="button" onClick={() => void signOut()}>Sair</button></section>;
}
