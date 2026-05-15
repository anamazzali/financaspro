'use strict';

// ================================================
// CONSTANTES
// ================================================
const SENHA_PADRAO = 'FinancasPro2025';
let SHEETS_URL = localStorage.getItem('fp_sheets_url') || '';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CATEGORIAS_DESPESA = [
  'Moradia','Educação','Transporte','Seguros','Alimentação','Pet',
  'Cuidados Pessoais','Entretenimento','Investimentos Curto Prazo',
  'Investimentos Longo Prazo','Empréstimos','Igreja / Religião',
  'Impostos','Presentes','Doações','Jurídico','Saúde'
];

const CATEGORIAS_RECEITA = [
  'Salário','Renda Extra','Freelance','Investimentos',
  'Vale Alimentação','Vale Transporte','Outros'
];

const ICONES = {
  'Moradia':'🏠','Educação':'📚','Transporte':'🚗','Seguros':'🛡️',
  'Alimentação':'🛒','Pet':'🐾','Cuidados Pessoais':'💅','Entretenimento':'🎬',
  'Investimentos Curto Prazo':'📈','Investimentos Longo Prazo':'💰',
  'Empréstimos':'🏦','Igreja / Religião':'⛪','Impostos':'📋',
  'Presentes':'🎁','Doações':'❤️','Jurídico':'⚖️','Saúde':'🏥',
  'Salário':'💼','Renda Extra':'💵','Freelance':'🖥️','Investimentos':'📊',
  'Vale Alimentação':'🍽️','Vale Transporte':'🚌','Outros':'📌'
};

const CORES_GRAFICO = [
  '#2D6A4F','#D4AF37','#52B788','#A07820','#95D5B2','#1B4332',
  '#F0CB5E','#40916C','#B7E4C7','#C9A227','#74C69D','#081C15',
  '#D8F3DC','#588157','#3A5A40','#E9C46A','#C0392B'
];

const BANDEIRAS = { 'Visa':'💳','Mastercard':'💳','Elo':'💳','Amex':'💎','Hipercard':'💳','Outro':'💳' };

// ================================================
// MASCOTE — Finn, o Guardião
// ================================================
const MENSAGENS_MASCOTE = [
  '💰 Cada real poupado hoje é um passo rumo à liberdade financeira!',
  '🎯 Defina metas mensais e celebre cada conquista financeira!',
  '📊 Quem controla seus gastos controla seu futuro!',
  '🌱 Pequenos hábitos financeiros geram grandes resultados!',
  '💡 Antes de comprar, pergunte: é necessidade ou vontade?',
  '🏆 Pagar a si mesmo primeiro é o segredo dos ricos!',
  '🔒 Sua reserva de emergência é seu melhor seguro de vida!',
  '📈 Investir R$ 100 por mês pode virar muito em 10 anos!',
  '✨ Organize suas finanças hoje e durma melhor amanhã!',
  '🐷 Poupar não é privação — é dar um presente ao seu futuro!',
  '🌟 Você está indo muito bem! Continue assim!',
  '💪 Controlar o dinheiro é um superpoder — e você tem ele!',
  '🎉 Registrar seus gastos é o primeiro passo para a riqueza!',
  '🧠 Inteligência financeira se aprende — e você já está praticando!',
  '🌈 Finanças equilibradas = vida equilibrada. Ótimo trabalho!',
];

let mascoteTimer = null;

function mostrarMascote() {
  const overlay = document.getElementById('mascote-overlay');
  const msgEl   = document.getElementById('mascote-msg');
  if (!overlay || !msgEl) return;

  // Mensagem aleatória
  const msg = MENSAGENS_MASCOTE[Math.floor(Math.random() * MENSAGENS_MASCOTE.length)];
  msgEl.textContent = msg;

  // Mostrar
  overlay.classList.add('show');

  // Esconder automaticamente após 2.8s
  clearTimeout(mascoteTimer);
  mascoteTimer = setTimeout(() => {
    overlay.classList.remove('show');
  }, 2800);

  // Clique para fechar mais rápido
  overlay.onclick = () => {
    clearTimeout(mascoteTimer);
    overlay.classList.remove('show');
    overlay.onclick = null;
  };
}



// ================================================
// ESTADO
// ================================================
let state = {
  transactions: [],
  cartoes: [],
  mesAtual: new Date().getMonth(),
  anoAtual: new Date().getFullYear(),
  faturaOffset: 0,      // 0 = fatura atual, -1 = anterior, etc.
  filterMode: 'mes',    // 'mes' ou 'periodo'
  sheetsConectado: false,
  sincronizando: false,
};

let charts = { pie: null, bar: null };

// ================================================
// INICIALIZAÇÃO
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  autoSetupFromURL();
  initPasswordGate();
  initNavigation();
  initForm();
  initMonthNav();
  initFilters();
  initMobileMenu();
  updateTopbarDate();
  initPeriodoFiltro();
});

function autoSetupFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('setup');
    if (!s) return;
    const url = atob(s);
    if (!localStorage.getItem('fp_sheets_url') && url.startsWith('https://script.google.com')) {
      localStorage.setItem('fp_sheets_url', url);
      SHEETS_URL = url;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch(e) {}
}

function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR',
    { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
}

// ================================================
// MENU MOBILE
// ================================================
function initMobileMenu() {
  const toggle  = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
}

