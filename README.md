# ⚡ THUNDER LOGISTIC

Plataforma completa de logística e entregas para **Moçambique**.

Frontend + Backend + Base de dados SQLite.

---

## 📁 Estrutura

```
thunder-logistic/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── db/
│   │   └── database.js      # SQLite + tabelas
│   ├── middleware/
│   │   └── auth.js          # JWT
│   └── routes/
│       ├── auth.js
│       ├── pedidos.js
│       ├── entregadores.js
│       ├── empresas.js
│       ├── carteira.js
│       └── admin.js
├── README.md
└── .gitignore
```

---

## 🚀 Como correr

### 1. Backend

```bash
cd backend
npm install
npm start
```

API disponível em: **http://localhost:3001**

### 2. Frontend

Abre o ficheiro `frontend/index.html` no navegador  
**ou** usa um servidor local:

```bash
cd frontend
npx serve .
# ou
python -m http.server 5500
```

> O frontend chama a API em `http://localhost:3001/api`

---

## 👤 Contas de teste

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@thunder.mz | admin123 |
| Cliente / Entregador / Empresa | cria no formulário de registo | — |

No registo podes escolher o tipo: **Cliente**, **Entregador** ou **Empresa**.

---

## 📡 Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registar |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Perfil |
| GET/POST | `/api/pedidos` | Listar / Criar pedidos |
| POST | `/api/pedidos/:id/aceitar` | Entregador aceita |
| GET | `/api/entregadores/planos` | Planos |
| POST | `/api/entregadores/comprar-plano` | Comprar plano |
| POST | `/api/entregadores/toggle-online` | Online/Offline |
| CRUD | `/api/empresas/produtos` | Produtos da empresa |
| GET/POST | `/api/carteira/*` | Saldo, cupons, prime |
| GET | `/api/admin/dashboard` | Dashboard admin |

---

## 🛠️ Stack

- **Frontend**: HTML + CSS + JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Base de dados**: SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt

---

## 📦 Produção

1. Backend → Railway / Render / Fly.io
2. Frontend → Vercel / Netlify
3. Altera a constante `API` em `frontend/js/app.js` para o URL do backend em produção

---

© 2026 Thunder Logistic EI
