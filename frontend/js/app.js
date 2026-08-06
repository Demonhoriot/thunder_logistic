/* =========================================================
   THUNDER LOGISTIC — Frontend (conectado à API)
   ========================================================= */

const API = window.location.origin + '/api';

let token = localStorage.getItem('thunder_token') || null;
let user = JSON.parse(localStorage.getItem('thunder_user') || 'null');
let pedidoAtual = { tipo: '', nome: '', peso: '', foto: null };

/* ---------- Secções (footer nunca esconde) ---------- */
function mostrarSecao(id) {
  const secoes = ['inicio', 'servicos', 'painel', 'formProduto'];
  secoes.forEach(function (sec) {
    const el = document.getElementById(sec);
    if (el) el.style.display = (sec === id) ? '' : 'none';
  });
  const footer = document.getElementById('contato');
  if (footer) footer.style.display = '';
}

/* ---------- API helper ---------- */
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...options.headers
  };
  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || data.message || 'Erro na requisição');
  return data;
}

function salvarSessao(t, u) {
  token = t;
  user = u;
  localStorage.setItem('thunder_token', t);
  localStorage.setItem('thunder_user', JSON.stringify(u));
  atualizarBotaoAuth();
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem('thunder_token');
  localStorage.removeItem('thunder_user');
  atualizarBotaoAuth();
  mostrarSecao('inicio');
  alert('Sessão terminada.');
}

function atualizarBotaoAuth() {
  const btn = document.getElementById('btnAuth');
  if (!btn) return;
  if (user) {
    btn.textContent = user.nome ? user.nome.split(' ')[0] : 'Conta';
    btn.onclick = function () {
      if (user.tipo === 'cliente') {
        mostrarSecao('painel');
        abrirPainel('cliente');
      } else {
        abrirPainelPorTipo(user.tipo);
      }
    };
  } else {
    btn.textContent = 'Entrar';
    btn.onclick = abrirLogin;
  }
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  if (menu) menu.classList.toggle('open');
}

/* ---------- Auth Modal Profissional ---------- */
function fecharModais() {
  document.querySelectorAll('.modal').forEach(function (m) {
    m.classList.remove('show');
  });
}

function mostrarAuthTab(tab) {
  const loginPanel = document.getElementById('authLogin');
  const cadPanel = document.getElementById('authCadastro');
  const tabLogin = document.getElementById('tabLogin');
  const tabCadastro = document.getElementById('tabCadastro');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');

  if (!loginPanel || !cadPanel) return;

  if (tab === 'cadastro') {
    loginPanel.style.display = 'none';
    cadPanel.style.display = 'block';
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabCadastro) tabCadastro.classList.add('active');
    if (title) title.textContent = 'Criar conta';
    if (subtitle) subtitle.textContent = 'Regista-te para fazer o teu pedido em minutos.';
  } else {
    loginPanel.style.display = 'block';
    cadPanel.style.display = 'none';
    if (tabLogin) tabLogin.classList.add('active');
    if (tabCadastro) tabCadastro.classList.remove('active');
    if (title) title.textContent = 'Entrar para pedir';
    if (subtitle) subtitle.textContent = 'Acede à tua conta ou cria uma em segundos.';
  }
}

function abrirLogin() {
  fecharModais();
  mostrarAuthTab('login');
  const m = document.getElementById('authModal');
  if (m) m.classList.add('show');
}

function abrirCadastro() {
  fecharModais();
  mostrarAuthTab('cadastro');
  const m = document.getElementById('authModal');
  if (m) m.classList.add('show');
}

window.onclick = function (e) {
  if (e.target.classList.contains('modal')) fecharModais();
};

/* ---------- Fluxo de pedido ---------- */
function iniciarPedido() {
  if (!token || !user) {
    abrirLogin();
    return;
  }
  mostrarSecao('servicos');
}

