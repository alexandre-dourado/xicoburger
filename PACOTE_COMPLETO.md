# 📦 PACOTE COMPLETO — COPILOT DE ATENDIMENTO WHATSAPP
## Tudo que você precisa para faturar R$2.000 em 15 dias

---

# PARTE 1 — PRD (Product Requirements Document)

## Nome do produto
**Copilot de Atendimento WhatsApp**
*(internamente: "o sisteminha")*

## O que é
Um assistente digital que funciona no celular/computador e ajuda o dono de um pequeno negócio a:
1. Gerar respostas rápidas para mensagens do WhatsApp usando IA (Gemini)
2. Registrar clientes e pedidos numa planilha do Google Sheets
3. Receber um resumo diário por e-mail com o que aconteceu

## O que NÃO é
- ❌ Chatbot automático (não precisa de API paga do WhatsApp)
- ❌ Integração complexa (sem Zapier, n8n, webhook etc.)
- ❌ Nada que exija o cliente saber programar

## Usuário-alvo (persona)
João, 35 anos, dono de hamburgueria. Atende sozinho pelo WhatsApp, demora para responder, perde pedidos, não tem registro de clientes. Tem smartphone Android. Não entende de tecnologia mas quer ser mais organizado.

## Fluxo principal
```
Cliente manda mensagem no WhatsApp
→ Dono abre o Copilot no celular
→ Cola a mensagem na caixa de texto (ou clica num chip de atalho)
→ Clica "Gerar resposta com IA"
→ IA retorna resposta pronta em 2-3 frases
→ Dono copia e cola de volta no WhatsApp
→ Registra o contato com 1 clique
→ Às 22h recebe e-mail com resumo do dia
```

## Features do MVP (o que você entrega)

| Feature | Prioridade |
|---|---|
| Gerar resposta via Gemini API | P0 (obrigatório) |
| Chips de atalho (cardápio, horário, entrega...) | P0 |
| Copiar resposta com 1 clique | P0 |
| Salvar contato na planilha | P0 |
| PWA instalável no celular | P1 |
| Relatório diário por e-mail | P1 |
| Sidebar no Google Sheets | P2 (bônus) |
| Lista de contatos na tela | P2 |

## Stack técnica
- **Backend**: Google Apps Script (GAS) — gratuito, zero infraestrutura
- **IA**: Google Gemini 1.5 Flash via AI Studio API — gratuito (1500 req/dia)
- **Database**: Google Sheets — gratuito
- **Frontend**: PWA puro (HTML/CSS/JS) — hospedar no GitHub Pages ou Netlify (gratuito)
- **E-mail**: GmailApp do próprio GAS — gratuito

## Limitações honnestas para comunicar ao cliente
- Não é automático: o dono precisa abrir o app e colar a mensagem manualmente
- Limite de ~1500 respostas/dia na API gratuita (mais que suficiente para pequenos negócios)
- Precisa de internet para funcionar

---

# PARTE 2 — MANUAL DE DEPLOY (passo a passo)

## PASSO 1 — Criar a Planilha Google

1. Acesse **sheets.google.com**
2. Crie uma planilha nova chamada "Copilot - [Nome do negócio]"
3. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/**SEU_ID_AQUI**/edit`

## PASSO 2 — Criar o projeto GAS

1. Acesse **script.google.com**
2. Clique em "Novo projeto"
3. Renomeie para "Copilot Atendimento"
4. **Apague** todo o código padrão
5. Crie os arquivos:
   - **Code.gs** → cole o conteúdo do arquivo `gas/Code.gs`
   - **Bridge.gs** → cole o conteúdo do arquivo `gas/Bridge.gs`
   - Clique em "+" → HTML → chame de **Sidebar** → cole o conteúdo de `gas/Sidebar.html`

## PASSO 3 — Obter a chave Gemini

1. Acesse **aistudio.google.com**
2. Clique em "Get API Key" → "Create API key in new project"
3. Copie a chave (começa com `AIza...`)

## PASSO 4 — Executar o Setup

1. No editor GAS, selecione a função **`setupConfig`** no dropdown
2. Clique em ▶️ Executar
3. Autorize as permissões quando pedido (clique em "Avançado" → "Acessar projeto")
4. Preencha cada campo conforme o formulário aparecer:
   - **SHEET_ID**: o ID copiado no Passo 1
   - **GEMINI_API_KEY**: a chave copiada no Passo 3
   - **NEGOCIO_NOME**: ex: "Burguer do Zé"
   - **NEGOCIO_TIPO**: hamburgueria
   - **NEGOCIO_HORARIO**: ex: "Seg a Dom das 18h às 23h"
   - **NEGOCIO_TELEFONE**: número do WhatsApp
   - **NEGOCIO_CARDAPIO**: lista de itens e preços
   - **EMAIL_RELATORIO**: e-mail para receber o resumo

## PASSO 5 — Publicar como Web App

1. No GAS, clique em **"Implantar" → "Nova implantação"**
2. Tipo: **Aplicativo da Web**
3. Executar como: **Eu (sua conta)**
4. Quem tem acesso: **Qualquer pessoa**
5. Clique em **Implantar**
6. Copie a URL que aparece (começa com `https://script.google.com/macros/s/...`)
7. No menu da planilha, clique em **🤖 Copilot → 🌐 Salvar URL do Web App**

