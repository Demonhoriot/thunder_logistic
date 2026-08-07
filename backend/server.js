const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicializa a base de dados (cria tabelas + seed)
require('./db/database');

const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const entregadoresRoutes = require('./routes/entregadores');
const empresasRoutes = require('./routes/empresas');
const carteiraRoutes = require('./routes/carteira');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/entregadores', entregadoresRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/carteira', carteiraRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    servico: 'Thunder Logistic API',
    versao: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

// ========== THUNDER PRO (entregadores) — ANTES dos clientes ==========
const proPath = path.join(__dirname, '../pro/frontend');
app.use('/pro', express.static(proPath));
app.get('/pro/*', (req, res) => {
  res.sendFile(path.join(proPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({
        erro: 'Thunder Pro não encontrado. Confirma a pasta pro/frontend no deploy.'
      });
    }
  });
});

// ========== FRONTEND CLIENTES ==========
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (req.path.startsWith('/pro')) return next();
  const indexFile = path.join(frontendPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(500).json({
        erro: 'Frontend não encontrado. Confirma que a pasta frontend existe no deploy.'
      });
    }
  });
});

// Erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('⚡ THUNDER LOGISTIC API');
  console.log('─────────────────────────────');
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log(`👤 Clientes: http://localhost:${PORT}/`);
  console.log(`🏍  Entregadores: http://localhost:${PORT}/pro/`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Contas padrão:');
  console.log('  Admin: admin@thunder.mz / admin123');
  console.log('  CEO:   demonhoriot@ceo.mz / peitos008');
  console.log('─────────────────────────────');
});