// ================================================
// SENHA
// ================================================
function initPasswordGate() {
  const gate  = document.getElementById('password-gate');
  const input = document.getElementById('pw-input');
  const btn   = document.getElementById('pw-btn');
  const error = document.getElementById('pw-error');
  const box   = document.querySelector('.pw-box');
  if (!gate) return;

  function tryLogin() {
    const ok = localStorage.getItem('fp_senha') || SENHA_PADRAO;
    if (input.value === ok) {
      gate.style.display = 'none';
      loadData();
    } else {
      error.textContent = '❌ Senha incorreta.';
      box.classList.remove('shake');
      void box.offsetWidth;
      box.classList.add('shake');
      setTimeout(() => box.classList.remove('shake'), 500);
      input.value = '';
      input.focus();
    }
  }
  btn.addEventListener('click', tryLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
}

function logout() {
  const gate = document.getElementById('password-gate');
  const input = document.getElementById('pw-input');
  if (gate) gate.style.display = 'flex';
  if (input) { input.value = ''; input.focus(); }
  document.getElementById('pw-error').textContent = '';
}

// ================================================
// LOCALSTORAGE
// ================================================
function loadLocalStorage() {
  try { return JSON.parse(localStorage.getItem('fp_transactions') || '[]'); } catch { return []; }
}
function saveLocalStorage(t) { localStorage.setItem('fp_transactions', JSON.stringify(t)); }
function loadCartoesLocal() {
  try { return JSON.parse(localStorage.getItem('fp_cartoes') || '[]'); } catch { return []; }
}
function saveCartoesLocal(c) { localStorage.setItem('fp_cartoes', JSON.stringify(c)); }

// ================================================
// GOOGLE SHEETS
// ================================================
async function testarConexaoSheets() {
  if (!SHEETS_URL) return false;
  try {
    const r = await fetch(SHEETS_URL, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({action:'ping'})
    });
    return (await r.json()).ok === true;
  } catch { return false; }
}

async function loadSheets() {
  if (!SHEETS_URL) return null;
  try {
    const r = await fetch(SHEETS_URL, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({action:'load'})
    });
    const d = await r.json();
    if (d.ok && Array.isArray(d.transactions)) return d.transactions;
    return null;
  } catch { return null; }
}

async function saveSheets(transactions) {
  if (!SHEETS_URL) return false;
  try {
    const r = await fetch(SHEETS_URL, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({action:'save', transactions})
    });
    return (await r.json()).ok === true;
  } catch { return false; }
}

// ================================================
// CARREGAR DADOS
// ================================================
async function loadData() {
  setSyncStatus('Carregando...', 'info');
  const localData = loadLocalStorage();
  state.transactions = localData;
  state.cartoes = loadCartoesLocal();
  renderAll();

  if (SHEETS_URL) {
    state.sincronizando = true;
    setSyncStatus('⏳ Sincronizando...', 'info');
    const sheetsData = await loadSheets();
    state.sincronizando = false;

    if (sheetsData !== null && sheetsData.length > 0) {
      state.transactions = sheetsData;
      state.sheetsConectado = true;
      saveLocalStorage(sheetsData);
      setSyncStatus('✅ Sheets conectado', 'success');
      renderAll();
    } else if (sheetsData !== null && sheetsData.length === 0 && localData.length > 0) {
      state.sheetsConectado = true;
      setSyncStatus('🔄 Recuperando...', 'info');
      const ok = await saveSheets(localData);
      setSyncStatus(ok ? '✅ Sheets sincronizado' : '⚠️ Falha sync', ok ? 'success' : 'warning');
    } else if (sheetsData !== null && sheetsData.length === 0) {
      state.sheetsConectado = true;
      setSyncStatus('✅ Sheets conectado', 'success');
    } else {
      state.sheetsConectado = false;
      setSyncStatus('⚠️ Offline — dados locais', 'warning');
    }
  } else {
    setSyncStatus('💾 Modo local', 'local');
  }
}

async function saveData() {
  saveLocalStorage(state.transactions);
  saveCartoesLocal(state.cartoes);
  if (SHEETS_URL && state.sheetsConectado) {
    const ok = await saveSheets(state.transactions);
    setSyncStatus(ok ? '✅ Salvo no Sheets' : '⚠️ Salvo local', ok ? 'success' : 'warning');
  }
}

function setSyncStatus(msg, tipo) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'sync-status ' + tipo;
}

// ================================================
// TRANSAÇÕES
// ================================================
async function addTransaction(tx) {
  tx.id = Date.now() + Math.random();
  state.transactions.unshift(tx);
  await saveData();
  renderAll();
  showToast('✅ Lançamento salvo!');
}

async function deleteTransaction(id) {
  if (!confirm('Deseja excluir este lançamento?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  await saveData();
  renderAll();
  showToast('🗑️ Lançamento excluído.');
}

// ================================================
// FILTRO POR MÊS
// ================================================
function getTransacoesMes(mes, ano) {
  const m = mes !== undefined ? mes : state.mesAtual;
  const a = ano  !== undefined ? ano  : state.anoAtual;
  return state.transactions.filter(t => {
    const d = new Date(t.data + 'T00:00:00');
    return d.getMonth() === m && d.getFullYear() === a;
  });
}

// FILTRO POR PERÍODO
function getTransacoesPeriodo(ini, fim) {
  const dIni = new Date(ini + 'T00:00:00');
  const dFim = new Date(fim + 'T23:59:59');
  return state.transactions.filter(t => {
    const d = new Date(t.data + 'T00:00:00');
    return d >= dIni && d <= dFim;
  });
}

// ================================================
// MODO DE FILTRO
// ================================================
function setFilterMode(mode) {
  state.filterMode = mode;
  document.getElementById('filters-mes').style.display    = mode === 'mes'     ? 'flex' : 'none';
  document.getElementById('filters-periodo').style.display = mode === 'periodo' ? 'block' : 'none';
  document.getElementById('btn-modo-mes').classList.toggle('active', mode === 'mes');
  document.getElementById('btn-modo-periodo').classList.toggle('active', mode === 'periodo');
  document.getElementById('periodo-resumo').style.display = 'none';
  renderLancamentos();
}

function initPeriodoFiltro() {
  const hoje = getTodayISO();
  const ini  = hoje.slice(0,8) + '01';
  document.getElementById('filter-data-ini').value = ini;
  document.getElementById('filter-data-fim').value = hoje;
}

// ================================================
// NAVEGAÇÃO
// ================================================
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      activateView(item.dataset.view, item);
      document.querySelector('.sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('show');
    });
  });
}

