# 💰 FinançasPro

**Sistema de Controle Financeiro Pessoal**

---

## 📁 Estrutura do Projeto

```
financaspro/
├── index.html        ← Landing page (página de vendas)
├── app.html          ← Sistema financeiro (produto entregue)
├── css/
│   ├── style.css     ← Estilos da landing page
│   └── app.css       ← Estilos do sistema
├── js/
│   └── app.js        ← Lógica principal
└── README.md
```

---

## 🔐 Acesso ao Sistema

- **URL do App:** `https://SEU-USUARIO.github.io/financaspro/app.html`
- **Senha padrão:** `FinancasPro2025`
- A senha pode ser alterada dentro do sistema em **Configurações → Alterar Senha**

---

## 🌐 Configuração do GitHub Pages

1. Faça o upload de todos os arquivos para um repositório no GitHub
2. Vá em **Settings → Pages**
3. Em **Source**, selecione `Deploy from a branch`
4. Escolha a branch `main` e pasta `/ (root)`
5. Clique em **Save**
6. Aguarde alguns minutos — o site ficará disponível em:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

---

## 🛒 Integração com Hotmart

No arquivo `index.html`, localize a linha:
```html
<a href="https://hotmart.com/SEU-LINK-AQUI" ...>
```
Substitua `https://hotmart.com/SEU-LINK-AQUI` pelo link real do seu produto na Hotmart.

### Entrega do Produto (Hotmart)
Configure a entrega automática com:
- **Link:** `https://SEU-USUARIO.github.io/financaspro/app.html`
- **Senha:** `FinancasPro2025` (inclua na mensagem de entrega)

---

## 📦 Funcionalidades

- ✅ Dashboard com 4 cards de resumo
- ✅ Gráfico de despesas por categoria (rosca)
- ✅ Gráfico comparativo dos últimos 6 meses
- ✅ Tabela com percentual por categoria e barra de progresso
- ✅ 16 categorias de despesa + 5 de receita
- ✅ Formulário de lançamento rápido
- ✅ Filtros por tipo e categoria
- ✅ Navegação por mês
- ✅ Proteção por senha
- ✅ Backup e restauração de dados (JSON)
- ✅ Dados salvos no LocalStorage (sem servidor)

---

## 🎨 Tecnologias

- HTML5, CSS3, JavaScript ES6+
- [Chart.js 4.4](https://www.chartjs.org/) — gráficos
- LocalStorage — armazenamento de dados
- GitHub Pages — hospedagem gratuita

---

*FinançasPro v1.0 — 2025*
