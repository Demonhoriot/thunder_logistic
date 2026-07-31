/* =========================================================
   THUNDER LOGISTIC — Frontend (conectado à API)
   ========================================================= */

const API = window.location.origin + '/api';

let token = localStorage.getItem('thunder_token') || null;
let user = JSON.parse(localStorage.getItem('thunder_user') || 'null');
function mostrarSecao(id) {
  var secoes = ['inicio', 'servicos', 'painel', 'contato'];
  secoes.forEach(function (sec) {
    var el = document.getElementById(sec);
    if (el) el.style.display = (sec === id) ? '' : 'none';
  });
}
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...options.headers
  };
  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data;
}

function salvarSessao(t, u) {
  token = t; user = u;
  localStorage.setItem('thunder_token', t);
  localStorage.setItem('thunder_user', JSON.stringify(u));
}

function logout() {
  token = null; user = null;
  localStorage.removeItem('thunder_token');
  localStorage.removeItem('thunder_user');
  abrirPainel('dashboard');
  alert('Sessão terminada.');
}

function toggleMenu() {
  document.getElementById('menu').classList.toggle('open');
}

function abrirLogin() {
  fecharModais();
  document.getElementById('loginModal').classList.add('show');
}
function abrirCadastro() {
  fecharModais();
  document.getElementById('cadastroModal').classList.add('show');
}
function iniciarPedido() {
  if (!token || !user) {
    abrirCadastro();
    return;
  }
  mostrarSecao('servicos');
}
let pedidoAtual = { tipo: '', nome: '', peso: '', foto: null };

function escolherServico(tipo) {
  if (!token || !user) {
    abrirLogin();
    return;
  }
  pedidoAtual.tipo = tipo;
  pedidoAtual.nome = '';
  pedidoAtual.peso = '';
  pedidoAtual.foto = null;

  var formProduto = document.getElementById('formProduto');
  if (formProduto) {
    var label = document.getElementById('tipoServicoLabel');
    if (label) label.textContent = tipo;
    if (typeof mostrarSecao === 'function') {
      mostrarSecao('formProduto');
    } else {
      document.getElementById('servicos').style.display = 'none';
      formProduto.style.display = 'block';
    }
  } else {
    alert('Serviço escolhido: ' + tipo + '\n(No próximo passo aparece o formulário com foto, nome e peso)');
  }
}
function fecharModais() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
}
window.onclick = e => { if (e.target.classList.contains('modal')) fecharModais(); };

async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  if (!email || !senha) return alert('Preencha email e senha.');
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
    salvarSessao(data.token, data.user);
    fecharModais();
    alert('Login realizado! Bem-vindo(a), ' + data.user.nome);
    if (data.user.tipo === 'cliente') {
      mostrarSecao('servicos');
    } else {
      abrirPainelPorTipo(data.user.tipo);
    }
  } catch (err) {
    alert(err.message);
  }
}

async function cadastrar() {
  const nome = document.getElementById('cadNome').value.trim();
  const telefone = document.getElementById('cadTelefone').value.trim();
  const email = document.getElementById('cadEmail').value.trim();
  const senha = document.getElementById('cadSenha').value;
  const conf = document.getElementById('cadConfirmar').value;
  const tipo = (document.getElementById('cadTipo') && document.getElementById('cadTipo').value) || 'cliente';
  if (!nome || !email || !senha) return alert('Preencha os campos obrigatórios.');
  if (senha !== conf) return alert('As senhas não coincidem.');
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, telefone, senha, tipo })
    });
    salvarSessao(data.token, data.user);
    fecharModais();
    alert('Conta criada! Bem-vindo(a), ' + data.user.nome);
    if (data.user.tipo === 'cliente') {
      mostrarSecao('servicos');
    } else {
      abrirPainelPorTipo(data.user.tipo);
    }
  } catch (err) {
    alert(err.message);
  }
}

function abrirPainelPorTipo(tipo) {
  const map = { cliente: 'cliente', entregador: 'entregador', empresa: 'empresa', admin: 'admin' };
  if (tipo === 'admin') {
    abrirPainel('admin');
    return;
  }
  abrirPainel(map[tipo] || 'dashboard');
}

function scrollToPainel(tipo) {
  document.getElementById('painel').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => abrirPainel(tipo || 'dashboard'), 400);
}