function activateView(viewName, navItem) {
  // Verificar se está trocando de view (não é a primeira vez)
  const viewAtual = document.querySelector('.view.active');
  const isSwitch  = viewAtual && viewAtual.id !== 'view-' + viewName;

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const nav  = navItem || document.querySelector(`.nav-item[data-view="${viewName}"]`);
  const view = document.getElementById('view-' + viewName);
  nav?.classList.add('active');
  view?.classList.add('active');
  const titles = {
    dashboard:'Dashboard', lancamentos:'Lançamentos',
    cartoes:'Cartões de Crédito', relatorios:'Relatórios',
    configuracoes:'Configurações'
  };
  const h2 = document.getElementById('topbar-title');
  if (h2) h2.textContent = titles[viewName] || viewName;
  if (viewName === 'dashboard')   renderDashboard();
  if (viewName === 'lancamentos') renderLancamentos();
  if (viewName === 'cartoes')     renderCartoes();
  if (viewName === 'relatorios')  renderRelatorios();

  // Mostrar mascote na troca de aba (exceto configurações)
  if (isSwitch && viewName !== 'configuracoes') {
    mostrarMascote();
  }
}

// ================================================
// FORMULÁRIO DE LANÇAMENTO
// ================================================
function initForm() {
  document.querySelectorAll('.tipo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateCategorias(btn.dataset.tipo);
    });
  });
  const btnD = document.querySelector('.tipo-btn.despesa');
  if (btnD) { btnD.classList.add('active'); updateCategorias('despesa'); }
  document.getElementById('form-data').value = getTodayISO();
  document.getElementById('btn-salvar')?.addEventListener('click', salvarLancamento);
  document.getElementById('btn-limpar')?.addEventListener('click', limparForm);
  updateSelectCartoes();
}

function updateCategorias(tipo) {
  const cats = tipo === 'despesa' ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA;
  const sel  = document.getElementById('form-categoria');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione...</option>';
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = (ICONES[c]||'📌') + '  ' + c;
    sel.appendChild(o);
  });
}

function updateSelectCartoes() {
  const sel = document.getElementById('form-cartao');
  if (!sel) return;
  sel.innerHTML = '<option value="">Nenhum (débito/espécie)</option>';
  state.cartoes.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = '💳 ' + c.nome + ' (' + c.bandeira + ')';
    sel.appendChild(o);
  });
  // Filtro de cartão na lista
  const selFiltro = document.getElementById('filter-cartao-lista');
  if (selFiltro) {
    selFiltro.innerHTML = '<option value="todos">Todos os cartões</option>';
    selFiltro.innerHTML += '<option value="sem">Sem cartão</option>';
    state.cartoes.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = '💳 ' + c.nome;
      selFiltro.appendChild(o);
    });
  }
}

async function salvarLancamento() {
  const tipo      = document.querySelector('.tipo-btn.active')?.dataset.tipo;
  const desc      = document.getElementById('form-descricao')?.value.trim();
  const valor     = parseFloat(document.getElementById('form-valor')?.value);
  const categoria = document.getElementById('form-categoria')?.value;
  const data      = document.getElementById('form-data')?.value;
  const obs       = document.getElementById('form-obs')?.value.trim();
  const cartaoId  = document.getElementById('form-cartao')?.value || '';

  if (!desc)              { showToast('⚠️ Informe a descrição.');    return; }
  if (!valor || valor<=0) { showToast('⚠️ Informe um valor válido.'); return; }
  if (!categoria)         { showToast('⚠️ Selecione uma categoria.'); return; }
  if (!data)              { showToast('⚠️ Informe a data.');          return; }

  await addTransaction({ tipo, desc, valor, categoria, data, obs, cartaoId });
  limparForm();
}

function limparForm() {
  document.getElementById('form-descricao').value = '';
  document.getElementById('form-valor').value     = '';
  document.getElementById('form-categoria').value  = '';
  document.getElementById('form-obs').value        = '';
  document.getElementById('form-data').value       = getTodayISO();
  document.getElementById('form-cartao').value     = '';
}

// ================================================
// NAVEGAÇÃO DE MÊS
// ================================================
function initMonthNav() {
  document.getElementById('btn-mes-ant')?.addEventListener('click', () => {
    state.mesAtual--;
    if (state.mesAtual < 0) { state.mesAtual = 11; state.anoAtual--; }
    updateMonthLabel(); renderAll();
  });
  document.getElementById('btn-mes-prox')?.addEventListener('click', () => {
    state.mesAtual++;
    if (state.mesAtual > 11) { state.mesAtual = 0; state.anoAtual++; }
    updateMonthLabel(); renderAll();
  });
  updateMonthLabel();
}

