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
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Servir frontend em produção (opcional)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  // Só devolve index.html se não for rota de API
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
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
  console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Conta admin padrão:');
  console.log('  Email: admin@thunder.mz');
  console.log('  Senha: admin123');
  console.log('─────────────────────────────');
});
