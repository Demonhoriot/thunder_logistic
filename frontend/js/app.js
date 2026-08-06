/* =========================================================
   THUNDER LOGISTIC — Site de CLIENTES (versão final)
   ========================================================= */

const API = window.location.origin + '/api';

let token = localStorage.getItem('thunder_token') || null;
let user = JSON.parse(localStorage.getItem('thunder_user') || 'null');
let pedidoAtual = { tipo: '', nome: '', peso: '', foto: null };

/* ---------- Toast ---------- */
function mostrarToast(msg, tipo) {
  var old = document.querySelector('.toast');
  if (old) old.remove();
  var t = document.createElement('div');
  t.className = 'toast ' + (tipo || '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.classList.add('show'); }, 10);
  setTimeout(function () {
    t.classList.remove('show');
    setTimeout(function () { t.remove(); }, 300);
  }, 2800);
}

/* ---------- Secções ---------- */
function mostrarSecao(id) {
  ['inicio', 'servicos', 'formProduto', 'painel'].forEach(function (sec) {
    var el = document.getElementById(sec);
    if (el) el.style.display = (sec === id) ? '' : 'none';
  });
  var footer = document.getElementById('contato');
  if (footer) footer.style.display = (id === 'inicio') ? 'none' : '';
}

function irPara(sec) {
  if (sec === 'servicos') {
    if (!token || !user) return abrirLogin();
    mostrarSecao('servicos');
  }
}

/* ---------- API ---------- */
async function api(endpoint, options) {
  options = options || {};
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  var res = await fetch(API + endpoint, {
    method: options.method || 'GET',
    headers: headers,
    body: options.body || undefined
  });
  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error(data.erro || data.message || 'Erro na requisição');
  return data;
}

function salvarSessao(t, u) {
  token = t;
  user = u;
  localStorage.setItem('thunder_token', t);
  localStorage.setItem('thunder_user', JSON.stringify(u));
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem('thunder_token');
  localStorage.removeItem('thunder_user');
  mostrarSecao('inicio');
  mostrarToast('Sessão terminada.', 'ok');
}

/* ---------- Auth modal ---------- */
function fecharModais() {
  document.querySelectorAll('.modal').forEach(function (m) {
    m.classList.remove('show');
  });
}

function mostrarAuthTab(tab) {
  var loginPanel = document.getElementById('authLogin');
  var cadPanel = document.getElementById('authCadastro');
  var tabLogin = document.getElementById('tabLogin');
  var tabCadastro = document.getElementById('tabCadastro');
  var title = document.getElementById('authTitle');
  var subtitle = document.getElementById('authSubtitle');

  if (tab === 'cadastro') {
    if (loginPanel) loginPanel.style.display = 'none';
    if (cadPanel) cadPanel.style.display = 'block';
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabCadastro) tabCadastro.classList.add('active');
    if (title) title.textContent = 'Cadastrar';
    if (subtitle) subtitle.textContent = 'Cria a tua conta de cliente.';
  } else {
    if (loginPanel) loginPanel.style.display = 'block';
    if (cadPanel) cadPanel.style.display = 'none';
    if (tabLogin) tabLogin.classList.add('active');
    if (tabCadastro) tabCadastro.classList.remove('active');
    if (title) title.textContent = 'Entrar';
    if (subtitle) subtitle.textContent = 'Acede à tua conta para pedir.';
  }
}

function abrirLogin() {
  fecharModais();
  mostrarAuthTab('login');
  var m = document.getElementById('authModal');
  if (m) m.classList.add('show');
}

function abrirCadastro() {
  fecharModais();
  mostrarAuthTab('cadastro');
  var m = document.getElementById('authModal');
  if (m) m.classList.add('show');
}

window.onclick = function (e) {
  if (e.target.classList.contains('modal')) fecharModais();
};

/* ---------- Fluxo pedido ---------- */
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
  var label = document.getElementById('tipoServicoLabel');
  if (label) label.textContent = tipo;
  var nomeEl = document.getElementById('produtoNome');
  var pesoEl = document.getElementById('produtoPeso');
  var fotoEl = document.getElementById('produtoFoto');
  var prev = document.getElementById('previewFoto');
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
  var nomeEl = document.getElementById('produtoNome');
  var pesoEl = document.getElementById('produtoPeso');
  var nome = nomeEl ? nomeEl.value.trim() : '';
  var peso = pesoEl ? pesoEl.value : '';
  if (!nome) return mostrarToast('Indique o nome do produto.', 'err');
  if (!peso) return mostrarToast('Indique o peso.', 'err');
  pedidoAtual.nome = nome;
  pedidoAtual.peso = peso;
  mostrarSecao('painel');
  setTituloPainel('Nova entrega', pedidoAtual.tipo + ' · ' + nome);
  renderFormEntrega();
}