function escolherServico(tipo) {
  if (!token || !user) {
    abrirLogin();
    return;
  }
  pedidoAtual = { tipo: tipo, nome: '', peso: '', foto: null };

  const label = document.getElementById('tipoServicoLabel');
  if (label) label.textContent = tipo;

  const nomeEl = document.getElementById('produtoNome');
  const pesoEl = document.getElementById('produtoPeso');
  const fotoEl = document.getElementById('produtoFoto');
  const prev = document.getElementById('previewFoto');
  if (nomeEl) nomeEl.value = '';
  if (pesoEl) pesoEl.value = '';
  if (fotoEl) fotoEl.value = '';
  if (prev) prev.innerHTML = '';

  mostrarSecao('formProduto');
}

function voltarServicos() {
  mostrarSecao('servicos');
}

function irParaEntrega() {
  const nomeEl = document.getElementById('produtoNome');
  const pesoEl = document.getElementById('produtoPeso');
  const nome = nomeEl ? nomeEl.value.trim() : '';
  const peso = pesoEl ? pesoEl.value : '';

  if (!nome) return alert('Indique o nome do produto.');
  if (!peso) return alert('Indique o peso.');

  pedidoAtual.nome = nome;
  pedidoAtual.peso = peso;

  mostrarSecao('painel');
  renderFormEntrega();
}

function voltarAoProduto() {
  mostrarSecao('formProduto');
}

function renderFormEntrega() {
  const content = document.getElementById('painelContent');
  if (!content) return;

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

async function finalizarPedidoCliente() {
  const origem = (document.getElementById('origem') || {}).value?.trim() || '';
  const destino = (document.getElementById('destino') || {}).value?.trim() || '';
  const contacto = (document.getElementById('contactoEntrega') || {}).value?.trim() || '';
  const obs = (document.getElementById('obsEntrega') || {}).value?.trim() || '';

  if (!origem || !destino) return alert('Preencha origem e destino.');
  if (!token) {
    alert('Precisa de fazer login.');
    abrirLogin();
    return;
  }

  try {
    const data = await api('/pedidos', {
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
          (obs ? ' | ' + obs : '')
      })
    });

    const id = (data.pedido && data.pedido.id) || data.id || '';
    alert('Pedido criado com sucesso!' + (id ? ' Nº ' + id : ''));
    pedidoAtual = { tipo: '', nome: '', peso: '', foto: null };
    abrirPainel('cliente');
  } catch (err) {
    alert(err.message || 'Erro ao criar pedido.');
  }
}

/* ---------- Auth ---------- */
async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  if (!email || !senha) return alert('Preencha email/telefone e senha.');
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email, senha: senha })
    });
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
  const tipoEl = document.getElementById('cadTipo');
  const tipo = (tipoEl && tipoEl.value) || 'cliente';

  if (!nome || !email || !senha) return alert('Preencha os campos obrigatórios.');
  if (senha !== conf) return alert('As senhas não coincidem.');

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome: nome, email: email, telefone: telefone, senha: senha, tipo: tipo })
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

/* ---------- Painel ---------- */
function abrirPainelPorTipo(tipo) {
  const map = {
    cliente: 'cliente',
    entregador: 'entregador',
    empresa: 'empresa',
    admin: 'admin'
  };
  mostrarSecao('painel');
  abrirPainel(map[tipo] || 'cliente');
}

function abrirPainel(tipo) {
  mostrarSecao('painel');

  document.querySelectorAll('.sidebar li').forEach(function (li) {
    li.classList.remove('active');
  });
  const items = document.querySelectorAll('.sidebar li');
  const mapIndex = { cliente: 1, carteira: 2, rastreamento: 3 };
  if (mapIndex[tipo] !== undefined && items[mapIndex[tipo]]) {
    items[mapIndex[tipo]].classList.add('active');
  }

  const content = document.getElementById('painelContent');
  if (!content) return;

  const renderers = {
    cliente: renderCliente,
    entregador: renderEntregador,
    empresa: renderEmpresa,
    carteira: renderCarteira,
    rastreamento: renderRastreamento,
    admin: renderAdmin
  };

  const fn = renderers[tipo] || renderCliente;
  fn()
    .then(function (html) {
      content.innerHTML = html;
    })
    .catch(function (err) {
      content.innerHTML =
        '<p style="color:red;padding:20px">' + err.message + '</p>' +
        '<p style="padding:0 20px"><button class="primary" onclick="abrirLogin()">Fazer Login</button></p>';
    });
}

