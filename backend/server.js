const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db/database');

const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const entregadoresRoutes = require('./routes/entregadores');
const empresasRoutes = require('./routes/empresas');
const carteiraRoutes = require('./routes/carteira');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ========== API ==========
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/entregadores', entregadoresRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/carteira', carteiraRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    servico: 'Thunder Logistic API',
    versao: '1.2.0',
    timestamp: new Date().toISOString()
  });
});

// ========== PRO (entregadores) ==========
const proPath = path.join(__dirname, '../pro/frontend');
app.use('/pro', express.static(proPath));
app.get('/pro/*', (req, res) => {
  res.sendFile(path.join(proPath, 'index.html'), (err) => {
    if (err) res.status(404).json({ erro: 'Thunder Pro não encontrado (pasta pro/frontend)' });
  });
});

// ========== CEO (admin) ==========
const ceoPath = path.join(__dirname, '../ceo/frontend');
app.use('/ceo', express.static(ceoPath));
app.get('/ceo/*', (req, res) => {
  res.sendFile(path.join(ceoPath, 'index.html'), (err) => {
    if (err) res.status(404).json({ erro: 'Thunder CEO não encontrado (pasta ceo/frontend)' });
  });
});

// ========== CLIENTES ==========
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (req.path.startsWith('/pro')) return next();
  if (req.path.startsWith('/ceo')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) res.status(500).json({ erro: 'Frontend clientes não encontrado' });
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('⚡ THUNDER LOGISTIC API v1.2');
  console.log('─────────────────────────────');
  console.log(`👤 Clientes:      http://localhost:${PORT}/`);
  console.log(`🏍  Entregadores: http://localhost:${PORT}/pro/`);
  console.log(`📊 CEO:           http://localhost:${PORT}/ceo/`);
  console.log(`📡 API:           http://localhost:${PORT}/api`);
  console.log('');
  console.log('Admin: admin@thunder.mz / admin123');
  console.log('CEO:   demonhoriot@ceo.mz / peitos008');
  console.log('─────────────────────────────');
});