function setTituloPainel(titulo, sub) {
  var t = document.getElementById('painelTitulo');
  var s = document.getElementById('painelSub');
  if (t) t.textContent = titulo;
  if (s) s.textContent = sub || '';
}

function setNavActive(id) {
  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.classList.remove('active');
  });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function renderFormEntrega() {
  var content = document.getElementById('painelContent');
  if (!content) return;
  content.innerHTML =
    '<h2 class="panel-title">Dados da entrega</h2>' +
    '<p style="margin-bottom:14px;color:#64748b;font-size:14px"><b>' +
    (pedidoAtual.tipo || '') + '</b> — ' + (pedidoAtual.nome || '') +
    ' (' + (pedidoAtual.peso || '') + ' kg)</p>' +
    '<input id="origem" class="input" placeholder="Local de recolha (origem)">' +
    '<input id="destino" class="input" placeholder="Local de entrega (destino)">' +
    '<input id="contactoEntrega" class="input" placeholder="Telefone de quem recebe">' +
    '<textarea id="obsEntrega" class="input" placeholder="Observações (opcional)" rows="3"></textarea>' +
    '<button type="button" class="bigButton" onclick="finalizarPedidoCliente()">Confirmar pedido</button>' +
    '<button type="button" class="btn-outline" onclick="mostrarSecao(\'formProduto\')">Voltar</button>';
}

async function finalizarPedidoCliente() {
  var origem = (document.getElementById('origem') || {}).value || '';
  var destino = (document.getElementById('destino') || {}).value || '';
  var contacto = (document.getElementById('contactoEntrega') || {}).value || '';
  var obs = (document.getElementById('obsEntrega') || {}).value || '';
  origem = origem.trim();
  destino = destino.trim();
  if (!origem || !destino) return mostrarToast('Preencha origem e destino.', 'err');
  if (!token) {
    mostrarToast('Precisa de fazer login.', 'err');
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
          ' | Tel: ' + contacto.trim() +
          (obs.trim() ? ' | ' + obs.trim() : '')
      })
    });
    var id = (data.pedido && data.pedido.id) || data.id || '';
    mostrarToast('Pedido criado!' + (id ? ' Nº ' + id : ''), 'ok');
    pedidoAtual = { tipo: '', nome: '', peso: '', foto: null };
    abrirPainel('cliente');
  } catch (err) {
    mostrarToast(err.message || 'Erro ao criar pedido.', 'err');
  }
}

/* ---------- Login / Cadastro (só cliente) ---------- */
async function fazerLogin() {
  var email = ((document.getElementById('loginEmail') || {}).value || '').trim();
  var senha = (document.getElementById('loginSenha') || {}).value || '';
  if (!email || !senha) return mostrarToast('Preencha email e senha.', 'err');
  try {
    var data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email, senha: senha })
    });
    if (data.user && data.user.tipo && data.user.tipo !== 'cliente') {
      mostrarToast('Este site é só para clientes.', 'err');
      return;
    }
    salvarSessao(data.token, data.user);
    fecharModais();
    mostrarToast('Bem-vindo(a), ' + data.user.nome, 'ok');
    mostrarSecao('servicos');
  } catch (err) {
    mostrarToast(err.message || 'Erro no login', 'err');
  }
}

async function cadastrar() {
  var nome = ((document.getElementById('cadNome') || {}).value || '').trim();
  var telefone = ((document.getElementById('cadTelefone') || {}).value || '').trim();
  var email = ((document.getElementById('cadEmail') || {}).value || '').trim();
  var senha = (document.getElementById('cadSenha') || {}).value || '';
  var conf = (document.getElementById('cadConfirmar') || {}).value || '';
  if (!nome || !email || !senha) return mostrarToast('Preencha os campos obrigatórios.', 'err');
  if (senha !== conf) return mostrarToast('As senhas não coincidem.', 'err');
  try {
    var data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nome: nome,
        email: email,
        telefone: telefone,
        senha: senha,
        tipo: 'cliente'
      })
    });
    salvarSessao(data.token, data.user);
    fecharModais();
    mostrarToast('Conta criada! Bem-vindo(a), ' + data.user.nome, 'ok');
    mostrarSecao('servicos');
  } catch (err) {
    mostrarToast(err.message || 'Erro no registo', 'err');
  }
}

