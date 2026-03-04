// ════════════════════════════════════════
// MODAL SYSTEM (no confirm/alert — works in sandboxed iframes)
// ════════════════════════════════════════
function showModal(ico, ttl, msg, btns) {
  document.getElementById('mIco').textContent = ico;
  document.getElementById('mTtl').textContent = ttl;
  document.getElementById('mMsg').textContent = msg;
  var bc = document.getElementById('mBtns');
  bc.innerHTML = '';
  btns.forEach(function(b) {
    var el = document.createElement('button');
    el.className = 'mbtn ' + b.cls;
    el.textContent = b.label;
    el.onclick = function() { closeModal(); if (b.cb) b.cb(); };
    bc.appendChild(el);
  });
  document.getElementById('modalOv').classList.add('open');
}
function closeModal() { document.getElementById('modalOv').classList.remove('open'); }
document.getElementById('modalOv').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

function mAlert(ico, ttl, msg) {
  showModal(ico, ttl, msg, [{label:'OK', cls:'mbtn-ok', cb:null}]);
}
function mConfirm(ico, ttl, msg, confirmLbl, confirmCls, onYes) {
  showModal(ico, ttl, msg, [
    {label:'Cancel', cls:'mbtn-cancel', cb:null},
    {label:confirmLbl, cls:confirmCls, cb:onYes}
  ]);
}

// ════════════════════════════════════════
// STORAGE
// ════════════════════════════════════════
var LS_USERS = 'wp_users', LS_SESSION = 'wp_sess', LS_THEME = 'wp_theme';
function getUsers()  { try { return JSON.parse(localStorage.getItem(LS_USERS)||'{}'); } catch(e) { return {}; } }
function saveUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u)); }
function getCurUser(){ return localStorage.getItem(LS_SESSION)||null; }
function setSession(e){ localStorage.setItem(LS_SESSION, e); }
function clearSess() { localStorage.removeItem(LS_SESSION); }
function getUserData(email){ var u=getUsers(); return u[email]?u[email].data:null; }
function saveUserData(data){
  var email=getCurUser(); if(!email) return;
  var users=getUsers(); if(users[email]){ users[email].data=data; saveUsers(users); }
}

// ════════════════════════════════════════
// THEME
// ════════════════════════════════════════
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  localStorage.setItem(LS_THEME,t);
  var lbl=document.getElementById('themeLbl');
  if(lbl) lbl.textContent = t==='dark'?'Day':'Night';
}
function toggleTheme(){
  applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
}
applyTheme(localStorage.getItem(LS_THEME)||'light');

// ════════════════════════════════════════
// APP STATE
// ════════════════════════════════════════
var curStep=1, riskVal=null;
var expenses=[], expCat='🎬', boostAmt=0;
var efSaved=0, efTarget=0, efContrib=0, efDone=false;
var uData={}, insData={sh:null,fh:null,tl:null};
var discBudget=0, planReady=false;