function abrirPainel(tipo) {
  document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
  const items = document.querySelectorAll('.sidebar li');
  const map = { dashboard: 0, cliente: 1, entregador: 2, empresa: 3, carteira: 4, rastreamento: 5, admin: 6 };
  if (map[tipo] !== undefined && items[map[tipo]]) items[map[tipo]].classList.add('active');
  const content = document.getElementById('painelContent');
  const renderers = {
    dashboard: renderDashboard, cliente: renderCliente, entregador: renderEntregador,
    empresa: renderEmpresa, carteira: renderCarteira, rastreamento: renderRastreamento, admin: renderAdmin
  };
  (renderers[tipo] || renderDashboard)().then(html => { content.innerHTML = html; })
    .catch(err => {
      content.innerHTML = '<p style="color:red;padding:20px">' + err.message + '</p>' +
        '<p style="padding:0 20px"><button class="primary" onclick="abrirLogin()">Fazer Login</button></p>';
    });
}

async function renderDashboard() {
  let extra = '';
  if (user && user.tipo === 'admin' && token) {
    try {
      const d = await api('/admin/dashboard');
      extra = '<div class="orders" style="margin-top:24px"><h2>Dados Reais (Admin)</h2>' +
        '<p>Clientes: ' + d.clientes + ' | Entregadores: ' + d.entregadores + ' | Empresas: ' + d.empresas + '</p>' +
        '<p>Pedidos hoje: ' + d.pedidosHoje + ' | Ativos: ' + d.pedidosAtivos + '</p>' +
        '<p>Receita: ' + d.receita.toLocaleString() + ' MT | Lucro: ' + d.lucro.toLocaleString() + ' MT</p></div>';
    } catch (_) {}
  }
  return '<div class="topcards">' +
    '<div class="small"><h4>Pedidos Hoje</h4><h2>1 240</h2></div>' +
    '<div class="small"><h4>Receita</h4><h2>1 540 000 MT</h2></div>' +
    '<div class="small"><h4>Clientes</h4><h2>12 845</h2></div>' +
    '<div class="small"><h4>Entregadores Online</h4><h2>842</h2></div></div>' +
    '<div class="orders"><h2>Pedidos Recentes (Demo)</h2><table>' +
    '<tr><th>ID</th><th>Cliente</th><th>Serviço</th><th>Valor</th><th>Status</th></tr>' +
    '<tr><td>1001</td><td>João</td><td>Comida</td><td>320 MT</td><td><span class="status ok">Entregue</span></td></tr>' +
    '<tr><td>1002</td><td>Maria</td><td>Farmácia</td><td>510 MT</td><td><span class="status wait">Em andamento</span></td></tr>' +
    '<tr><td>1003</td><td>Carlos</td><td>Supermercado</td><td>980 MT</td><td><span class="status cancel">Cancelado</span></td></tr>' +
    '</table></div>' + extra +
    (user ? '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair (' + user.nome + ')</button></p>' : '');
}

