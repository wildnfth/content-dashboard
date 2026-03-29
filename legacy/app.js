// ══════════ DEBUG SYSTEM ══════════
const DBG = [];
function dbg(msg, data) {
  const ts = new Date().toLocaleTimeString('id-ID', {hour12:false});
  const line = `[${ts}] ${msg}` + (data !== undefined ? ': ' + JSON.stringify(data) : '');
  DBG.push(line);
  const el = document.getElementById('dbg');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = DBG.map(l => `<div>${l}</div>`).join('');
    el.scrollTop = el.scrollHeight;
  }
}
window.onerror = (msg, src, line, col, err) => {
  dbg('❌ JS ERROR', {msg, src: src?.split('/').pop(), line, col});
};
window.onunhandledrejection = (e) => {
  dbg('❌ PROMISE REJECT', String(e.reason));
};
dbg('✅ Script mulai');
// ══════════════════════════════════

const SUPABASE_URL='https://bvkrqzmcdpkkrldakdcf.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_LSYHeAlqbAHt-uqJ65_sMg_0x3yV3zw';
const {createClient}=supabase;
const sb=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
dbg('✅ Supabase client dibuat', {url: SUPABASE_URL.slice(0,30)+'...'});

// UTILS
const p2=n=>String(n).padStart(2,'0');
const nowTime=()=>{const d=new Date();return`${p2(d.getHours())}:${p2(d.getMinutes())}`;};
const todayStr=()=>{const d=new Date();return`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;};
function fmtV(n){if(n==null||n===''||isNaN(n))return'—';n=parseInt(n);if(n>=1000000)return(n/1e6).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return n.toLocaleString('id-ID');}
function fmtD(d){if(!d)return'—';return new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});}
function ensureUrl(v){
  if(!v) return null;
  if(/^https?:\/\//i.test(v)) return v;
  return 'https://'+v;
}
function showToast(msg,type='ok'){const el=document.getElementById('toast');el.innerHTML=`<span>${type==='ok'?'✅':'❌'}</span><span>${msg}</span>`;el.className=`toast show ${type}`;setTimeout(()=>el.className='toast',3000);}

// AUTH HELPERS
function togglePw(id,btn){const i=document.getElementById(id);if(i.type==='password'){i.type='text';btn.textContent='🙈';}else{i.type='password';btn.textContent='👁️';}}
function showErr(msg){const e=document.getElementById('auth-err');e.textContent=msg;e.style.display='block';document.getElementById('auth-ok').style.display='none';}
function showOk(msg){const e=document.getElementById('auth-ok');e.textContent=msg;e.style.display='block';document.getElementById('auth-err').style.display='none';}
const uToEmail=u=>`${u.toLowerCase().replace(/[^a-z0-9]/g,'_')}@proton.me`;

// LOGIN
dbg('✅ Event listener login terpasang');
document.getElementById('btn-login').addEventListener('click',async()=>{
  dbg('🔵 Tombol login diklik');
  const u=document.getElementById('l-user').value.trim();
  const p=document.getElementById('l-pw').value;
  dbg('🔵 Input', {username: u, passwordLen: p.length});
  document.getElementById('auth-err').style.display='none';
  if(!u||!p){showErr('Username dan password wajib diisi.');dbg('⚠️ Input kosong');return;}
  const btn=document.getElementById('btn-login');
  btn.disabled=true;btn.textContent='Memuat...';
  const email=uToEmail(u);
  dbg('🔵 Email digenerate', email);
  dbg('🔵 Mengirim request ke Supabase...');
  let data, error;
  try {
    const res = await sb.auth.signInWithPassword({email, password: p});
    data = res.data;
    error = res.error;
    dbg('🔵 Response diterima', {user: data?.user?.email||null, errorMsg: error?.message||null, status: error?.status||null});
  } catch(e) {
    dbg('❌ Exception saat request', String(e));
    error = {message: String(e), status: 0};
  }
  btn.disabled=false;btn.textContent='Masuk →';
  if(error){
    const msg = `❌ ${error.message}\n\n📧 Email: ${email}\nStatus: ${error.status||'-'}`;
    showErr(msg);
    dbg('❌ Login gagal', {msg: error.message, status: error.status});
  } else {
    dbg('✅ Login berhasil!');
  }
});
document.getElementById('l-pw').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-login').click();});

// REGISTER

// LOGOUT
document.getElementById('btn-out').addEventListener('click',()=>sb.auth.signOut());

// AUTH STATE
sb.auth.onAuthStateChange((ev,session)=>{
  if(session){
    document.getElementById('auth-screen').style.display='none';
    document.getElementById('dashboard').style.display='block';
    const meta=session.user.user_metadata;
    const uname=meta?.username||session.user.email.split('@')[0];
    document.getElementById('u-lbl').textContent=uname;
    document.getElementById('u-av').textContent=uname[0].toUpperCase();
    loadAll();
  }else{
    document.getElementById('auth-screen').style.display='flex';
    document.getElementById('dashboard').style.display='none';
  }
});

// DATA
let allPosts=[];
let currentPeriod='month';
let activePrefix='all'; // prefix filter for table only (not charts/stats)

// TABLE-SPECIFIC FILTER + PAGINATION
let tblFilter='all';       // 'today' | 'all' | 'range'
let tblFrom=null;          // string YYYY-MM-DD, for range mode
let tblTo=null;
let tblPage=0;             // current page index (0-based)
const TBL_PAGE_SIZE=15;    // posts per page

function getTblDateFiltered(basePosts){
  const today=todayStr();
  let filtered;
  if(tblFilter==='today') filtered=basePosts.filter(p=>p.tanggal===today);
  else if(tblFilter==='range'&&tblFrom&&tblTo) filtered=basePosts.filter(p=>p.tanggal>=tblFrom&&p.tanggal<=tblTo);
  else filtered=[...basePosts];
  // Sort descending dulu — page 1 = post terbaru
  return filtered.sort((a,b)=>{
    if(b.tanggal>a.tanggal) return 1;
    if(b.tanggal<a.tanggal) return -1;
    return (b.nomor||0)-(a.nomor||0);
  });
}

function getTblFilteredPosts(basePosts){
  const dateFiltered=getTblDateFiltered(basePosts);
  const start=tblPage*TBL_PAGE_SIZE;
  return dateFiltered.slice(start, start+TBL_PAGE_SIZE);
}

function getTblTotalPages(basePosts){
  const dateFiltered=getTblDateFiltered(basePosts);
  return Math.max(1,Math.ceil(dateFiltered.length/TBL_PAGE_SIZE));
}

function extractPrefix(kode){
  // Extract leading letters from kode, e.g. 'SPL1' → 'SPL', 'TESTI3' → 'TESTI'
  if(!kode) return null;
  const m=kode.match(/^([A-Z]+)/);
  return m ? m[1] : null;
}

function renderPrefixFilter(posts){
  // Collect unique prefixes from ALL posts (not filtered by period)
  const prefixes=[...new Set(allPosts.map(p=>extractPrefix(p.kode_video)).filter(Boolean))].sort();
  const bar=document.getElementById('prefix-bar');
  if(!prefixes.length){bar.classList.add('hidden');return;}
  bar.classList.remove('hidden');
  // Keep Semua pill + add one per prefix
  bar.innerHTML=`<span class="prefix-lbl">🏷️ Seri</span>
    <button class="pfp ${activePrefix==='all'?'active':''}" data-prefix="all">Semua</button>
    ${prefixes.map(p=>`<button class="pfp ${activePrefix===p?'active':''}" data-prefix="${p}">${p}</button>`).join('')}`;
  bar.querySelectorAll('.pfp').forEach(btn=>{
    btn.addEventListener('click',()=>{
      activePrefix=btn.dataset.prefix;
      applyDisplay();
    });
  });
}
let customFrom=null, customTo=null;

function getFilteredPosts(){
  const today=new Date();
  let from=null, to=new Date(today); to.setHours(23,59,59,999);
  if(currentPeriod==='month'){
    from=new Date(today.getFullYear(),today.getMonth(),1);
    to=new Date(today.getFullYear(),today.getMonth()+1,0,23,59,59,999);
  } else if(currentPeriod==='7d'){
    from=new Date(today); from.setDate(from.getDate()-6); from.setHours(0,0,0,0);
  } else if(currentPeriod==='30d'){
    from=new Date(today); from.setDate(from.getDate()-29); from.setHours(0,0,0,0);
  } else if(currentPeriod==='1y'){
    from=new Date(today); from.setFullYear(from.getFullYear()-1); from.setHours(0,0,0,0);
  } else if(currentPeriod==='custom'&&customFrom&&customTo){
    from=new Date(customFrom+'T00:00:00');
    to=new Date(customTo+'T23:59:59');
  }
  if(!from) return allPosts;
  return allPosts.filter(p=>{
    if(!p.tanggal) return false;
    const d=new Date(p.tanggal+'T00:00:00');
    return d>=from && d<=to;
  });
}

function applyDisplay(){
  const filtered=getFilteredPosts();
  renderStats(filtered);
  renderCharts(filtered);
  renderPrefixFilter(filtered);
  // Apply prefix filter then table date filter
  const prefixed = activePrefix==='all'
    ? filtered
    : filtered.filter(p=>extractPrefix(p.kode_video)===activePrefix);
  const tableData = getTblFilteredPosts(prefixed);
  renderTable(tableData, prefixed);
  // Update info label (stats area)
  const info=document.getElementById('filter-info');
  const monthNames=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now2=new Date();
  if(currentPeriod==='all') info.textContent=`${prefixed.length} post`;
  else if(currentPeriod==='month') info.textContent=`${monthNames[now2.getMonth()]} ${now2.getFullYear()} · ${prefixed.length} post`;
  else info.textContent=`${prefixed.length} dari ${allPosts.length} post`;
}
async function loadAll(){
  const{data,error}=await sb.from('posts').select('*').order('tanggal',{ascending:true}).order('nomor',{ascending:true});
  if(error){showToast('Gagal memuat data','err');return;}
  allPosts=data||[];
  applyDisplay();
}

async function getNextNomor(tanggal,excludeId=null){
  let q=sb.from('posts').select('nomor').eq('tanggal',tanggal).order('nomor',{ascending:false}).limit(1);
  if(excludeId) q=q.neq('id',excludeId);
  const{data}=await q;
  if(!data||!data.length)return 1;
  return(data[0].nomor||0)+1;
}

// STATS
function renderStats(data){
  document.getElementById('sv-tt').textContent=fmtV(data.reduce((s,r)=>s+(parseInt(r.views_tiktok)||0),0));
  document.getElementById('sv-ig').textContent=fmtV(data.reduce((s,r)=>s+(parseInt(r.views_instagram)||0),0));
  document.getElementById('sv-yt').textContent=fmtV(data.reduce((s,r)=>s+(parseInt(r.views_youtube)||0),0));
}

// CHARTS
const CI={};
function dc(id){
  if(CI[id]){
    CI[id].destroy();
    delete CI[id];
  }
  // Reset canvas so Chart.js re-measures from container on next draw
  const canvas=document.getElementById(id);
  if(canvas){canvas.width=0;canvas.height=0;canvas.style.width='';canvas.style.height='';}
}
const C={tt:'rgba(1,1,1,.85)',ttL:'rgba(1,1,1,.15)',ig:'rgba(225,48,108,.85)',igL:'rgba(225,48,108,.2)',yt:'rgba(255,0,0,.85)',ytL:'rgba(255,0,0,.2)'};

function renderCharts(data){
  // TREND
  dc('ch-trend');
  const bd={};
  data.forEach(r=>{const d=r.tanggal||'?';if(!bd[d])bd[d]={tt:0,ig:0,yt:0};bd[d].tt+=parseInt(r.views_tiktok)||0;bd[d].ig+=parseInt(r.views_instagram)||0;bd[d].yt+=parseInt(r.views_youtube)||0;});
  const dl=Object.keys(bd).sort();
  if(dl.length){
    CI['ch-trend']=new Chart(document.getElementById('ch-trend'),{type:'line',data:{labels:dl.map(d=>fmtD(d)),datasets:[{label:'TikTok',data:dl.map(d=>bd[d].tt),borderColor:C.tt,backgroundColor:C.ttL,tension:.4,fill:true,pointRadius:4,pointHoverRadius:7},{label:'Instagram',data:dl.map(d=>bd[d].ig),borderColor:C.ig,backgroundColor:C.igL,tension:.4,fill:true,pointRadius:4,pointHoverRadius:7},{label:'YouTube',data:dl.map(d=>bd[d].yt),borderColor:C.yt,backgroundColor:C.ytL,tension:.4,fill:true,pointRadius:4,pointHoverRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{family:'Quicksand',weight:'700'},boxRadius:6,padding:16}}},scales:{x:{grid:{color:'rgba(194,24,91,.06)'},ticks:{font:{family:'Quicksand',size:11}}},y:{grid:{color:'rgba(194,24,91,.06)'},ticks:{font:{family:'Quicksand',size:11},callback:v=>fmtV(v)}}}}});
  }

  // DONUT
  dc('ch-donut');
  const ttt=data.reduce((s,r)=>s+(parseInt(r.views_tiktok)||0),0);
  const tig=data.reduce((s,r)=>s+(parseInt(r.views_instagram)||0),0);
  const tyt=data.reduce((s,r)=>s+(parseInt(r.views_youtube)||0),0);
  CI['ch-donut']=new Chart(document.getElementById('ch-donut'),{type:'doughnut',data:{labels:['TikTok','Instagram','YouTube'],datasets:[{data:[ttt,tig,tyt],backgroundColor:[C.tt,C.ig,C.yt],borderWidth:0,hoverOffset:8}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{family:'Quicksand',weight:'700'},boxRadius:6,padding:16}},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fmtV(ctx.parsed)}`}}}}});

  // TOP 5
  dc('ch-top');
  const scored=data.map(r=>({kode:r.kode_video||'?',total:(parseInt(r.views_tiktok)||0)+(parseInt(r.views_instagram)||0)+(parseInt(r.views_youtube)||0)})).sort((a,b)=>b.total-a.total).slice(0,5);
  if(scored.length){
    CI['ch-top']=new Chart(document.getElementById('ch-top'),{type:'bar',data:{labels:scored.map(r=>r.kode),datasets:[{label:'Total Views',data:scored.map(r=>r.total),backgroundColor:['rgba(194,24,91,.85)','rgba(156,39,176,.85)','rgba(224,64,251,.85)','rgba(255,45,85,.75)','rgba(230,74,150,.75)'],borderRadius:10,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${fmtV(ctx.parsed.x)} views`}}},scales:{x:{grid:{color:'rgba(194,24,91,.06)'},ticks:{font:{family:'Quicksand',size:11},callback:v=>fmtV(v)}},y:{grid:{display:false},ticks:{font:{family:'Quicksand',size:11,weight:'700'}}}}}});
  }

  // BREAKDOWN
  dc('ch-bar');
  const recent=data.slice(-10);
  if(recent.length){
    CI['ch-bar']=new Chart(document.getElementById('ch-bar'),{type:'bar',data:{labels:recent.map(r=>r.kode_video||'?'),datasets:[{label:'TikTok',data:recent.map(r=>parseInt(r.views_tiktok)||0),backgroundColor:C.tt,borderRadius:6,borderSkipped:false},{label:'Instagram',data:recent.map(r=>parseInt(r.views_instagram)||0),backgroundColor:C.ig,borderRadius:6,borderSkipped:false},{label:'YouTube',data:recent.map(r=>parseInt(r.views_youtube)||0),backgroundColor:C.yt,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{family:'Quicksand',weight:'700'},boxRadius:6,padding:16}}},scales:{x:{grid:{display:false},ticks:{font:{family:'Quicksand',size:11}}},y:{grid:{color:'rgba(194,24,91,.06)'},ticks:{font:{family:'Quicksand',size:11},callback:v=>fmtV(v)}}}}});
  }
}

// TABLE + MOBILE CARDS
function isIncomplete(r){
  // Cek apakah ada field penting yang belum diisi
  const missingLink = !r.link_tiktok || !r.link_instagram || !r.link_youtube;
  const missingViews = !(parseInt(r.views_tiktok)>0) || !(parseInt(r.views_instagram)>0) || !(parseInt(r.views_youtube)>0);
  return missingLink || missingViews;
}

function incompleteHints(r){
  const hints=[];
  if(!r.link_tiktok) hints.push('Link TT');
  if(!r.link_instagram) hints.push('Link IG');
  if(!r.link_youtube) hints.push('Link YT');
  if(!(parseInt(r.views_tiktok)>0)) hints.push('Views TT');
  if(!(parseInt(r.views_instagram)>0)) hints.push('Views IG');
  if(!(parseInt(r.views_youtube)>0)) hints.push('Views YT');
  return hints.join(', ');
}

function renderPagination(basePosts){
  const pg=document.getElementById('tbl-pagination');
  if(!pg) return;
  const total=getTblTotalPages(basePosts);
  if(total<=1){pg.innerHTML='';return;}
  // Show max 7 page buttons around current page
  const range=3;
  let html=`<div class="pg-wrap">`;
  html+=`<button class="pg-btn" onclick="tblPageGo(${tblPage-1})" ${tblPage===0?'disabled':''}>‹</button>`;
  for(let i=0;i<total;i++){
    if(i===0||i===total-1||Math.abs(i-tblPage)<=range){
      if(i>0&&i<tblPage-range) {html+=`<span class="pg-ellipsis">…</span>`;i=tblPage-range-1;continue;}
      if(i<total-1&&i>tblPage+range) {html+=`<span class="pg-ellipsis">…</span>`;break;}
      html+=`<button class="pg-btn ${i===tblPage?'pg-active':''}" onclick="tblPageGo(${i})">${i+1}</button>`;
    }
  }
  html+=`<button class="pg-btn" onclick="tblPageGo(${tblPage+1})" ${tblPage>=total-1?'disabled':''}>›</button>`;
  html+=`</div>`;
  pg.innerHTML=html;
}

function tblPageGo(page){
  const prefixed=activePrefix==='all'?getFilteredPosts():getFilteredPosts().filter(p=>extractPrefix(p.kode_video)===activePrefix);
  const total=getTblTotalPages(prefixed);
  if(page<0||page>=total) return;
  tblPage=page;
  applyDisplay();
  document.getElementById('tbody').closest('.tbl-card')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function renderTable(data, basePosts=[]){
  const tb=document.getElementById('tbody');
  const cards=document.getElementById('post-cards');
  // Terbaru di atas: sort tanggal descending, lalu nomor descending
  const sorted=[...data].sort((a,b)=>{if(b.tanggal>a.tanggal)return 1;if(b.tanggal<a.tanggal)return-1;return(b.nomor||0)-(a.nomor||0);});

  if(!sorted.length){
    tb.innerHTML=`<tr><td colspan="6"><div class="empty-st"><div class="empty-ic">🌸</div><div class="empty-tx">Belum ada data. Yuk tambah post pertama!</div></div></td></tr>`;
    cards.innerHTML=`<div class="empty-st"><div class="empty-ic">🌸</div><div class="empty-tx">Belum ada data. Yuk tambah post pertama!</div></div>`;
    return;
  }

  // Desktop table rows
  tb.innerHTML=sorted.map(r=>{
    const inc=isIncomplete(r);
    const hints=inc?incompleteHints(r):'';
    return `<tr class="${inc?'row-incomplete':''}">
    <td><span class="badge-no">${r.nomor||'?'}</span></td>
    <td><span class="chip-date">${fmtD(r.tanggal)}</span></td>
    <td><span class="chip-time">${r.jam_upload||'—'}</span></td>
    <td>
      <button class="code-btn" onclick='openLinks(${JSON.stringify(r).replace(/'/g,"&#39;")})'>${r.kode_video||'—'}</button>
      ${inc?`<span class="badge-incomplete" title="Belum lengkap: ${hints}">⚠️ Belum lengkap</span>`:''}
    </td>
    <td><div class="v-cell">
      <div class="v-row ${!(parseInt(r.views_tiktok)>0)?'v-empty':''}"><span class="v-dot tt"></span>${fmtV(r.views_tiktok)}</div>
      <div class="v-row ${!(parseInt(r.views_instagram)>0)?'v-empty':''}"><span class="v-dot ig"></span>${fmtV(r.views_instagram)}</div>
      <div class="v-row ${!(parseInt(r.views_youtube)>0)?'v-empty':''}"><span class="v-dot yt"></span>${fmtV(r.views_youtube)}</div>
    </div></td>
    <td><div class="act-cell"><button class="btn-edit" onclick='openEdit(${JSON.stringify(r).replace(/'/g,"&#39;")})'>✏️ Edit</button><button class="btn-del" onclick="delPost('${r.id}')">🗑️ Hapus</button></div></td>
  </tr>`;
  }).join('');

  // Mobile cards
  cards.innerHTML=sorted.map(r=>{
    const inc=isIncomplete(r);
    const hints=inc?incompleteHints(r):'';
    return `
    <div class="post-card ${inc?'card-incomplete':''}">
      <div class="pc-top">
        <div class="pc-meta">
          <span class="badge-no">${r.nomor||'?'}</span>
          <span class="chip-date">${fmtD(r.tanggal)}</span>
          <span class="chip-time">${r.jam_upload||'—'}</span>
        </div>
        <button class="code-btn" onclick='openLinks(${JSON.stringify(r).replace(/'/g,"&#39;")})'>${r.kode_video||'—'}</button>
      </div>
      ${inc?`<div class="card-incomplete-hint">⚠️ Belum lengkap: ${hints}</div>`:''}
      <div class="pc-views">
        <div class="pc-view-item ${!(parseInt(r.views_tiktok)>0)?'v-empty':''}"><span class="v-dot tt"></span><span style="color:var(--tiktok)">TT</span> ${fmtV(r.views_tiktok)}</div>
        <div class="pc-view-item ${!(parseInt(r.views_instagram)>0)?'v-empty':''}"><span class="v-dot ig"></span><span style="color:var(--ig)">IG</span> ${fmtV(r.views_instagram)}</div>
        <div class="pc-view-item ${!(parseInt(r.views_youtube)>0)?'v-empty':''}"><span class="v-dot yt"></span><span style="color:var(--yt)">YT</span> ${fmtV(r.views_youtube)}</div>
      </div>
      <div class="pc-actions">
        <button class="btn-edit" style="flex:1" onclick='openEdit(${JSON.stringify(r).replace(/'/g,"&#39;")})'>✏️ Edit</button>
        <button class="btn-del" style="flex:1" onclick="delPost('${r.id}')">🗑️ Hapus</button>
      </div>
    </div>
  `;}).join('');

  renderPagination(basePosts);
}

// LINKS POPUP
function openLinks(r){
  document.getElementById('lnk-code').textContent=r.kode_video||'—';
  function setL(aid,uid,url){const a=document.getElementById(aid);const u=document.getElementById(uid);if(url){a.href=url;u.textContent=url.replace('https://','').substring(0,38)+(url.length>41?'…':'');a.classList.remove('dis');}else{a.href='#';u.textContent='Tidak ada link';a.classList.add('dis');}}
  setL('lnk-tt','lnk-tt-url',r.link_tiktok);setL('lnk-ig','lnk-ig-url',r.link_instagram);setL('lnk-yt','lnk-yt-url',r.link_youtube);
  document.getElementById('ov-links').classList.add('open');
}
document.getElementById('lnk-close').addEventListener('click',()=>document.getElementById('ov-links').classList.remove('open'));
document.getElementById('ov-links').addEventListener('click',e=>{if(e.target===document.getElementById('ov-links'))document.getElementById('ov-links').classList.remove('open');});

// TIME PICKER
let tH=0,tM=0;
function updTP(){document.getElementById('h-val').textContent=p2(tH);document.getElementById('m-val').textContent=p2(tM);document.getElementById('tp-disp').textContent=`${p2(tH)}:${p2(tM)}`;}
document.getElementById('h-up').addEventListener('click',()=>{tH=(tH+1)%24;updTP();});
document.getElementById('h-dn').addEventListener('click',()=>{tH=(tH-1+24)%24;updTP();});
document.getElementById('m-up').addEventListener('click',()=>{tM=(tM+1)%60;updTP();});
document.getElementById('m-dn').addEventListener('click',()=>{tM=(tM-1+60)%60;updTP();});
document.getElementById('f-jam').addEventListener('click',()=>{
  const cur=document.getElementById('f-jam').value;
  if(cur){const[h,m]=cur.split(':');tH=parseInt(h);tM=parseInt(m);}
  else{const n=nowTime().split(':');tH=parseInt(n[0]);tM=parseInt(n[1]);}
  updTP();document.getElementById('ov-time').classList.add('open');
});
document.getElementById('tp-ok').addEventListener('click',()=>{document.getElementById('f-jam').value=`${p2(tH)}:${p2(tM)}`;document.getElementById('ov-time').classList.remove('open');});
document.getElementById('tp-cancel').addEventListener('click',()=>document.getElementById('ov-time').classList.remove('open'));

// POST MODAL
let editId=null;
function clearForm(){['f-tgl','f-jam','f-kode','f-tt','f-ig','f-yt','f-vtt','f-vig','f-vyt'].forEach(id=>document.getElementById(id).value='');}

document.getElementById('btn-add').addEventListener('click',()=>{
  editId=null;clearForm();
  document.getElementById('f-tgl').value=todayStr();
  document.getElementById('f-jam').value=nowTime();
  document.getElementById('m-ttl').textContent='Tambah Post';
  document.getElementById('ov-post').classList.add('open');
});

function openEdit(r){
  editId=r.id;
  document.getElementById('m-ttl').textContent='Edit Post';
  document.getElementById('f-tgl').value=r.tanggal||'';
  document.getElementById('f-jam').value=r.jam_upload||'';
  document.getElementById('f-kode').value=(r.kode_video||'').toUpperCase();
  document.getElementById('f-tt').value=r.link_tiktok||'';
  document.getElementById('f-ig').value=r.link_instagram||'';
  document.getElementById('f-yt').value=r.link_youtube||'';
  document.getElementById('f-vtt').value=r.views_tiktok??'';
  document.getElementById('f-vig').value=r.views_instagram??'';
  document.getElementById('f-vyt').value=r.views_youtube??'';
  document.getElementById('ov-post').classList.add('open');
}

function closePost(){document.getElementById('ov-post').classList.remove('open');editId=null;}
document.getElementById('m-x').addEventListener('click',closePost);
document.getElementById('m-cancel').addEventListener('click',closePost);
document.getElementById('ov-post').addEventListener('click',e=>{if(e.target===document.getElementById('ov-post'))closePost();});

document.getElementById('m-save').addEventListener('click',async()=>{
  const tanggal=document.getElementById('f-tgl').value;
  const kode=document.getElementById('f-kode').value.trim().toUpperCase();
  if(!tanggal){showToast('Tanggal wajib diisi','err');return;}
  if(!kode){showToast('Kode video wajib diisi','err');return;}

  // CEK DUPLIKAT KODE VIDEO
  const dup=allPosts.find(p=>p.kode_video===kode&&p.id!==editId);
  if(dup){showToast(`Kode "${kode}" sudah dipakai! Gunakan kode lain.`,'err');return;}

  const btn=document.getElementById('m-save');
  btn.disabled=true;btn.textContent='Menyimpan...';

  // AUTO NOMOR
  let nomor;
  if(editId){
    const cur=allPosts.find(p=>p.id===editId);
    if(cur?.tanggal===tanggal){nomor=cur.nomor;}
    else{nomor=await getNextNomor(tanggal,editId);}
  }else{
    nomor=await getNextNomor(tanggal);
  }

  const payload={
    tanggal,nomor,
    jam_upload:document.getElementById('f-jam').value||null,
    kode_video:kode,
    link_tiktok:ensureUrl(document.getElementById('f-tt').value.trim()),
    link_instagram:ensureUrl(document.getElementById('f-ig').value.trim()),
    link_youtube:ensureUrl(document.getElementById('f-yt').value.trim()),
    views_tiktok:parseInt(document.getElementById('f-vtt').value)||0,
    views_instagram:parseInt(document.getElementById('f-vig').value)||0,
    views_youtube:parseInt(document.getElementById('f-vyt').value)||0,
  };

  let error;
  if(editId)({error}=await sb.from('posts').update(payload).eq('id',editId));
  else({error}=await sb.from('posts').insert(payload));

  btn.disabled=false;btn.textContent='Simpan ✨';
  if(error){showToast('Gagal menyimpan: '+error.message,'err');return;}
  showToast(editId?'Post berhasil diperbarui! ✨':'Post berhasil ditambahkan! 🎉');
  closePost();
  await loadAll();
  // Scroll ke tabel agar post terbaru langsung terlihat
  document.getElementById('tbody').closest('.tbl-card')?.scrollIntoView({behavior:'smooth',block:'start'});
});


// TABLE FILTER PILLS
document.querySelectorAll('.tfp').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tfp').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    tblFilter=btn.dataset.tfilter;
    tblPage=0;
    const rangeRow=document.getElementById('tbl-range-row');
    if(tblFilter==='range'){
      rangeRow.classList.add('show');
      if(!tblFrom){
        document.getElementById('tbl-dari').value=todayStr();
        document.getElementById('tbl-sampai').value=todayStr();
        tblFrom=todayStr(); tblTo=todayStr();
      }
    } else {
      rangeRow.classList.remove('show');
      applyDisplay();
    }
  });
});

document.getElementById('tbl-apply').addEventListener('click',()=>{
  const dari=document.getElementById('tbl-dari').value;
  const sampai=document.getElementById('tbl-sampai').value;
  if(!dari||!sampai){showToast('Isi rentang tanggal dulu ya!','err');return;}
  if(dari>sampai){showToast('Tanggal awal harus sebelum tanggal akhir','err');return;}
  tblFrom=dari; tblTo=sampai; tblPage=0;
  applyDisplay();
});

// FILTER PILLS
document.querySelectorAll('.fp').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.fp').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentPeriod=btn.dataset.period;
    const customEl=document.getElementById('filter-custom');
    if(currentPeriod==='custom'){
      customEl.classList.add('show');
      // Set default: last 30 days
      if(!customFrom){
        const d=new Date(); d.setDate(d.getDate()-29);
        document.getElementById('f-dari').value=`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
        document.getElementById('f-sampai').value=todayStr();
        customFrom=document.getElementById('f-dari').value;
        customTo=document.getElementById('f-sampai').value;
      }
    } else {
      customEl.classList.remove('show');
      applyDisplay();
    }
  });
});

