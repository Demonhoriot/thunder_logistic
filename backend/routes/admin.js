const express = require('express');
const db = require('../db/database');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas admin exigem autenticação + tipo admin
router.use(autenticar, autorizar('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
  try {
    const clientes = db.prepare("SELECT COUNT(*) as total FROM users WHERE tipo = 'cliente'").get().total;
    const entregadores = db.prepare("SELECT COUNT(*) as total FROM users WHERE tipo = 'entregador'").get().total;
    const empresas = db.prepare("SELECT COUNT(*) as total FROM users WHERE tipo = 'empresa'").get().total;

    const pedidosHoje = db.prepare(`
      SELECT COUNT(*) as total FROM pedidos
      WHERE date(created_at) = date('now')
    `).get().total;

    const pedidosAtivos = db.prepare(`
      SELECT COUNT(*) as total FROM pedidos
      WHERE status NOT IN ('Entregue', 'Cancelado')
    `).get().total;

    const receita = db.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total FROM pedidos
      WHERE status = 'Entregue'
    `).get().total;

    const lucro = Math.round(receita * 0.3); // 30% margem estimada

    const recentes = db.prepare(`
      SELECT p.id, p.tipo, p.valor, p.status, p.created_at, u.nome as cliente
      FROM pedidos p
      JOIN users u ON p.cliente_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      clientes,
      entregadores,
      empresas,
      pedidosHoje,
      pedidosAtivos,
      receita,
      lucro,
      recentes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar dashboard' });
  }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, nome, email, telefone, tipo, created_at
    FROM users ORDER BY created_at DESC LIMIT 100
  `).all();
  res.json(users);
});

// GET /api/admin/pedidos
router.get('/pedidos', (req, res) => {
  const pedidos = db.prepare(`
    SELECT p.*, c.nome as cliente_nome, e.nome as entregador_nome
    FROM pedidos p
    LEFT JOIN users c ON p.cliente_id = c.id
    LEFT JOIN users e ON p.entregador_id = e.id
    ORDER BY p.created_at DESC
    LIMIT 100
  `).all();
  res.json(pedidos);
});

module.exports = router;
