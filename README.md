# CheqControl — Gestão de Cheques

Sistema de controle de cheques com leitor CMC-7, filtros, alertas e auditoria completa.

---

## Stack
- React + Vite
- Supabase (auth + banco)
- Vercel (deploy)

---

## Setup passo a passo

### 1. GitHub — criar repositório
```bash
git init
git add .
git commit -m "feat: projeto inicial CheqControl"
git remote add origin https://github.com/SEU_USUARIO/cheques-app.git
git push -u origin main
```

### 2. Supabase — criar projeto
1. Acesse https://supabase.com e crie um novo projeto
2. Vá em **SQL Editor** e execute todo o conteúdo de `database/schema.sql`
3. Nas configurações do projeto, copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Variáveis de ambiente (local)
```bash
cp .env.example .env
# Edite .env com suas chaves do Supabase
```

### 4. Rodar localmente
```bash
npm install
npm run dev
# Abre em http://localhost:5173
```

### 5. Vercel — deploy
1. Acesse https://vercel.com e importe o repositório GitHub
2. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático a cada `git push`

---

## Estrutura do projeto
```
src/
  App.jsx                    # Controlador principal
  lib/supabase.js            # Cliente Supabase
  utils/
    constants.js             # Bancos, status, helpers
    cmc7.js                  # Parser CMC-7
    formatters.js            # Formatação BRL, datas, CPF/CNPJ
  components/
    UIComponents.jsx         # Design system
    Navigation.jsx           # Barra de navegação
  screens/
    AuthScreens.jsx          # Login e cadastro
    DashboardScreen.jsx      # Painel com totais e alertas
    ChequesScreen.jsx        # Lista com filtros e busca
    ChequeFormScreen.jsx     # Formulário + leitor CMC-7
    HistoricoScreen.jsx      # Auditoria completa
    AdminScreen.jsx          # Configurações da empresa
database/
  schema.sql                 # Estrutura completa do banco
```

---

## Funcionalidades
- ✅ Login / Cadastro com empresa separada por usuário
- ✅ Dashboard com totais e alertas de vencimento
- ✅ Lista de cheques com busca e filtros
- ✅ Leitor CMC-7 — digitação manual e câmera (via Claude API)
- ✅ Status: A vencer / Compensado / Devolvido / Vencido
- ✅ Ações rápidas de status diretamente na lista
- ✅ Histórico de auditoria: todo INSERT, UPDATE e DELETE é registrado
- ✅ Multi-empresa: cada empresa vê apenas seus próprios cheques (RLS)
