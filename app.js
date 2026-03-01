
const TOTAL_STEPS = 4;
let currentStep = 1;
let userData = {};
let riskApetite = null;
let expenses = [];
let discretionaryBudget = 0;
let expCatIcon = '🎬';

// Init step indicators
function initIndicators() {
  const wrap = document.getElementById('stepIndicator');
  wrap.innerHTML = '';
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const d = document.createElement('div');
    d.className = 'step-dot' + (i === currentStep ? ' active' : i < currentStep ? ' done' : '');
    wrap.appendChild(d);
  }
}
initIndicators();

function selectRisk(val, el) {
  riskApetite = val;
  document.querySelectorAll('.risk-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function updateSaveRate() {
  const salary = parseFloat(document.getElementById('salary').value) || 0;
  const rate = parseInt(document.getElementById('saveRate').value);
  document.getElementById('saveRateLabel').textContent = rate + '%';
  const amt = Math.round(salary * rate / 100);
  document.getElementById('savingsAmount').textContent = fmt(amt);
  const expenses_total = (parseFloat(document.getElementById('rent').value)||0) +
    (parseFloat(document.getElementById('groceries').value)||0) +
    (parseFloat(document.getElementById('transport').value)||0) +
    (parseFloat(document.getElementById('other').value)||0);
  const leftover = salary - expenses_total - amt;
  document.getElementById('savingsNote').textContent = leftover >= 0
    ? `Leaves ${fmt(leftover)} for discretionary spending`
    : `⚠️ This exceeds your available income by ${fmt(Math.abs(leftover))}`;
}

function nextStep(from) {
  if (!validate(from)) return;
  currentStep++;
  document.getElementById('step-'+from).classList.remove('active');
  document.getElementById('step-'+currentStep).classList.add('active');
  if (currentStep === 4) updateSaveRate();
  initIndicators();
  window.scrollTo({top: 0, behavior:'smooth'});
}

function prevStep(from) {
  document.getElementById('step-'+from).classList.remove('active');
  currentStep--;
  document.getElementById('step-'+currentStep).classList.add('active');
  initIndicators();
}

function validate(step) {
  if (step === 1) {
    const age = document.getElementById('age').value;
    const salary = document.getElementById('salary').value;
    if (!age || age < 18 || age > 80) { alert('Please enter a valid age (18–80)'); return false; }
    if (!salary || salary < 1000) { alert('Please enter a valid monthly salary'); return false; }
  }
  if (step === 2) {
    if (!riskApetite) { alert('Please select your risk appetite'); return false; }
  }
  return true;
}

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function generatePlan() {
  if (!validate(4)) return;
  const age = parseInt(document.getElementById('age').value);
  const salary = parseFloat(document.getElementById('salary').value);
  const dependents = parseInt(document.getElementById('dependents').value);
  const rent = parseFloat(document.getElementById('rent').value)||0;
  const groceries = parseFloat(document.getElementById('groceries').value)||0;
  const transport = parseFloat(document.getElementById('transport').value)||0;
  const other = parseFloat(document.getElementById('other').value)||0;
  const totalFixedExp = rent + groceries + transport + other;
  const saveRate = parseInt(document.getElementById('saveRate').value);
  const monthlySavings = Math.round(salary * saveRate / 100);
  const discretionary = Math.max(0, salary - totalFixedExp - monthlySavings);

  userData = { age, salary, dependents, totalFixedExp, monthlySavings, discretionary, saveRate };
  discretionaryBudget = discretionary;

  document.getElementById('stepsContainer').style.display = 'none';
  document.getElementById('stepIndicator').style.display = 'none';

  // Build dashboard
  buildDashboard(userData);
  document.getElementById('dashboard').style.display = 'block';
  window.scrollTo({top: 0, behavior:'smooth'});
}

function buildDashboard(d) {
  const { age, salary, dependents, totalFixedExp, monthlySavings, discretionary, saveRate } = d;

  // Sub header
  document.getElementById('dashSub').textContent =
    `Based on your ₹${salary.toLocaleString('en-IN')}/mo income • ${riskApetite.charAt(0).toUpperCase()+riskApetite.slice(1)} risk profile`;

  // Emergency fund target (6 months expenses)
  const monthlyNeed = totalFixedExp + (salary * 0.1); // essential + 10% buffer
  const emergencyFund = monthlyNeed * 6;
  const yearlyInvestment = monthlySavings * 12;
  const yearsToRetire = Math.max(5, 60 - age);

  // Summary cards
  document.getElementById('summaryGrid').innerHTML = `
    <div class="summary-card green">
      <div class="summary-label">Monthly Savings</div>
      <div class="summary-value green">${fmt(monthlySavings)}</div>
      <div class="summary-note">${saveRate}% of income</div>
    </div>
    <div class="summary-card gold">
      <div class="summary-label">Emergency Fund Target</div>
      <div class="summary-value gold">${fmt(emergencyFund)}</div>
      <div class="summary-note">6 months of essential expenses</div>
    </div>
    <div class="summary-card" style="border-top-color:var(--accent)">
      <div class="summary-label">Discretionary Budget</div>
      <div class="summary-value" style="color:var(--text)">${fmt(discretionary)}</div>
      <div class="summary-note">Free to spend each month</div>
    </div>
  `;

  // Foundation checklist
  const foundations = [
    {
      icon: '🏦',
      title: '6-Month Emergency Fund',
      desc: `Build ${fmt(emergencyFund)} in a liquid savings account. Priority #1 before any investment.`,
      badge: 'Start Here',
      badgeClass: ''
    },
    {
      icon: '🏥',
      title: 'Health Insurance',
      desc: `Minimum ₹5–10 lakh cover for yourself${dependents > 0 ? ' + family' : ''}. Budget ₹${(1500*(1+dependents)).toLocaleString('en-IN')}–₹${(3000*(1+dependents)).toLocaleString('en-IN')}/mo.`,
      badge: 'Essential',
      badgeClass: 'warning'
    },
    {
      icon: '🛡️',
      title: 'Term Life Insurance',
      desc: `Cover 10–15× annual income = ${fmt(salary * 12 * 12)}. Pure term plan costs ~₹1,000–₹2,000/mo at your age.`,
      badge: dependents > 0 ? 'Critical' : 'Recommended',
      badgeClass: dependents > 0 ? 'danger' : 'warning'
    }
  ];
  document.getElementById('foundationList').innerHTML = foundations.map(f => `
    <div style="display:flex;gap:16px;align-items:flex-start;padding:16px;background:var(--bg3);border-radius:12px;border:1px solid var(--border)">
      <div style="font-size:1.8rem">${f.icon}</div>
      <div style="flex:1">
        <div style="font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px">
          ${f.title} <span class="badge ${f.badgeClass}">${f.badge}</span>
        </div>
        <div style="font-size:0.85rem;color:var(--text2)">${f.desc}</div>
      </div>
    </div>
  `).join('');

  // Allocation
  const alloc = getAllocation(monthlySavings, riskApetite, age);
  const colors = ['#2dff8f','#f5c842','#00b4d8','#ff6b6b','#a29bfe','#fd79a8'];
  let barHTML = '';
  let listHTML = '';
  alloc.forEach((a, i) => {
    const amt = Math.round(monthlySavings * a.pct / 100);
    barHTML += `<div class="bar-seg" style="width:${a.pct}%;background:${colors[i]}"></div>`;
    listHTML += `
      <div class="alloc-item">
        <div class="alloc-color" style="background:${colors[i]}"></div>
        <div class="alloc-name">${a.name}</div>
        <div class="alloc-pct">${a.pct}%</div>
        <div class="alloc-amt">${fmt(amt)}</div>
      </div>`;
  });
  document.getElementById('allocBar').innerHTML = barHTML;
  document.getElementById('allocList').innerHTML = listHTML;

  // Tips
  const tips = getTips(age, salary, riskApetite, dependents, saveRate);
  document.getElementById('tipsList').innerHTML = tips.map(t => `
    <div class="tip-card">
      <div class="tip-icon">${t.icon}</div>
      <div>
        <div class="tip-head">${t.head}</div>
        <div class="tip-text">${t.text}</div>
      </div>
    </div>
  `).join('');

  // Setup expense tracker
  document.getElementById('budgetMax').textContent = fmt(discretionary) + ' Total';
  updateBudgetBar();
}

function getAllocation(total, risk, age) {
  // Build allocation based on risk and age
  const debtPct = Math.min(70, Math.max(20, age - 10)); // older = more debt
  let alloc;
  if (risk === 'conservative') {
    alloc = [
      { name: 'Emergency Fund SIP', pct: 30 },
      { name: 'Fixed Deposits / Debt Funds', pct: 35 },
      { name: 'Index Funds (Nifty 50)', pct: 20 },
      { name: 'Gold / SGBs', pct: 10 },
      { name: 'PPF / NPS', pct: 5 },
    ];
  } else if (risk === 'moderate') {
    alloc = [
      { name: 'Emergency Fund SIP', pct: 20 },
      { name: 'Index Funds (Nifty 50)', pct: 35 },
      { name: 'Debt Mutual Funds', pct: 20 },
      { name: 'Mid/Small Cap Funds', pct: 15 },
      { name: 'Gold / SGBs', pct: 5 },
      { name: 'NPS / PPF', pct: 5 },
    ];
  } else {
    alloc = [
      { name: 'Emergency Fund SIP', pct: 10 },
      { name: 'Large Cap Index Funds', pct: 25 },
      { name: 'Mid & Small Cap Funds', pct: 30 },
      { name: 'International ETFs', pct: 15 },
      { name: 'Sectoral / Thematic Funds', pct: 15 },
      { name: 'Crypto / Alt Assets', pct: 5 },
    ];
  }
  // Adjust emergency fund portion based on if emergency fund likely already built
  return alloc;
}

function getTips(age, salary, risk, dependents, saveRate) {
  const tips = [
    { icon: '📈', head: 'Power of Compounding', text: `Starting at ${age}, investing ${fmt(salary * saveRate/100)}/mo at 12% CAGR grows to ${fmt(salary * saveRate/100 * 12 * (Math.pow(1.12, Math.max(5,60-age))-1) / 0.12)} by retirement.` },
    { icon: '🧾', head: 'Tax Saving (Section 80C)', text: 'Invest ₹1.5L/year in ELSS, PPF, or NPS to save up to ₹46,800 in taxes annually.' },
    { icon: '🔄', head: 'SIP Over Lump Sum', text: 'Use SIPs to average out market volatility. Automate them on salary day so you invest before spending.' },
    { icon: '⚡', head: 'Step-Up SIP', text: `Increase your SIP by 10% each year. Even small increments accelerate wealth dramatically over ${Math.max(5, 60-age)} years.` },
    ...(risk === 'aggressive' ? [
      { icon: '🌍', head: 'Diversify Globally', text: 'Add 10–15% international ETFs (Nasdaq, S&P 500) via Mirae Asset or Motilal Oswal funds for global exposure.' }
    ] : []),
    ...(dependents > 0 ? [
      { icon: '👨‍👩‍👧', head: 'Family Floater Plan', text: 'Get a family floater health insurance of ₹10–20L. Much cheaper than individual policies.' }
    ] : []),
    { icon: '🚫', head: 'Avoid Lifestyle Inflation', text: `You earned a raise? Don't inflate spending. Route 50% of every raise into investments.` },
    { icon: '📅', head: 'Review Quarterly', text: 'Re-balance your portfolio every 6 months. As life changes, your allocation should too.' }
  ];
  return tips.slice(0, 6);
}

function toggleExpenseForm() {
  const form = document.getElementById('expenseForm');
  form.classList.toggle('open');
}

function setExpCat(btn, icon) {
  expCatIcon = icon;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function addExpense() {
  const name = document.getElementById('expName').value.trim();
  const amt = parseFloat(document.getElementById('expAmt').value);
  if (!name || !amt || amt <= 0) { alert('Please enter a valid name and amount'); return; }

  const totalSpent = expenses.reduce((s,e) => s + e.amt, 0);
  if (totalSpent + amt > discretionaryBudget) {
    if (!confirm(`This exceeds your discretionary budget! Remaining: ${fmt(discretionaryBudget - totalSpent)}. Add anyway?`)) return;
  }

  expenses.push({ id: Date.now(), name, amt, icon: expCatIcon });
  document.getElementById('expName').value = '';
  document.getElementById('expAmt').value = '';
  renderExpenses();
  document.getElementById('expenseForm').classList.remove('open');
}

function removeExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  renderExpenses();
}

function renderExpenses() {
  const list = document.getElementById('expenseList');
  if (expenses.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text3);font-size:0.9rem">No expenses tracked yet. Your budget is fully available! ✨</div>`;
  } else {
    list.innerHTML = expenses.map(e => `
      <div class="expense-item">
        <div class="expense-cat">${e.icon}</div>
        <div class="expense-name">${e.name}</div>
        <div class="expense-amount">- ${fmt(e.amt)}</div>
        <button class="expense-del" onclick="removeExpense(${e.id})">✕</button>
      </div>
    `).join('');
  }
  updateBudgetBar();
}