/* ---------- Painéis ---------- */
function abrirPainel(tipo) {
  if (!token || !user) {
    abrirLogin();
    return;
  }
  mostrarSecao('painel');
  var content = document.getElementById('painelContent');
  if (!content) return;

  if (tipo === 'cliente') {
    setTituloPainel('Meus Pedidos', 'Histórico e estado das entregas');
    setNavActive('navPedidos');
    renderCliente().then(function (html) { content.innerHTML = html; })
      .catch(function (err) { content.innerHTML = '<p style="color:#dc2626">' + err.message + '</p>'; });
  } else if (tipo === 'carteira') {
    setTituloPainel('Carteira', 'Saldo, pontos e movimentos');
    setNavActive('navCarteira');
    renderCarteira().then(function (html) { content.innerHTML = html; })
      .catch(function (err) { content.innerHTML = '<p style="color:#dc2626">' + err.message + '</p>'; });
  } else if (tipo === 'rastreamento') {
    setTituloPainel('Rastreio', 'Mapa e acompanhamento');
    setNavActive('navRastreio');
    renderRastreamento().then(function (html) { content.innerHTML = html; })
      .catch(function (err) { content.innerHTML = '<p style="color:#dc2626">' + err.message + '</p>'; });
  }
}

async function renderCliente() {
  var me = await api('/auth/me');
  var pedidos = await api('/pedidos');
  var lista = (pedidos || []).map(function (p) {
    return '<div class="pedido-card">' +
      '<h3>Pedido #' + p.id + '</h3>' +
      '<p><b>Serviço:</b> ' + (p.tipo || '') + '</p>' +
      '<p><b>Origem:</b> ' + (p.origem || '') + '</p>' +
      '<p><b>Destino:</b> ' + (p.destino || '') + '</p>' +
      '<p><b>Valor:</b> ' + (p.valor || 0) + ' MT</p>' +
      '<p><b>Status:</b> ' + (p.status || '') + '</p>' +
      '<button type="button" class="btn-sm" onclick="abrirRastreioPedido(\'' + p.id + '\',\'' +
      encodeURIComponent(p.destino || 'Maputo') + '\')">Ver no mapa</button>' +
      '</div>';
  }).join('') || '<p style="color:#64748b">Ainda não tem pedidos.</p>';

  return '<div class="grid-4">' +
    '<div class="small"><h4>Carteira</h4><h2>' + (me.saldo || 0) + ' MT</h2></div>' +
    '<div class="small"><h4>Pontos</h4><h2>' + (me.pontos || 0) + '</h2></div>' +
    '<div class="small"><h4>Pedidos</h4><h2>' + (pedidos ? pedidos.length : 0) + '</h2></div>' +
    '<div class="small"><h4>Estado</h4><h2 style="color:#059669">Ativo</h2></div>' +
    '</div><h3 style="margin:8px 0 14px;font-size:16px">Os seus pedidos</h3>' + lista;
}

async function renderCarteira() {
  var data = await api('/carteira');
  var extrato = (data.extrato || []).map(function (e) {
    return '<div class="pedido-card" style="display:flex;justify-content:space-between">' +
      '<span>' + (e.tipo || '') + '</span><b>' + (e.valor || 0) + ' MT</b></div>';
  }).join('') || '<p style="color:#64748b">Sem movimentos.</p>';

  return '<div class="grid-4">' +
    '<div class="small"><h4>Saldo</h4><h2>' + (data.saldo || 0) + ' MT</h2></div>' +
    '<div class="small"><h4>Pontos</h4><h2>' + (data.pontos || 0) + '</h2></div>' +
    '<div class="small"><h4>Prime</h4><h2>' + (data.prime ? 'Sim' : 'Não') + '</h2></div>' +
    '<div class="small"><h4>Cashback</h4><h2>' + (data.cashback || 0) + ' MT</h2></div>' +
    '</div><h3 style="margin:8px 0 14px;font-size:16px">Extrato</h3>' + extrato;
}