> ⚠️ IMPORTANTE: Sempre que editar o código GAS, precisa criar uma **nova implantação** (não "gerenciar implantações existentes"). A URL muda. Atualize no PWA também.

## PASSO 6 — Configurar relatório diário

1. No menu da planilha: **🤖 Copilot → 📊 Criar trigger relatório**
2. Autorize quando pedido
3. Pronto. O e-mail chegará todo dia às 22h.

## PASSO 7 — Hospedar o PWA

### Opção A — GitHub Pages (recomendado, gratuito)
1. Crie conta em **github.com** (se não tiver)
2. Crie repositório novo, público, chame de `copilot-atendimento`
3. Faça upload dos arquivos da pasta `pwa/` (index.html, manifest.json, sw.js)
4. Settings → Pages → Source: main → /root
5. URL será: `https://seuusuario.github.io/copilot-atendimento`

### Opção B — Netlify (mais fácil, gratuito)
1. Acesse **netlify.com** → "Add new site" → "Deploy manually"
2. Arraste a pasta `pwa/` para a área de upload
3. Pronto. URL gerada automaticamente.

## PASSO 8 — Configurar o PWA no celular do cliente

1. Abra a URL do PWA no Chrome do celular
2. Preencha a tela de setup:
   - Cole a URL do GAS (Passo 5)
   - Nome do negócio, horário, telefone, cardápio
3. Clique "Salvar e entrar"
4. Chrome vai sugerir "Adicionar à tela inicial" → aceite
5. Agora o app aparece como ícone no celular, igual a um app nativo

## PASSO 9 — Testar tudo

1. Abra o app, cole uma mensagem de teste: "Qual o cardápio?"
2. Clique em "Gerar resposta com IA"
3. Deve aparecer uma resposta em 2-3 segundos
4. Copie e "envie" (só para teste)
5. Vá na aba "➕ Contato" e salve um contato de teste
6. Abra a planilha → aba "Contatos" → deve aparecer o registro

**Tempo total de deploy: 30-45 minutos**

---

# PARTE 3 — ESTRATÉGIA DE VENDA

## Posicionamento central

**NÃO diga**: "faço automações com IA", "sou citizen developer", "uso LLM"
**DIGA**: *"Eu instalo um assistente no seu celular que gera as respostas do WhatsApp pra você. Você só copia e cola."*

## Diferencial vs. chatbot (objeção mais comum)

| Chatbot | Copilot |
|---|---|
| R$ 300-800/mês | Paga uma vez, fica pra sempre |
| Precisa de API paga do WhatsApp | Funciona com qualquer WhatsApp |
| Responde automaticamente (pode dar ruim) | Você revisa antes de enviar |
| Difícil de configurar | 1 dia de setup |
| Responde igual pra todo mundo | Você personaliza cada resposta |
| Suspende se não pagar | Não tem mensalidade |

**Frase de ouro**: *"Chatbot responde no lugar de você. Isso aqui te ajuda a responder melhor, mais rápido, sem errar."*

## Público-alvo por ordem de facilidade

1. **Amigo do seu amigo que tem hamburgueria/lanchonete** (quente, fácil)
2. **Donos de adega / bebidas / tabacaria** (acesso via amigo)
3. **Barbearia / salão** (muito WhatsApp, atendimento caótico)
4. **Pequenas clínicas / consultórios** (confirmação de consultas)
5. **Autônomos em geral** (nutricionistas, personal trainers)

## Meta dos 15 dias

- **5 clientes × R$400 = R$2.000**
- Ou: **3 clientes × R$600 + 1 × R$300 = R$2.100** (mais realista no começo)

---

## SCRIPTS DE ABORDAGEM

### Script 1 — Via amigo (para seu parceiro usar)

```
"Ei [nome], tenho um amigo que criou um negócio bacana.
Ele instala um assistente de IA no seu celular pra te ajudar
a responder o WhatsApp mais rápido.

Não é chatbot automático, é tipo um copiloto — você vê a
sugestão e decide se manda.

Ele tá fazendo por R$400 agora pra montar a carteira dele.
Posso pedir pra ele te mostrar como funciona?"
```

