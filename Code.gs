// ============================================================
//  WHATSAPP COPILOT — Google Apps Script
//  Copilot de Atendimento para Hamburguerias / Pequenos Negócios
//  Versão: 1.0
// ============================================================

// ─────────────────────────────────────────────
//  CONFIGURAÇÃO CENTRAL (sem edição manual!)
// ─────────────────────────────────────────────
function getConfig() {
  const ps = PropertiesService.getScriptProperties();
  return {
    SHEET_ID:         ps.getProperty('SHEET_ID'),
    GEMINI_API_KEY:   ps.getProperty('GEMINI_API_KEY'),
    NEGOCIO_NOME:     ps.getProperty('NEGOCIO_NOME')     || 'Minha Hamburgueria',
    NEGOCIO_TIPO:     ps.getProperty('NEGOCIO_TIPO')     || 'hamburgueria',
    NEGOCIO_HORARIO:  ps.getProperty('NEGOCIO_HORARIO')  || '18h às 23h',
    NEGOCIO_TELEFONE: ps.getProperty('NEGOCIO_TELEFONE') || '',
    NEGOCIO_CARDAPIO: ps.getProperty('NEGOCIO_CARDAPIO') || '',
    EMAIL_RELATORIO:  ps.getProperty('EMAIL_RELATORIO')  || '',
    GAS_URL:          ps.getProperty('GAS_URL')          || '',
  };
}

// ─────────────────────────────────────────────
//  SETUP AUTOMÁTICO — roda UMA vez
// ─────────────────────────────────────────────
function setupConfig() {
  const ui = SpreadsheetApp.getUi();

  const campos = [
    ['SHEET_ID',         'ID da planilha (copie da URL entre /d/ e /edit)'],
    ['GEMINI_API_KEY',   'Sua chave da API Gemini (aistudio.google.com)'],
    ['NEGOCIO_NOME',     'Nome do negócio'],
    ['NEGOCIO_TIPO',     'Tipo (hamburgueria / barbearia / clínica etc)'],
    ['NEGOCIO_HORARIO',  'Horário de atendimento (ex: 18h às 23h)'],
    ['NEGOCIO_TELEFONE', 'Telefone/WhatsApp do negócio'],
    ['NEGOCIO_CARDAPIO', 'Cardápio resumido (cole aqui os itens e preços)'],
    ['EMAIL_RELATORIO',  'E-mail para receber o relatório diário'],
  ];

  const ps = PropertiesService.getScriptProperties();

  for (const [key, label] of campos) {
    const atual = ps.getProperty(key) || '';
    const resp  = ui.prompt(`⚙️ Setup — ${label}`, `Valor atual: "${atual}"\n\nDeixe em branco para manter.`, ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() === ui.Button.OK) {
      const val = resp.getResponseText().trim();
      if (val) ps.setProperty(key, val);
    }
  }

  _criarPlanilhaSeTiverID();
  ui.alert('✅ Configuração salva!\n\nAgora clique em "Copilot > Publicar Web App" e cole a URL no campo GAS_URL.');
}

function salvarGasUrl() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('🌐 Cole a URL do Web App publicado:', '', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() === ui.Button.OK) {
    const url = resp.getResponseText().trim();
    PropertiesService.getScriptProperties().setProperty('GAS_URL', url);
    ui.alert('✅ URL salva! Agora abra o PWA e configure essa mesma URL.');
  }
}

// ─────────────────────────────────────────────
//  CRIAR ABAS DA PLANILHA
// ─────────────────────────────────────────────
function _criarPlanilhaSeTiverID() {
  const cfg = getConfig();
  if (!cfg.SHEET_ID) return;

  const ss = SpreadsheetApp.openById(cfg.SHEET_ID);
  _garantirAba(ss, 'Contatos',    ['Data', 'Nome', 'Telefone', 'Pedido / Assunto', 'Status', 'Observações']);
  _garantirAba(ss, 'Historico',   ['Data/Hora', 'Telefone', 'Mensagem Original', 'Resposta Gerada', 'Usou?']);
  _garantirAba(ss, 'Configuracao',['Chave', 'Valor']);
}

