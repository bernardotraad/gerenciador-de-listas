# Gerenciador de Listas VIP

Plataforma mobile-first para gerenciar listas de convidados em casas de show. Promoters enviam listas por link público; o admin aprova; a portaria faz check-in em tempo real.

**Stack:** Next.js 16 · Supabase (Auth + PostgreSQL + Realtime) · Tailwind CSS v4 · shadcn/ui

---

## Deploy no Vercel

### 1. Banco de dados (Supabase)

Crie um projeto em [supabase.com](https://supabase.com) e execute os dois arquivos SQL abaixo **em ordem** no SQL Editor do Supabase:

1. [`nextapp/supabase/migrations/001_initial_schema.sql`](nextapp/supabase/migrations/001_initial_schema.sql)
2. [`nextapp/supabase/migrations/002_lista_tipos.sql`](nextapp/supabase/migrations/002_lista_tipos.sql)

Após rodar o SQL, guarde:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

> As chaves ficam em: Supabase Dashboard → Project Settings → API

### 2. Vercel

1. Importe o repositório GitHub no [Vercel](https://vercel.com)
2. Na tela de configuração do projeto, **não altere** o Root Directory (o `vercel.json` já direciona para `nextapp/`)
3. Em **Environment Variables**, adicione:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (nunca expor no client) |
| `NEXT_PUBLIC_APP_URL` | URL de produção (ex: `https://meuapp.vercel.app`) |
| `BOOTSTRAP_SECRET` | Segredo para criar o primeiro Admin (gere com `openssl rand -hex 32`) |

4. Clique em **Deploy**

### 3. Criar o primeiro Admin

Após o deploy, faça uma requisição POST para criar a boate e o usuário Admin:

```bash
curl -X POST https://SEU_DOMINIO/api/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "SEU_BOOTSTRAP_SECRET",
    "boate_nome": "Nome da Casa de Show",
    "admin_email": "admin@exemplo.com",
    "admin_senha": "senha-segura",
    "admin_nome": "Nome do Admin"
  }'
```

> O endpoint `/api/bootstrap` só funciona uma vez — após criar o primeiro Admin, rejeita novas chamadas.

---

## Desenvolvimento local

```bash
cd nextapp
cp .env.example .env.local
# preencher .env.local com as variáveis do Supabase

pnpm install
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Estrutura do projeto

```
nextapp/
  src/
    app/
      login/          # Login com Supabase Auth
      submit/         # Formulário público para promoters
      admin/          # Painel admin (eventos, submissões, dashboard)
      portaria/       # Interface de check-in (mobile)
    lib/
      actions/        # Server actions (eventos, submissões, check-in)
      schemas/        # Validação Zod + parseNomes()
      supabase/       # Clientes Supabase (browser + server)
  supabase/
    migrations/       # SQL do schema completo
```

## Roles

| Role | Acesso |
|---|---|
| **Admin** | Cria eventos, aprova listas, vê dashboard |
| **Portaria** | Interface de check-in no celular |
| **Promoter** | Envia listas via link público (sem login) |