### Script 2 — Abordagem direta (WhatsApp/Instagram)

```
"Oi [nome], vi que você atende bastante pelo WhatsApp.

Desenvolvi um app simples que fica no seu celular e gera
as respostas automaticamente. Você só copia e cola.
Nada de chatbot nem API complicada.

Tenho um demo funcionando com uma hamburgueria, posso
mandar um vídeo de 1 min pra você ver?"
```

### Script 3 — Depois que a pessoa pede o vídeo

*(grave um vídeo de tela de 60-90s mostrando: você abre o app, cola uma mensagem, aparece a resposta sugerida, você copia, registra o contato, mostra a planilha com o dado salvo)*

```
"Esse é o app funcionando. Em 10 segundos a IA já sugeriu
a resposta certa com o horário e cardápio do negócio.

Configuro isso pra você em 1 dia por R$400.
Fica no seu celular como app, sem mensalidade."
```

---

## ONBOARDING (depois que fechou)

### Reunião de onboarding (30-45 min, pode ser por vídeo)

**Roteiro:**
1. "Me passa o cardápio completo com preços" (pode ser foto)
2. "Me passa o horário e telefone oficial"
3. "Me passa seu e-mail do Google"
4. [Você executa o deploy enquanto conversa]
5. "Acessa essa URL aqui, deixa eu te mostrar"
6. [Mostra o app funcionando COM os dados reais do negócio dele]
7. "Adiciona à tela inicial assim ó" [instrui passo a passo]
8. "Envia uma mensagem de teste pra mim pelo WhatsApp, eu mostro como usar"

### Materiais de entrega
- Link do PWA já configurado
- Link da planilha compartilhada
- Vídeo de 2 min mostrando como usar (grave uma vez, reutilize)
- Print screen com as 3 etapas: abrir app → gerar → copiar

---

## OBJEÇÕES E RESPOSTAS

**"Já tenho chatbot"**
*"Esse é diferente — você continua no controle. O app sugere, você decide o que manda. Sem risco de robô mandar mensagem errada pro cliente."*

**"Não tenho tempo pra aprender"**
*"O app tem 3 botões. Em 5 minutos você já sabe usar. Eu configuro tudo, só te entrego funcionando."*

**"Tá caro"**
*"R$400 único, sem mensalidade. Se economizar 30 min por dia, paga em 1 semana. Quer que eu faça por R$300 pra gente começar?"*

**"Vou pensar"**
*"Tranquilo. Só que to fechando 5 projetos com esse valor agora, depois sobe. Qual sua maior dificuldade no atendimento hoje?"* (redirecione para a dor)

**"Vai funcionar no meu WhatsApp normal?"**
*"Sim! Não precisa de WhatsApp Business nem API paga. Funciona com qualquer WhatsApp."*

---

## PÓS-VENDA E UPSELL

### Semana 1 (pós-entrega)
- Day 3: WhatsApp rápido: "Tudo certo com o app? Tô por aqui"
- Day 7: "Conseguiu usar essa semana? Tem alguma resposta que a IA errou?"

### Upsell 1 — Ajuste de cardápio / respostas (R$100-150)
*"Posso atualizar o cardápio e calibrar as respostas da IA pra ficarem ainda mais no seu tom. Leva 1h, cobro R$100."*

### Upsell 2 — Dashboard mensal (R$200/mês)
*"Posso criar um painel que mostra seus clientes mais frequentes, horários de pico e produtos mais pedidos. R$200/mês ou R$500 único."*

### Upsell 3 — Indicação (modelo referral)
*"Se você indicar um amigo e eu fechar, te dou R$50 de desconto na próxima manutenção."*

### Upsell 4 — Segundo negócio / filial
Já é mais fácil: o cliente já confia, o produto já existe. R$250-300 por instância adicional.

---

# PARTE 4 — GUIA BRUTAL: FATURE R$2.000 EM 15 DIAS

## (Tom: Sem frescura. Sem autoengano. Sem bullshit.)

---

### 🧠 MINDSET PRIMEIRO (sim, isso importa mais que o código)

**Você não é programador vendendo software.**
Você é um cara que resolve um problema concreto de gente real.
O problema: donos de negócio afogados em mensagem de WhatsApp.
A solução: você chega, configura em 1 dia, a vida fica mais fácil.

**Pare de achar que precisa estar "pronto".**
O produto está pronto. O código funciona. O deploy é de 45 minutos.
O que você precisa é de 5 pessoas dizendo sim.