function _garantirAba(ss, nome, cabecalho) {
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho])
       .setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
    aba.setFrozenRows(1);
  }
  return aba;
}

// ─────────────────────────────────────────────
//  WEB APP — doPost (chamado pelo PWA)
// ─────────────────────────────────────────────
function doPost(e) {
  const cors = ContentService.createTextOutput();
  cors.setMimeType(ContentService.MimeType.JSON);

  try {
    const payload = JSON.parse(e.postData.contents);
    const acao    = payload.acao;

    let resultado;

    if (acao === 'gerar_resposta') {
      resultado = _gerarResposta(payload.mensagem, payload.contexto);
    } else if (acao === 'salvar_contato') {
      resultado = _salvarContato(payload);
    } else if (acao === 'listar_contatos') {
      resultado = _listarContatos();
    } else if (acao === 'marcar_status') {
      resultado = _marcarStatus(payload.linha, payload.status);
    } else if (acao === 'get_config') {
      resultado = _getConfigPublica();
    } else {
      resultado = { erro: 'Ação desconhecida: ' + acao };
    }

    cors.setContent(JSON.stringify({ ok: true, data: resultado }));
  } catch (err) {
    cors.setContent(JSON.stringify({ ok: false, erro: err.message }));
  }

  return cors;
}

function doGet(e) {
  const acao = e.parameter.acao;
  if (acao === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: 'Copilot ativo!' }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('Copilot GAS rodando.')
                       .setMimeType(ContentService.MimeType.TEXT);
}

// ─────────────────────────────────────────────
//  GEMINI — Gerar Resposta
// ─────────────────────────────────────────────
function _gerarResposta(mensagem, contextoExtra) {
  const cfg = getConfig();
  if (!cfg.GEMINI_API_KEY) return { resposta: '⚠️ API key não configurada.', tokens: 0 };

  const systemPrompt = `Você é um assistente de atendimento da ${cfg.NEGOCIO_NOME}, uma ${cfg.NEGOCIO_TIPO}.
Seu papel: gerar respostas rápidas, cordiais e diretas para mensagens de clientes no WhatsApp.
Horário de funcionamento: ${cfg.NEGOCIO_HORARIO}.
Cardápio / Serviços: ${cfg.NEGOCIO_CARDAPIO || 'não informado'}.
Telefone: ${cfg.NEGOCIO_TELEFONE || 'não informado'}.
${contextoExtra ? 'Contexto extra: ' + contextoExtra : ''}

REGRAS:
- Responda em português, tom amigável mas profissional.
- Máximo 3 frases por resposta.
- Se for pedido, confirme o item e pergunte se é para entrega ou retirada.
- Nunca invente preços que não estão no cardápio.
- Sempre termine com uma pergunta ou CTA (ex: "Posso anotar?", "Deseja confirmar?").`;

  const url  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cfg.GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: mensagem }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
  };

  const resp    = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true });
  const json    = JSON.parse(resp.getContentText());
  const texto   = json?.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ Sem resposta da IA.';

  // salvar no histórico
  _salvarHistorico(mensagem, texto);

  return { resposta: texto };
}

// ─────────────────────────────────────────────
//  PLANILHA — helpers
// ─────────────────────────────────────────────
function _salvarContato(dados) {
  const cfg = getConfig();
  if (!cfg.SHEET_ID) return { erro: 'SHEET_ID não configurado' };

  const ss  = SpreadsheetApp.openById(cfg.SHEET_ID);
  const aba = ss.getSheetByName('Contatos') || _garantirAba(ss, 'Contatos', ['Data','Nome','Telefone','Pedido / Assunto','Status','Observações']);
  const linha = [
    new Date().toLocaleString('pt-BR'),
    dados.nome     || '',
    dados.telefone || '',
    dados.assunto  || '',
    dados.status   || 'Novo',
    dados.obs      || ''
  ];
  aba.appendRow(linha);
  return { ok: true, linha: aba.getLastRow() };
}

