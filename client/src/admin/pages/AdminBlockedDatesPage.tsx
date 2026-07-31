import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AdminModal } from '../components/common/AdminModal';
import { AdminEmpty, AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest } from '../services/adminApi';

type Block = {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  reason: string;
  all_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

export function AdminBlockedDatesPage() {
  const [editing, setEditing] = useState<Block | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.blockedDates, queryFn: () => adminRequest<Block[]>('/blocked-dates') });
  const save = useMutation({
    mutationFn: (block: Block) =>
      adminRequest<Block>(block.id ? `/blocked-dates/${block.id}` : '/blocked-dates', {
        method: block.id ? 'PATCH' : 'POST',
        body: JSON.stringify(block),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.blockedDates }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminRequest(`/blocked-dates/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.blockedDates }),
  });

  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar bloqueios." />;

  const rows = query.data || [];

  return (
    <section className="admin-card">
      <div className="admin-section-title">
        <h2>Bloqueios</h2>
        <button className="admin-button primary" type="button" onClick={() => setEditing({ title: 'Bloqueio', start_date: '', end_date: '', reason: '', all_day: true })}>
          <Plus size={17} />
          Novo bloqueio
        </button>
      </div>

      {rows.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Motivo</th>
                <th>Período</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((block) => (
                <tr key={block.id}>
                  <td data-label="Data">{block.start_date} até {block.end_date}</td>
                  <td data-label="Motivo">{block.reason || block.title}</td>
                  <td data-label="Período">{block.all_day ? 'Dia inteiro' : `${block.start_time} - ${block.end_time}`}</td>
                  <td data-label="Ações">
                    <button className="admin-link-button" onClick={() => setEditing(block)} type="button">
                      Editar
                    </button>
                    <button className="admin-link-button danger" type="button" onClick={() => block.id && remove.mutate(block.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <BlockModal
          block={editing}
          onClose={() => setEditing(null)}
          onSave={(block) => {
            save.mutate(block);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function BlockModal({ block, onClose, onSave }: { block: Block; onClose: () => void; onSave: (block: Block) => void }) {
  const [draft, setDraft] = useState(block);

  return (
    <AdminModal title="Bloqueio" onClose={onClose}>
      <div className="admin-form">
        <label>
          Título
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </label>
        <label>
          Data inicial
          <input type="date" value={draft.start_date} onChange={(event) => setDraft({ ...draft, start_date: event.target.value, end_date: draft.end_date || event.target.value })} />
        </label>
        <label>
          Data final
          <input type="date" value={draft.end_date} onChange={(event) => setDraft({ ...draft, end_date: event.target.value })} />
        </label>
        <label>
          Motivo
          <input value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value })} />
        </label>
        <label>
          Tipo
          <select value={draft.all_day ? 'all_day' : 'scheduled'} onChange={(event) => setDraft({ ...draft, all_day: event.target.value === 'all_day' })}>
            <option value="all_day">Dia inteiro</option>
            <option value="scheduled">Com horário</option>
          </select>
        </label>
        {!draft.all_day ? (
          <>
            <label>
              Início
              <input type="time" value={draft.start_time || ''} onChange={(event) => setDraft({ ...draft, start_time: event.target.value })} />
            </label>
            <label>
              Fim
              <input type="time" value={draft.end_time || ''} onChange={(event) => setDraft({ ...draft, end_time: event.target.value })} />
            </label>
          </>
        ) : null}
        <button className="admin-button primary" type="button" onClick={() => onSave(draft)}>
          Salvar
        </button>
      </div>
    </AdminModal>
  );
}
