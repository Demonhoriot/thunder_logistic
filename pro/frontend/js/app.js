/* Thunder Logistic PRO — App dos Entregadores */
const API = window.location.origin.includes('localhost')
  ? 'http://localhost:3001/api'
  : (window.THUNDER_API || 'https://thunderlogistic-production.up.railway.app/api');

let token = localStorage.getItem('thunder_pro_token') || '';
let user = JSON.parse(localStorage.getItem('thunder_pro_user') || 'null');

const planos = [
  { nome: 'Starter', valor: 300, entregas: 20 },
  { nome: 'Bronze', valor: 600, entregas: 45 },
  { nome: 'Silver', valor: 1200, entregas: 95 },
  { nome: 'Gold', valor: 2500, entregas: 220 },
  { nome: 'Platinum', valor: 5000, entregas: 500 }
];

let estado = {
  online: false,
  plano: null,
  saldo: 0,
  entregasDisponiveis: 0,
  entregasFeitas: 0,
  pedidoAtual: null
};

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || data.message || 'Erro na API');
  return data;
}

function salvarSessao(t, u) {
  token = t;
  user = u;
  localStorage.setItem('thunder_pro_token', t);
  localStorage.setItem('thunder_pro_user', JSON.stringify(u));
}

function logout() {
  token = '';
  user = null;
  localStorage.removeItem('thunder_pro_token');
  localStorage.removeItem('thunder_pro_user');
  document.getElementById('app').style.display = 'none';
  document.getElementById('inicio').style.display = '';
  document.getElementById('btnEntrar').style.display = '';
  document.getElementById('btnCadastrar').style.display = '';
}

function abrirLogin() {
  document.getElementById('authModal').classList.add('show');
  mostrarTab('login');
}
function abrirCadastro() {
  document.getElementById('authModal').classList.add('show');
  mostrarTab('cadastro');
}
function fecharModais() {
  document.getElementById('authModal').classList.remove('show');
}
function mostrarTab(tab) {
  document.getElementById('formLogin').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('formCadastro').style.display = tab === 'cadastro' ? '' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabCadastro').classList.toggle('active', tab === 'cadastro');
}

window.onclick = function (e) {
  if (e.target.classList.contains('modal')) fecharModais();
};

async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  if (!email || !senha) return alert('Preencha email e senha.');
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    if (data.user.tipo !== 'entregador' && data.user.tipo !== 'admin') {
      return alert('Esta conta não é de entregador. Use o app Thunder Pro só para entregadores.');
    }
    salvarSessao(data.token, data.user);
    fecharModais();
    entrarApp();
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
  if (!nome || !email || !senha) return alert('Preencha os campos obrigatórios.');
  if (senha !== conf) return alert('As senhas não coincidem.');
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, telefone, senha, tipo: 'entregador' })
    });
    salvarSessao(data.token, data.user);
    fecharModais();
    entrarApp();
  } catch (err) {
    alert(err.message);
  }
}

function entrarApp() {
  document.getElementById('inicio').style.display = 'none';
  document.getElementById('app').style.display = '';
  document.getElementById('btnEntrar').style.display = 'none';
  document.getElementById('btnCadastrar').style.display = 'none';
  document.getElementById('sideNome').textContent = (user && user.nome) ? user.nome.split(' ')[0] : 'Entregador';
  abrirVista('home');
  carregarPerfilEntregador();
}

async function carregarPerfilEntregador() {
  try {
    const data = await api('/entregadores/me');
    if (data) {
      estado.online = !!data.online;
      estado.plano = data.plano || null;
      estado.saldo = data.saldo || 0;
      estado.entregasDisponiveis = data.entregas_disponiveis || 0;
      estado.entregasFeitas = data.entregas || 0;
      actualizarStatusUI();
    }
  } catch (_) {
    // API pode não ter /me — usa estado local
  }
}

function actualizarStatusUI() {
  const el = document.getElementById('sideStatus');
  if (!el) return;
  el.textContent = estado.online ? 'Online' : 'Offline';
  el.className = estado.online ? 'status-on' : 'status-off';
}

function abrirVista(nome) {
  document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
  const map = { home: 0, pedidos: 1, planos: 2, ganhos: 3, perfil: 4 };
  const items = document.querySelectorAll('.sidebar li');
  if (map[nome] !== undefined && items[map[nome]]) items[map[nome]].classList.add('active');

  const main = document.getElementById('mainContent');
  const views = { home: renderHome, pedidos: renderPedidos, planos: renderPlanos, ganhos: renderGanhos, perfil: renderPerfil };
  main.innerHTML = (views[nome] || renderHome)();
}

function renderHome() {
  return `
    <h1 class="panel-title">Olá, ${(user && user.nome) ? user.nome.split(' ')[0] : 'Entregador'} 👋</h1>
    <div class="toggle-row">
      <div>
        <strong>Status de trabalho</strong>
        <p style="color:var(--muted);font-size:13px;margin-top:4px">Fique online para receber pedidos</p>
      </div>
      <button class="toggle-btn ${estado.online ? 'on' : 'off'}" onclick="alternarOnline()">
        ${estado.online ? '● Online' : '○ Offline'}
      </button>
    </div>
    <div class="grid-3">
      <div class="card"><h4>Saldo</h4><h2 class="green">${estado.saldo} MT</h2></div>
      <div class="card"><h4>Plano</h4><h2 class="yellow">${estado.plano || 'Nenhum'}</h2></div>
      <div class="card"><h4>Entregas restantes</h4><h2>${estado.entregasDisponiveis}</h2></div>
    </div>
    <div id="pedidoBox">
      ${estado.online
        ? '<div class="pedido-card"><p>À procura de pedidos perto de si...</p></div>'
        : '<div class="pedido-card"><p>Fique online para ver pedidos disponíveis.</p></div>'}
    </div>
  `;
}