async function renderCliente() {
  if (!token || user.tipo !== 'cliente') {
    return '<h1 class="panel-title">Área do Cliente</h1><p>Faça login como <b>cliente</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const me = await api('/auth/me');
  const pedidos = await api('/pedidos');
  const pedidosHtml = pedidos.map(p =>
    '<div class="pedido-card"><h3>Pedido #' + p.id + '</h3>' +
    '<p><b>Serviço:</b> ' + p.tipo + '</p><p><b>Origem:</b> ' + p.origem + '</p>' +
    '<p><b>Destino:</b> ' + p.destino + '</p><p><b>Valor:</b> ' + p.valor + ' MT</p>' +
    '<p><b>Status:</b> <span style="color:var(--primary);font-weight:600">' + p.status + '</span></p>' +
    (p.status !== 'Entregue' && p.status !== 'Cancelado'
      ? '<button class="primary btn-sm" onclick="avancarStatus(\'' + p.id + '\',\'' + p.status + '\')">Avançar Status</button>'
      : '') + '</div>'
  ).join('') || '<p style="color:#666">Nenhum pedido ainda.</p>';

  return '<h1 class="panel-title">Olá, ' + me.nome + ' 👋</h1><div class="grid-4">' +
    '<div class="small"><h4>Carteira</h4><h2>' + (me.saldo || 0) + ' MT</h2></div>' +
    '<div class="small"><h4>Pontos</h4><h2>' + (me.pontos || 0) + '</h2></div>' +
    '<div class="small"><h4>Pedidos</h4><h2>' + pedidos.length + '</h2></div>' +
    '<div class="small"><h4>Status</h4><h2 style="color:var(--success)">Ativo</h2></div></div>' +
    '<h2 style="margin-bottom:16px">Novo Pedido</h2>' +
    '<select id="tipoPedido" class="input"><option>Comida</option><option>Farmácia</option>' +
    '<option>Supermercado</option><option>Documentos</option><option>Encomenda</option></select>' +
    '<input id="origem" class="input" placeholder="Local de recolha">' +
    '<input id="destino" class="input" placeholder="Destino">' +
    '<button class="bigButton" onclick="criarPedido()">Solicitar Pedido</button>' +
    '<div style="margin-top:30px"><h2 style="margin-bottom:16px">Meus Pedidos</h2>' +
    '<div id="listaPedidos">' + pedidosHtml + '</div></div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function renderEntregador() {
  if (!token || user.tipo !== 'entregador') {
    return '<h1 class="panel-title">Área do Entregador</h1><p>Faça login como <b>entregador</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const me = await api('/entregadores/me');
  const planos = await api('/entregadores/planos');
  let disponiveis = [];
  try { disponiveis = await api('/pedidos/disponiveis/lista'); } catch (_) {}

  const planosHtml = planos.map(p =>
    '<div class="plan-card"><h3>' + p.nome + '</h3>' +
    '<h2 style="color:var(--primary);margin:8px 0">' + p.valor + ' MT</h2>' +
    '<p>' + p.entregas + ' entregas</p>' +
    '<button class="primary btn-sm" style="margin-top:12px;width:100%" onclick="comprarPlano(\'' + p.nome + '\')">Comprar</button></div>'
  ).join('');

  const pedidosHtml = disponiveis.map(p =>
    '<div class="pedido-card" style="border-left:5px solid var(--primary)">' +
    '<h3>Pedido #' + p.id + '</h3><p>' + p.tipo + ' — ' + p.origem + ' → ' + p.destino + '</p>' +
    '<p><b>' + p.valor + ' MT</b></p>' +
    '<button class="primary btn-sm" onclick="aceitarPedido(\'' + p.id + '\')">Aceitar</button></div>'
  ).join('') || '<p style="color:#666">Nenhum pedido disponível.</p>';

  return '<h1 class="panel-title">Painel do Entregador</h1><div class="grid-4">' +
    '<div class="small"><h4>Status</h4><h2>' + (me.online ? 'Online' : 'Offline') + '</h2></div>' +
    '<div class="small"><h4>Saldo</h4><h2>' + me.saldo + ' MT</h2></div>' +
    '<div class="small"><h4>Plano</h4><h2>' + (me.plano || 'Nenhum') + '</h2></div>' +
    '<div class="small"><h4>Entregas Restantes</h4><h2>' + me.entregas_disponiveis + '</h2></div></div>' +
    '<h2 style="margin:24px 0 16px">Comprar Plano</h2><div class="grid-5">' + planosHtml + '</div>' +
    '<button class="bigButton" style="margin-top:24px" onclick="toggleOnline()">' +
    (me.online ? 'Ficar Offline' : 'Entrar Online') + '</button>' +
    '<div style="margin-top:28px"><h2 style="margin-bottom:16px">Pedidos Disponíveis</h2>' + pedidosHtml + '</div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function renderEmpresa() {
  if (!token || user.tipo !== 'empresa') {
    return '<h1 class="panel-title">Área da Empresa</h1><p>Faça login como <b>empresa</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const me = await api('/empresas/me');
  const produtos = me.produtos || [];
  const produtosHtml = produtos.map(p =>
    '<div class="product-card"><h3>' + p.nome + '</h3><p>Preço: <b>' + p.preco + ' MT</b></p>' +
    '<button class="primary btn-sm" onclick="editarProduto(\'' + p.id + '\',\'' + p.nome + '\',' + p.preco + ')">Editar</button> ' +
    '<button class="secondary btn-sm" onclick="eliminarProduto(\'' + p.id + '\')">Eliminar</button></div>'
  ).join('') || '<p style="color:#666">Nenhum produto.</p>';

  return '<h1 class="panel-title">Painel da Empresa</h1><div class="grid-4">' +
    '<div class="small"><h4>Produtos</h4><h2>' + produtos.length + '</h2></div>' +
    '<div class="small"><h4>Pedidos</h4><h2>' + (me.totalPedidos || 0) + '</h2></div>' +
    '<div class="small"><h4>Receita</h4><h2>' + (me.saldo || 0) + ' MT</h2></div>' +
    '<div class="small"><h4>Status</h4><h2 style="color:var(--success)">Aberto</h2></div></div>' +
    '<h2 style="margin-bottom:16px">Cadastrar Produto</h2>' +
    '<input class="input" id="produtoNome" placeholder="Nome do produto">' +
    '<input class="input" id="produtoPreco" type="number" placeholder="Preço (MT)">' +
    '<button class="bigButton" onclick="adicionarProduto()">Adicionar Produto</button>' +
    '<div style="margin-top:28px"><h2 style="margin-bottom:16px">Meus Produtos</h2>' + produtosHtml + '</div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function renderCarteira() {
  if (!token || user.tipo !== 'cliente') {
    return '<h1 class="panel-title">Carteira Thunder</h1><p>Faça login como <b>cliente</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const data = await api('/carteira');
  const cuponsHtml = (data.cupons || []).map(c =>
    '<div class="cupom-card"><h3>' + c.codigo + '</h3><p>Desconto: ' + c.desconto + ' MT ' +
    (c.usado ? '(já usado)' : '') + '</p>' +
    (!c.usado ? '<button class="primary btn-sm" onclick="usarCupom(\'' + c.codigo + '\')">Usar</button>' : '') + '</div>'
  ).join('');
  const extratoHtml = (data.extrato || []).map(e =>
    '<div style="background:#fff;padding:12px 16px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between">' +
    '<span><b>' + e.tipo + '</b></span><span>' + e.valor + ' MT</span></div>'
  ).join('') || '<p style="color:#666">Sem movimentos.</p>';

  return '<h1 class="panel-title">Carteira Thunder</h1><div class="grid-4">' +
    '<div class="small"><h4>Saldo</h4><h2>' + data.saldo + ' MT</h2></div>' +
    '<div class="small"><h4>Pontos</h4><h2>' + data.pontos + '</h2></div>' +
    '<div class="small"><h4>Prime</h4><h2>' + (data.prime ? 'Ativo' : 'Não') + '</h2></div>' +
    '<div class="small"><h4>Cashback</h4><h2>' + (data.cashback || 0) + ' MT</h2></div></div>' +
    '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px">' +
    '<button class="primary" onclick="adicionarSaldo()">+ Adicionar Saldo</button>' +
    '<button class="secondary" onclick="levantarSaldo()">Levantar</button>' +
    (!data.prime ? '<button class="primary" onclick="ativarPrime()">Ativar Thunder Prime (299 MT)</button>' : '') +
    '</div><h2 style="margin-bottom:14px">Cupons</h2><div>' + cuponsHtml + '</div>' +
    '<h2 style="margin:28px 0 14px">Extrato</h2><div>' + extratoHtml + '</div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function renderRastreamento() {
  return '<h1 class="panel-title">Rastreamento em Tempo Real</h1>' +
    '<div class="map-placeholder">🗺️ MAPA DA ENTREGA<br><small style="font-size:14px;opacity:.7">Maputo, Moçambique</small></div>' +
    '<div class="grid-4">' +
    '<div class="small"><h4>Status</h4><h2 id="statusEntrega">Aguardando</h2></div>' +
    '<div class="small"><h4>Tempo</h4><h2 id="tempoEntrega">25 min</h2></div>' +
    '<div class="small"><h4>Distância</h4><h2 id="distanciaEntrega">6.4 km</h2></div>' +
    '<div class="small"><h4>Entregador</h4><h2>Carlos M.</h2></div></div>' +
    '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
    '<button class="primary" onclick="iniciarRastreamento()">Iniciar Simulação</button>' +
    '<button class="secondary" onclick="abrirChat()">Abrir Chat</button></div>' +
    '<div id="janelaChat" style="margin-top:24px"></div>';
}

async function renderAdmin() {
  if (!token || user.tipo !== 'admin') {
    return '<h1 class="panel-title">Painel Administrativo</h1>' +
      '<p>Login: <b>admin@thunder.mz</b> / <b>admin123</b></p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar como Admin</button>';
  }
  const d = await api('/admin/dashboard');
  const recentesHtml = (d.recentes || []).map(p =>
    '<tr><td>' + p.id + '</td><td>' + p.cliente + '</td><td>' + p.tipo + '</td>' +
    '<td>' + p.valor + ' MT</td><td>' + p.status + '</td></tr>'
  ).join('') || '<tr><td colspan="5">Sem pedidos</td></tr>';

  return '<h1 class="panel-title">Painel Administrativo</h1><div class="grid-4">' +
    '<div class="small"><h4>Clientes</h4><h2>' + d.clientes + '</h2></div>' +
    '<div class="small"><h4>Entregadores</h4><h2>' + d.entregadores + '</h2></div>' +
    '<div class="small"><h4>Empresas</h4><h2>' + d.empresas + '</h2></div>' +
    '<div class="small"><h4>Pedidos Hoje</h4><h2>' + d.pedidosHoje + '</h2></div></div>' +
    '<div class="grid-4" style="margin-bottom:28px">' +
    '<div class="small"><h4>Receita</h4><h2>' + d.receita.toLocaleString() + ' MT</h2></div>' +
    '<div class="small"><h4>Lucro</h4><h2>' + d.lucro.toLocaleString() + ' MT</h2></div>' +
    '<div class="small"><h4>Pedidos Ativos</h4><h2>' + d.pedidosAtivos + '</h2></div>' +
    '<div class="small"><h4>Status</h4><h2 style="color:var(--success)">ONLINE</h2></div></div>' +
    '<div class="orders"><h2>Pedidos Recentes</h2><table>' +
    '<tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Valor</th><th>Status</th></tr>' +
    recentesHtml + '</table></div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function criarPedido() {
  const tipo = document.getElementById('tipoPedido').value;
  const origem = document.getElementById('origem').value.trim();
  const destino = document.getElementById('destino').value.trim();
  if (!origem || !destino) return alert('Preencha origem e destino.');
  try {
    const data = await api('/pedidos', { method: 'POST', body: JSON.stringify({ tipo, origem, destino }) });
    alert('Pedido #' + data.pedido.id + ' criado!');
    abrirPainel('cliente');
  } catch (err) { alert(err.message); }
}

async function avancarStatus(id, statusAtual) {
  const fluxo = ['Procurando Entregador','Entregador Encontrado','A Caminho da Loja','Recolhendo Pedido','Em Entrega','Entregue'];
  const idx = fluxo.indexOf(statusAtual);
  if (idx < 0 || idx >= fluxo.length - 1) return;
  try {
    await api('/pedidos/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status: fluxo[idx + 1] }) });
    abrirPainel('cliente');
  } catch (err) { alert(err.message); }
}

async function comprarPlano(nome) {
  try {
    const data = await api('/entregadores/comprar-plano', { method: 'POST', body: JSON.stringify({ plano: nome }) });
    alert(data.mensagem); abrirPainel('entregador');
  } catch (err) { alert(err.message); }
}

async function toggleOnline() {
  try {
    const data = await api('/entregadores/toggle-online', { method: 'POST' });
    alert(data.mensagem); abrirPainel('entregador');
  } catch (err) { alert(err.message); }
}

async function aceitarPedido(id) {
  try {
    const data = await api('/pedidos/' + id + '/aceitar', { method: 'POST' });
    alert(data.mensagem); abrirPainel('entregador');
  } catch (err) { alert(err.message); }
}

async function adicionarProduto() {
  const nome = document.getElementById('produtoNome').value.trim();
  const preco = document.getElementById('produtoPreco').value;
  if (!nome || !preco) return alert('Preencha nome e preço.');
  try {
    await api('/empresas/produtos', { method: 'POST', body: JSON.stringify({ nome, preco: Number(preco) }) });
    abrirPainel('empresa');
  } catch (err) { alert(err.message); }
}

async function eliminarProduto(id) {
  if (!confirm('Eliminar este produto?')) return;
  try { await api('/empresas/produtos/' + id, { method: 'DELETE' }); abrirPainel('empresa'); }
  catch (err) { alert(err.message); }
}

async function editarProduto(id, nomeAtual, precoAtual) {
  const nome = prompt('Novo nome:', nomeAtual); if (nome === null) return;
  const preco = prompt('Novo preço:', precoAtual); if (preco === null) return;
  try {
    await api('/empresas/produtos/' + id, { method: 'PUT', body: JSON.stringify({ nome, preco: Number(preco) }) });
    abrirPainel('empresa');
  } catch (err) { alert(err.message); }
}

async function adicionarSaldo() {
  const v = Number(prompt('Valor a adicionar (MT):')); if (!v || v <= 0) return;
  try {
    const data = await api('/carteira/adicionar', { method: 'POST', body: JSON.stringify({ valor: v }) });
    alert(data.mensagem); abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

async function levantarSaldo() {
  const v = Number(prompt('Valor a levantar (MT):')); if (!v || v <= 0) return;
  try {
    const data = await api('/carteira/levantar', { method: 'POST', body: JSON.stringify({ valor: v }) });
    alert(data.mensagem); abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

async function usarCupom(codigo) {
  try {
    const data = await api('/carteira/cupom', { method: 'POST', body: JSON.stringify({ codigo }) });
    alert(data.mensagem); abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

async function ativarPrime() {
  try {
    const data = await api('/carteira/prime', { method: 'POST' });
    alert(data.mensagem); abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

function iniciarRastreamento() {
  let tempo = 25, dist = 6.4;
  const estados = [{ t: 25, s: 'Entregador a Caminho' }, { t: 18, s: 'Pedido Recolhido' }, { t: 10, s: 'Em Entrega' }, { t: 0, s: 'Entregue' }];
  const interval = setInterval(() => {
    tempo--; dist = Math.max(0, dist - 0.25);
    const elT = document.getElementById('tempoEntrega');
    if (!elT) { clearInterval(interval); return; }
    elT.textContent = tempo + ' min';
    document.getElementById('distanciaEntrega').textContent = dist.toFixed(1) + ' km';
    const est = estados.find(e => tempo <= e.t) || estados[0];
    document.getElementById('statusEntrega').textContent = est.s;
    if (tempo <= 0) { clearInterval(interval); alert('Pedido entregue! 🎉'); }
  }, 1000);
}

function abrirChat() {
  document.getElementById('janelaChat').innerHTML =
    '<div style="background:#fff;padding:20px;border-radius:14px;box-shadow:var(--shadow)">' +
    '<h3 style="margin-bottom:12px">Chat com Entregador</h3>' +
    '<div id="mensagens" style="height:180px;overflow:auto;background:#f5f7fa;padding:12px;border-radius:10px;margin-bottom:12px"></div>' +
    '<input id="textoChat" class="input" placeholder="Digite uma mensagem..." style="margin-bottom:10px">' +
    '<button class="bigButton" onclick="enviarMsg()">Enviar</button></div>';
}

function enviarMsg() {
  const texto = document.getElementById('textoChat').value.trim();
  if (!texto) return;
  const box = document.getElementById('mensagens');
  box.innerHTML += '<div style="margin-bottom:8px;padding:8px 12px;background:#fff;border-radius:8px"><b>Você:</b> ' + texto + '</div>';
  document.getElementById('textoChat').value = '';
  setTimeout(() => {
    box.innerHTML += '<div style="margin-bottom:8px;padding:8px 12px;background:#e8f0fe;border-radius:8px"><b>Carlos:</b> Recebido 👍</div>';
    box.scrollTop = box.scrollHeight;
  }, 800);
}
function voltarServicos() {
  if (typeof mostrarSecao === 'function') {
    mostrarSecao('servicos');
  } else {
    document.getElementById('formProduto').style.display = 'none';
    document.getElementById('servicos').style.display = '';
  }
}

function irParaEntrega() {
  var nomeEl = document.getElementById('produtoNome');
  var pesoEl = document.getElementById('produtoPeso');
  var nome = nomeEl ? nomeEl.value.trim() : '';
  var peso = pesoEl ? pesoEl.value : '';

  if (!nome) return alert('Indique o nome do produto.');
  if (!peso) return alert('Indique o peso.');

  pedidoAtual.nome = nome;
  pedidoAtual.peso = peso;

  if (typeof mostrarSecao === 'function') {
    mostrarSecao('painel');
  } else {
    document.getElementById('formProduto').style.display = 'none';
    var painel = document.getElementById('painel');
    if (painel) painel.style.display = '';
  }

  if (typeof renderFormEntrega === 'function') {
    renderFormEntrega();
  } else {
    alert('Produto: ' + nome + ' (' + peso + ' kg)\nServiço: ' + pedidoAtual.tipo + '\n(No próximo passo aparecem origem e destino)');
  }
}

document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'produtoFoto') {
    var file = e.target.files[0];
    if (!file) return;
    pedidoAtual.foto = file;
    var url = URL.createObjectURL(file);
    var prev = document.getElementById('previewFoto');
    if (prev) {
      prev.innerHTML = '<img src="' + url + '" style="max-width:100%;border-radius:12px;max-height:200px">';
    }
  }
});

document.addEventListener('DOMContentLoaded', () => { abrirPainel('dashboard'); });
function renderFormEntrega() {
  var content = document.getElementById('painelContent');
  if (!content) {
    alert('Painel não encontrado. Confirma que existe id="painelContent" no HTML.');
    return;
  }

  content.innerHTML =
    '<h1 class="panel-title">Dados da entrega</h1>' +
    '<p style="margin-bottom:16px"><b>Serviço:</b> ' + (pedidoAtual.tipo || '') +
    ' — ' + (pedidoAtual.nome || '') + ' (' + (pedidoAtual.peso || '') + ' kg)</p>' +
    '<input id="origem" class="input" placeholder="Local de recolha (origem)">' +
    '<input id="destino" class="input" placeholder="Local de entrega (destino)">' +
    '<input id="contactoEntrega" class="input" placeholder="Telefone de quem recebe">' +
    '<textarea id="obsEntrega" class="input" placeholder="Observações (opcional)" rows="3"></textarea>' +
    '<button class="bigButton" onclick="finalizarPedidoCliente()">Confirmar pedido</button>' +
    '<button class="secondary" style="width:100%;margin-top:12px" onclick="voltarAoProduto()">Voltar ao produto</button>';
}

function voltarAoProduto() {
  if (typeof mostrarSecao === 'function') {
    mostrarSecao('formProduto');
  } else {
    var painel = document.getElementById('painel');
    var form = document.getElementById('formProduto');
    if (painel) painel.style.display = 'none';
    if (form) form.style.display = 'block';
  }
}

async function finalizarPedidoCliente() {
  var origemEl = document.getElementById('origem');
  var destinoEl = document.getElementById('destino');
  var contactoEl = document.getElementById('contactoEntrega');
  var obsEl = document.getElementById('obsEntrega');

  var origem = origemEl ? origemEl.value.trim() : '';
  var destino = destinoEl ? destinoEl.value.trim() : '';
  var contacto = contactoEl ? contactoEl.value.trim() : '';
  var obs = obsEl ? obsEl.value.trim() : '';

  if (!origem || !destino) {
    return alert('Preencha origem e destino.');
  }

  if (!token) {
    alert('Precisa de fazer login.');
    abrirLogin();
    return;
  }

  try {
    var data = await api('/pedidos', {
      method: 'POST',
      body: JSON.stringify({
        tipo: pedidoAtual.tipo || 'Encomenda',
        origem: origem,
        destino: destino,
        valor: 350,
        observacoes:
          'Produto: ' + (pedidoAtual.nome || '') +
          ' | Peso: ' + (pedidoAtual.peso || '') + 'kg' +
          ' | Tel: ' + contacto +
          ' | ' + obs
      })
    });

    alert('Pedido criado com sucesso!' + (data && data.id ? ' Nº ' + data.id : ''));

    pedidoAtual = { tipo: '', nome: '', peso: '', foto: null };

    if (typeof abrirPainel === 'function') {
      abrirPainel('cliente');
    }
  } catch (err) {
    alert(err.message || 'Erro ao criar pedido. Verifique se está logado.');
  }
}