async function renderCliente() {
  if (!token || !user || user.tipo !== 'cliente') {
    return '<h1 class="panel-title">Área do Cliente</h1><p>Faça login como <b>cliente</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const me = await api('/auth/me');
  const pedidos = await api('/pedidos');
  const pedidosHtml = (pedidos || []).map(function (p) {
    return '<div class="pedido-card"><h3>Pedido #' + p.id + '</h3>' +
      '<p><b>Serviço:</b> ' + p.tipo + '</p><p><b>Origem:</b> ' + p.origem + '</p>' +
      '<p><b>Destino:</b> ' + p.destino + '</p><p><b>Valor:</b> ' + p.valor + ' MT</p>' +
      '<p><b>Status:</b> <span style="color:var(--primary);font-weight:600">' + p.status + '</span></p></div>';
  }).join('') || '<p style="color:#666">Nenhum pedido ainda.</p>';

  return '<h1 class="panel-title">Olá, ' + me.nome + ' 👋</h1><div class="grid-4">' +
    '<div class="small"><h4>Carteira</h4><h2>' + (me.saldo || 0) + ' MT</h2></div>' +
    '<div class="small"><h4>Pontos</h4><h2>' + (me.pontos || 0) + '</h2></div>' +
    '<div class="small"><h4>Pedidos</h4><h2>' + (pedidos || []).length + '</h2></div>' +
    '<div class="small"><h4>Status</h4><h2 style="color:#16a34a">Ativo</h2></div></div>' +
    '<div style="margin-top:24px"><button class="primary" onclick="mostrarSecao(\'servicos\')">Novo Pedido</button></div>' +
    '<div style="margin-top:30px"><h2 style="margin-bottom:16px">Meus Pedidos</h2>' +
    '<div id="listaPedidos">' + pedidosHtml + '</div></div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function renderEntregador() {
  if (!token || !user || user.tipo !== 'entregador') {
    return '<h1 class="panel-title">Área do Entregador</h1><p>Faça login como <b>entregador</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const me = await api('/entregadores/me');
  const planos = await api('/entregadores/planos');
  let disponiveis = [];
  try { disponiveis = await api('/pedidos/disponiveis/lista'); } catch (_) {}

  const planosHtml = (planos || []).map(function (p) {
    return '<div class="plan-card"><h3>' + p.nome + '</h3>' +
      '<h2 style="color:var(--primary);margin:8px 0">' + p.valor + ' MT</h2>' +
      '<p>' + p.entregas + ' entregas</p>' +
      '<button class="primary btn-sm" style="margin-top:12px;width:100%" onclick="comprarPlano(\'' + p.nome + '\')">Comprar</button></div>';
  }).join('');

  const pedidosHtml = (disponiveis || []).map(function (p) {
    return '<div class="pedido-card" style="border-left:5px solid var(--primary)">' +
      '<h3>Pedido #' + p.id + '</h3><p>' + p.tipo + ' — ' + p.origem + ' → ' + p.destino + '</p>' +
      '<p><b>' + p.valor + ' MT</b></p>' +
      '<button class="primary btn-sm" onclick="aceitarPedido(\'' + p.id + '\')">Aceitar</button></div>';
  }).join('') || '<p style="color:#666">Nenhum pedido disponível.</p>';

  return '<h1 class="panel-title">Painel do Entregador</h1><div class="grid-4">' +
    '<div class="small"><h4>Status</h4><h2>' + (me.online ? 'Online' : 'Offline') + '</h2></div>' +
    '<div class="small"><h4>Saldo</h4><h2>' + me.saldo + ' MT</h2></div>' +
    '<div class="small"><h4>Plano</h4><h2>' + (me.plano || 'Nenhum') + '</h2></div>' +
    '<div class="small"><h4>Entregas Restantes</h4><h2>' + me.entregas_disponiveis + '</h2></div></div>' +
    '<h2 style="margin:24px 0 16px">Comprar Plano</h2><div class="grid-4">' + planosHtml + '</div>' +
    '<button class="bigButton" style="margin-top:24px" onclick="toggleOnline()">' +
    (me.online ? 'Ficar Offline' : 'Entrar Online') + '</button>' +
    '<div style="margin-top:28px"><h2 style="margin-bottom:16px">Pedidos Disponíveis</h2>' + pedidosHtml + '</div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function renderEmpresa() {
  if (!token || !user || user.tipo !== 'empresa') {
    return '<h1 class="panel-title">Área da Empresa</h1><p>Faça login como <b>empresa</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const me = await api('/empresas/me');
  const produtos = me.produtos || [];
  const produtosHtml = produtos.map(function (p) {
    return '<div class="product-card"><h3>' + p.nome + '</h3><p>Preço: <b>' + p.preco + ' MT</b></p>' +
      '<button class="primary btn-sm" onclick="editarProduto(\'' + p.id + '\',\'' + p.nome + '\',' + p.preco + ')">Editar</button> ' +
      '<button class="secondary btn-sm" onclick="eliminarProduto(\'' + p.id + '\')">Eliminar</button></div>';
  }).join('') || '<p style="color:#666">Nenhum produto.</p>';

  return '<h1 class="panel-title">Painel da Empresa</h1><div class="grid-4">' +
    '<div class="small"><h4>Produtos</h4><h2>' + produtos.length + '</h2></div>' +
    '<div class="small"><h4>Pedidos</h4><h2>' + (me.totalPedidos || 0) + '</h2></div>' +
    '<div class="small"><h4>Receita</h4><h2>' + (me.saldo || 0) + ' MT</h2></div>' +
    '<div class="small"><h4>Status</h4><h2 style="color:#16a34a">Aberto</h2></div></div>' +
    '<h2 style="margin-bottom:16px">Cadastrar Produto</h2>' +
    '<input class="input" id="produtoNomeEmp" placeholder="Nome do produto">' +
    '<input class="input" id="produtoPreco" type="number" placeholder="Preço (MT)">' +
    '<button class="bigButton" onclick="adicionarProduto()">Adicionar Produto</button>' +
    '<div style="margin-top:28px"><h2 style="margin-bottom:16px">Meus Produtos</h2>' + produtosHtml + '</div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function renderCarteira() {
  if (!token || !user || user.tipo !== 'cliente') {
    return '<h1 class="panel-title">Carteira Thunder</h1><p>Faça login como <b>cliente</b>.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const data = await api('/carteira');
  const cuponsHtml = (data.cupons || []).map(function (c) {
    return '<div class="cupom-card"><h3>' + c.codigo + '</h3><p>Desconto: ' + c.desconto + ' MT ' +
      (c.usado ? '(já usado)' : '') + '</p>' +
      (!c.usado ? '<button class="primary btn-sm" onclick="usarCupom(\'' + c.codigo + '\')">Usar</button>' : '') + '</div>';
  }).join('');
  const extratoHtml = (data.extrato || []).map(function (e) {
    return '<div style="background:#fff;padding:12px 16px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between">' +
      '<span><b>' + e.tipo + '</b></span><span>' + e.valor + ' MT</span></div>';
  }).join('') || '<p style="color:#666">Sem movimentos.</p>';

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
  if (!token || !user || user.tipo !== 'admin') {
    return '<h1 class="panel-title">Painel Administrativo</h1>' +
      '<p>Faça login como administrador.</p>' +
      '<button class="primary" onclick="abrirLogin()">Entrar</button>';
  }
  const d = await api('/admin/dashboard');
  const recentesHtml = (d.recentes || []).map(function (p) {
    return '<tr><td>' + p.id + '</td><td>' + p.cliente + '</td><td>' + p.tipo + '</td>' +
      '<td>' + p.valor + ' MT</td><td>' + p.status + '</td></tr>';
  }).join('') || '<tr><td colspan="5">Sem pedidos</td></tr>';

  return '<h1 class="panel-title">Painel Administrativo</h1><div class="grid-4">' +
    '<div class="small"><h4>Clientes</h4><h2>' + d.clientes + '</h2></div>' +
    '<div class="small"><h4>Entregadores</h4><h2>' + d.entregadores + '</h2></div>' +
    '<div class="small"><h4>Empresas</h4><h2>' + d.empresas + '</h2></div>' +
    '<div class="small"><h4>Pedidos Hoje</h4><h2>' + d.pedidosHoje + '</h2></div></div>' +
    '<div class="grid-4" style="margin-bottom:28px">' +
    '<div class="small"><h4>Receita</h4><h2>' + Number(d.receita || 0).toLocaleString() + ' MT</h2></div>' +
    '<div class="small"><h4>Lucro</h4><h2>' + Number(d.lucro || 0).toLocaleString() + ' MT</h2></div>' +
    '<div class="small"><h4>Pedidos Ativos</h4><h2>' + d.pedidosAtivos + '</h2></div>' +
    '<div class="small"><h4>Status</h4><h2 style="color:#16a34a">ONLINE</h2></div></div>' +
    '<div class="orders"><h2>Pedidos Recentes</h2><table>' +
    '<tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Valor</th><th>Status</th></tr>' +
    recentesHtml + '</table></div>' +
    '<p style="margin-top:20px"><button class="secondary" onclick="logout()">Sair</button></p>';
}

async function comprarPlano(nome) {
  try {
    const data = await api('/entregadores/comprar-plano', {
      method: 'POST',
      body: JSON.stringify({ plano: nome })
    });
    alert(data.mensagem);
    abrirPainel('entregador');
  } catch (err) { alert(err.message); }
}

async function toggleOnline() {
  try {
    const data = await api('/entregadores/toggle-online', { method: 'POST' });
    alert(data.mensagem);
    abrirPainel('entregador');
  } catch (err) { alert(err.message); }
}

async function aceitarPedido(id) {
  try {
    const data = await api('/pedidos/' + id + '/aceitar', { method: 'POST' });
    alert(data.mensagem);
    abrirPainel('entregador');
  } catch (err) { alert(err.message); }
}

async function adicionarProduto() {
  const nomeEl = document.getElementById('produtoNomeEmp');
  const precoEl = document.getElementById('produtoPreco');
  const nome = nomeEl ? nomeEl.value.trim() : '';
  const preco = precoEl ? precoEl.value : '';
  if (!nome || !preco) return alert('Preencha nome e preço.');
  try {
    await api('/empresas/produtos', {
      method: 'POST',
      body: JSON.stringify({ nome: nome, preco: Number(preco) })
    });
    abrirPainel('empresa');
  } catch (err) { alert(err.message); }
}

async function eliminarProduto(id) {
  if (!confirm('Eliminar este produto?')) return;
  try {
    await api('/empresas/produtos/' + id, { method: 'DELETE' });
    abrirPainel('empresa');
  } catch (err) { alert(err.message); }
}

async function editarProduto(id, nomeAtual, precoAtual) {
  const nome = prompt('Novo nome:', nomeAtual);
  if (nome === null) return;
  const preco = prompt('Novo preço:', precoAtual);
  if (preco === null) return;
  try {
    await api('/empresas/produtos/' + id, {
      method: 'PUT',
      body: JSON.stringify({ nome: nome, preco: Number(preco) })
    });
    abrirPainel('empresa');
  } catch (err) { alert(err.message); }
}

async function adicionarSaldo() {
  const v = Number(prompt('Valor a adicionar (MT):'));
  if (!v || v <= 0) return;
  try {
    const data = await api('/carteira/adicionar', {
      method: 'POST',
      body: JSON.stringify({ valor: v })
    });
    alert(data.mensagem);
    abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

async function levantarSaldo() {
  const v = Number(prompt('Valor a levantar (MT):'));
  if (!v || v <= 0) return;
  try {
    const data = await api('/carteira/levantar', {
      method: 'POST',
      body: JSON.stringify({ valor: v })
    });
    alert(data.mensagem);
    abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

async function usarCupom(codigo) {
  try {
    const data = await api('/carteira/cupom', {
      method: 'POST',
      body: JSON.stringify({ codigo: codigo })
    });
    alert(data.mensagem);
    abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

async function ativarPrime() {
  try {
    const data = await api('/carteira/prime', { method: 'POST' });
    alert(data.mensagem);
    abrirPainel('carteira');
  } catch (err) { alert(err.message); }
}

function iniciarRastreamento() {
  let tempo = 25;
  let dist = 6.4;
  const estados = [
    { t: 25, s: 'Entregador a Caminho' },
    { t: 18, s: 'Pedido Recolhido' },
    { t: 10, s: 'Em Entrega' },
    { t: 0, s: 'Entregue' }
  ];
  const interval = setInterval(function () {
    tempo--;
    dist = Math.max(0, dist - 0.25);
    const elT = document.getElementById('tempoEntrega');
    if (!elT) { clearInterval(interval); return; }
    elT.textContent = tempo + ' min';
    document.getElementById('distanciaEntrega').textContent = dist.toFixed(1) + ' km';
    const est = estados.find(function (e) { return tempo <= e.t; }) || estados[0];
    document.getElementById('statusEntrega').textContent = est.s;
    if (tempo <= 0) {
      clearInterval(interval);
      alert('Pedido entregue! 🎉');
    }
  }, 1000);
}

function abrirChat() {
  const box = document.getElementById('janelaChat');
  if (!box) return;
  box.innerHTML =
    '<div style="background:#fff;padding:20px;border-radius:14px;box-shadow:var(--shadow)">' +
    '<h3 style="margin-bottom:12px">Chat com Entregador</h3>' +
    '<div id="mensagens" style="height:180px;overflow:auto;background:#f5f7fa;padding:12px;border-radius:10px;margin-bottom:12px"></div>' +
    '<input id="textoChat" class="input" placeholder="Digite uma mensagem..." style="margin-bottom:10px">' +
    '<button class="bigButton" onclick="enviarMsg()">Enviar</button></div>';
}

function enviarMsg() {
  const textoEl = document.getElementById('textoChat');
  const texto = textoEl ? textoEl.value.trim() : '';
  if (!texto) return;
  const box = document.getElementById('mensagens');
  if (!box) return;
  box.innerHTML += '<div style="margin-bottom:8px;padding:8px 12px;background:#fff;border-radius:8px"><b>Você:</b> ' + texto + '</div>';
  textoEl.value = '';
  setTimeout(function () {
    box.innerHTML += '<div style="margin-bottom:8px;padding:8px 12px;background:#e8f0fe;border-radius:8px"><b>Carlos:</b> Recebido 👍</div>';
    box.scrollTop = box.scrollHeight;
  }, 800);
}

document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'produtoFoto') {
    const file = e.target.files[0];
    if (!file) return;
    pedidoAtual.foto = file;
    const url = URL.createObjectURL(file);
    const prev = document.getElementById('previewFoto');
    if (prev) {
      prev.innerHTML = '<img src="' + url + '" style="max-width:100%;border-radius:12px;max-height:200px" alt="Preview">';
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  mostrarSecao('inicio');
  atualizarBotaoAuth();
});