function updateMonthLabel() {
  const txt = MESES[state.mesAtual] + ' de ' + state.anoAtual;
  setText('mes-label', txt);
  setText('rel-mes-label', MESES_CURTOS[state.mesAtual] + '/' + state.anoAtual);
}

// ================================================
// FILTROS
// ================================================
function initFilters() {
  document.getElementById('filter-tipo')?.addEventListener('change', renderLancamentos);
  document.getElementById('filter-cat')?.addEventListener('change', renderLancamentos);
  document.getElementById('filter-cartao-lista')?.addEventListener('change', renderLancamentos);
}

function renderAll() {
  updateMonthLabel();
  renderDashboard();
  renderLancamentos();
  renderCartoes();
}

// ================================================
// DASHBOARD
// ================================================
function renderDashboard() {
  const txs = getTransacoesMes();
  const rec = txs.filter(t => t.tipo === 'receita');
  const dep = txs.filter(t => t.tipo === 'despesa');
  const totalRec  = rec.reduce((s,t) => s+t.valor, 0);
  const totalDep  = dep.reduce((s,t) => s+t.valor, 0);
  const saldo     = totalRec - totalDep;
  const economia  = totalRec > 0 ? ((saldo/totalRec)*100).toFixed(1) : 0;

  // Cards principais
  setText('card-receitas', formatMoeda(totalRec));
  setText('card-despesas', formatMoeda(totalDep));
  setText('card-economia', economia + '%');
  const cardSaldo = document.getElementById('card-saldo');
  if (cardSaldo) {
    cardSaldo.textContent = saldo < 0 ? '-' + formatMoeda(Math.abs(saldo)) : formatMoeda(saldo);
    cardSaldo.style.color = saldo >= 0 ? 'var(--dourado-escuro)' : 'var(--vermelho)';
  }

  // ── INSIGHTS ──
  // Maior categoria de despesa
  const catDepMap = {};
  dep.forEach(t => { catDepMap[t.categoria] = (catDepMap[t.categoria]||0) + t.valor; });
  const topDep = Object.entries(catDepMap).sort((a,b)=>b[1]-a[1])[0];
  if (topDep) {
    setText('insight-maior-cat', (ICONES[topDep[0]]||'📌') + ' ' + topDep[0]);
    setText('insight-maior-val', formatMoeda(topDep[1]) + ' gastos');
  } else {
    setText('insight-maior-cat', '—'); setText('insight-maior-val', 'Sem despesas');
  }

  // Maior categoria de receita
  const catRecMap = {};
  rec.forEach(t => { catRecMap[t.categoria] = (catRecMap[t.categoria]||0) + t.valor; });
  const topRec = Object.entries(catRecMap).sort((a,b)=>b[1]-a[1])[0];
  if (topRec) {
    setText('insight-maior-rec', (ICONES[topRec[0]]||'📌') + ' ' + topRec[0]);
    setText('insight-maior-rec-val', formatMoeda(topRec[1]) + ' recebidos');
  } else {
    setText('insight-maior-rec', '—'); setText('insight-maior-rec-val', 'Sem receitas');
  }

  // Total lançamentos
  setText('insight-total-lanc', txs.length);
  setText('insight-lanc-sub', dep.length + ' despesas · ' + rec.length + ' receitas');

  // Maior despesa única
  const maiorDep = dep.sort((a,b)=>b.valor-a.valor)[0];
  if (maiorDep) {
    setText('insight-maior-despesa', formatMoeda(maiorDep.valor));
    setText('insight-maior-desc', escapeHtml(maiorDep.desc));
  } else {
    setText('insight-maior-despesa', '—'); setText('insight-maior-desc', 'Sem despesas');
  }

  // Tabelas
  renderCategoryTable(txs.filter(t=>t.tipo==='despesa'), totalDep, 'cat-tbody', 'despesa');
  renderCategoryTable(txs.filter(t=>t.tipo==='receita'), totalRec, 'rec-tbody', 'receita');
  renderPieChart(txs, totalDep);
  renderBarChart();
}

