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

router.get('/planos', (req, res) => res.json(PLANOS));

router.get('/me', autenticar, autorizar('entregador', 'admin'), (req, res) => {
  const data = db.prepare(`
    SELECT e.*, u.nome, u.email, u.telefone
    FROM entregadores e JOIN users u ON e.user_id = u.id
    WHERE e.user_id = ?
  `).get(req.user.id);
  if (!data) return res.status(404).json({ erro: 'Perfil não encontrado' });
  res.json(data);
});

function comprarPlano(req, res) {
  try {
    const { plano, entregas } = req.body;
    const encontrado = PLANOS.find(p => p.nome === plano);
    if (!encontrado && !plano) return res.status(400).json({ erro: 'Plano inválido' });

    const nomePlano = encontrado ? encontrado.nome : plano;
    const qtd = encontrado ? encontrado.entregas : (Number(entregas) || 20);

    db.prepare(`
      UPDATE entregadores SET plano = ?, entregas_disponiveis = entregas_disponiveis + ?
      WHERE user_id = ?
    `).run(nomePlano, qtd, req.user.id);

    res.json({
      mensagem: `Plano ${nomePlano} activado`,
      entregador: db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao comprar plano' });
  }
}

router.post('/comprar-plano', autenticar, autorizar('entregador'), comprarPlano);
router.post('/plano', autenticar, autorizar('entregador'), comprarPlano);

router.post('/toggle-online', autenticar, autorizar('entregador'), (req, res) => {
  try {
    const e = db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id);
    if (!e.plano) return res.status(400).json({ erro: 'Compre um plano primeiro' });
    if (e.entregas_disponiveis <= 0 && !e.online) {
      return res.status(400).json({ erro: 'Sem entregas no plano' });
    }
    const novo = e.online ? 0 : 1;
    db.prepare('UPDATE entregadores SET online = ? WHERE user_id = ?').run(novo, req.user.id);
    res.json({ mensagem: novo ? 'Online' : 'Offline', online: !!novo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao alterar status' });
  }
});

router.post('/online', autenticar, autorizar('entregador'), (req, res) => {
  try {
    const e = db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id);
    if (!e) return res.status(404).json({ erro: 'Não encontrado' });
    if (!e.plano) return res.status(400).json({ erro: 'Compre um plano primeiro' });
    const online = req.body.online ? 1 : 0;
    db.prepare('UPDATE entregadores SET online = ? WHERE user_id = ?').run(online, req.user.id);
    res.json({ mensagem: online ? 'Online' : 'Offline', online: !!online });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro' });
  }
});

module.exports = router;
