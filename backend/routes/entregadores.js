const express = require('express');
const db = require('../db/database');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

const PLANOS = [
  { nome: 'Starter', valor: 300, entregas: 20 },
  { nome: 'Bronze', valor: 600, entregas: 45 },
  { nome: 'Silver', valor: 1200, entregas: 95 },
  { nome: 'Gold', valor: 2500, entregas: 220 },
  { nome: 'Platinum', valor: 5000, entregas: 500 }
];

// GET /api/entregadores/planos
router.get('/planos', (req, res) => {
  res.json(PLANOS);
});

// GET /api/entregadores/me
router.get('/me', autenticar, autorizar('entregador', 'admin'), (req, res) => {
  const data = db.prepare(`
    SELECT e.*, u.nome, u.email, u.telefone
    FROM entregadores e
    JOIN users u ON e.user_id = u.id
    WHERE e.user_id = ?
  `).get(req.user.id);

  if (!data) return res.status(404).json({ erro: 'Perfil não encontrado' });
  res.json(data);
});

// POST /api/entregadores/comprar-plano  (e alias /plano)
router.post('/comprar-plano', autenticar, autorizar('entregador'), comprarPlano);
router.post('/plano', autenticar, autorizar('entregador'), comprarPlano);

function comprarPlano(req, res) {
  try {
    const { plano, entregas, valor } = req.body;
    const encontrado = PLANOS.find(p => p.nome === plano);

    if (!encontrado && !plano) {
      return res.status(400).json({ erro: 'Plano inválido' });
    }

    const nomePlano = encontrado ? encontrado.nome : plano;
    const qtd = encontrado ? encontrado.entregas : (entregas || 20);

    db.prepare(`
      UPDATE entregadores
      SET plano = ?, entregas_disponiveis = entregas_disponiveis + ?
      WHERE user_id = ?
    `).run(nomePlano, qtd, req.user.id);

    const atualizado = db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id);

    res.json({
      mensagem: `Plano ${nomePlano} adquirido com sucesso`,
      entregador: atualizado
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao comprar plano' });
  }
}

// POST /api/entregadores/toggle-online  (e alias /online)
router.post('/toggle-online', autenticar, autorizar('entregador'), toggleOnline);
router.post('/online', autenticar, autorizar('entregador'), toggleOnlineBody);

function toggleOnline(req, res) {
  try {
    const entregador = db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id);

    if (!entregador.plano) {
      return res.status(400).json({ erro: 'Compre um plano primeiro' });
    }
    if (entregador.entregas_disponiveis <= 0 && !entregador.online) {
      return res.status(400).json({ erro: 'Sem entregas disponíveis no plano' });
    }

    const novoEstado = entregador.online ? 0 : 1;
    db.prepare('UPDATE entregadores SET online = ? WHERE user_id = ?')
      .run(novoEstado, req.user.id);

    res.json({
      mensagem: novoEstado ? 'Agora está Online' : 'Agora está Offline',
      online: !!novoEstado
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao alterar status' });
  }
}

function toggleOnlineBody(req, res) {
  try {
    const entregador = db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id);
    if (!entregador) return res.status(404).json({ erro: 'Entregador não encontrado' });

    if (!entregador.plano) {
      return res.status(400).json({ erro: 'Compre um plano primeiro' });
    }

    const online = req.body.online ? 1 : 0;
    db.prepare('UPDATE entregadores SET online = ? WHERE user_id = ?')
      .run(online, req.user.id);

    res.json({ mensagem: online ? 'Online' : 'Offline', online: !!online });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao alterar status' });
  }
}

// POST /api/entregadores/aceitar — registo local de ganho (opcional)
router.post('/aceitar', autenticar, autorizar('entregador'), (req, res) => {
  try {
    const valor = Number(req.body.valor) || 350;
    db.prepare(`
      UPDATE entregadores
      SET saldo = saldo + ?, total_entregas = total_entregas + 1
      WHERE user_id = ?
    `).run(valor, req.user.id);
    const atualizado = db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id);
    res.json({ mensagem: 'Ganho registado', entregador: atualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registar' });
  }
});

module.exports = router;