function persist(){
  saveUserData({curStep:curStep,riskVal:riskVal,expenses:expenses,expCat:expCat,
    boostAmt:boostAmt,efSaved:efSaved,efTarget:efTarget,efContrib:efContrib,efDone:efDone,
    uData:uData,insData:insData,discBudget:discBudget,planReady:planReady});
}
function loadState(){
  var s=getUserData(getCurUser()); if(!s) return;
  curStep=s.curStep||1; riskVal=s.riskVal||null;
  expenses=s.expenses||[]; expCat=s.expCat||'🎬';
  boostAmt=s.boostAmt||0; efSaved=s.efSaved||0;
  efTarget=s.efTarget||0; efContrib=s.efContrib||0;
  efDone=s.efDone||false; uData=s.uData||{};
  insData=s.insData||{sh:null,fh:null,tl:null};
  discBudget=s.discBudget||0; planReady=s.planReady||false;
  if(planReady){ showDash(); } else { restoreForms(); }
}
function restoreForms(){
  var d=uData;
  if(d.age)      document.getElementById('age').value=d.age;
  if(d.salary)   document.getElementById('salary').value=d.salary;
  if(d.dep!==undefined) document.getElementById('dependents').value=d.dep;
  if(d.rent)     document.getElementById('rent').value=d.rent;
  if(d.groc)     document.getElementById('groceries').value=d.groc;
  if(d.trans)    document.getElementById('transport').value=d.trans;
  if(d.other)    document.getElementById('otherExp').value=d.other;
  if(d.cs)       document.getElementById('curSav').value=d.cs;
  if(d.sr)       { document.getElementById('saveRate').value=d.sr; calcSave(); }
  if(d.dep>0)    document.getElementById('famWrap').style.display='block';
  if(riskVal){
    var idx={conservative:0,moderate:1,aggressive:2}[riskVal];
    var cards=document.querySelectorAll('.risk-card');
    if(cards[idx]) cards[idx].classList.add('sel');
  }
  ['sh','fh','tl'].forEach(function(k){ if(insData[k]) restoreYN(k,insData[k]); });
  document.querySelectorAll('.step-w').forEach(function(s,i){ s.classList.toggle('active',i===curStep-1); });
  initDots();
}

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════
function switchTab(t){
  document.getElementById('tabLogin').classList.toggle('active',t==='login');
  document.getElementById('tabReg').classList.toggle('active',t==='register');
  document.getElementById('panLogin').classList.toggle('active',t==='login');
  document.getElementById('panReg').classList.toggle('active',t==='register');
  document.getElementById('panForgot').classList.remove('active');
  document.getElementById('liMsg').className='auth-msg';
  document.getElementById('rgMsg').className='auth-msg';
}
function showForgot(){
  document.getElementById('panLogin').classList.remove('active');
  document.getElementById('panReg').classList.remove('active');
  document.getElementById('panForgot').classList.add('active');
  document.getElementById('fpMsg').className='auth-msg';
  document.getElementById('fpEmail').value='';
  document.getElementById('fpPass').value='';
  document.getElementById('fpPassC').value='';
  // pre-fill email if already typed
  var liE=document.getElementById('liEmail');
  if(liE&&liE.value) document.getElementById('fpEmail').value=liE.value;
}
function showLogin(){
  document.getElementById('panForgot').classList.remove('active');
  document.getElementById('panLogin').classList.add('active');
  document.getElementById('tabLogin').classList.add('active');
  document.getElementById('tabReg').classList.remove('active');
}
function togglePw(inputId,btn){
  var inp=document.getElementById(inputId);
  var isText=inp.type==='text';
  inp.type=isText?'password':'text';
  // swap icon between eye and eye-off
  btn.querySelector('svg').innerHTML=isText
    ?'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    :'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  btn.title=isText?'Show password':'Hide password';
}
function doForgot(){
  var email=document.getElementById('fpEmail').value.trim().toLowerCase();
  var pass=document.getElementById('fpPass').value;
  var passC=document.getElementById('fpPassC').value;
  var msg=document.getElementById('fpMsg');
  if(!email||email.indexOf('@')<0){ setAuthMsg('fpMsg','error','Please enter a valid email address.'); return; }
  if(pass.length<6){ setAuthMsg('fpMsg','error','New password must be at least 6 characters.'); return; }
  if(pass!==passC){ setAuthMsg('fpMsg','error','Passwords do not match. Please try again.'); return; }
  var users=getUsers();
  if(!users[email]){ setAuthMsg('fpMsg','error','No account found with this email. Please register first.'); return; }
  users[email].ph=btoa(pass+email);
  saveUsers(users);
  setAuthMsg('fpMsg','success','Password reset successfully! Redirecting to sign in...');
  setTimeout(function(){ showLogin(); document.getElementById('liEmail').value=email; },1400);
}
function setAuthMsg(id,type,msg){
  var el=document.getElementById(id); el.className='auth-msg '+type; el.textContent=msg;
}
function doRegister(){
  var name=document.getElementById('rgName').value.trim();
  var email=document.getElementById('rgEmail').value.trim().toLowerCase();
  var pass=document.getElementById('rgPass').value;
  if(!name)               { setAuthMsg('rgMsg','error','Please enter your full name.'); return; }
  if(!email||email.indexOf('@')<0) { setAuthMsg('rgMsg','error','Please enter a valid email.'); return; }
  if(pass.length<6)       { setAuthMsg('rgMsg','error','Password must be at least 6 characters.'); return; }
  var users=getUsers();
  if(users[email])        { setAuthMsg('rgMsg','error','Account already exists. Please sign in.'); return; }
  users[email]={name:name,email:email,ph:btoa(pass+email),data:null};
  saveUsers(users); setSession(email);
  setAuthMsg('rgMsg','success','Account created! Loading your dashboard...');
  setTimeout(function(){ launchApp(name); },700);
}
function doLogin(){
  var email=document.getElementById('liEmail').value.trim().toLowerCase();
  var pass=document.getElementById('liPass').value;
  if(!email||!pass) { setAuthMsg('liMsg','error','Please enter your email and password.'); return; }
  var users=getUsers(), user=users[email];
  if(!user)              { setAuthMsg('liMsg','error','No account found. Please register first.'); return; }
  if(user.ph!==btoa(pass+email)) { setAuthMsg('liMsg','error','Incorrect password. Please try again.'); return; }
  setSession(email); launchApp(user.name);
}
function doSignOut(){
  mConfirm('👋','Sign out?','Your data is saved and will be here when you return.',
    'Sign out','mbtn-danger',function(){
      clearSess(); resetState();
      document.getElementById('appScreen').style.display='none';
      document.getElementById('dashboard').style.display='none';
      document.getElementById('stepsWrap').style.display='block';
      document.getElementById('authScreen').style.display='flex';
      ['liEmail','liPass','rgName','rgEmail','rgPass'].forEach(function(id){
        var el=document.getElementById(id); if(el) el.value='';
      });
      document.getElementById('liMsg').className='auth-msg';
      document.getElementById('rgMsg').className='auth-msg';
      switchTab('login');
    });
}
function launchApp(name){
  document.getElementById('authScreen').style.display='none';
  document.getElementById('appScreen').style.display='block';
  var ini=name.split(' ').map(function(p){return p[0]||'';}).join('').slice(0,2).toUpperCase();
  document.getElementById('uAv').textContent=ini;
  document.getElementById('uNm').textContent=name.split(' ')[0];
  initDots(); loadState();
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
var fmt=function(n){ return '₹'+Math.round(n).toLocaleString('en-IN'); };
function initDots(){
  var w=document.getElementById('stepDots'); if(!w) return;
  w.innerHTML='';
  if(planReady){ w.innerHTML='<span style="font-size:.74rem;color:rgba(255,255,255,.65);font-weight:600">Plan Active ✓</span>'; return; }
  for(var i=1;i<=5;i++){
    var d=document.createElement('div');
    d.className='hdot'+(i===curStep?' active':i<curStep?' done':'');
    w.appendChild(d);
  }
}
function updateFamilyQ(){
  var dep=parseInt(document.getElementById('dependents').value)||0;
  document.getElementById('famWrap').style.display=dep>0?'block':'none';
  if(dep===0) insData.fh='yes';
}
function restoreYN(key,val){
  insData[key]=val;
  var yEl=document.getElementById(key+'Y'), nEl=document.getElementById(key+'N');
  if(yEl) yEl.className='yn-card'+(val==='yes'?' sel-yes':'');
  if(nEl) nEl.className='yn-card'+(val==='no'?' sel-no':'');
}
function setYN(key,val){
  restoreYN(key,val); updateInsAlert(); persist();
}
function updateInsAlert(){
  var dep=parseInt(document.getElementById('dependents').value)||0;
  var msgs=[];
  if(insData.sh==='no') msgs.push('<strong>Your Health Insurance:</strong> Get a min ₹5–10L individual policy. ~₹800–₹1,500/month.');
  if(dep>0&&insData.fh==='no') msgs.push('<strong>Family Health Insurance:</strong> Family floater (₹10–20L) covers everyone. ~₹1,500–₹3,000/month.');
  if(insData.tl==='no') msgs.push('<strong>Term Life Insurance:</strong> Pure term plan = 10–15× annual income. ~₹1,000–₹2,500/month.');
  var allOk=insData.sh==='yes'&&insData.tl==='yes'&&(dep===0||insData.fh==='yes');
  var el=document.getElementById('insAlert'); if(!el) return;
  if(allOk&&(insData.sh||insData.tl)){
    el.innerHTML='<div class="alert alert-ok">✅ Core insurance protections confirmed. Building on solid ground.</div>';
  } else if(msgs.length){
    el.innerHTML='<div class="alert alert-warn">⚠️ '+msgs.join('<br><br>⚠️ ')+'</div>';
  } else { el.innerHTML=''; }
}
function selRisk(val,el){
  riskVal=val;
  document.querySelectorAll('.risk-card').forEach(function(c){c.classList.remove('sel');});
  el.classList.add('sel'); persist();
}
function getFixedExp(){
  return (parseFloat(document.getElementById('rent').value)||0)+
         (parseFloat(document.getElementById('groceries').value)||0)+
         (parseFloat(document.getElementById('transport').value)||0)+
         (parseFloat(document.getElementById('otherExp').value)||0);
}
function calcSave(){
  var sal=parseFloat(document.getElementById('salary').value)||0;
  var rate=parseInt(document.getElementById('saveRate').value)||20;
  document.getElementById('saveRateLbl').textContent=rate+'%';
  var amt=Math.round(sal*rate/100);
  document.getElementById('saveAmt').textContent=fmt(amt);
  var exp=getFixedExp(), left=sal-exp-amt;
  document.getElementById('saveNote').textContent=left>=0
    ?'Leaves '+fmt(left)+' for discretionary spending'
    :'⚠️ Exceeds available income by '+fmt(Math.abs(left));
  efTarget=(exp+sal*0.05)*6;
  var cs=parseFloat(document.getElementById('curSav').value)||0;
  var rem=Math.max(0,efTarget-cs);
  var mo=Math.ceil(rem/Math.max(1,Math.round(amt*0.5)));
  var box=document.getElementById('efBox'); if(!box) return;
  if(cs>=efTarget&&efTarget>0){
    box.className='alert alert-ok';
    box.innerHTML='✅ <strong>Emergency Fund already covered!</strong> Investments unlock from day one.';
  } else if(efTarget>0){
    box.className='alert alert-warn';
    box.innerHTML='🏦 <strong>EF Target: '+fmt(efTarget)+'</strong> — Have '+fmt(cs)+' · Need '+fmt(rem)+' more · ~'+mo+' months at 50% of savings';
  }
}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
function goNext(from){
  if(!validate(from)) return;
  document.getElementById('step-'+from).classList.remove('active');
  curStep=from+1;
  document.getElementById('step-'+curStep).classList.add('active');
  if(curStep===5) calcSave();
  if(from===4) checkExpAlert();
  initDots(); persist();
  window.scrollTo({top:0,behavior:'smooth'});
}
function goBack(from){
  document.getElementById('step-'+from).classList.remove('active');
  curStep=from-1;
  document.getElementById('step-'+curStep).classList.add('active');
  initDots(); persist();
}
function checkExpAlert(){
  var sal=parseFloat(document.getElementById('salary').value)||0;
  var exp=getFixedExp();
  var el=document.getElementById('expAlert');
  if(exp>sal*0.8&&sal>0){ el.style.display='block'; el.textContent='⚠️ Fixed expenses ('+fmt(exp)+') are '+Math.round(exp/sal*100)+'% of salary. Very little room to save.'; }
  else el.style.display='none';
}
function validate(step){
  if(step===1){
    var age=document.getElementById('age').value;
    var sal=document.getElementById('salary').value;
    if(!age||parseInt(age)<18){ mAlert('⚠️','Invalid Age','Please enter a valid age (18 or above).'); return false; }
    if(!sal||parseFloat(sal)<1000){ mAlert('⚠️','Invalid Salary','Please enter a valid monthly salary.'); return false; }
  }
  if(step===2){
    if(!insData.sh){ mAlert('⚠️','Missing Answer','Please answer the health insurance question for yourself.'); return false; }
    if(!insData.tl){ mAlert('⚠️','Missing Answer','Please answer the term life insurance question.'); return false; }
    var dep=parseInt(document.getElementById('dependents').value)||0;
    if(dep>0&&!insData.fh){ mAlert('⚠️','Missing Answer','Please answer the family health insurance question.'); return false; }
  }
  if(step===3&&!riskVal){ mAlert('⚠️','Risk Profile Needed','Please select your risk appetite to continue.'); return false; }
  return true;
}

// ════════════════════════════════════════
// GENERATE PLAN
// ════════════════════════════════════════
function genPlan(){
  var age=parseInt(document.getElementById('age').value);
  var sal=parseFloat(document.getElementById('salary').value);
  var dep=parseInt(document.getElementById('dependents').value)||0;
  var rent=parseFloat(document.getElementById('rent').value)||0;
  var groc=parseFloat(document.getElementById('groceries').value)||0;
  var trans=parseFloat(document.getElementById('transport').value)||0;
  var other=parseFloat(document.getElementById('otherExp').value)||0;
  var fixed=rent+groc+trans+other;
  var sr=parseInt(document.getElementById('saveRate').value)||20;
  var monthly=Math.round(sal*sr/100);
  var disc=Math.max(0,sal-fixed-monthly);
  var cs=parseFloat(document.getElementById('curSav').value)||0;
  efTarget=(fixed+sal*0.05)*6;
  efSaved=cs; efContrib=Math.round(monthly*0.5);
  efDone=cs>=efTarget; discBudget=disc; planReady=true;
  uData={age:age,salary:sal,dep:dep,fixed:fixed,rent:rent,groc:groc,trans:trans,other:other,
         monthly:monthly,disc:disc,sr:sr,cs:cs};
  persist(); showDash();
}
function showDash(){
  document.getElementById('stepsWrap').style.display='none';
  document.getElementById('dashboard').style.display='block';
  buildDash(); initDots();
}

// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════
function buildDash(){
  var d=uData, name=getUsers()[getCurUser()]?getUsers()[getCurUser()].name:'';
  document.getElementById('dashTtl').textContent=name.split(' ')[0]+"'s Financial Blueprint";
  document.getElementById('dashSub').textContent='₹'+d.salary.toLocaleString('en-IN')+'/mo · '+
    riskVal.charAt(0).toUpperCase()+riskVal.slice(1)+' risk · Age '+d.age;
  document.getElementById('dashChips').innerHTML=[
    '💰 Save '+d.sr+'% monthly',
    '🏦 EF: '+(efDone?'Complete ✓':Math.round(Math.min(100,efSaved/efTarget*100))+'% built'),
    (riskVal==='conservative'?'🛡️':riskVal==='moderate'?'⚖️':'🚀')+' '+riskVal.charAt(0).toUpperCase()+riskVal.slice(1)+' investor',
    '👨‍👩‍👧 '+d.dep+' dependent'+(d.dep!==1?'s':'')
  ].map(function(c){ return '<div class="chip">'+c+'</div>'; }).join('');

  var ban=document.getElementById('phaseBan');
  if(!efDone){
    ban.className='phase-ban emg';
    ban.innerHTML='<div class="phase-ico">🏦</div><div><div class="phase-ttl">Phase 1 — Build Emergency Fund First</div><div class="phase-dsc">50% of monthly savings go toward the emergency fund. Investments unlock once complete.</div></div>';
  } else {
    ban.className='phase-ban inv';
    ban.innerHTML='<div class="phase-ico">🚀</div><div><div class="phase-ttl">Phase 2 — Invest &amp; Grow</div><div class="phase-dsc">Emergency fund secured! 100% of savings deployed into your investment plan.</div></div>';
  }

  document.getElementById('sumGrid').innerHTML=
    '<div class="sum-card"><div class="sum-top"><div class="sum-ico" style="background:var(--cta-light)">💰</div><div class="sum-lbl">Monthly Savings</div></div><div class="sum-val" style="color:var(--cta)">'+fmt(d.monthly)+'</div><div class="sum-note">'+d.sr+'% of income</div></div>'+
    '<div class="sum-card"><div class="sum-top"><div class="sum-ico" style="background:var(--gold-bg)">🏦</div><div class="sum-lbl">Emergency Fund</div></div><div class="sum-val" style="color:var(--gold)">'+fmt(efTarget)+'</div><div class="sum-note" id="efSumNote">'+fmt(efSaved)+' saved · '+(efDone?'✅ Complete':fmt(Math.max(0,efTarget-efSaved))+' to go')+'</div></div>'+
    '<div class="sum-card"><div class="sum-top"><div class="sum-ico" style="background:var(--secondary-xl)">🎯</div><div class="sum-lbl">Discretionary</div></div><div class="sum-val" style="color:var(--secondary)">'+fmt(d.disc)+'</div><div class="sum-note">Free to spend / month</div></div>';

  buildInsRows(); buildPri(); buildEF(); buildInv(); buildTips();
  document.getElementById('budMax').textContent=fmt(discBudget)+' total';
  renderExp();
}
function buildInsRows(){
  var dep=uData.dep||0, sal=uData.salary||0;
  var items=[
    {ok:insData.sh==='yes',lbl:'Your Health Insurance',warn:'Get a ₹5–10L individual policy. ~₹800–₹1,500/month.',ok_msg:'Individual health cover confirmed.'},
    ...(dep>0?[{ok:insData.fh==='yes',lbl:'Family Health Insurance',warn:'Get a family floater (₹10–20L) for all dependents. ~₹1,500–₹3,000/month.',ok_msg:'All family members covered.'}]:[]),
    {ok:insData.tl==='yes',lbl:'Term Life Insurance',warn:'Pure term plan of '+fmt(sal*12*12)+' (12× annual). ~₹1,000–₹2,500/month.',ok_msg:'Term life protection active.'}
  ];
  document.getElementById('insRows').innerHTML=items.map(function(it){
    return '<div class="ins-row '+(it.ok?'ok':'warn')+'"><div class="ins-row-ico">'+(it.ok?'✅':'⚠️')+'</div><div class="ins-row-txt"><strong>'+it.lbl+':</strong> '+(it.ok?it.ok_msg:it.warn)+'</div></div>';
  }).join('');
}
function buildPri(){
  var ins=insData.sh==='yes'&&insData.tl==='yes'&&((uData.dep||0)===0||insData.fh==='yes');
  var items=[
    {ico:'🛡️',ttl:'Secure Insurance Coverage',done:ins,desc:'Health + term life before investing. Non-negotiable — protect your downside first.'},
    {ico:'🏦',ttl:'Build 6-Month Emergency Fund',done:efDone,desc:'Target '+fmt(efTarget)+' in a liquid fund. Do NOT invest in markets until complete.'},
    {ico:'📊',ttl:'Start SIP Investments',done:efDone,desc:'Deploy full '+fmt(uData.monthly)+'/mo into your '+riskVal+' allocation.'},
    {ico:'🧾',ttl:'Optimise Tax — Section 80C',done:false,desc:'₹1.5L/year in ELSS/PPF/NPS saves up to ₹46,800 in taxes annually.'},
    {ico:'⚡',ttl:'Step-Up SIP Every Year',done:false,desc:'Increase SIP by 10% annually. Even small increments 2–3× your final corpus.'}
  ];
  document.getElementById('priList').innerHTML=items.map(function(it,i){
    return '<div class="pri-item'+(it.done?' done':'')+'"><div class="pri-num">'+(it.done?'✓':i+1)+'</div><div><div class="pri-name">'+it.ico+' '+it.ttl+(it.done?' <span class="badge badge-green">Done</span>':'')+'</div><div class="pri-desc">'+it.desc+'</div></div></div>';
  }).join('');
}
function buildEF(){
  var pct=Math.min(100,efTarget>0?efSaved/efTarget*100:0);
  var pm=efTarget/6;
  var mDone=Math.min(6,efTarget>0?Math.floor(efSaved/pm):0);
  var rem=Math.max(0,efTarget-efSaved);
  var eta=efContrib>0?Math.ceil(rem/efContrib):0;
  document.getElementById('efBadge').textContent=Math.round(pct)+'% complete';
  document.getElementById('efBigNum').textContent=fmt(efSaved)+' / '+fmt(efTarget);
  document.getElementById('efFill').style.width=pct+'%';
  document.getElementById('efCur').textContent=fmt(efSaved)+' saved';
  document.getElementById('efGoal').textContent=fmt(efTarget)+' target';
  document.getElementById('efMoDone').textContent=mDone;
  document.getElementById('efMoLeft').textContent=Math.max(0,6-mDone);
  document.getElementById('efETA').textContent=efDone?'✅':eta>0?eta+' mo':'—';
  var g='';
  for(var i=1;i<=6;i++){
    var need=pm*i, done=efSaved>=need, part=!done&&efSaved>pm*(i-1);
    g+='<div class="ef-mo'+(done?' done':part?' part':'')+'"><div class="ef-mo-lbl">Month '+i+'</div><div class="ef-mo-amt">'+fmt(pm)+'</div><div class="ef-mo-chk">'+(done?'✅':part?'🔶':'⬜')+'</div></div>';
  }
  document.getElementById('efGrid').innerHTML=g;
  document.getElementById('efDone').style.display=efDone?'block':'none';
}
function addToEF(){
  var amt=parseFloat(document.getElementById('efAdd').value)||0;
  if(amt<=0){ mAlert('⚠️','Invalid Amount','Please enter a valid deposit amount.'); return; }
  efSaved=Math.min(efTarget*2,efSaved+amt);
  var was=efDone; efDone=efSaved>=efTarget;
  document.getElementById('efAdd').value='';
  buildEF();
  var n=document.getElementById('efSumNote');
  if(n) n.textContent=fmt(efSaved)+' saved · '+(efDone?'✅ Complete':fmt(Math.max(0,efTarget-efSaved))+' to go');
  if(!was&&efDone){
    buildInv(); buildPri();
    var ban=document.getElementById('phaseBan');
    ban.className='phase-ban inv';
    ban.innerHTML='<div class="phase-ico">🚀</div><div><div class="phase-ttl">Phase 2 — Invest &amp; Grow</div><div class="phase-dsc">Emergency fund secured! 100% of savings now deployed into your investment plan.</div></div>';
  }
  persist();
}
function buildInv(){
  var locked=!efDone;
  document.getElementById('invLock').style.display=locked?'block':'none';
  document.getElementById('invContent').style.opacity=locked?'0.35':'1';
  document.getElementById('invContent').style.pointerEvents=locked?'none':'auto';
  var total=(uData.monthly||0)+boostAmt;
  var alloc=getAlloc(riskVal,uData.age);
  var colors=['#2563EB','#16A34A','#0891B2','#DC2626','#7C3AED','#D97706'];
  document.getElementById('allocTotal').textContent='Total: '+fmt(total)+'/mo';
  var bar='',list='';
  alloc.forEach(function(a,i){
    var amt=Math.round(total*a.p/100);
    bar+='<div class="alloc-seg" style="width:'+a.p+'%;background:'+colors[i]+'"></div>';
    list+='<div class="alloc-item"><div class="alloc-dot" style="background:'+colors[i]+'"></div><div class="alloc-name">'+a.n+'</div><div class="alloc-pct">'+a.p+'%</div><div class="alloc-amt">'+fmt(amt)+'</div></div>';
  });
  document.getElementById('allocBar').innerHTML=bar;
  document.getElementById('allocList').innerHTML=list;
  updBoostProj();
}
function getAlloc(risk,age){
  if(risk==='conservative') return [{n:'Liquid Fund / Short-term FD',p:15},{n:'Debt Mutual Funds / FDs',p:35},{n:'Nifty 50 Index Fund',p:25},{n:'Gold ETF / Sovereign Gold Bonds',p:15},{n:'PPF / NPS (Tax-saving)',p:10}];
  if(risk==='moderate') return [{n:'Nifty 50 / Large Cap Index Fund',p:35},{n:'Debt Mutual Funds',p:20},{n:'Mid Cap Fund',p:20},{n:'Gold ETF / Sovereign Gold Bonds',p:10},{n:'NPS / PPF (Tax-saving)',p:10},{n:'International ETF',p:5}];
  return [{n:'Large Cap Nifty 50 Index Fund',p:25},{n:'Mid & Small Cap Funds',p:30},{n:'International ETFs (Nasdaq/S&P 500)',p:15},{n:'Sectoral / Thematic Funds',p:15},{n:'Debt / Liquid Buffer',p:10},{n:'Crypto / Alt Assets (≤5%)',p:5}];
}
function buildTips(){
  var age=uData.age||30, mo=uData.monthly||0, dep=uData.dep||0;
  var yrs=Math.max(5,60-age), r=0.12/12, n=yrs*12;
  var corpus=mo*((Math.pow(1+r,n)-1)/r)*(1+r);
  var tips=[
    {i:'📈',h:'Power of Compounding',t:fmt(mo)+'/mo at 12% CAGR over '+yrs+' years = '+fmt(corpus)+'. Start early, stay consistent.'},
    {i:'🧾',h:'Tax Saving — 80C',t:'Invest ₹1.5L/year in ELSS, PPF, or NPS to save up to ₹46,800 in taxes annually.'},
    {i:'🔄',h:'Automate on Salary Day',t:'Set SIPs on salary credit day. Pay yourself first — invest before you spend anything.'},
    {i:'⚡',h:'10% Step-Up SIP Yearly',t:'Raising SIP by 10% each year can 2–3× your final corpus over '+yrs+' years.'},
    ...(riskVal==='aggressive'?[{i:'🌍',h:'Global Diversification',t:'Add international ETFs (Mirae Nasdaq, Motilal S&P 500) for geographic diversification.'}]:[]),
    ...(dep>0?[{i:'👨‍👩‍👧',h:'Family Floater Tip',t:'A ₹20L family floater often costs less than two ₹10L individual policies. Compare both.'}]:[]),
    {i:'🚫',h:'Beat Lifestyle Inflation',t:'Every salary hike, route 50% of the increase directly into SIPs before it reaches your wallet.'},
    {i:'📅',h:'Review Every 6 Months',t:'Rebalance portfolio, reassess insurance needs, update nominees as your life changes.'}
  ];
  document.getElementById('tipsList').innerHTML=tips.slice(0,6).map(function(t){
    return '<div class="tip-card"><div class="tip-ico">'+t.i+'</div><div><div class="tip-hd">'+t.h+'</div><div class="tip-tx">'+t.t+'</div></div></div>';
  }).join('');
}

// ════════════════════════════════════════
// BOOST
// ════════════════════════════════════════
function selBoost(amt,el){ boostAmt=amt; document.querySelectorAll('.boost-card').forEach(function(c){c.classList.remove('sel');}); el.classList.add('sel'); buildInv(); persist(); }
function toggleCustBoost(){ document.getElementById('boostCust').classList.toggle('show'); }
function applyCustBoost(){ boostAmt=parseFloat(document.getElementById('custBoostAmt').value)||0; document.querySelectorAll('.boost-card').forEach(function(c){c.classList.remove('sel');}); buildInv(); persist(); }
function clearBoost(){ boostAmt=0; document.querySelectorAll('.boost-card').forEach(function(c){c.classList.remove('sel');}); document.getElementById('custBoostAmt').value=''; document.getElementById('boostCust').classList.remove('show'); buildInv(); persist(); }
function updBoostProj(){
  var box=document.getElementById('boostProj'); if(!box||boostAmt<=0){if(box)box.style.display='none';return;}
  var mo=uData.monthly||0, age=uData.age||30, yrs=Math.max(5,60-age), r=0.12/12, n=yrs*12;
  var calc=function(m){return m*((Math.pow(1+r,n)-1)/r)*(1+r);};
  var diff=calc(mo+boostAmt)-calc(mo);
  box.style.display='block';
  box.innerHTML='<div class="alert alert-ok">⚡ <strong>Boost impact:</strong> Adding '+fmt(boostAmt)+'/mo generates <strong>'+fmt(diff)+' more</strong> by age 60 — total corpus becomes <strong>'+fmt(calc(mo+boostAmt))+'</strong>.</div>';
}

// ════════════════════════════════════════
// TABS
// ════════════════════════════════════════
function showTab(id,btn){
  document.querySelectorAll('.tab-pan').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('tab-'+id).classList.add('active');
  if(btn) btn.classList.add('active');
}

// ════════════════════════════════════════
// EXPENSES
// ════════════════════════════════════════
function toggleExpForm(){ document.getElementById('expForm').classList.toggle('open'); }
function setExpCat(btn,icon){ expCat=icon; document.querySelectorAll('#expForm .tog-btn').forEach(function(b){b.classList.remove('active');}); btn.classList.add('active'); }
function addExpense(){
  var name=document.getElementById('expName').value.trim();
  var amt=parseFloat(document.getElementById('expAmt').value)||0;
  if(!name||amt<=0){ mAlert('⚠️','Missing Info','Please enter both a name and amount.'); return; }
  var spent=expenses.reduce(function(s,e){return s+e.amt;},0);
  if(spent+amt>discBudget){
    mConfirm('💸','Over Budget!',
      'This exceeds your discretionary budget. Remaining: '+fmt(discBudget-spent)+'. Add it anyway?',
      'Add Anyway','mbtn-danger',function(){
        pushExpense(name,amt);
      });
  } else { pushExpense(name,amt); }
}
function pushExpense(name,amt){
  expenses.push({id:Date.now(),name:name,amt:amt,ico:expCat});
  document.getElementById('expName').value='';
  document.getElementById('expAmt').value='';
  renderExp(); document.getElementById('expForm').classList.remove('open'); persist();
}
function delExpense(id){ expenses=expenses.filter(function(e){return e.id!==id;}); renderExp(); persist(); }
function renderExp(){
  document.getElementById('expList').innerHTML=expenses.length===0
    ?'<div style="text-align:center;padding:20px;color:var(--text3);font-size:.82rem">No expenses logged. Full budget available! ✨</div>'
    :expenses.map(function(e){ return '<div class="exp-item"><div class="exp-cat">'+e.ico+'</div><div class="exp-name">'+e.name+'</div><div class="exp-amt">− '+fmt(e.amt)+'</div><button class="exp-del" onclick="delExpense('+e.id+')">✕</button></div>'; }).join('');
  updBudBar();
}
function updBudBar(){
  var spent=expenses.reduce(function(s,e){return s+e.amt;},0);
  var rem=discBudget-spent;
  var pct=Math.min(100,discBudget>0?spent/discBudget*100:0);
  document.getElementById('budRem').textContent=fmt(Math.max(0,rem));
  document.getElementById('budSpent').textContent=fmt(spent);
  var fill=document.getElementById('budFill');
  fill.style.width=pct+'%';
  fill.style.background=pct>90?'var(--red)':pct>70?'var(--gold)':'var(--cta)';
  document.getElementById('budRem').style.color=rem<0?'var(--red)':rem<discBudget*0.1?'var(--gold)':'var(--cta)';
}

// ════════════════════════════════════════
// RESET
// ════════════════════════════════════════
function doReset(){
  mConfirm('🔄','Reset your plan?','This clears all plan data. Your account and login are kept.',
    'Reset Plan','mbtn-danger',function(){ execReset(); });
}
function resetState(){
  curStep=1; riskVal=null; expenses=[]; expCat='🎬';
  boostAmt=0; efSaved=0; efTarget=0; efContrib=0; efDone=false;
  discBudget=0; planReady=false;
  insData={sh:null,fh:null,tl:null}; uData={};
}
function execReset(){
  var email=getCurUser(), users=getUsers();
  if(users[email]){ users[email].data=null; saveUsers(users); }
  resetState();
  // clear form fields
  ['age','salary','rent','groceries','transport','otherExp','curSav'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('dependents').selectedIndex=0;
  document.getElementById('saveRate').value=20;
  document.getElementById('saveRateLbl').textContent='20%';
  document.getElementById('saveAmt').textContent='₹0';
  document.getElementById('saveNote').textContent='—';
  document.querySelectorAll('.risk-card').forEach(function(c){c.classList.remove('sel');});
  ['shY','shN','fhY','fhN','tlY','tlN'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.className='yn-card';
  });
  document.getElementById('famWrap').style.display='none';
  var ia=document.getElementById('insAlert'); if(ia) ia.innerHTML='';
  var eb=document.getElementById('efBox');
  if(eb){ eb.className='alert alert-info'; eb.innerHTML='🏦 Enter salary &amp; expenses to see your emergency fund target.'; }
  var ea=document.getElementById('expAlert'); if(ea) ea.style.display='none';
  document.getElementById('dashboard').style.display='none';
  document.getElementById('stepsWrap').style.display='block';
  document.querySelectorAll('.step-w').forEach(function(s,i){ s.classList.toggle('active',i===0); });
  initDots();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
(function(){
  var email=getCurUser();
  if(email){
    var users=getUsers();
    if(users[email]) launchApp(users[email].name);
    else clearSess();
  }
})();