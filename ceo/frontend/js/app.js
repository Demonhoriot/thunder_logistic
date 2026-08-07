/* Thunder CEO — Painel Admin */
const API = window.location.origin.includes('localhost')
  ? 'http://localhost:3001/api'
  : (window.THUNDER_API || 'https://thunderlogistic-production.up.railway.app/api');

let token = localStorage.getItem('thunder_ceo_token') || '';
let user = JSON.parse(localStorage.getItem('thunder_ceo_user') || 'null');

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
  localStorage.setItem('thunder_ceo_token', t);
  localStorage.setItem('thunder_ceo_user', JSON.stringify(u));
}

function logout() {
  token = '';
  user = null;
  localStorage.removeItem('thunder_ceo_token');
  localStorage.removeItem('thunder_ceo_user');
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = '';
}

async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  if (!email || !senha) return alert('Preencha email e senha.');
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    if (data.user.tipo !== 'admin') {
      return alert('Acesso negado. Só contas admin entram no CEO.');
    }
    salvarSessao(data.token, data.user);
    entrarApp();
  } catch (err) {
    alert(err.message);
  }
}

function entrarApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'grid';
  document.getElementById('ceoNome').textContent = user.nome || 'Admin';
  document.getElementById('ceoEmail').textContent = user.email || '';
  abrirVista('dashboard');
}

function abrirVista(nome) {
  if (nome === 'logout') return logout();

  document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
  const map = { dashboard: 0, pedidos: 1, users: 2, entregadores: 3, clientes: 4 };
  const items = document.querySelectorAll('.sidebar li');
  if (map[nome] !== undefined && items[map[nome]]) items[map[nome]].classList.add('active');

  const main = document.getElementById('mainContent');
  const views = {
    dashboard: renderDashboard,
    pedidos: renderPedidos,
    users: renderUsers,
    entregadores: renderEntregadores,
    clientes: renderClientes
  };
  main.innerHTML = '<p class="empty">A carregar...</p>';
  (views[nome] || renderDashboard)().then(html => {
    main.innerHTML = html;
  }).catch(err => {
    main.innerHTML = '<p class="empty" style="color:var(--red)">' + err.message + '</p>';
  });
}

function badgeStatus(s) {
  if (!s) return '';
  if (s === 'Entregue' || s === 'Concluído') return '<span class="badge ok">' + s + '</span>';
  if (s === 'Cancelado') return '<span class="badge cancel">' + s + '</span>';
  if (s.includes('Procurando') || s.includes('andamento') || s.includes('Caminho') || s.includes('Entrega'))
    return '<span class="badge wait">' + s + '</span>';
  return '<span class="badge info">' + s + '</span>';
}

