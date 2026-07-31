# Banco público da Barbearia Elite

Modelo em Terceira Forma Normal para o site público.

## Como executar

No SQL Editor do Supabase, execute:

```text
database/supabase-schema.sql
```

Ou aplique a migration versionada copiando o conteúdo de:

```text
database/migrations/001_public_schema_3fn.sql
```

Observação: o SQL Editor do Supabase pode não aceitar `\i`; nesse caso execute diretamente `database/supabase-schema.sql`.

## Tabelas

- `services`
- `customers`
- `appointments`
- `business_hours`
- `blocked_periods`
- `gallery_images`
- `site_content`
- `booking_settings`

## Relacionamentos

- `customers` 1:N `appointments`
- `services` 1:N `appointments`

Clientes e serviços usados em agendamentos antigos não são excluídos por cascata.