function renderPedidos() {
  return `
    <h1 class="panel-title">📦 Pedidos</h1>
    <div class="pedido-card">
      <h3>Como funciona</h3>
      <p>1. Compre um plano</p>
      <p>2. Fique online</p>
      <p>3. Aceite pedidos dos clientes (app Thunder Logistic)</p>
      <p>4. Entregue e receba no saldo</p>
    </div>
    <div id="listaPedidosPro">A carregar pedidos disponíveis...</div>
  `;
}

function renderPlanos() {
  const cards = planos.map((p, i) => `
    <div class="plan">
      <h3>${p.nome}</h3>
      <div class="price">${p.valor} MT</div>
      <p>${p.entregas} entregas</p>
      <button class="btn-yellow" onclick="comprarPlano(${i})">Comprar</button>
    </div>
  `).join('');
  return `
    <h1 class="panel-title">💳 Planos</h1>
    <p style="color:var(--muted);margin-bottom:16px">Escolha um plano para começar a receber pedidos.</p>
    <div class="plan-grid">${cards}</div>
  `;
}

function renderGanhos() {
  return `
    <h1 class="panel-title">💰 Ganhos</h1>
    <div class="grid-2">
      <div class="card"><h4>Saldo disponível</h4><h2 class="green">${estado.saldo} MT</h2></div>
      <div class="card"><h4>Entregas feitas</h4><h2>${estado.entregasFeitas}</h2></div>
    </div>
    <div class="pedido-card" style="margin-top:16px">
      <h3>Levantar saldo</h3>
      <p>Contacte o suporte Thunder ou use o painel CEO para processar levantamentos.</p>
      <button class="btn-ok" onclick="alert('Pedido de levantamento registado. A equipa Thunder contacta-o em breve.')">Pedir levantamento</button>
    </div>
  `;
}

function renderPerfil() {
  return `
    <h1 class="panel-title">👤 Perfil</h1>
    <div class="card">
      <p><b>Nome:</b> ${(user && user.nome) || '-'}</p>
      <p style="margin-top:8px"><b>Email:</b> ${(user && user.email) || '-'}</p>
      <p style="margin-top:8px"><b>Tipo:</b> Entregador</p>
      <p style="margin-top:8px"><b>Plano:</b> ${estado.plano || 'Nenhum'}</p>
    </div>
    <button class="bigButton" style="background:#3a1a1a;color:#ff8a8a;margin-top:16px" onclick="logout()">Terminar sessão</button>
  `;
}

async function alternarOnline() {
  if (!estado.plano) {
    alert('Compre um plano primeiro.');
    abrirVista('planos');
    return;
  }
  if (estado.entregasDisponiveis <= 0) {
    alert('O seu plano terminou. Compre outro plano.');
    abrirVista('planos');
    return;
  }
  estado.online = !estado.online;
  actualizarStatusUI();
  try {
    await api('/entregadores/online', {
      method: 'POST',
      body: JSON.stringify({ online: estado.online })
    });
  } catch (_) {}
  abrirVista('home');
  if (estado.online) setTimeout(mostrarPedidoDemo, 3000);
}

function mostrarPedidoDemo() {
  if (!estado.online) return;
  const box = document.getElementById('pedidoBox');
  if (!box) return;
  box.innerHTML = `
    <div class="pedido-card" style="border-color:var(--primary)">
      <h3>🆕 Novo pedido perto de si</h3>
      <p><b>Origem:</b> Restaurante Central</p>
      <p><b>Destino:</b> Bairro Central</p>
      <p><b>Distância:</b> 4.8 km</p>
      <p><b>Pagamento:</b> 350 MT</p>
      <div class="row-btns">
        <button class="btn-ok" onclick="aceitarPedido()">Aceitar</button>
        <button class="btn-no" onclick="recusarPedido()">Recusar</button>
      </div>
    </div>
  `;
}

function aceitarPedido() {
  estado.saldo += 350;
  estado.entregasDisponiveis = Math.max(0, estado.entregasDisponiveis - 1);
  estado.entregasFeitas += 1;
  const box = document.getElementById('pedidoBox');
  if (box) {
    box.innerHTML = `
      <div class="pedido-card">
        <h3>✓ Pedido aceite</h3>
        <p>Dirija-se à origem. Depois marque como entregue.</p>
        <button class="btn-ok" onclick="concluirEntrega()">Marcar como entregue</button>
      </div>
    `;
  }
  try {
    api('/entregadores/aceitar', { method: 'POST', body: JSON.stringify({ valor: 350 }) });
  } catch (_) {}
}

function concluirEntrega() {
  alert('Entrega concluída! +350 MT');
  abrirVista('home');
  if (estado.online && estado.entregasDisponiveis > 0) setTimeout(mostrarPedidoDemo, 5000);
}

function recusarPedido() {
  const box = document.getElementById('pedidoBox');
  if (box) box.innerHTML = '<div class="pedido-card"><p>Pedido recusado. À procura de outro...</p></div>';
  if (estado.online) setTimeout(mostrarPedidoDemo, 4000);
}

async function comprarPlano(i) {
  const p = planos[i];
  estado.plano = p.nome;
  estado.entregasDisponiveis = p.entregas;
  alert('Plano ' + p.nome + ' activado!');
  try {
    await api('/entregadores/plano', {
      method: 'POST',
      body: JSON.stringify({ plano: p.nome, entregas: p.entregas, valor: p.valor })
    });
  } catch (_) {}
  abrirVista('home');
}

document.addEventListener('DOMContentLoaded', () => {
  if (token && user) {
    if (user.tipo === 'entregador' || user.tipo === 'admin') entrarApp();
    else logout();
  }
});