function updateBudgetBar() {
  const totalSpent = expenses.reduce((s,e) => s + e.amt, 0);
  const remaining = discretionaryBudget - totalSpent;
  const pct = Math.min(100, discretionaryBudget > 0 ? (totalSpent / discretionaryBudget * 100) : 0);

  document.getElementById('remainingBudget').textContent = fmt(Math.max(0, remaining));
  document.getElementById('spentTotal').textContent = fmt(totalSpent);

  const fill = document.getElementById('budgetFill');
  fill.style.width = pct + '%';
  fill.style.background = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--gold)' : 'var(--accent)';

  document.getElementById('remainingBudget').style.color = remaining < 0 ? 'var(--red)' : remaining < discretionaryBudget * 0.1 ? 'var(--gold)' : 'var(--accent)';
}

function resetAll() {
  if (!confirm('Start over and reset your savings plan?')) return;
  currentStep = 1;
  riskApetite = null;
  expenses = [];
  discretionaryBudget = 0;
  userData = {};

  // Reset form
  ['age','salary','rent','groceries','transport','other'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('dependents').selectedIndex = 0;
  document.getElementById('saveRate').value = 20;
  document.querySelectorAll('.risk-card').forEach(c => c.classList.remove('selected'));

  // Show steps
  document.querySelectorAll('.step').forEach((s,i) => {
    s.classList.toggle('active', i === 0);
  });
  document.getElementById('stepsContainer').style.display = 'block';
  document.getElementById('stepIndicator').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  initIndicators();
  window.scrollTo({top:0});
}

// Init expense list render
renderExpenses();
