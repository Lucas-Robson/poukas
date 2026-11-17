# Poukas Team | Gestão

Sistema administrativo da academia, em HTML, CSS e JavaScript sem framework. A fundação inclui autenticação Supabase, esquema inicial com políticas RLS, consulta de alunos/mensalidades e preparação manual de cobranças individuais pelo WhatsApp via `wa.me`.

A tela de acesso também oferece uma demonstração sem login, usando somente dados fictícios locais. O cadastro de alunos, os vínculos de modalidade e os valores mensais (Jiu-Jitsu: R$ 90; MMA: R$ 70) funcionam apenas em memória durante a demonstração. Os botões de cobrança abrem `wa.me` para o número de teste `+55 11 94359-6607`; confira o destinatário antes de enviar manualmente. Nenhum dado demo é enviado ao Supabase.

## Requisitos

- Projeto Supabase.
- Navegador moderno e conexão com a internet para carregar o cliente Supabase JS pelo CDN.
- Node.js e npm apenas para servir localmente.

## Configuração do Supabase

1. Crie um projeto no Supabase e abra o SQL Editor.
2. Execute `supabase/migrations/001_initial_schema.sql`.
3. Execute `supabase/migrations/002_whatsapp_charge_clicks.sql` para habilitar o registro de cliques na preparação de cobranças manuais.
4. Em Authentication, crie o primeiro usuário da equipe. O cadastro público deve permanecer desabilitado.
5. Copie o UUID desse usuário em Authentication > Users e execute no SQL Editor, substituindo o valor abaixo:

   ```sql
   update public.users
   set role = 'mestre'
   where id = 'UUID-DO-USUARIO-MESTRE';
   ```

   O gatilho da migração cria automaticamente o perfil como funcionário. Promova o primeiro mestre somente pelo painel/SQL confiável. Convide os demais usuários pelo painel do Supabase; eles começarão com o papel funcionário.
6. Em Project Settings > API, copie a Project URL e a chave `anon`/publishable para `supabase-config.js`.

A URL e a chave anon são visíveis no navegador por natureza. Nunca coloque a `service_role`, tokens de pagamento ou segredos de integração nesse arquivo. A proteção dos dados depende das políticas RLS da migração.

## Executar localmente

Na pasta do projeto:

```powershell
npx serve .
```

Abra o endereço local exibido pelo comando. Não abra `index.html` diretamente, pois o cliente Supabase é carregado como módulo ES.

## Publicar na Vercel

Importe este diretório como projeto na Vercel, sem etapa de build e com a raiz do projeto como diretório de saída. Depois de publicar, adicione o domínio de produção em Authentication > URL Configuration no Supabase. Para uso local, mantenha também a URL local permitida.

## Escopo e próximos passos

- O cadastro de alunos e os preços locais na demonstração não persistem; o cadastro/edição real e os módulos financeiros ainda requerem implementação no backend.
- Clientes autenticados não podem criar ou alterar mensalidades nem inserir pagamentos diretamente. O registro em dinheiro usa uma função transacional; geração recorrente e confirmação Pix ficam reservadas a operações confiáveis no backend.
- A tela de alunos prepara cobranças individuais pelo link oficial `wa.me`, usando o saldo real da fatura (incluindo pagamentos parciais). Não há disparo automático; o usuário revisa e envia no WhatsApp. O histórico separado registra apenas o clique do usuário, nunca envio ou entrega.
- As modalidades Jiu-Jitsu e MMA são inseridas pela migração. Nenhum aluno, plano, cobrança ou pagamento fictício é criado.
- PicPay e WhatsApp Business Platform não estão integrados. A cobrança básica manual por `wa.me` não exige API. Antes de qualquer integração oficial, confirmar os produtos habilitados na conta PicPay e a viabilidade/migração do número para a WhatsApp Business Platform.
- O cliente usa a chave pública Supabase; regras de negócio privilegiadas e segredos deverão ficar em Edge Functions. A confirmação de Pix deverá vir de webhook verificado, nunca de comprovante enviado pelo aluno.
