/* ================================================
   FinançasPro — JavaScript Principal
   ================================================ */

'use strict';

// ================================================
// CONSTANTES
// ================================================
const SENHA_PADRAO = 'FinancasPro2025';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CATEGORIAS_DESPESA = [
  'Moradia','Educação','Transporte','Seguros','Alimentação',
  'Pet','Cuidados Pessoais','Entretenimento',
  'Investimentos Curto Prazo','Investimentos Longo Prazo',
  'Empréstimos','Igreja / Religião','Impostos',
  'Presentes','Doações','Jurídico'
];

const CATEGORIAS_RECEITA = [
  'Salário','Renda Extra','Freelance','Investimentos','Outros'
];

const ICONES = {
  'Moradia':'🏠','Educação':'📚','Transporte':'🚗','Seguros':'🛡️',
  'Alimentação':'🛒','Pet':'🐾','Cuidados Pessoais':'💅',
  'Entretenimento':'🎬','Investimentos Curto Prazo':'📈',
  'Investimentos Longo Prazo':'💰','Empréstimos':'🏦',
  'Igreja / Religião':'⛪','Impostos':'📋','Presentes':'🎁',
  'Doações':'❤️','Jurídico':'⚖️',
  'Salário':'💼','Renda Extra':'💵','Freelance':'🖥️',
  'Investimentos':'📊','Outros':'📌'
};

const CORES_GRAFICO = [
  '#2D6A4F','#D4AF37','#52B788','#A07820','#95D5B2',
  '#1B4332','#F0CB5E','#40916C','#B7E4C7','#C9A227',
  '#74C69D','#081C15','#D8F3DC','#588157','#3A5A40','#E9C46A'
];

// ================================================
// ESTADO DA APLICAÇÃO
// ================================================
let state = {
  transactions: [],
  mesAtual: new Date().getMonth(),
  anoAtual: new Date().getFullYear(),
};

let charts = { pie: null, bar: null };

// ================================================
// INICIALIZAÇÃO
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  initPasswordGate();
  initNavigation();
  initForm();
  initMonthNav();
  initFilters();
  initMobileMenu();
  updateTopbarDate();
});

// ================================================
// DATA TOPBAR
// ================================================
function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

// ================================================
// MENU MOBILE
// ================================================
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar && overlay) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
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
    const senhaCorreta = localStorage.getItem('fp_senha') || SENHA_PADRAO;
    if (input.value === senhaCorreta) {
      gate.style.display = 'none';
      loadData();
      renderAll();
    } else {
      error.textContent = '❌ Senha incorreta. Tente novamente.';
      box.classList.remove('shake');
      void box.offsetWidth; // reflow
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
  const gate  = document.getElementById('password-gate');
  const input = document.getElementById('pw-input');
  const error = document.getElementById('pw-error');
  if (gate) gate.style.display = 'flex';
  if (input) { input.value = ''; input.focus(); }
  if (error) error.textContent = '';
}

// ================================================
// LOCALSTORAGE
// ================================================
function loadData() {
  try {
    const saved = localStorage.getItem('fp_transactions');
    state.transactions = saved ? JSON.parse(saved) : [];
  } catch {
    state.transactions = [];
  }
}

function saveData() {
  localStorage.setItem('fp_transactions', JSON.stringify(state.transactions));
}

// ================================================
// TRANSAÇÕES
// ================================================
function addTransaction(tx) {
  tx.id = Date.now() + Math.random();
  state.transactions.unshift(tx);
  saveData();
  renderAll();
  showToast('✅ Lançamento salvo com sucesso!');
}

function deleteTransaction(id) {
  if (!confirm('Deseja excluir este lançamento?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveData();
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

// ================================================
// NAVEGAÇÃO
// ================================================
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      activateView(view, item);
      // Fechar sidebar no mobile
      document.querySelector('.sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('show');
    });
  });
}

function activateView(viewName, navItem) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const targetNav  = navItem || document.querySelector(`.nav-item[data-view="${viewName}"]`);
  const targetView = document.getElementById('view-' + viewName);

  if (targetNav)  targetNav.classList.add('active');
  if (targetView) targetView.classList.add('active');

  const titles = { dashboard:'Dashboard', lancamentos:'Lançamentos', relatorios:'Relatórios', configuracoes:'Configurações' };
  const h2 = document.querySelector('.topbar h2');
  if (h2) h2.textContent = titles[viewName] || viewName;

  // Renderizar view específica
  if (viewName === 'dashboard')    renderDashboard();
  if (viewName === 'lancamentos')  renderLancamentos();
  if (viewName === 'relatorios')   renderRelatorios();
}