**Tolerância a rejeição = 3. Tudo bem.**
Você não vai fazer 100 abordagens. Vai fazer 15-20 abordagens cirúrgicas,
em gente que já tem calor humano. Seu amigo faz o contato frio, você fecha.

---

### 📅 OS 15 DIAS — OPERAÇÃO POR DIA

**DIA 1 (hoje)**
- Lê esse documento inteiro
- Faz o deploy num negócio fictício (hamburgueria "Teste Burguer")
- Grava o vídeo demo de 90s (tela + voz, sem aparecer)
- Combina estratégia com seu amigo

**DIA 2**
- Manda o vídeo pro seu amigo
- Ele assiste, entende o produto
- Vocês definem: ele faz o primeiro contato, você fecha
- Lista de 10 alvos: começa pelos mais quentes (amigos, conhecidos, clientes da adega)

**DIA 3-4**
- Seu amigo aborda 10 pessoas com o Script 1
- Você faz 5 abordagens diretas com o Script 2 (WhatsApp/Instagram)
- Objetivo: conseguir 3-5 pessoas interessadas em ver o vídeo

**DIA 5-7**
- Manda o vídeo demo pras pessoas interessadas
- Responde dúvidas
- Fecha os primeiros 2 clientes (meta: R$800)
- Executa o deploy dos 2 clientes

**DIA 8-10**
- Pede indicação pra quem já fechou
- Seu amigo aborda mais 10 pessoas
- Fecha mais 1-2 clientes (meta: +R$600)

**DIA 11-13**
- Deploy dos novos clientes
- Acompanhamento pós-venda semana 1
- Fecha o 5º cliente se ainda não bateu a meta

**DIA 14-15**
- Conta o dinheiro
- Documenta o que funcionou
- Define próximo passo (subir preço? Novo nicho?)

---

### 💰 TABELA DE PREÇO — SEJA CONSISTENTE

| Situação | Preço |
|---|---|
| Primeiros 2-3 clientes (validação) | R$300 |
| Clientes normais | R$400 |
| Cliente com mais features pedidas | R$500-600 |
| Nunca abaixo de | R$200 |

Se o cara pechinchar muito: *"Esse é o menor valor que consigo. Mas posso parcelar em 2x sem juros."*

---

### 🤝 DIVISÃO COM SEU AMIGO

**Modelo 1 — Comissão simples**
Ele fecha → você paga 25% pra ele
R$400 cliente → R$100 pra ele, R$300 pra você

**Modelo 2 — Parceria igualitária**
Ele fecha + você entrega → 50/50
R$400 → R$200 cada
(mais justo se ele realmente trouxer os clientes)

**Combine antes.** Dinheiro e amizade não combinam sem combinado.

---

### ⚡ ACELERADORES (use se travar)

**Se ninguém está respondendo:** Muda o gancho. Tente: *"Posso te mostrar uma coisa de 1 min? Prometo que é rápido."*

**Se estão vendo o vídeo mas não fechando:** Ofereça fazer GRÁTIS o primeiro mês. Depois cobra. (Isso é arriscado pra sua agenda, mas quebra o gelo.)

**Se seu amigo não está abordando ninguém:** Separe seu papel do dele. Você faz o produto, ele faz as abordagens. Se ele não aborda, você precisa abordar sozinho.

**Se você trava na abordagem:** Lembre: você não está pedindo favor. Você está oferecendo algo que resolve um problema real. A pessoa pode dizer não. Tudo bem. Próxima.

---

### 🚫 SABOTADORES CLÁSSICOS

**"Preciso melhorar mais o produto"** → MENTIRA. O produto funciona. Você está procrastinando.

**"Vou fazer mais um nicho antes de vender"** → ERRADO. Um nicho, um demo, vende, aprende, itera.

**"Ele não vai pagar esse valor"** → Você não sabe até perguntar. Muita gente paga R$400 pra resolver dor real.

**"Meu amigo disse que vai me ajudar mas sumiu"** → Não dependa de ninguém. Faça você mesmo as abordagens também.

---

### 🏁 DEFINIÇÃO DE SUCESSO NOS 15 DIAS

- ✅ R$2.000? Ótimo. Missão cumprida.
- ✅ R$1.200 e 3 clientes satisfeitos? Também ótimo. Você validou o produto, tem casos reais, tem base pra subir o preço.
- ✅ 1 cliente e 1 indicação? Ainda positivo. Você aprendeu o processo real.
- ❌ Zero clientes e 0 abordagens? Problema de execução, não de produto.

**O produto está pronto. O resto depende só de você.**

---

*Documento gerado em: 2026*
*Versão: 1.0 — Copilot de Atendimento WhatsApp*