function renderCategoryTable(txs, total, tbodyId, tipo) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const catMap = {};
  txs.forEach(t => { catMap[t.categoria] = (catMap[t.categoria]||0)+t.valor; });
  const sorted = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--texto-medio);padding:16px">
      Nenhum registro no período</td></tr>`;
    return;
  }
  const corBarra = tipo === 'despesa' ? 'var(--vermelho)' : 'var(--verde-positivo)';
  tbody.innerHTML = sorted.map(([cat,val]) => {
    const pct = total > 0 ? ((val/total)*100).toFixed(1) : 0;
    return `<tr>
      <td>${ICONES[cat]||'📌'} ${cat}</td>
      <td><strong>${formatMoeda(val)}</strong></td>
      <td>${pct}%</td>
      <td><div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${corBarra}"></div></div></td>
    </tr>`;
  }).join('');
}

function renderPieChart(txs, totalDep) {
  const ctx = document.getElementById('chart-pizza');
  if (!ctx) return;
  const catMap = {};
  txs.filter(t=>t.tipo==='despesa').forEach(t => { catMap[t.categoria]=(catMap[t.categoria]||0)+t.valor; });
  const labels = Object.keys(catMap), data = Object.values(catMap);
  if (charts.pie) { charts.pie.destroy(); charts.pie = null; }
  if (!labels.length) return;
  charts.pie = new Chart(ctx, {
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor:CORES_GRAFICO.slice(0,labels.length), borderWidth:3, borderColor:'#fff', hoverOffset:8 }]},
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'62%',
      plugins:{
        legend:{ position:'right', labels:{ font:{family:'Tahoma',size:11}, boxWidth:14, padding:10 }},
        tooltip:{ callbacks:{ label: ctx => `  ${ctx.label}: ${formatMoeda(ctx.raw)} (${totalDep>0?((ctx.raw/totalDep)*100).toFixed(1):0}%)` }}
      }
    }
  });
}

function renderBarChart() {
  const ctx = document.getElementById('chart-barras');
  if (!ctx) return;
  const labels=[], receitas=[], despesas=[];
  for (let i=5; i>=0; i--) {
    let m=state.mesAtual-i, a=state.anoAtual;
    while(m<0){m+=12;a--;}
    labels.push(MESES_CURTOS[m]+'/'+String(a).slice(2));
    const txs = getTransacoesMes(m,a);
    receitas.push(txs.filter(t=>t.tipo==='receita').reduce((s,t)=>s+t.valor,0));
    despesas.push(txs.filter(t=>t.tipo==='despesa').reduce((s,t)=>s+t.valor,0));
  }
  if (charts.bar) { charts.bar.destroy(); charts.bar=null; }
  charts.bar = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[
      { label:'Receitas', data:receitas, backgroundColor:'#52B788', borderRadius:7, borderSkipped:false },
      { label:'Despesas', data:despesas, backgroundColor:'#C0392B', borderRadius:7, borderSkipped:false }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ labels:{ font:{family:'Tahoma',size:11} }},
        tooltip:{ callbacks:{ label: ctx => `  ${ctx.dataset.label}: ${formatMoeda(ctx.raw)}` }}
      },
      scales:{
        y:{ ticks:{ callback: v=>'R$'+(v>=1000?(v/1000).toFixed(1)+'k':v.toLocaleString('pt-BR')), font:{family:'Tahoma',size:10} }, grid:{color:'#F5F0E8'} },
        x:{ ticks:{ font:{family:'Tahoma',size:11} }, grid:{display:false} }
      }
    }
  });
}

// ================================================
// LANÇAMENTOS
// ================================================
function renderLancamentos() {
  let txs;

  if (state.filterMode === 'periodo') {
    const ini = document.getElementById('filter-data-ini')?.value;
    const fim = document.getElementById('filter-data-fim')?.value;
    if (!ini || !fim) { renderTransactionList([]); return; }
    txs = getTransacoesPeriodo(ini, fim);

    // Aplicar filtros adicionais
    const tipo = document.getElementById('filter-tipo-periodo')?.value || 'todos';
    const cat  = document.getElementById('filter-cat-periodo')?.value  || 'todas';
    if (tipo !== 'todos') txs = txs.filter(t => t.tipo === tipo);
    if (cat  !== 'todas') txs = txs.filter(t => t.categoria === cat);

    // Mostrar resumo do período
    const totalRec  = txs.filter(t=>t.tipo==='receita').reduce((s,t)=>s+t.valor,0);
    const totalDep  = txs.filter(t=>t.tipo==='despesa').reduce((s,t)=>s+t.valor,0);
    const saldo     = totalRec - totalDep;
    const resumo    = document.getElementById('periodo-resumo');
    if (resumo && txs.length > 0) {
      resumo.style.display = 'flex';
      setText('res-rec',   formatMoeda(totalRec));
      setText('res-desp',  formatMoeda(totalDep));
      setText('res-saldo', formatMoeda(saldo));
      setText('res-qtd',   txs.length + ' lançamentos');
    }
    // Atualizar categorias do filtro período
    updateFilterCatsPeriodo(getTransacoesPeriodo(ini, fim));
  } else {
    txs = getTransacoesMes();
    const filterTipo   = document.getElementById('filter-tipo')?.value   || 'todos';
    const filterCat    = document.getElementById('filter-cat')?.value    || 'todas';
    const filterCartao = document.getElementById('filter-cartao-lista')?.value || 'todos';
    if (filterTipo !== 'todos') txs = txs.filter(t => t.tipo === filterTipo);
    if (filterCat  !== 'todas') txs = txs.filter(t => t.categoria === filterCat);
    if (filterCartao === 'sem') txs = txs.filter(t => !t.cartaoId);
    else if (filterCartao !== 'todos') txs = txs.filter(t => String(t.cartaoId) === filterCartao);
    updateFilterCats(getTransacoesMes());
  }

  renderTransactionList(txs);
}

function renderTransactionList(txs) {
  const list = document.getElementById('transactions-list');
  if (!list) return;
  if (!txs.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span>
      <p>Nenhum lançamento encontrado.</p></div>`;
    return;
  }
  list.innerHTML = txs.map(t => {
    const cartao = state.cartoes.find(c => String(c.id) === String(t.cartaoId));
    const cartaoTag = cartao
      ? `<span class="cartao-tag" style="border-color:${cartao.cor};color:${cartao.cor}">💳 ${cartao.nome}</span>`
      : '';
    return `<div class="transaction-item">
      <div class="trans-icon ${t.tipo}">${ICONES[t.categoria]||'📌'}</div>
      <div class="trans-info">
        <div class="trans-desc">${escapeHtml(t.desc)} ${cartaoTag}</div>
        <div class="trans-cat">${t.categoria}${t.obs?' · '+escapeHtml(t.obs):''}</div>
      </div>
      <div class="trans-date">${formatData(t.data)}</div>
      <div class="trans-value ${t.tipo}">${t.tipo==='receita'?'+':'-'} ${formatMoeda(t.valor)}</div>
      <button class="btn-del" onclick="deleteTransaction(${t.id})">🗑️</button>
    </div>`;
  }).join('');
}