document.getElementById('btn-apply').addEventListener('click',()=>{
  const dari=document.getElementById('f-dari').value;
  const sampai=document.getElementById('f-sampai').value;
  if(!dari||!sampai){showToast('Isi rentang tanggal dulu ya!','err');return;}
  if(dari>sampai){showToast('Tanggal awal harus sebelum tanggal akhir','err');return;}
  customFrom=dari; customTo=sampai;
  applyDisplay();
});

// Fix chart resize on orientation change
// Portrait needs longer delay — browser hasn't finished reflowing when resize fires
// Only redraw charts when WIDTH changes (not height).
// On mobile, scroll causes address bar to hide/show → height changes → resize fires.
// We must ignore those height-only changes to prevent chart flickering on scroll.
let resizeTimer, lastWidth=window.innerWidth;
window.addEventListener("resize",()=>{
  const newWidth=window.innerWidth;
  if(newWidth===lastWidth) return; // height-only change (mobile scroll) — skip
  lastWidth=newWidth;
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    if(allPosts.length) renderCharts(getFilteredPosts());
  },300);
});

// DELETE
async function delPost(id){
  if(!confirm('Yakin hapus post ini? Tidak bisa dibatalkan ya! 🥺'))return;
  const{error}=await sb.from('posts').delete().eq('id',id);
  if(error){showToast('Gagal menghapus','err');return;}
  showToast('Post dihapus 🗑️');loadAll();
}
