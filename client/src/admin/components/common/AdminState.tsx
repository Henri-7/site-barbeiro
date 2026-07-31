export function AdminLoading() {
  return (
    <div className="admin-state" role="status">
      <span />
      <p>Carregando dados...</p>
    </div>
  );
}

export function AdminEmpty({ text = 'Nenhum registro encontrado.' }: { text?: string }) {
  return <div className="admin-state"><p>{text}</p></div>;
}

export function AdminError({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="admin-state" role="alert">
      <p>{text}</p>
      {onRetry ? <button className="admin-button secondary" type="button" onClick={onRetry}>Tentar novamente</button> : null}
    </div>
  );
}