function updateFilterCats(txs) {
  const sel = document.getElementById('filter-cat');
  if (!sel) return;
  const cats = [...new Set(txs.map(t=>t.categoria))].sort();
  const cur  = sel.value;
  sel.innerHTML = '<option value="todas">Todas as categorias</option>';
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value=c; o.textContent=(ICONES[c]||'')+ ' '+c;
    if(c===cur) o.selected=true;
    sel.appendChild(o);
  });
}

function updateFilterCatsPeriodo(txs) {
  const sel = document.getElementById('filter-cat-periodo');
  if (!sel) return;
  const cats = [...new Set(txs.map(t=>t.categoria))].sort();
  const cur  = sel.value;
  sel.innerHTML = '<option value="todas">Todas as categorias</option>';
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value=c; o.textContent=(ICONES[c]||'')+ ' '+c;
    if(c===cur) o.selected=true;
    sel.appendChild(o);
  });
}

// ================================================
// CARTÕES DE CRÉDITO
// ================================================
function salvarCartao() {
  const nome        = document.getElementById('cartao-nome')?.value.trim();
  const bandeira    = document.getElementById('cartao-bandeira')?.value;
  const limite      = parseFloat(document.getElementById('cartao-limite')?.value) || 0;
  const fechamento  = parseInt(document.getElementById('cartao-fechamento')?.value);
  const vencimento  = parseInt(document.getElementById('cartao-vencimento')?.value);
  const cor         = document.getElementById('cartao-cor')?.value || '#2D6A4F';

  if (!nome)                    { showToast('⚠️ Informe o nome do cartão.');    return; }
  if (!fechamento||fechamento<1||fechamento>31) { showToast('⚠️ Dia de fechamento inválido.'); return; }
  if (!vencimento||vencimento<1||vencimento>31) { showToast('⚠️ Dia de vencimento inválido.'); return; }

  const cartao = { id: Date.now(), nome, bandeira, limite, fechamento, vencimento, cor };
  state.cartoes.push(cartao);
  saveCartoesLocal(state.cartoes);
  updateSelectCartoes();
  renderCartoes();
  limparFormCartao();
  showToast('✅ Cartão salvo!');
}

function limparFormCartao() {
  document.getElementById('cartao-nome').value = '';
  document.getElementById('cartao-limite').value = '';
  document.getElementById('cartao-fechamento').value = '';
  document.getElementById('cartao-vencimento').value = '';
  document.getElementById('cartao-cor').value = '#2D6A4F';
}

function excluirCartao(id) {
  if (!confirm('Excluir este cartão? Os lançamentos vinculados não serão excluídos.')) return;
  state.cartoes = state.cartoes.filter(c => c.id !== id);
  saveCartoesLocal(state.cartoes);
  updateSelectCartoes();
  renderCartoes();
  showToast('🗑️ Cartão excluído.');
}

function faturaAnterior() { state.faturaOffset--; renderCartoes(); }
function faturaProxima()  {
  if (state.faturaOffset < 0) { state.faturaOffset++; renderCartoes(); }
}

function getFaturaPeriodo(cartao) {
  const hoje  = new Date();
  const base  = new Date(hoje.getFullYear(), hoje.getMonth() + state.faturaOffset, 1);
  const ano   = base.getFullYear();
  const mes   = base.getMonth();
  const dia   = cartao.fechamento;

  // Período: dia+1 do mês anterior até dia do mês atual
  let iniMes = mes - 1, iniAno = ano;
  if (iniMes < 0) { iniMes = 11; iniAno--; }

  const ini  = new Date(iniAno, iniMes, dia + 1);
  const fim  = new Date(ano, mes, dia);
  const venc = new Date(ano, mes, cartao.vencimento);

  return { ini, fim, venc };
}

