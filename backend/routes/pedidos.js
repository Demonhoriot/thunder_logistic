const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

// GET /api/pedidos
router.get('/', autenticar, (req, res) => {
  try {
    let pedidos;

    if (req.user.tipo === 'cliente') {
      pedidos = db.prepare(`
        SELECT p.*, u.nome as entregador_nome
        FROM pedidos p
        LEFT JOIN users u ON p.entregador_id = u.id
        WHERE p.cliente_id = ?
        ORDER BY p.created_at DESC
      `).all(req.user.id);
    } else if (req.user.tipo === 'entregador') {
      pedidos = db.prepare(`
        SELECT p.*, u.nome as cliente_nome
        FROM pedidos p
        JOIN users u ON p.cliente_id = u.id
        WHERE p.entregador_id = ? OR (p.status = 'Procurando Entregador' AND p.entregador_id IS NULL)
        ORDER BY p.created_at DESC
      `).all(req.user.id);
    } else if (req.user.tipo === 'admin') {
      pedidos = db.prepare(`
        SELECT p.*, c.nome as cliente_nome, e.nome as entregador_nome
        FROM pedidos p
        LEFT JOIN users c ON p.cliente_id = c.id
        LEFT JOIN users e ON p.entregador_id = e.id
        ORDER BY p.created_at DESC
        LIMIT 100
      `).all();
    } else {
      return res.status(403).json({ erro: 'Sem permissão' });
    }

    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar pedidos' });
  }
});

// POST /api/pedidos — criar (cliente)
router.post('/', autenticar, autorizar('cliente'), (req, res) => {
  try {
    const { tipo, origem, destino, valor, observacoes } = req.body;

    if (!tipo || !origem || !destino) {
      return res.status(400).json({ erro: 'Tipo, origem e destino são obrigatórios' });
    }

    const valorFinal = valor ? Number(valor) : Math.floor(Math.random() * 400) + 150;
    const id = uuidv4().slice(0, 8).toUpperCase();

    db.prepare(`
      INSERT INTO pedidos (id, cliente_id, tipo, origem, destino, valor, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Procurando Entregador')
    `).run(id, req.user.id, tipo, origem, destino, valorFinal, observacoes || '');

    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);

    res.status(201).json({
      mensagem: 'Pedido criado com sucesso',
      id: pedido.id,
      pedido
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar pedido' });
  }
});

// PATCH /api/pedidos/:id/status
router.patch('/:id/status', autenticar, (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const statusValidos = [
      'Procurando Entregador',
      'Entregador Encontrado',
      'A Caminho da Loja',
      'Recolhendo Pedido',
      'Em Entrega',
      'Entregue',
      'Cancelado'
    ];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }

    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });

    if (req.user.tipo === 'cliente' && pedido.cliente_id !== req.user.id) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }
    if (req.user.tipo === 'entregador' && pedido.entregador_id !== req.user.id) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }

    db.prepare(`
      UPDATE pedidos SET status = ?, updated_at = datetime('now') WHERE id = ?
    `).run(status, id);

    if (status === 'Entregue') {
      db.prepare('UPDATE clientes SET pontos = pontos + 10 WHERE user_id = ?')
        .run(pedido.cliente_id);

      if (pedido.entregador_id) {
        db.prepare(`
          UPDATE entregadores
          SET saldo = saldo + ?, total_entregas = total_entregas + 1
          WHERE user_id = ?
        `).run(pedido.valor * 0.7, pedido.entregador_id);
      }
    }

    const atualizado = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    res.json({ mensagem: 'Status atualizado', pedido: atualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar status' });
  }
});

// POST /api/pedidos/:id/aceitar — entregador aceita
router.post('/:id/aceitar', autenticar, autorizar('entregador'), (req, res) => {
  try {
    const { id } = req.params;

    const entregador = db.prepare('SELECT * FROM entregadores WHERE user_id = ?').get(req.user.id);
    if (!entregador || !entregador.online) {
      return res.status(400).json({ erro: 'Precisa estar online e com plano ativo' });
    }
    if (entregador.entregas_disponiveis <= 0) {
      return res.status(400).json({ erro: 'Plano esgotado. Compre mais entregas.' });
    }

    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ? AND status = ?')
      .get(id, 'Procurando Entregador');

    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido não disponível' });
    }

    db.prepare(`
      UPDATE pedidos
      SET entregador_id = ?, status = 'Entregador Encontrado', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.user.id, id);

    db.prepare(`
      UPDATE entregadores SET entregas_disponiveis = entregas_disponiveis - 1 WHERE user_id = ?
    `).run(req.user.id);

    const atualizado = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    res.json({ mensagem: 'Pedido aceite', pedido: atualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao aceitar pedido' });
  }
});

// GET /api/pedidos/disponiveis/lista
router.get('/disponiveis/lista', autenticar, autorizar('entregador'), (req, res) => {
  try {
    const pedidos = db.prepare(`
      SELECT p.*, u.nome as cliente_nome
      FROM pedidos p
      JOIN users u ON p.cliente_id = u.id
      WHERE p.status = 'Procurando Entregador' AND p.entregador_id IS NULL
      ORDER BY p.created_at ASC
      LIMIT 10
    `).all();

    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar pedidos disponíveis' });
  }
});

module.exports = router;
