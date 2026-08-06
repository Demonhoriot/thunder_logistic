# Thunder Logistic PRO — App dos Entregadores

Site **2 de 3** do ecossistema Thunder.

| Site | Para quem | URL exemplo |
|------|-----------|-------------|
| **Thunder Logistic** | Clientes | thunderlogistic.mz |
| **Thunder Pro** (este) | Entregadores | pro.thunderlogistic.mz |
| **Thunder CEO** | Empresa / admin | ceo.thunderlogistic.mz |

---

## O que este app faz

- Cadastro / login só como **entregador**
- Comprar planos (Starter → Platinum)
- Ficar **Online / Offline**
- Receber e aceitar pedidos
- Ver saldo e ganhos
- Perfil e logout

---

## Como interligar os 3 sites

```
┌─────────────────┐     pedidos      ┌─────────────────┐
│  CLIENTES       │ ───────────────► │  BACKEND API    │
│  Thunder        │                  │  (Railway)      │
│  Logistic       │ ◄─────────────── │  + Base dados   │
└─────────────────┘     status       └────────┬────────┘
                                              │
┌─────────────────┐     aceitar               │
│  ENTREGADORES   │ ◄─────────────────────────┤
│  Thunder Pro    │ ───────────────► pedidos  │
└─────────────────┘                           │
                                              │
┌─────────────────┐     monitorizar           │
│  EMPRESA        │ ◄─────────────────────────┘
│  Thunder CEO    │
└─────────────────┘
```

### Regra de ouro
**Um só backend. Três frontends.**

Todos os sites usam a **mesma API**:

```
https://thunderlogistic-production.up.railway.app/api
```

No `js/app.js` de cada site:

```js
const API = 'https://thunderlogistic-production.up.railway.app/api';
```

### Fluxo real

1. **Cliente** cria pedido no site Clientes  
2. Pedido grava-se na base de dados (`pedidos`)  
3. **Entregador** online no Pro vê / aceita o pedido  
4. Status actualiza-se (A caminho → Entregue)  
5. **CEO** vê clientes, entregadores, pedidos e chats no painel admin  

### Contas (campo `tipo` na tabela users)

| tipo | Site que usa |
|------|----------------|
| `cliente` | Thunder Logistic |
| `entregador` | Thunder Pro |
| `empresa` | (parceiros / lojas) |
| `admin` | Thunder CEO |

---

## Como publicar o Pro

### Opção A — Subdomínio (recomendado)
1. Frontend Pro no **Vercel** ou pasta separada no Railway  
2. Domínio: `pro.thunderlogistic.mz` → aponta para esse frontend  
3. API continua a mesma URL do backend  

### Opção B — Mesmo servidor, path diferente
- Clientes: `/`  
- Pro: `/pro/`  
- CEO: `/ceo/`  

No backend Express:

```js
app.use('/pro', express.static(path.join(__dirname, '../pro')));
app.use('/ceo', express.static(path.join(__dirname, '../ceo')));
```

### Opção C — 3 projectos Vercel + 1 Railway (API)
Mais limpo a longo prazo.

---

## Instalação rápida

1. Copia a pasta `frontend` deste ZIP  
2. No `js/app.js`, confirma a linha da API (URL do teu Railway)  
3. Publica (Vercel / Netlify / Railway)  
4. Testa registo com tipo entregador  

Login de teste (se já existir no backend):
- Criar conta nova com tipo `entregador` neste app  

---

## Próximo passo

Pedir o **Thunder CEO** — painel da empresa para monitorizar clientes, entregadores, pedidos e conversas.
