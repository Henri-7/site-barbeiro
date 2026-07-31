import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminAuthProvider } from '../../client/src/admin/hooks/useAdminAuth';
import { AdminLoginPage } from '../../client/src/admin/pages/AdminLoginPage';

describe('admin login', () => {
  it('permite acessar o modo local quando Supabase nao esta configurado', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminAuthProvider>
          <AdminLoginPage />
        </AdminAuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/^senha$/i), '123456');

    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled();
  });
});
