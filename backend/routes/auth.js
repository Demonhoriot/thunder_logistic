const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { gerarToken, autenticar } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { nome, email, telefone, senha, tipo = 'cliente' } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }
    const tiposValidos = ['cliente', 'entregador', 'empresa'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo inválido: cliente, entregador ou empresa' });
    }
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      return res.status(409).json({ erro: 'Email já registado' });
    }

    const id = uuidv4();
    const hash = bcrypt.hashSync(senha, 10);
    db.prepare(`INSERT INTO users (id, nome, email, telefone, senha, tipo) VALUES (?,?,?,?,?,?)`)
      .run(id, nome, email, telefone || '', hash, tipo);

    if (tipo === 'cliente') {
      db.prepare('INSERT INTO clientes (user_id, saldo, pontos) VALUES (?, 500, 100)').run(id);
    } else if (tipo === 'entregador') {
      db.prepare('INSERT INTO entregadores (user_id) VALUES (?)').run(id);
    } else if (tipo === 'empresa') {
      db.prepare('INSERT INTO empresas (user_id, nome_empresa) VALUES (?, ?)').run(id, nome);
    }

    const user = { id, nome, email, tipo };
    res.status(201).json({ mensagem: 'Conta criada', token: gerarToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(senha, user.senha)) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    res.json({
      mensagem: 'Login OK',
      token: gerarToken(user),
      user: { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone, tipo: user.tipo }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/me', autenticar, (req, res) => {
  const user = db.prepare('SELECT id, nome, email, telefone, tipo, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ erro: 'Não encontrado' });

  let extra = {};
  if (user.tipo === 'cliente') {
    extra = db.prepare('SELECT saldo, pontos FROM clientes WHERE user_id = ?').get(user.id) || {};
  } else if (user.tipo === 'entregador') {
    extra = db.prepare('SELECT plano, saldo, online, entregas_disponiveis, total_entregas, avaliacao FROM entregadores WHERE user_id = ?').get(user.id) || {};
  } else if (user.tipo === 'empresa') {
    extra = db.prepare('SELECT nome_empresa, categoria, saldo FROM empresas WHERE user_id = ?').get(user.id) || {};
  }
  res.json({ ...user, ...extra });
});

module.exports = router;
