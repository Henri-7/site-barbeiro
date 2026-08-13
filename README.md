# Barbearia Elite

Site de agendamento online para a Barbearia Elite em Cássia, MG.

## Tecnologias

React, TypeScript, Vite, React Router DOM, Framer Motion, Lucide React, React Hook Form, Zod, date-fns, Node.js, Express, Supabase/PostgreSQL, Vitest e Supertest.

## Estrutura

- `client/`: front-end React.
- `server/`: API REST Express.
- `database/supabase-schema.sql`: schema principal para Supabase/PostgreSQL.
- `database/mysql-reference.sql`: referencia futura para MySQL, sem conexao no sistema.
- `tests/`: testes essenciais.

## Como executar

```bash
npm install
npm run dev
```

Cliente: `http://localhost:5173`

API: `http://localhost:3000/api/health`

## Variaveis

Crie `server/.env` baseado em `server/.env.example`.

```env
PORT=3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=
```

Crie `client/.env` baseado em `client/.env.example` se quiser alterar a URL da API.

## Supabase

No painel do Supabase, abra o SQL Editor e execute o conteúdo de:

```text
database/supabase-schema.sql
database/admin-migration.sql
```

Depois preencha `SUPABASE_URL` e uma chave no `server/.env`. A API usa Supabase quando essas variaveis existem. Sem elas, o servidor roda com dados iniciais em memoria para desenvolvimento local.

## Scripts

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run build
npm run start
npm run lint
npm run test
npm run test:client
npm run test:server
```

## Funcionalidades

- Landing page responsiva com tema claro/escuro.
- Serviços carregados de fonte única via API.
- Agendamento por etapas.
- Calendário com limite de 60 dias, bloqueio de domingos, datas passadas e feriados recorrentes.
- Horários agrupados por manhã, tarde e noite.
- Duração diferente por serviço.
- Revalidacao de disponibilidade no servidor antes de salvar.
- Formulario validado com React Hook Form e Zod.
- Revisao antes do envio.
- Modal de solicitação enviada.
- Mensagem pronta para WhatsApp.
- Galeria com lightbox acessivel e placeholders substituiveis.
- Painel administrativo em `/admin`.
- Supabase Auth para acesso administrativo.
- Dashboard, agenda, agendamentos, serviços, horários, bloqueios, galeria, conteúdo, clientes, configurações e perfil.
- Endpoints públicos em `/api/public/*` para conteúdo dinâmico.

## Primeiro administrador

1. No Supabase, crie um usuário em Authentication.
2. Copie o `id` desse usuário.
3. Execute no SQL Editor:

```sql
insert into public.admin_profiles (id, name, role, active)
values ('COLE-O-ID-DO-USUARIO', 'Administrador', 'owner', true);
```

4. Preencha `server/.env` com `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
5. No cliente, mantenha apenas `VITE_API_URL=/api` para producao.

Em producao, configure as variaveis do Supabase na plataforma de hospedagem para liberar o painel administrativo.

## Storage

Crie estes buckets no Supabase Storage quando for usar upload real:

- `site-images`
- `gallery-images`
- `service-images`
- `avatars`

Formatos planejados: JPEG, PNG, WebP e AVIF quando suportado.

## Deploy na Vercel

Este projeto esta preparado para Vercel com o frontend Vite servido como estatico e a API Express executando como Serverless Function em `api/index.js`.

Configuracao recomendada no painel da Vercel:

- Framework Preset: `Vite`
- Root Directory: `.`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist/client`
- Node.js Version: `22.x`

O arquivo `vercel.json` mantem as rotas `/api/*` apontando para a API Express e redireciona as demais rotas para `index.html`, preservando refresh direto em `/admin` e demais rotas SPA.

Configure as variaveis de ambiente da Vercel com os mesmos nomes do `server/.env.example`. Para producao, use `CLIENT_URL` com o dominio publico final, por exemplo `https://seu-dominio.com`. Para multiplos dominios ou previews externos, use `CORS_ORIGINS` separado por virgula.

Em producao, mantenha `VITE_API_URL=/api` ou deixe a variavel ausente para usar chamadas relativas.