function renderCartoes() {
  const lista = document.getElementById('cartoes-lista');
  if (!lista) return;

  if (!state.cartoes.length) {
    lista.innerHTML = `<div class="empty-state"><span class="empty-icon">💳</span>
      <p>Nenhum cartão cadastrado.</p></div>`;
    document.getElementById('fatura-label').textContent = 'Fatura Atual';
    return;
  }

  const offsetTxt = state.faturaOffset === 0 ? 'Fatura Atual'
    : state.faturaOffset === -1 ? 'Fatura Anterior'
    : `${Math.abs(state.faturaOffset)} faturas atrás`;
  setText('fatura-label', offsetTxt);

  lista.innerHTML = state.cartoes.map(cartao => {
    const { ini, fim, venc } = getFaturaPeriodo(cartao);
    const iniStr = ini.toISOString().split('T')[0];
    const fimStr = fim.toISOString().split('T')[0];

    // Lançamentos da fatura
    const txsFatura = state.transactions.filter(t => {
      if (String(t.cartaoId) !== String(cartao.id)) return false;
      const d = new Date(t.data + 'T00:00:00');
      return d >= ini && d <= fim;
    });

    const totalFatura  = txsFatura.reduce((s,t) => s+t.valor, 0);
    const disponivel   = cartao.limite > 0 ? cartao.limite - totalFatura : null;
    const pctUsado     = cartao.limite > 0 ? Math.min((totalFatura/cartao.limite)*100,100).toFixed(0) : 0;
    const corStatus    = pctUsado > 80 ? 'var(--vermelho)' : pctUsado > 60 ? '#E65100' : cartao.cor;

    const periodoFmt = `${formatData(iniStr)} a ${formatData(fimStr)}`;
    const vencFmt    = `Vence ${formatData(venc.toISOString().split('T')[0])}`;

    return `<div class="cartao-card">
      <div class="cartao-header" style="background:${cartao.cor}">
        <div class="cartao-title-row">
          <div>
            <div class="cartao-nome">💳 ${cartao.nome}</div>
            <div class="cartao-bandeira">${cartao.bandeira}</div>
          </div>
          <button class="cartao-del-btn" onclick="excluirCartao(${cartao.id})">🗑️</button>
        </div>
        <div class="cartao-periodo">${periodoFmt} · ${vencFmt}</div>
      </div>
      <div class="cartao-body">
        <div class="cartao-valores">
          <div class="cartao-val-item">
            <div class="cartao-val-label">Fatura Atual</div>
            <div class="cartao-val-num" style="color:var(--vermelho)">${formatMoeda(totalFatura)}</div>
          </div>
          ${cartao.limite > 0 ? `
          <div class="cartao-val-item">
            <div class="cartao-val-label">Limite</div>
            <div class="cartao-val-num">${formatMoeda(cartao.limite)}</div>
          </div>
          <div class="cartao-val-item">
            <div class="cartao-val-label">Disponível</div>
            <div class="cartao-val-num" style="color:var(--verde-positivo)">${formatMoeda(disponivel)}</div>
          </div>` : ''}
        </div>
        ${cartao.limite > 0 ? `
        <div class="cartao-barra-wrap">
          <div class="cartao-barra">
            <div class="cartao-barra-fill" style="width:${pctUsado}%;background:${corStatus}"></div>
          </div>
          <span class="cartao-pct">${pctUsado}% usado</span>
        </div>` : ''}
        <div class="cartao-lancamentos">
          <div class="cartao-lanc-title">📋 Lançamentos da fatura (${txsFatura.length})</div>
          ${txsFatura.length === 0
            ? '<div style="color:var(--texto-medio);font-size:0.82rem;padding:8px 0">Nenhum lançamento nesta fatura</div>'
            : txsFatura.slice(0,5).map(t => `
              <div class="cartao-lanc-item">
                <span>${ICONES[t.categoria]||'📌'} ${escapeHtml(t.desc)}</span>
                <span>${formatData(t.data)}</span>
                <span style="color:var(--vermelho);font-weight:bold">${formatMoeda(t.valor)}</span>
              </div>`).join('')
          }
          ${txsFatura.length > 5 ? `<div style="font-size:0.78rem;color:var(--texto-medio);margin-top:4px">
            + ${txsFatura.length - 5} lançamentos adicionais</div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ================================================
// RELATÓRIOS
// ================================================
function renderRelatorios() {
  const txs = getTransacoesMes();
  const rec = txs.filter(t=>t.tipo==='receita');
  const dep = txs.filter(t=>t.tipo==='despesa');
  const totalRec = rec.reduce((s,t)=>s+t.valor,0);
  const totalDep = dep.reduce((s,t)=>s+t.valor,0);
  const saldo    = totalRec - totalDep;
  const economia = totalRec > 0 ? ((saldo/totalRec)*100).toFixed(1) : 0;

  setText('rel-receitas', formatMoeda(totalRec));
  setText('rel-despesas', formatMoeda(totalDep));
  setText('rel-economia', economia + '%');

  const relSaldo = document.getElementById('rel-saldo');
  if (relSaldo) {
    relSaldo.textContent = formatMoeda(Math.abs(saldo));
    relSaldo.parentElement.className = 'rel-card ' + (saldo>=0?'pos':'neg');
  }

  // ── INSIGHTS ──
  const insightsEl = document.getElementById('rel-insights');
  if (insightsEl) {
    const insights = [];
    if (dep.length === 0 && rec.length === 0) {
      insights.push('📭 Nenhum lançamento registrado neste mês.');
    } else {
      if (saldo >= 0) insights.push(`✅ Você ficou <strong>no azul</strong> este mês! Saldo positivo de <strong>${formatMoeda(saldo)}</strong>.`);
      else insights.push(`⚠️ Você ficou <strong>no vermelho</strong> este mês em <strong>${formatMoeda(Math.abs(saldo))}</strong>.`);

      // Categoria mais cara
      const catMap = {};
      dep.forEach(t => { catMap[t.categoria]=(catMap[t.categoria]||0)+t.valor; });
      const topDep = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
      if (topDep) insights.push(`🏆 Maior gasto: <strong>${topDep[0]}</strong> com <strong>${formatMoeda(topDep[1])}</strong> (${totalDep>0?((topDep[1]/totalDep)*100).toFixed(0):0}% do total).`);

      // Maior despesa única
      const maiorDep = [...dep].sort((a,b)=>b.valor-a.valor)[0];
      if (maiorDep) insights.push(`💸 Maior despesa única: <strong>${escapeHtml(maiorDep.desc)}</strong> no valor de <strong>${formatMoeda(maiorDep.valor)}</strong>.`);

      // Taxa de economia
      if (totalRec > 0) {
        if (Number(economia) >= 20) insights.push(`🎉 Parabéns! Taxa de economia de <strong>${economia}%</strong> — muito bom!`);
        else if (Number(economia) > 0) insights.push(`💡 Taxa de economia de <strong>${economia}%</strong>. A meta recomendada é 20%.`);
        else insights.push(`❌ Sem economia este mês. As despesas superaram as receitas.`);
      }
    }
    insightsEl.innerHTML = insights.map(i =>
      `<div class="insight-linha">${i}</div>`
    ).join('');
  }

  // Tabelas de categoria
  renderCategoryTableRel(dep, totalDep, 'rel-cat-tbody');
  renderCategoryTableRel(rec, totalRec, 'rel-rec-tbody');

  // Top 5 maiores despesas
  const top5tbody = document.getElementById('rel-top5-tbody');
  if (top5tbody) {
    const top5 = [...dep].sort((a,b)=>b.valor-a.valor).slice(0,5);
    if (!top5.length) {
      top5tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--texto-medio);padding:16px">Nenhuma despesa no período</td></tr>`;
    } else {
      top5tbody.innerHTML = top5.map((t,i) => `<tr>
        <td><strong>#${i+1}</strong></td>
        <td>${escapeHtml(t.desc)}</td>
        <td>${ICONES[t.categoria]||'📌'} ${t.categoria}</td>
        <td>${formatData(t.data)}</td>
        <td style="color:var(--vermelho);font-weight:bold">${formatMoeda(t.valor)}</td>
      </tr>`).join('');
    }
  }
}

function renderCategoryTableRel(txs, total, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const catMap = {};
  txs.forEach(t => { catMap[t.categoria]=(catMap[t.categoria]||0)+t.valor; });
  const sorted = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--texto-medio);padding:16px">Sem registros</td></tr>`;
    return;
  }
  tbody.innerHTML = sorted.map(([cat,val]) => {
    const pct = total > 0 ? ((val/total)*100).toFixed(1) : 0;
    return `<tr>
      <td>${ICONES[cat]||'📌'} ${cat}</td>
      <td>${formatMoeda(val)}</td>
      <td>${pct}%</td>
    </tr>`;
  }).join('');
}

