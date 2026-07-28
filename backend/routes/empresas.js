const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

// GET /api/empresas/me
router.get('/me', autenticar, autorizar('empresa'), (req, res) => {
  const empresa = db.prepare(`
    SELECT e.*, u.nome, u.email, u.telefone
    FROM empresas e
    JOIN users u ON e.user_id = u.id
    WHERE e.user_id = ?
  `).get(req.user.id);

  if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada' });

  const produtos = db.prepare('SELECT * FROM produtos WHERE empresa_id = ? AND ativo = 1')
    .all(req.user.id);

  const totalPedidos = db.prepare(`
    SELECT COUNT(*) as total FROM pedidos WHERE tipo = 'Empresa'
  `).get();

  res.json({ ...empresa, produtos, totalPedidos: totalPedidos?.total || 0 });
});

// GET /api/empresas/produtos
router.get('/produtos', autenticar, autorizar('empresa'), (req, res) => {
  const produtos = db.prepare('SELECT * FROM produtos WHERE empresa_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(produtos);
});

// POST /api/empresas/produtos
router.post('/produtos', autenticar, autorizar('empresa'), (req, res) => {
  try {
    const { nome, preco } = req.body;
    if (!nome || !preco) {
      return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO produtos (id, empresa_id, nome, preco) VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, nome, Number(preco));

    const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
    res.status(201).json({ mensagem: 'Produto adicionado', produto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao adicionar produto' });
  }
});

// PUT /api/empresas/produtos/:id
router.put('/produtos/:id', autenticar, autorizar('empresa'), (req, res) => {
  try {
    const { nome, preco } = req.body;
    const produto = db.prepare('SELECT * FROM produtos WHERE id = ? AND empresa_id = ?')
      .get(req.params.id, req.user.id);

    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    db.prepare('UPDATE produtos SET nome = ?, preco = ? WHERE id = ?')
      .run(nome || produto.nome, preco !== undefined ? Number(preco) : produto.preco, req.params.id);

    const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    res.json({ mensagem: 'Produto atualizado', produto: atualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/empresas/produtos/:id
router.delete('/produtos/:id', autenticar, autorizar('empresa'), (req, res) => {
  try {
    const produto = db.prepare('SELECT * FROM produtos WHERE id = ? AND empresa_id = ?')
      .get(req.params.id, req.user.id);

    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(req.params.id);
    // ou: db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);

    res.json({ mensagem: 'Produto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao eliminar produto' });
  }
});

module.exports = router;