// ================================================
// FORMULÁRIO
// ================================================
function initForm() {
  const tipoBtns = document.querySelectorAll('.tipo-btn');

  tipoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tipoBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateCategorias(btn.dataset.tipo);
    });
  });

  // Padrão: despesa
  const btnDespesa = document.querySelector('.tipo-btn.despesa');
  if (btnDespesa) { btnDespesa.classList.add('active'); updateCategorias('despesa'); }

  // Data padrão = hoje
  const inputData = document.getElementById('form-data');
  if (inputData) inputData.value = getTodayISO();

  document.getElementById('btn-salvar')?.addEventListener('click', salvarLancamento);
  document.getElementById('btn-limpar')?.addEventListener('click', limparForm);
}

function updateCategorias(tipo) {
  const cats = tipo === 'despesa' ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA;
  const sel  = document.getElementById('form-categoria');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione a categoria...</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = (ICONES[c] || '📌') + '  ' + c;
    sel.appendChild(opt);
  });
}

function salvarLancamento() {
  const tipo      = document.querySelector('.tipo-btn.active')?.dataset.tipo;
  const desc      = document.getElementById('form-descricao')?.value.trim();
  const valor     = parseFloat(document.getElementById('form-valor')?.value);
  const categoria = document.getElementById('form-categoria')?.value;
  const data      = document.getElementById('form-data')?.value;
  const obs       = document.getElementById('form-obs')?.value.trim();

  if (!desc)              { showToast('⚠️ Informe a descrição.');      return; }
  if (!valor || valor<=0) { showToast('⚠️ Informe um valor válido.');   return; }
  if (!categoria)         { showToast('⚠️ Selecione uma categoria.');   return; }
  if (!data)              { showToast('⚠️ Informe a data.');            return; }

  addTransaction({ tipo, desc, valor, categoria, data, obs });
  limparForm();
}

function limparForm() {
  document.getElementById('form-descricao').value = '';
  document.getElementById('form-valor').value     = '';
  document.getElementById('form-categoria').value  = '';
  document.getElementById('form-obs').value        = '';
  document.getElementById('form-data').value       = getTodayISO();
}

// ================================================
// NAVEGAÇÃO DE MÊS
// ================================================
function initMonthNav() {
  document.getElementById('btn-mes-ant')?.addEventListener('click', () => {
    state.mesAtual--;
    if (state.mesAtual < 0) { state.mesAtual = 11; state.anoAtual--; }
    updateMonthLabel();
    renderAll();
  });
  document.getElementById('btn-mes-prox')?.addEventListener('click', () => {
    state.mesAtual++;
    if (state.mesAtual > 11) { state.mesAtual = 0; state.anoAtual++; }
    updateMonthLabel();
    renderAll();
  });
  updateMonthLabel();
}

function updateMonthLabel() {
  const el = document.getElementById('mes-label');
  if (el) el.textContent = MESES[state.mesAtual] + ' de ' + state.anoAtual;
  const relEl = document.getElementById('rel-mes-label');
  if (relEl) relEl.textContent = MESES[state.mesAtual] + '/' + state.anoAtual;
}

// ================================================
// FILTROS
// ================================================
function initFilters() {
  document.getElementById('filter-tipo')?.addEventListener('change', renderLancamentos);
  document.getElementById('filter-cat')?.addEventListener('change', renderLancamentos);
}

// ================================================
// RENDER ALL
// ================================================
function renderAll() {
  updateMonthLabel();
  renderDashboard();
  renderLancamentos();
}

// ================================================
// DASHBOARD
// ================================================
function renderDashboard() {
  const txs = getTransacoesMes();

  const totalReceitas = txs.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalDespesas = txs.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const saldo         = totalReceitas - totalDespesas;
  const taxaEconomia  = totalReceitas > 0 ? ((saldo / totalReceitas) * 100).toFixed(1) : 0;

  setText('card-receitas', formatMoeda(totalReceitas));
  setText('card-despesas', formatMoeda(totalDespesas));
  setText('card-economia', taxaEconomia + '%');

  const cardSaldo = document.getElementById('card-saldo');
  if (cardSaldo) {
    cardSaldo.textContent = formatMoeda(Math.abs(saldo));
    cardSaldo.style.color = saldo >= 0 ? 'var(--dourado-escuro)' : 'var(--vermelho)';
    if (saldo < 0) cardSaldo.textContent = '-' + formatMoeda(Math.abs(saldo));
  }

  renderCategoryTable(txs, totalDespesas);
  renderPieChart(txs, totalDespesas);
  renderBarChart();
}

