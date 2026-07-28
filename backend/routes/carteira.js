const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

// GET /api/carteira
router.get('/', autenticar, autorizar('cliente'), (req, res) => {
  try {
    const cliente = db.prepare('SELECT saldo, pontos FROM clientes WHERE user_id = ?')
      .get(req.user.id);

    const prime = db.prepare('SELECT * FROM prime WHERE user_id = ?').get(req.user.id);

    const extrato = db.prepare(`
      SELECT * FROM transacoes WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(req.user.id);

    const cupons = db.prepare(`
      SELECT id, codigo, desconto, 
        CASE WHEN usado_por = ? THEN 1 ELSE 0 END as usado
      FROM cupons WHERE ativo = 1
    `).all(req.user.id);

    res.json({
      saldo: cliente?.saldo || 0,
      pontos: cliente?.pontos || 0,
      cashback: 0, // pode calcular a partir de transações
      prime: prime?.ativo ? true : false,
      extrato,
      cupons
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar carteira' });
  }
});

// POST /api/carteira/adicionar
router.post('/adicionar', autenticar, autorizar('cliente'), (req, res) => {
  try {
    const { valor } = req.body;
    const v = Number(valor);

    if (!v || v <= 0) return res.status(400).json({ erro: 'Valor inválido' });

    db.prepare('UPDATE clientes SET saldo = saldo + ? WHERE user_id = ?')
      .run(v, req.user.id);

    db.prepare(`
      INSERT INTO transacoes (id, user_id, tipo, valor, descricao)
      VALUES (?, ?, 'Entrada', ?, 'Adição de saldo')
    `).run(uuidv4(), req.user.id, v);

    const cliente = db.prepare('SELECT saldo FROM clientes WHERE user_id = ?').get(req.user.id);
    res.json({ mensagem: 'Saldo adicionado', saldo: cliente.saldo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao adicionar saldo' });
  }
});

// POST /api/carteira/levantar
router.post('/levantar', autenticar, autorizar('cliente'), (req, res) => {
  try {
    const { valor } = req.body;
    const v = Number(valor);

    if (!v || v <= 0) return res.status(400).json({ erro: 'Valor inválido' });

    const cliente = db.prepare('SELECT saldo FROM clientes WHERE user_id = ?').get(req.user.id);
    if (!cliente || cliente.saldo < v) {
      return res.status(400).json({ erro: 'Saldo insuficiente' });
    }

    db.prepare('UPDATE clientes SET saldo = saldo - ? WHERE user_id = ?')
      .run(v, req.user.id);

    db.prepare(`
      INSERT INTO transacoes (id, user_id, tipo, valor, descricao)
      VALUES (?, ?, 'Levantamento', ?, 'Levantamento de saldo')
    `).run(uuidv4(), req.user.id, v);

    const atualizado = db.prepare('SELECT saldo FROM clientes WHERE user_id = ?').get(req.user.id);
    res.json({ mensagem: 'Levantamento realizado', saldo: atualizado.saldo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao levantar saldo' });
  }
});

// POST /api/carteira/cupom
router.post('/cupom', autenticar, autorizar('cliente'), (req, res) => {
  try {
    const { codigo } = req.body;
    const cupom = db.prepare('SELECT * FROM cupons WHERE codigo = ? AND ativo = 1').get(codigo);

    if (!cupom) return res.status(404).json({ erro: 'Cupom inválido' });
    if (cupom.usado_por) return res.status(400).json({ erro: 'Cupom já utilizado' });

    db.prepare('UPDATE cupons SET usado_por = ? WHERE id = ?').run(req.user.id, cupom.id);

    db.prepare('UPDATE clientes SET pontos = pontos + 20 WHERE user_id = ?').run(req.user.id);

    db.prepare(`
      INSERT INTO transacoes (id, user_id, tipo, valor, descricao)
      VALUES (?, ?, 'Cupom', ?, ?)
    `).run(uuidv4(), req.user.id, cupom.desconto, `Cupom ${codigo}`);

    // Cashback no saldo
    db.prepare('UPDATE clientes SET saldo = saldo + ? WHERE user_id = ?')
      .run(cupom.desconto, req.user.id);

    res.json({
      mensagem: `Cupom ${codigo} aplicado! +${cupom.desconto} MT`,
      desconto: cupom.desconto
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao aplicar cupom' });
  }
});

// POST /api/carteira/prime
router.post('/prime', autenticar, autorizar('cliente'), (req, res) => {
  try {
    const MENSALIDADE = 299;
    const cliente = db.prepare('SELECT saldo FROM clientes WHERE user_id = ?').get(req.user.id);

    if (!cliente || cliente.saldo < MENSALIDADE) {
      return res.status(400).json({ erro: 'Saldo insuficiente' });
    }

    const jaAtivo = db.prepare('SELECT * FROM prime WHERE user_id = ? AND ativo = 1').get(req.user.id);
    if (jaAtivo) return res.status(400).json({ erro: 'Prime já está ativo' });

    db.prepare('UPDATE clientes SET saldo = saldo - ? WHERE user_id = ?')
      .run(MENSALIDADE, req.user.id);

    db.prepare(`
      INSERT OR REPLACE INTO prime (user_id, ativo, plano, ativado_em)
      VALUES (?, 1, 'Mensal', datetime('now'))
    `).run(req.user.id);

    db.prepare(`
      INSERT INTO transacoes (id, user_id, tipo, valor, descricao)
      VALUES (?, ?, 'Thunder Prime', ?, 'Ativação Thunder Prime')
    `).run(uuidv4(), req.user.id, MENSALIDADE);

    res.json({ mensagem: 'Thunder Prime ativado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao ativar Prime' });
  }
});

module.exports = router;