async function renderDashboard() {
  const d = await api('/admin/dashboard');
  const recentes = (d.recentes || []).map(p =>
    '<tr>' +
    '<td>#' + p.id + '</td>' +
    '<td>' + (p.cliente || '—') + '</td>' +
    '<td>' + p.tipo + '</td>' +
    '<td>' + p.valor + ' MT</td>' +
    '<td>' + badgeStatus(p.status) + '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="5" class="empty">Sem pedidos</td></tr>';

  return `
    <h1 class="panel-title">Dashboard</h1>
    <p class="panel-sub">Visão geral da operação Thunder Logistic</p>
    <div class="grid-4">
      <div class="stat"><h4>Clientes</h4><h2 class="purple">${d.clientes || 0}</h2></div>
      <div class="stat"><h4>Entregadores</h4><h2 class="green">${d.entregadores || 0}</h2></div>
      <div class="stat"><h4>Empresas</h4><h2 class="yellow">${d.empresas || 0}</h2></div>
      <div class="stat"><h4>Pedidos hoje</h4><h2>${d.pedidosHoje || 0}</h2></div>
    </div>
    <div class="grid-4">
      <div class="stat"><h4>Pedidos ativos</h4><h2 class="wait">${d.pedidosAtivos || 0}</h2></div>
      <div class="stat"><h4>Receita (entregues)</h4><h2 class="green">${Number(d.receita || 0).toLocaleString()} MT</h2></div>
      <div class="stat"><h4>Lucro estimado</h4><h2 class="purple">${Number(d.lucro || 0).toLocaleString()} MT</h2></div>
      <div class="stat"><h4>Sistema</h4><h2 class="green">ONLINE</h2></div>
    </div>
    <div class="card">
      <h3>Pedidos recentes</h3>
      <table>
        <tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Valor</th><th>Status</th></tr>
        ${recentes}
      </table>
    </div>
  `;
}

async function renderPedidos() {
  const pedidos = await api('/admin/pedidos');
  const rows = (pedidos || []).map(p =>
    '<tr>' +
    '<td>#' + p.id + '</td>' +
    '<td>' + (p.cliente_nome || '—') + '</td>' +
    '<td>' + (p.entregador_nome || '—') + '</td>' +
    '<td>' + p.tipo + '</td>' +
    '<td>' + p.origem + ' → ' + p.destino + '</td>' +
    '<td>' + p.valor + ' MT</td>' +
    '<td>' + badgeStatus(p.status) + '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="7" class="empty">Sem pedidos</td></tr>';

  return `
    <h1 class="panel-title">📦 Pedidos</h1>
    <p class="panel-sub">Todos os pedidos da plataforma</p>
    <div class="card">
      <table>
        <tr>
          <th>ID</th><th>Cliente</th><th>Entregador</th>
          <th>Tipo</th><th>Rota</th><th>Valor</th><th>Status</th>
        </tr>
        ${rows}
      </table>
    </div>
  `;
}

async function renderUsers() {
  const users = await api('/admin/users');
  const rows = (users || []).map(u =>
    '<tr>' +
    '<td>' + u.nome + '</td>' +
    '<td>' + u.email + '</td>' +
    '<td>' + (u.telefone || '—') + '</td>' +
    '<td><span class="badge info">' + u.tipo + '</span></td>' +
    '<td>' + (u.created_at || '').slice(0, 10) + '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="5" class="empty">Sem utilizadores</td></tr>';

  return `
    <h1 class="panel-title">👥 Utilizadores</h1>
    <p class="panel-sub">Clientes, entregadores, empresas e admins</p>
    <div class="card">
      <table>
        <tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Tipo</th><th>Desde</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

async function renderEntregadores() {
  const users = await api('/admin/users');
  const lista = (users || []).filter(u => u.tipo === 'entregador');
  const rows = lista.map(u =>
    '<tr>' +
    '<td>' + u.nome + '</td>' +
    '<td>' + u.email + '</td>' +
    '<td>' + (u.telefone || '—') + '</td>' +
    '<td>' + (u.created_at || '').slice(0, 10) + '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="4" class="empty">Nenhum entregador registado</td></tr>';

  return `
    <h1 class="panel-title">🏍 Entregadores</h1>
    <p class="panel-sub">Contas do Thunder Pro</p>
    <div class="card">
      <table>
        <tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Desde</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

async function renderClientes() {
  const users = await api('/admin/users');
  const lista = (users || []).filter(u => u.tipo === 'cliente');
  const rows = lista.map(u =>
    '<tr>' +
    '<td>' + u.nome + '</td>' +
    '<td>' + u.email + '</td>' +
    '<td>' + (u.telefone || '—') + '</td>' +
    '<td>' + (u.created_at || '').slice(0, 10) + '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="4" class="empty">Nenhum cliente registado</td></tr>';

  return `
    <h1 class="panel-title">🛒 Clientes</h1>
    <p class="panel-sub">Contas do site Thunder Logistic</p>
    <div class="card">
      <table>
        <tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Desde</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  if (token && user && user.tipo === 'admin') {
    entrarApp();
  }
});