// ================================================
// CONFIGURAÇÕES
// ================================================
function alterarSenha() {
  const atual    = document.getElementById('senha-atual')?.value;
  const nova     = document.getElementById('senha-nova')?.value;
  const confirma = document.getElementById('senha-confirma')?.value;
  const ok = localStorage.getItem('fp_senha') || SENHA_PADRAO;
  if (atual !== ok)      { showToast('❌ Senha atual incorreta.');   return; }
  if (nova.length < 6)   { showToast('⚠️ Mínimo 6 caracteres.');    return; }
  if (nova !== confirma) { showToast('⚠️ As senhas não coincidem.'); return; }
  localStorage.setItem('fp_senha', nova);
  ['senha-atual','senha-nova','senha-confirma'].forEach(id => {
    document.getElementById(id).value = '';
  });
  showToast('✅ Senha alterada!');
}

async function salvarUrlSheets() {
  const input = document.getElementById('sheets-url');
  const url   = input?.value.trim();
  if (!url) {
    SHEETS_URL = ''; localStorage.removeItem('fp_sheets_url');
    state.sheetsConectado = false;
    setSyncStatus('💾 Modo local', 'local');
    showToast('🔌 Sheets desconectado.');
    return;
  }
  setSyncStatus('⏳ Testando...', 'info');
  SHEETS_URL = url;
  const ok = await testarConexaoSheets();
  if (ok) {
    localStorage.setItem('fp_sheets_url', url);
    state.sheetsConectado = true;
    setSyncStatus('✅ Sheets conectado!', 'success');
    showToast('✅ Google Sheets conectado!');
    if (state.transactions.length > 0) await saveSheets(state.transactions);
  } else {
    SHEETS_URL = localStorage.getItem('fp_sheets_url') || '';
    setSyncStatus('❌ URL inválida', 'error');
    showToast('❌ Não foi possível conectar.');
  }
}

async function sincronizarAgora() {
  if (!SHEETS_URL) { showToast('⚠️ Configure o Sheets primeiro.'); return; }
  setSyncStatus('⏳ Sincronizando...', 'info');
  const ok = await saveSheets(state.transactions);
  setSyncStatus(ok ? '✅ Sincronizado' : '❌ Erro', ok ? 'success' : 'error');
  showToast(ok ? '✅ Sincronizado!' : '❌ Erro ao sincronizar.');
}

function exportarDados() {
  const data = JSON.stringify({ version:2, exportedAt:new Date().toISOString(),
    transactions:state.transactions, cartoes:state.cartoes }, null, 2);
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([data],{type:'application/json'}));
  a.download = 'financaspro-backup-' + getTodayISO() + '.json';
  a.click();
  showToast('📥 Backup exportado!');
}

function importarDados() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const txs    = parsed.transactions || (Array.isArray(parsed)?parsed:null);
        if (!txs) { showToast('❌ Arquivo inválido.'); return; }
        if (!confirm(`Importar ${txs.length} lançamento(s)?`)) return;
        state.transactions = txs;
        if (parsed.cartoes) state.cartoes = parsed.cartoes;
        await saveData();
        updateSelectCartoes();
        renderAll();
        showToast(`✅ ${txs.length} lançamentos importados!`);
      } catch { showToast('❌ Erro ao ler arquivo.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

async function limparTodosDados() {
  if (!confirm('⚠️ Apagará TODOS os dados. Confirma?')) return;
  if (!confirm('Última confirmação: apagar tudo?')) return;
  state.transactions = []; state.cartoes = [];
  await saveData();
  updateSelectCartoes();
  renderAll();
  showToast('🗑️ Dados apagados.');
}

// ================================================
// UTILITÁRIOS
// ================================================
function formatMoeda(v) { return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function formatData(d)  { if(!d)return''; const[y,m,day]=d.split('-'); return`${day}/${m}/${y}`; }
function getTodayISO()  { return new Date().toISOString().split('T')[0]; }
function setText(id,t)  { const el=document.getElementById(id); if(el) el.textContent=t; }
function escapeHtml(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function showToast(msg, dur=3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), dur);
}