async function renderRastreamento() {
  var pedidos = [];
  try { pedidos = await api('/pedidos'); } catch (e) {}
  var ativos = (pedidos || []).filter(function (p) {
    return p.status !== 'Entregue' && p.status !== 'Cancelado';
  });
  if (!ativos.length) {
    return '<p style="color:#64748b;margin-bottom:16px">Nenhum pedido em curso.</p>' +
      mapaEmbed('Maputo, Mozambique') +
      '<p style="margin-top:12px;font-size:13px;color:#64748b">Mapa geral de Maputo. Quando tiver um pedido activo, escolha-o para ver o destino.</p>';
  }
  var lista = ativos.map(function (p) {
    return '<div class="pedido-card">' +
      '<h3>#' + p.id + ' — ' + (p.tipo || '') + '</h3>' +
      '<p>' + (p.origem || '') + ' → ' + (p.destino || '') + '</p>' +
      '<p><b>' + (p.status || '') + '</b></p>' +
      '<button type="button" class="btn-sm" onclick="abrirRastreioPedido(\'' + p.id + '\',\'' +
      encodeURIComponent(p.destino || 'Maputo') + '\')">Abrir mapa e chat</button></div>';
  }).join('');
  return lista;
}

function mapaEmbed(query) {
  var q = encodeURIComponent(query || 'Maputo, Mozambique');
  return '<div class="map-wrap">' +
    '<iframe title="Mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
    'src="https://maps.google.com/maps?q=' + q + '&z=14&output=embed"></iframe></div>';
}

function abrirRastreioPedido(id, destinoEnc) {
  var destino = decodeURIComponent(destinoEnc || 'Maputo');
  setTituloPainel('Rastreio #' + id, destino);
  setNavActive('navRastreio');
  var content = document.getElementById('painelContent');
  if (!content) return;
  content.innerHTML =
    mapaEmbed(destino + ', Maputo') +
    '<div class="grid-4">' +
    '<div class="small"><h4>Status</h4><h2 style="font-size:16px">Em caminho</h2></div>' +
    '<div class="small"><h4>Tempo</h4><h2 style="font-size:16px">~25 min</h2></div>' +
    '<div class="small"><h4>Destino</h4><h2 style="font-size:14px">' + destino + '</h2></div>' +
    '<div class="small"><h4>Pedido</h4><h2 style="font-size:16px">#' + id + '</h2></div></div>' +
    '<h3 style="margin:8px 0 10px;font-size:16px">💬 Chat com o entregador</h3>' +
    '<div class="chat-box" id="chatBox"><p style="color:#64748b">Escreva uma mensagem abaixo.</p></div>' +
    '<input id="chatMsg" class="input" placeholder="Mensagem...">' +
    '<button type="button" class="bigButton" onclick="enviarMsgLocal(\'' + id + '\')">Enviar</button>' +
    '<button type="button" class="btn-outline" onclick="abrirPainel(\'rastreamento\')">Voltar</button>';
  carregarChatLocal(id);
}

function carregarChatLocal(pedidoId) {
  var box = document.getElementById('chatBox');
  if (!box) return;
  var key = 'thunder_chat_' + pedidoId;
  var msgs = [];
  try { msgs = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
  if (!msgs.length) return;
  box.innerHTML = msgs.map(function (m) {
    return '<p><b>' + m.remetente + ':</b> ' + m.texto +
      ' <small style="color:#94a3b8">' + m.hora + '</small></p>';
  }).join('');
  box.scrollTop = box.scrollHeight;
}

function enviarMsgLocal(pedidoId) {
  var input = document.getElementById('chatMsg');
  var msg = input ? input.value.trim() : '';
  if (!msg) return;
  var hora = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  var key = 'thunder_chat_' + pedidoId;
  var msgs = [];
  try { msgs = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
  msgs.push({ remetente: 'Você', texto: msg, hora: hora });
  localStorage.setItem(key, JSON.stringify(msgs));
  if (input) input.value = '';
  carregarChatLocal(pedidoId);

  /* Tenta API se existir */
  api('/chat/' + pedidoId, {
    method: 'POST',
    body: JSON.stringify({ texto: msg })
  }).catch(function () {});
}

/* Preview foto */
document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'produtoFoto') {
    var file = e.target.files[0];
    if (!file) return;
    pedidoAtual.foto = file;
    var url = URL.createObjectURL(file);
    var prev = document.getElementById('previewFoto');
    if (prev) prev.innerHTML = '<img src="' + url + '" alt="Pré-visualização">';
  }
});

/* Arranque */
document.addEventListener('DOMContentLoaded', function () {
  mostrarSecao('inicio');
});