// ================================================
// TABELA DE CATEGORIAS
// ================================================
function renderCategoryTable(txs, totalDespesas) {
  const tbody = document.getElementById('cat-tbody');
  if (!tbody) return;

  const despesas = txs.filter(t => t.tipo === 'despesa');
  const catMap   = {};
  despesas.forEach(t => { catMap[t.categoria] = (catMap[t.categoria] || 0) + t.valor; });

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--texto-medio);padding:24px">Nenhuma despesa registrada neste período</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(([cat, val]) => {
    const pct  = totalDespesas > 0 ? ((val / totalDespesas) * 100).toFixed(1) : 0;
    const icon = ICONES[cat] || '📌';
    return `
      <tr>
        <td>${icon} &nbsp;${cat}</td>
        <td><strong>${formatMoeda(val)}</strong></td>
        <td>${pct}%</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ================================================
// GRÁFICO PIZZA (Despesas por Categoria)
// ================================================
function renderPieChart(txs, totalDespesas) {
  const ctx = document.getElementById('chart-pizza');
  if (!ctx) return;

  const despesas = txs.filter(t => t.tipo === 'despesa');
  const catMap   = {};
  despesas.forEach(t => { catMap[t.categoria] = (catMap[t.categoria] || 0) + t.valor; });

  const labels = Object.keys(catMap);
  const data   = Object.values(catMap);

  if (charts.pie) { charts.pie.destroy(); charts.pie = null; }

  if (labels.length === 0) {
    const c = ctx.getContext('2d');
    c.clearRect(0, 0, ctx.width, ctx.height);
    c.fillStyle = '#999';
    c.font = '14px Tahoma';
    c.textAlign = 'center';
    c.fillText('Sem dados no período', ctx.width / 2, ctx.height / 2);
    return;
  }

  charts.pie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CORES_GRAFICO.slice(0, labels.length),
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { family: 'Tahoma', size: 11 },
            boxWidth: 14,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = totalDespesas > 0 ? ((ctx.raw / totalDespesas) * 100).toFixed(1) : 0;
              return `  ${ctx.label}: ${formatMoeda(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ================================================
// GRÁFICO BARRAS (Últimos 6 meses)
// ================================================
function renderBarChart() {
  const ctx = document.getElementById('chart-barras');
  if (!ctx) return;

  const labels   = [];
  const receitas = [];
  const despesas = [];

  for (let i = 5; i >= 0; i--) {
    let m = state.mesAtual - i;
    let a = state.anoAtual;
    while (m < 0) { m += 12; a--; }

    labels.push(MESES_CURTOS[m] + '/' + String(a).slice(2));

    const txs = getTransacoesMes(m, a);
    receitas.push(txs.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0));
    despesas.push(txs.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0));
  }

  if (charts.bar) { charts.bar.destroy(); charts.bar = null; }

  charts.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Receitas', data: receitas, backgroundColor: '#52B788', borderRadius: 7, borderSkipped: false },
        { label: 'Despesas', data: despesas, backgroundColor: '#C0392B', borderRadius: 7, borderSkipped: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: 'Tahoma', size: 11 } } },
        tooltip: {
          callbacks: { label: ctx => `  ${ctx.dataset.label}: ${formatMoeda(ctx.raw)}` }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: v => 'R$ ' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toLocaleString('pt-BR')),
            font: { family: 'Tahoma', size: 10 }
          },
          grid: { color: '#F5F0E8' }
        },
        x: {
          ticks: { font: { family: 'Tahoma', size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ================================================
// LANÇAMENTOS
// ================================================
function renderLancamentos() {
  const txs       = getTransacoesMes();
  const filterTipo = document.getElementById('filter-tipo')?.value || 'todos';
  const filterCat  = document.getElementById('filter-cat')?.value  || 'todas';

  let filtered = [...txs];
  if (filterTipo !== 'todos')  filtered = filtered.filter(t => t.tipo === filterTipo);
  if (filterCat  !== 'todas')  filtered = filtered.filter(t => t.categoria === filterCat);

  updateFilterCats(txs);
  renderTransactionList(filtered);
}

function renderTransactionList(txs) {
  const list = document.getElementById('transactions-list');
  if (!list) return;

  if (txs.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>Nenhum lançamento encontrado neste período.</p>
        <p style="font-size:0.8rem;margin-top:8px">Clique em "Lançamentos" e adicione o primeiro!</p>
      </div>`;
    return;
  }

  list.innerHTML = txs.map(t => `
    <div class="transaction-item">
      <div class="trans-icon ${t.tipo}">${ICONES[t.categoria] || '📌'}</div>
      <div class="trans-info">
        <div class="trans-desc">${escapeHtml(t.desc)}</div>
        <div class="trans-cat">${t.categoria}${t.obs ? ' &middot; ' + escapeHtml(t.obs) : ''}</div>
      </div>
      <div class="trans-date">${formatData(t.data)}</div>
      <div class="trans-value ${t.tipo}">
        ${t.tipo === 'receita' ? '+' : '-'} ${formatMoeda(t.valor)}
      </div>
      <button class="btn-del" onclick="deleteTransaction(${t.id})" title="Excluir lançamento">🗑️</button>
    </div>
  `).join('');
}

function updateFilterCats(txs) {
  const sel = document.getElementById('filter-cat');
  if (!sel) return;
  const cats    = [...new Set(txs.map(t => t.categoria))].sort();
  const current = sel.value;
  sel.innerHTML  = '<option value="todas">Todas as categorias</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = (ICONES[c] || '') + ' ' + c;
    if (c === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ================================================
// RELATÓRIOS
// ================================================
function renderRelatorios() {
  const txs = getTransacoesMes();
  const totalReceitas = txs.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalDespesas = txs.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  setText('rel-receitas', formatMoeda(totalReceitas));
  setText('rel-despesas', formatMoeda(totalDespesas));

  const relSaldo = document.getElementById('rel-saldo');
  if (relSaldo) {
    relSaldo.textContent = formatMoeda(Math.abs(saldo));
    relSaldo.parentElement.className = 'rel-card ' + (saldo >= 0 ? 'pos' : 'neg');
  }

  // Tabela por categoria
  const tbody = document.getElementById('rel-cat-tbody');
  if (!tbody) return;
  const despesas = txs.filter(t => t.tipo === 'despesa');
  const catMap   = {};
  despesas.forEach(t => { catMap[t.categoria] = (catMap[t.categoria] || 0) + t.valor; });
  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--texto-medio);padding:20px">Sem despesas no período</td></tr>`;
    return;
  }
  tbody.innerHTML = sorted.map(([cat, val]) => {
    const pct = totalDespesas > 0 ? ((val / totalDespesas) * 100).toFixed(1) : 0;
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

  const senhaAtual = localStorage.getItem('fp_senha') || SENHA_PADRAO;
  if (atual !== senhaAtual)    { showToast('❌ Senha atual incorreta.');          return; }
  if (nova.length < 6)         { showToast('⚠️ Mínimo 6 caracteres.');           return; }
  if (nova !== confirma)       { showToast('⚠️ As senhas não coincidem.');        return; }

  localStorage.setItem('fp_senha', nova);
  document.getElementById('senha-atual').value    = '';
  document.getElementById('senha-nova').value     = '';
  document.getElementById('senha-confirma').value = '';
  showToast('✅ Senha alterada com sucesso!');
}

function exportarDados() {
  const data = JSON.stringify({ version:1, exportedAt: new Date().toISOString(), transactions: state.transactions }, null, 2);
  const blob  = new Blob([data], { type: 'application/json' });
  const a     = document.createElement('a');
  a.href      = URL.createObjectURL(blob);
  a.download  = 'financaspro-backup-' + getTodayISO() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('📥 Backup exportado com sucesso!');
}

function importarDados() {
  const input   = document.createElement('input');
  input.type    = 'file';
  input.accept  = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const txs = parsed.transactions || (Array.isArray(parsed) ? parsed : null);
        if (!txs) { showToast('❌ Arquivo inválido.'); return; }
        if (!confirm(`Importar ${txs.length} lançamento(s)? Os dados atuais serão substituídos.`)) return;
        state.transactions = txs;
        saveData();
        renderAll();
        showToast(`✅ ${txs.length} lançamentos importados!`);
      } catch { showToast('❌ Erro ao ler o arquivo JSON.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function limparTodosDados() {
  if (!confirm('⚠️ ATENÇÃO: Isso apagará TODOS os lançamentos. Esta ação não pode ser desfeita!')) return;
  if (!confirm('Confirma a exclusão permanente de todos os dados?')) return;
  state.transactions = [];
  saveData();
  renderAll();
  showToast('🗑️ Todos os dados foram apagados.');
}

// ================================================
// UTILITÁRIOS
// ================================================
function formatMoeda(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}
