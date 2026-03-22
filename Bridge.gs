// ─────────────────────────────────────────────
//  BRIDGE — chamado pelo Sidebar via google.script.run
// ─────────────────────────────────────────────
// Adicione esta função no final do Code.gs

function chamarAcao(acao, dadosJson) {
  const dados = JSON.parse(dadosJson || '{}');
  if (acao === 'gerar_resposta')  return _gerarResposta(dados.mensagem, dados.contexto);
  if (acao === 'salvar_contato')  return _salvarContato(dados);
  if (acao === 'listar_contatos') return _listarContatos();
  if (acao === 'marcar_status')   return _marcarStatus(dados.linha, dados.status);
  if (acao === 'get_config')      return _getConfigPublica();
  return { erro: 'Ação desconhecida' };
}