function _listarContatos() {
  const cfg = getConfig();
  if (!cfg.SHEET_ID) return [];

  const ss  = SpreadsheetApp.openById(cfg.SHEET_ID);
  const aba = ss.getSheetByName('Contatos');
  if (!aba) return [];

  const dados = aba.getDataRange().getValues();
  if (dados.length <= 1) return [];

  const header = dados[0];
  return dados.slice(1).map((row, i) => {
    const obj = { _linha: i + 2 };
    header.forEach((h, j) => { obj[h] = row[j]; });
    return obj;
  }).reverse(); // mais recentes primeiro
}

function _marcarStatus(linha, status) {
  const cfg = getConfig();
  if (!cfg.SHEET_ID || !linha) return { erro: 'Parâmetros inválidos' };

  const ss  = SpreadsheetApp.openById(cfg.SHEET_ID);
  const aba = ss.getSheetByName('Contatos');
  if (!aba) return { erro: 'Aba não encontrada' };

  // coluna Status = 5
  aba.getRange(linha, 5).setValue(status);
  return { ok: true };
}

function _salvarHistorico(mensagem, resposta) {
  const cfg = getConfig();
  if (!cfg.SHEET_ID) return;

  const ss  = SpreadsheetApp.openById(cfg.SHEET_ID);
  const aba = ss.getSheetByName('Historico') || _garantirAba(ss, 'Historico', ['Data/Hora','Telefone','Mensagem Original','Resposta Gerada','Usou?']);
  aba.appendRow([new Date().toLocaleString('pt-BR'), '', mensagem, resposta, 'Sim']);
}

function _getConfigPublica() {
  const cfg = getConfig();
  return {
    nome:     cfg.NEGOCIO_NOME,
    tipo:     cfg.NEGOCIO_TIPO,
    horario:  cfg.NEGOCIO_HORARIO,
    telefone: cfg.NEGOCIO_TELEFONE,
  };
}

// ─────────────────────────────────────────────
//  RELATÓRIO DIÁRIO — acionar por trigger
// ─────────────────────────────────────────────
function enviarRelatorioDiario() {
  const cfg      = getConfig();
  const contatos = _listarContatos();
  if (!cfg.EMAIL_RELATORIO) return;

  const hoje   = new Date().toLocaleDateString('pt-BR');
  const novos  = contatos.filter(c => c['Status'] === 'Novo').length;
  const total  = contatos.length;

  const linhas = contatos.slice(0, 20).map(c =>
    `• ${c['Nome'] || 'S/N'} | ${c['Telefone'] || '-'} | ${c['Pedido / Assunto'] || '-'} | ${c['Status']}`
  ).join('\n');

  const corpo = `📊 RELATÓRIO DIÁRIO — ${cfg.NEGOCIO_NOME}
Data: ${hoje}

Total de contatos registrados hoje: ${total}
Aguardando resposta (Novo): ${novos}

ÚLTIMOS REGISTROS:
${linhas || 'Nenhum contato hoje.'}

—
Copilot de Atendimento WhatsApp`;

  GmailApp.sendEmail(cfg.EMAIL_RELATORIO, `📊 Relatório Diário — ${cfg.NEGOCIO_NOME} — ${hoje}`, corpo);
}

function criarTriggerRelatorio() {
  // deleta triggers antigos
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'enviarRelatorioDiario')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('enviarRelatorioDiario')
    .timeBased().atHour(22).everyDays(1).create();

  SpreadsheetApp.getUi().alert('✅ Relatório diário agendado para 22h!');
}

// ─────────────────────────────────────────────
//  MENU LATERAL (sidebar)
// ─────────────────────────────────────────────
function abrirPainel() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('🍔 Copilot Atendimento')
    .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(html);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🤖 Copilot')
    .addItem('⚙️ Setup inicial',        'setupConfig')
    .addItem('🌐 Salvar URL do Web App', 'salvarGasUrl')
    .addSeparator()
    .addItem('📋 Abrir painel lateral',  'abrirPainel')
    .addSeparator()
    .addItem('📊 Criar trigger relatório', 'criarTriggerRelatorio')
    .addItem('📬 Enviar relatório agora',  'enviarRelatorioDiario')
    .addToUi();
}
