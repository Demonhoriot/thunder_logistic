const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'thunder-logistic-secret-2026-mz';

function gerarToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, tipo: user.tipo, nome: user.nome },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

function autorizar(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.user.tipo)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
  };
}

module.exports = { gerarToken, autenticar, autorizar, JWT_SECRET };
