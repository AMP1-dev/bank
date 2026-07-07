-- ============================================================
-- CHEQUES DEVOLVIDOS — Schema Supabase
-- ============================================================

-- Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  cnpj        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Profiles (estende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  empresa_id  UUID REFERENCES empresas(id) ON DELETE SET NULL,
  nome        TEXT,
  tipo        TEXT DEFAULT 'operador', -- 'admin_sistema' | 'admin' | 'operador'
  ativo       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Cheques
CREATE TABLE IF NOT EXISTS cheques (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,

  -- Lançamento
  data_entrada    DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente         TEXT,
  destino         TEXT,

  -- Dados do cheque (extraídos do CMC-7 ou manuais)
  codigo_banco    INTEGER,
  nome_banco      TEXT,
  agencia         TEXT,
  conta           TEXT,
  numero_cheque   TEXT NOT NULL,
  cmc7            TEXT,

  -- Emitente
  emitente        TEXT NOT NULL,
  cpf_cnpj        TEXT,
  telefone        TEXT,
  email_obs       TEXT,

  -- Financeiro
  valor           NUMERIC(12,2) NOT NULL DEFAULT 0,
  vencimento      DATE,
  compensacao     DATE,

  -- Status: 'a_vencer' | 'compensado' | 'devolvido' | 'vencido'
  status          TEXT NOT NULL DEFAULT 'a_vencer',

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Histórico / Auditoria
CREATE TABLE IF NOT EXISTS historico_cheques (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cheque_id        UUID REFERENCES cheques(id) ON DELETE CASCADE NOT NULL,
  empresa_id       UUID REFERENCES empresas(id) NOT NULL,
  usuario_id       UUID REFERENCES auth.users(id),
  usuario_nome     TEXT,
  acao             TEXT NOT NULL, -- 'criado' | 'editado' | 'status_alterado' | 'excluido'
  descricao        TEXT,
  dados_anteriores JSONB,
  dados_novos      JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Auto updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cheques_updated_at
  BEFORE UPDATE ON cheques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE empresas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques           ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_cheques ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para checar se é Super Admin sem causar recursão infinita
CREATE OR REPLACE FUNCTION is_admin_sistema()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND tipo = 'admin_sistema'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles
CREATE POLICY "profile_select" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin_sistema());
CREATE POLICY "profile_update" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin_sistema());

-- Empresas
CREATE POLICY "empresa_select" ON empresas FOR SELECT
  USING (id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()) OR is_admin_sistema());
CREATE POLICY "empresa_insert" ON empresas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "empresa_update" ON empresas FOR UPDATE
  USING (id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()) OR is_admin_sistema());

-- Cheques
CREATE POLICY "cheque_select" ON cheques FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "cheque_insert" ON cheques FOR INSERT
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "cheque_update" ON cheques FOR UPDATE
  USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "cheque_delete" ON cheques FOR DELETE
  USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Histórico
CREATE POLICY "historico_select" ON historico_cheques FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "historico_insert" ON historico_cheques FOR INSERT
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- ── Trigger: cria profile ao registrar usuário ────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nome', 'Usuário Convidado'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
