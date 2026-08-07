const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'thunder.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefone TEXT,
      senha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('cliente','entregador','empresa','admin')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      saldo REAL DEFAULT 500,
      pontos INTEGER DEFAULT 100
    );

    CREATE TABLE IF NOT EXISTS entregadores (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plano TEXT,
      saldo REAL DEFAULT 0,
      online INTEGER DEFAULT 0,
      entregas_disponiveis INTEGER DEFAULT 0,
      total_entregas INTEGER DEFAULT 0,
      avaliacao REAL DEFAULT 5.0
    );

    CREATE TABLE IF NOT EXISTS empresas (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      nome_empresa TEXT,
      categoria TEXT DEFAULT 'Geral',
      saldo REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(user_id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      ativo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL REFERENCES users(id),
      entregador_id TEXT REFERENCES users(id),
      tipo TEXT NOT NULL,
      origem TEXT NOT NULL,
      destino TEXT NOT NULL,
      valor REAL NOT NULL,
      observacoes TEXT DEFAULT '',
      status TEXT DEFAULT 'Procurando Entregador',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      tipo TEXT NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cupons (
      id TEXT PRIMARY KEY,
      codigo TEXT UNIQUE NOT NULL,
      desconto REAL NOT NULL,
      usado_por TEXT,
      ativo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS prime (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      ativo INTEGER DEFAULT 0,
      plano TEXT,
      ativado_em TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_mensagens (
      id TEXT PRIMARY KEY,
      pedido_id TEXT,
      user_id TEXT,
      remetente TEXT,
      texto TEXT,
      hora TEXT
    );
  `);

  // Admin padrão
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@thunder.mz');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    const adminId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, nome, email, telefone, senha, tipo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, 'Administrador', 'admin@thunder.mz', '840000000', hash, 'admin');

    const cupons = [
      { codigo: 'BEMVINDO', desconto: 50 },
      { codigo: 'THUNDER10', desconto: 10 },
      { codigo: 'FRETEGRATIS', desconto: 100 }
    ];
    const insertCupom = db.prepare('INSERT INTO cupons (id, codigo, desconto) VALUES (?, ?, ?)');
    cupons.forEach(c => insertCupom.run(uuidv4(), c.codigo, c.desconto));

    console.log('✅ Admin criado: admin@thunder.mz / admin123');
  }

  // CEO
  const ceoEmail = 'demonhoriot@ceo.mz';
  const ceoExists = db.prepare('SELECT id FROM users WHERE email = ?').get(ceoEmail);
  if (!ceoExists) {
    const ceoId = uuidv4();
    const ceoHash = bcrypt.hashSync('peitos008', 10);
    db.prepare(`
      INSERT INTO users (id, nome, email, telefone, senha, tipo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ceoId, 'Demonhoriot CEO', ceoEmail, '840000000', ceoHash, 'admin');
    console.log('✅ CEO criado: demonhoriot@ceo.mz / peitos008');
  }
}

initDatabase();

module.exports = db;
