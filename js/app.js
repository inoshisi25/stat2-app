'use strict';
// 統計検定2級 対策アプリ
// 問題: 付属データ(data/questions.js) + 自動生成(js/gen.js) + 利用者が取り込んだ問題(localStorage)
// 記録: localStorage(このブラウザ内のみ。「データ」タブからバックアップ可能)
const U='stat2_user',R='stat2_rec',FL='stat2_flags',SS='stat2_sess';
const SRC='予想問題(AI作成・過去問ではありません)';
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const BUILTIN=(window.STAT2_QUESTIONS||[]).map(q=>({source:SRC,...q}));
const GEN=window.STAT2_GEN,TB=window.STAT2_TABLES,FORM=window.STAT2_FORMULAS||[];
const FIELDS=['データの基礎','2変数・時系列','確率','確率変数と確率分布','正規分布と標本分布','統計的推定','仮説検定','回帰分析と分散分析'];
let user=ld(U,[]),rec=ld(R,{}),flags=ld(FL,{}),bank=[],S={tab:'quiz',sess:null,msg:'',cf:0,sheet:null,calc:''},T;
function rebuild(){const m=new Map(BUILTIN.map(q=>[q.id,q]));user.forEach(q=>m.set(q.id,q));bank=[...m.values()]}
rebuild();

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const NUM='①②③④⑤⑥⑦⑧⑨⑩';
const fields=()=>{const f=new Set(bank.map(q=>q.field));GEN.list.forEach(g=>f.add(g.field));return[...FIELDS.filter(x=>f.has(x)),...[...f].filter(x=>!FIELDS.includes(x))]};
const exams=()=>[...new Set(bank.filter(q=>q.exam).map(q=>q.exam))];
// 記録のキー: 付属・取り込み問題はid、自動生成は型(同じ型を数値を変えて復習する)
const key=q=>q.tpl||q.id;
const tpls=()=>GEN.list.map(g=>({key:'gen:'+g.id,field:g.field,title:g.title}));
const items=()=>[...bank.map(q=>({key:q.id,field:q.field})),...tpls()];
const last=k=>{const a=rec[k]?.a;return a?.length?a[a.length-1]:null};
const fmt=ms=>{ms=Math.max(0,ms/1000|0);return (ms/60|0)+':'+String(ms%60).padStart(2,'0')};
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'-';
const DAY=864e5,INT=[0,1,3,7,14,30,60];
const now=()=>Date.now();
function instance(k){if(k.startsWith('gen:'))return GEN.generate(k.slice(4),GEN.newSeed());return bank.find(q=>q.id===k)||null}

// ---------- 記録と間隔反復 ----------
// 不正解 → 箱0(すぐ復習)/正解だが自信なし → 箱1(翌日)/自信を持って正解 → 箱を1つ上げる(1,3,7,14,30,60日後)
function addRec(q,c,m,unsure){
 const k=key(q),r=rec[k]=rec[k]||{a:[]},ok=c===q.answer-1;
 r.a.push({t:now(),ok,c,m,...(unsure?{u:1}:{})});if(r.a.length>50)r.a=r.a.slice(-50);
 if(!ok){r.box=0;r.due=now()}else if(unsure){r.box=1;r.due=now()+DAY}else{r.box=Math.min((r.box??0)+1+(r.a.length===1?1:0),INT.length-1);r.due=now()+INT[r.box]*DAY}
 const f=flags[k]=flags[k]||{};if(unsure)f.un=1;else if(ok)delete f.un;if(!Object.keys(f).length)delete flags[k];
 sv(R,rec);sv(FL,flags);
}
const isDue=k=>rec[k]?.a?.length&&(rec[k].due??0)<=now();
function fieldAcc(){const o={};for(const it of items()){const a=rec[it.key]?.a;if(!a?.length)continue;const x=o[it.field]=o[it.field]||{c:0,t:0};a.slice(-5).forEach(v=>{x.t++;if(v.ok)x.c++})}return o}
function weakFields(){const acc=fieldAcc();return fields().map(f=>({f,r:acc[f]?acc[f].c/acc[f].t:0.5})).sort((a,b)=>a.r-b.r).map(x=>x.f)}

// ---------- セッション ----------
// 選択肢の並びは出題ごとにシャッフルする(自動生成問題は生成時に並びが決まっている)
const mkItem=q=>({q,perm:q.fixed?q.choices.map((_,i)=>i):shuf(q.choices.map((_,i)=>i))});
function saveSess(){if(S.sess&&!S.sess.done)sv(SS,S.sess);else{try{localStorage.removeItem(SS)}catch(e){}}}

// ---------- 表示部品 ----------
const toggles=(q,s)=>{const k=key(q),f=flags[k]||{},un=s?!!s.un[k]:!!f.un;
 return `<span class="tg"><button class="ic ${f.bm?'on':''}" data-a="bm" data-k="${esc(k)}" title="ブックマーク">${f.bm?'★':'☆'}</button>${s?`<button class="ic ${un?'on warn':''}" data-a="un" title="自信なし(見直し)">${un?'⚑ 自信なし':'⚐ 自信なし'}</button>`:''}</span>`};
function qhtml(it,sel,lock,s){
 const q=it.q;
 return `<div class="qh"><div class="meta">${esc(q.field)}${q.title?' / '+esc(q.title):''}<br>${esc(q.source||'')}</div>${toggles(q,s)}</div><div class="qt">${esc(q.question)}</div>`+
 (q.gen&&q.fig?`<div class="fig">${q.fig}</div>`:q.figure&&/^data:image\//.test(q.figure)?`<img class="fig" src="${esc(q.figure)}" alt="">`:'')+
 it.perm.map((o,k)=>{let cl='ch';if(lock){if(o===q.answer-1)cl+=' ok';else if(o===sel)cl+=' ng'}else if(o===sel)cl+=' sel';
  return `<button class="${cl}" data-a="pick" data-k="${o}" ${lock?'disabled':''}><b>${NUM[k]}</b> ${esc(q.choices[o])}</button>`}).join('');
}
const pos=(it,o)=>NUM[it.perm.indexOf(o)];
const off=q=>`${q.explanation?`<div class="off"><b>解説</b>\n${esc(q.explanation)}</div>`:''}<p><button class="lk" data-a="fsheet" data-f="${esc(q.field)}">📘 「${esc(q.field)}」の公式を見る</button></p>`;
const tools=()=>`<span class="tl"><button data-a="sheet" data-s="tables">付表</button><button data-a="sheet" data-s="calc">電卓</button></span>`;

function home(){
 const due=items().filter(it=>isDue(it.key)).length,un=bank.filter(q=>!last(q.id)).length;
 const ex=exams();
 return `${due?`<div class="card hl"><h2>今日の復習: ${due}問</h2><p class="meta">間違えた問題・自信がなかった問題が、忘れかけるタイミングで出題されます。</p><button class="pri" data-a="srs">復習を始める</button></div>`:''}
 <div class="card"><h2>模擬試験(CBT形式)</h2><p class="meta">本番のCBTにならい、全分野から出題して最後にまとめて採点します。問題一覧からの移動、見直し(自信なし)の目印、付表・電卓が使えます。100点満点で60点以上が合格の目安です。</p>
 <p><label>問題数 <input id="mn" type="number" min="1" value="35"></label> <label>制限時間(分・空欄なら無制限) <input id="mt" type="number" min="1" value="90"></label></p>
 <button class="pri" data-a="mock">開始</button></div>
 <div class="card"><h2>分野別演習</h2>${fields().map(x=>`<label class="chip"><input type="checkbox" class="fc" value="${esc(x)}" checked> ${esc(x)}</label>`).join('')}
 <p><button data-a="fall" data-v="1">全選択</button> <button data-a="fall" data-v="">全解除</button></p>
 <p><label>出題 <select id="src"><option value="mix">収録問題+自動生成</option><option value="bank">収録問題のみ(${bank.length}問)</option><option value="gen">自動生成のみ(${GEN.list.length}種類・数値が毎回変わる)</option></select></label></p>
 <p><label>問題数 <input id="sn" type="number" min="1" value="10"></label> <label class="chip"><input type="checkbox" id="nu"> 未解答の収録問題を優先(残り${un}問)</label></p>
 <button class="pri" data-a="study">開始</button></div>`+
 (ex.length?`<div class="card"><h2>試験回別(取り込んだ問題)</h2><p><select id="ex">${ex.map(x=>`<option value="${esc(x)}">${esc(x)}(${bank.filter(q=>q.exam===x).length}問)</option>`).join('')}</select></p>
 <p><label>制限時間(分・空欄なら無制限) <input id="tl" type="number" min="1"></label></p><button class="pri" data-a="exam">開始</button></div>`:'');
}
function sess(){
 const s=S.sess;if(s.done)return result();
 const it=s.qs[s.i],q=it.q,k=key(q),n=s.qs.length,sel=s.ans[k],ex=s.mode==='exam',an=sel!==undefined;
 let h=`<div class="card"><div class="bar"><span><b>問${s.i+1}</b> / ${n}</span>${s.end?`<span id="tm" class="tm">残り ${fmt(s.end-now())}</span>`:''}${tools()}<button data-a="quit">${ex?'中断':'終了'}</button></div>`+qhtml(it,sel,!ex&&an,s);
 if(!ex&&an){const ok=sel===q.answer-1;h+=`<p class="${ok?'okt':'ngt'}">${ok?'正解':'不正解(正解: '+pos(it,q.answer-1)+')'}</p>`+off(q)+`<p><button class="pri" data-a="next">${s.i+1<n?'次へ':'結果を見る'}</button></p>`}
 if(ex)h+=`<div class="bar"><button data-a="prev" ${s.i?'':'disabled'}>前へ</button><button data-a="next" ${s.i+1<n?'':'disabled'}>次へ</button></div>
 <details class="pl" ${S.pal?'open':''}><summary data-a="pal">問題一覧(回答済 ${s.qs.filter(x=>s.ans[key(x.q)]!==undefined).length} / ${n}・見直し ${s.qs.filter(x=>s.un[key(x.q)]).length})</summary><div class="pal">${s.qs.map((x,i)=>`<button class="${i===s.i?'cur':''} ${s.ans[key(x.q)]!==undefined?'dn':''} ${s.un[key(x.q)]?'fl':''}" data-a="go" data-i="${i}">${i+1}</button>`).join('')}</div><p class="meta">塗りつぶし=回答済、⚑=見直し(自信なし)</p></details>
 <p><button class="pri" data-a="submit">${S.cf==='sub'?'未回答があります。本当に提出する':'解答を提出する'}</button></p>`;
 return h+'</div>';
}
function result(){
 const s=S.sess,rs=s.qs.map(it=>{const c=s.ans[key(it.q)];return{it,c,ok:c===it.q.answer-1,un:!!s.un[key(it.q)]}}),ok=rs.filter(r=>r.ok).length,sc=Math.round(ok/rs.length*100);
 const bf=s.mode==='exam'?fields().map(f=>{const a=rs.filter(r=>r.it.q.field===f);return a.length?`<tr><td>${esc(f)}</td><td>${a.filter(r=>r.ok).length} / ${a.length}</td></tr>`:''}).join(''):'';
 return `<div class="card"><h2>${s.mode==='exam'?`${sc}点(${ok} / ${rs.length}問正解)${sc>=60?' <span class="okt">合格ライン到達</span>':' <span class="ngt">合格ライン未到達</span>'}`:`結果 ${ok} / ${rs.length}(${pct(ok,rs.length)})`}</h2>
 ${s.mode==='exam'?'<p class="meta">未回答は不正解として記録しています。合格の目安は60点です(公式の基準は受験案内で確認してください)。</p>':''}
 ${bf?`<div class="tw"><table><tr><th>分野</th><th>正解</th></tr>${bf}</table></div>`:''}
 <p>${rs.some(r=>!r.ok||r.un)?'<button class="pri" data-a="retry">間違えた・自信なしの問題をもう一度</button> ':''}<button data-a="quit">戻る</button></p></div>`+
 rs.map((r,i)=>`<details class="card"><summary class="${r.ok?'okt':'ngt'}">${r.ok?'○':'×'}${r.un?' ⚑':''} ${i+1}. ${esc(r.it.q.question.replace(/\$/g,'').slice(0,40))}…</summary>${qhtml(r.it,r.c,true,null)}${off(r.it.q)}</details>`).join('');
}
function recs(){
 const its=items(),due=its.filter(it=>isDue(it.key)).length,att=its.filter(it=>last(it.key));
 const wr=att.filter(it=>!last(it.key).ok).length,ev=att.filter(it=>rec[it.key].a.some(x=>!x.ok)).length;
 const bm=Object.keys(flags).filter(k=>flags[k].bm).length,un=Object.keys(flags).filter(k=>flags[k].un).length;
 const acc=fieldAcc();
 const bf=fields().map(f=>{const all=its.filter(x=>x.field===f),a=att.filter(x=>x.field===f),t=a.reduce((s,x)=>s+rec[x.key].a.length,0),c=a.reduce((s,x)=>s+rec[x.key].a.filter(v=>v.ok).length,0);
  return `<tr><td>${esc(f)}</td><td>${a.length}/${all.length}<div class="meter"><i style="width:${a.length/all.length*100}%"></i></div></td><td>${pct(c,t)}</td><td>${acc[f]?pct(acc[f].c,acc[f].t):'-'}</td></tr>`}).join('');
 const hist=[...att].sort((a,b)=>last(b.key).t-last(a.key).t).slice(0,100).map(it=>{const q=it.key.startsWith('gen:')?tpls().find(x=>x.key===it.key):bank.find(x=>x.id===it.key);const l=last(it.key);
  return `<tr><td class="${l.ok?'okt':'ngt'}">${l.ok?'○':'×'}${flags[it.key]?.un?'⚑':''}</td><td>${esc(q?.title?'[自動生成] '+q.title:(q?.question||it.key).slice(0,30)+'…')}</td><td>${esc(it.field)}</td><td>${rec[it.key].a.length}回</td></tr>`}).join('');
 return `<div class="card"><h2>間隔反復(今日の復習)</h2><p>復習期限が来ている問題: <b>${due}</b>問</p>
 <p><label>問題数 <input id="rn" type="number" min="1" value="20"></label> <label class="chip"><input type="checkbox" id="wf" checked> 足りない分は苦手分野から補う</label></p>
 <button class="pri" data-a="srs">開始</button>
 <p class="meta">不正解は当日中、自信なしの正解は翌日、自信を持って正解すると 3→7→14→30→60日後と間隔を空けて再出題します。自動生成問題は数値を変えて出し直します。</p></div>
 <div class="card"><h2>目印・間違いから復習</h2>
 <p><select id="rs"><option value="bm">★ブックマーク(${bm})</option><option value="un">⚑自信なし(${un})</option><option value="last">最新が不正解(${wr})</option><option value="ever">一度でも不正解(${ev})</option></select> <button class="pri" data-a="review">開始</button></p></div>
 <div class="card"><h2>分野別の記録</h2>${att.length?`<div class="tw"><table><tr><th>分野</th><th>解答済/全問</th><th>正答率(延べ)</th><th>直近の正答率</th></tr>${bf}</table></div><p class="meta">自動生成問題は1種類を1問として数えています。</p>`:'<p>まだ解答記録がありません。</p>'}</div>
 ${att.length?`<div class="card"><h2>解答履歴(直近100問)</h2><div class="tw"><table><tr><th></th><th>問題</th><th>分野</th><th>回数</th></tr>${hist}</table></div></div>`:''}`;
}
function formulas(only){
 const secs=only?FORM.filter(s=>s.field===only):FORM;
 return (only?'':`<div class="card"><h2>公式・用語まとめ</h2><div class="jump">${FORM.map((s,i)=>`<a href="#f${i}">${esc(s.field)}</a>`).join('')}</div></div>`)+
 secs.map(s=>`<div class="card" id="f${FORM.indexOf(s)}"><h2>${esc(s.field)}</h2>${s.items.map(x=>`<div class="fm"><h3>${esc(x.t)}</h3>${x.f?`<div class="fx">${tex(/quad|\\\\/.test(x.f)?'\\begin{gathered}'+x.f.replace(/,?\\q?quad\s*/g,'\\\\')+'\\end{gathered}':x.f,true)}</div>`:''}${x.d?`<p class="fd">${esc(x.d)}</p>`:''}</div>`).join('')}</div>`).join('');
}
function tex(s,d){try{return katex.renderToString(s,{displayMode:d,throwOnError:false})}catch(e){return esc(s)}}
function tablesView(w){
 const tabs=[['normal','正規分布'],['t','t分布'],['chi2','χ²分布'],['f05','F分布 5%'],['f025','F分布 2.5%']];w=w||S.tbl||'normal';
 let h=`<div class="tabs sm">${tabs.map(t=>`<button class="${w===t[0]?'on':''}" data-a="tbl" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>`;
 if(w==='normal'){const N=TB.normal;h+=`<p class="meta">標準正規分布の上側確率 $P(Z\\ge z)$。行が $z$ の小数第1位まで、列が小数第2位。</p><div class="tw"><table class="nt"><tr><th>z</th>${N.cols.map(c=>`<th>${c.toFixed(2)}</th>`).join('')}</tr>${N.rows.map((r,i)=>`<tr><th>${r.toFixed(1)}</th>${N.v[i].map(v=>`<td>${v.toFixed(4)}</td>`).join('')}</tr>`).join('')}</table></div>
 <p class="meta">主な上側パーセント点: ${Object.entries(TB.zq).map(([a,z])=>`${a}→${z}`).join('、')}</p>`}
 else if(w==='t'){const t=TB.t;h+=`<p class="meta">t分布の上側 $\\alpha$ 点 $t_\\alpha(\\nu)$。行が自由度 $\\nu$。</p><div class="tw"><table class="nt"><tr><th>ν \\ α</th>${t.alpha.map(a=>`<th>${a}</th>`).join('')}</tr>${t.df.map((d,i)=>`<tr><th>${d}</th>${t.v[i].map(v=>`<td>${v.toFixed(3)}</td>`).join('')}</tr>`).join('')}</table></div>`}
 else if(w==='chi2'){const c=TB.chi2;h+=`<p class="meta">χ²分布の上側 $\\alpha$ 点 $\\chi^2_\\alpha(\\nu)$。行が自由度 $\\nu$。</p><div class="tw"><table class="nt"><tr><th>ν \\ α</th>${c.alpha.map(a=>`<th>${a}</th>`).join('')}</tr>${c.df.map((d,i)=>`<tr><th>${d}</th>${c.v[i].map(v=>`<td>${v.toFixed(3)}</td>`).join('')}</tr>`).join('')}</table></div>`}
 else{const f=TB[w];h+=`<p class="meta">F分布の上側 ${f.alpha*100}% 点 $F_{${f.alpha}}(\\nu_1,\\nu_2)$。列が分子の自由度 $\\nu_1$、行が分母の自由度 $\\nu_2$。</p><div class="tw"><table class="nt"><tr><th>ν₂ \\ ν₁</th>${f.df1.map(a=>`<th>${a}</th>`).join('')}</tr>${f.df2.map((d,i)=>`<tr><th>${d}</th>${f.v[i].map(v=>`<td>${v.toFixed(2)}</td>`).join('')}</tr>`).join('')}</table></div>`}
 return h;
}
// 電卓: 四則演算・括弧・√ のみ(本番の持ち込み電卓程度)
function calcEval(src){
 const s=src.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');let i=0;
 const peek=()=>s[i],eat=c=>{if(s[i]===c){i++;return true}return false};
 const num=()=>{const m=/^\d*\.?\d+(e[+-]?\d+)?/.exec(s.slice(i));if(!m)throw 0;i+=m[0].length;return+m[0]};
 const atom=()=>{if(eat('('))return paren();if(eat('√')){if(eat('('))return Math.sqrt(paren());return Math.sqrt(atom())}if(eat('-'))return-atom();return num()};
 const paren=()=>{const v=expr();if(!eat(')'))throw 0;return v};
 const pw=()=>{let v=atom();while(eat('²'))v*=v;return v};
 const term=()=>{let v=pw();for(;;){if(eat('*'))v*=pw();else if(eat('/'))v/=pw();else return v}};
 const expr=()=>{let v=term();for(;;){if(eat('+'))v+=term();else if(eat('-'))v-=term();else return v}};
 const v=expr();if(i<s.length)throw 0;return v;
}
function calcView(){
 const keys=['7','8','9','÷','C','4','5','6','×','⌫','1','2','3','−','√','0','.','=','+','²','(',')'];
 let out='';if(S.calc){try{const v=calcEval(S.calc);out=Number.isFinite(v)?String(+v.toPrecision(10)):'エラー'}catch(e){out='…'}}
 return `<div class="cd"><div class="cx">${esc(S.calc)||'0'}</div><div class="cr">${out?'= '+esc(out):''}</div></div><div class="ck">${keys.map(k=>`<button data-a="ck" data-v="${k}" class="${'÷×−+='.includes(k)?'op':''}">${k}</button>`).join('')}</div>`;
}
function data(){
 return `<div class="card"><h2>問題データの取り込み</h2><p>収録: ${bank.length}問(付属 ${BUILTIN.length} / 取り込み ${user.length})+自動生成 ${GEN.list.length}種類。同じidの問題は上書きされます。</p>
 <p><input type="file" id="fl" accept=".json,application/json"></p><textarea id="ta" placeholder="JSONを貼り付け"></textarea>
 <p><button class="pri" data-a="imp">取り込む</button> <button data-a="rb" ${user.length?'':'disabled'}>${S.cf==='rb'?'本当に削除する(もう一度押す)':'取り込んだ問題を全削除'}</button></p></div>
 <div class="card"><h2>解答記録のバックアップ</h2><p class="meta">記録・目印はこの端末のブラウザ内にだけ保存されます。別の端末に移すときはバックアップを使ってください。</p>
 <p><button data-a="bk">記録を書き出す</button> <label>記録を読み込む <input type="file" id="rf" accept=".json,application/json"></label></p>
 <p><button data-a="rr">${S.cf==='rr'?'本当に記録を全削除する(もう一度押す)':'解答記録を全削除'}</button></p></div>
 <div class="card"><h2>データ形式</h2><p>JSON配列(または {"questions":[...]})。必須: id / field / question / choices / answer(正解の番号、1始まり)。任意: exam(試験回) / no(問題番号) / source(出典表記) / explanation(解説) / figure(図表のdata:image URI)。問題文・選択肢・解説の中の <code>$...$</code> は数式として表示されます。</p>
 <pre>[{"id":"...","field":"...","question":"...","choices":["...","..."],"answer":1,"exam":"...","no":1,"source":"...","explanation":"..."}]</pre></div>`;
}
function sheet(){
 if(!S.sheet)return'';const t={tables:'付表',calc:'電卓',form:'公式'}[S.sheet.k];
 const body=S.sheet.k==='tables'?tablesView():S.sheet.k==='calc'?calcView():formulas(S.sheet.f);
 return `<div class="sh-bg" data-a="close"></div><div class="sh ${S.sheet.k==='calc'?'sm':''}" role="dialog"><div class="sh-h"><b>${t}</b><button data-a="close">閉じる</button></div><div class="sh-b">${body}</div></div>`;
}
const MATH={delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false,ignoredClasses:['cx']};
function render(){
 const tabs=[['quiz','出題'],['rec','復習'],['form','公式'],['tables','付表'],['data','データ']];
 const sy=S.sheet?$('shb')?.scrollTop:0;
 $('app').innerHTML=`<header><h1>統計検定2級 対策</h1></header><nav class="tabs">${tabs.map(t=>`<button class="${S.tab===t[0]?'on':''}" data-a="tab" data-t="${t[0]}">${t[1]}${t[0]==='quiz'&&S.sess&&!S.sess.done?'・中':''}</button>`).join('')}</nav>`+(S.msg?`<div class="msg">${esc(S.msg)}</div>`:'')+
 (S.tab==='quiz'?(S.sess?sess():home()):S.tab==='rec'?recs():S.tab==='form'?formulas():S.tab==='tables'?`<div class="card">${tablesView()}</div>`:data());
 $('sheet').innerHTML=sheet();document.body.classList.toggle('noscroll',!!S.sheet);
 if(window.renderMathInElement){renderMathInElement($('app'),MATH);renderMathInElement($('sheet'),MATH)}
 const b=document.querySelector('.sh-b');if(b){b.id='shb';if(sy)b.scrollTop=sy}
 saveSess();
}
function start(mode,qs,min){
 qs=qs.filter(Boolean);
 if(!qs.length){S.msg='該当する問題がありません。';return render()}
 S.msg='';S.cf=0;S.pal=mode==='exam';S.sess={mode,qs:qs.map(mkItem),i:0,ans:{},un:{},done:false,end:min?now()+min*6e4:0};S.tab='quiz';render();scrollTo(0,0);tick();
}
function tick(){clearInterval(T);if(S.sess?.end&&!S.sess.done)T=setInterval(()=>{const s=S.sess;if(!s||s.done){clearInterval(T);return}const r=s.end-now();if($('tm'))$('tm').textContent='残り '+fmt(r);if(r<=0){S.msg='制限時間になったため提出しました。';submit()}},1000)}
function submit(){const s=S.sess;if(!s||s.done)return;s.qs.forEach(it=>addRec(it.q,s.ans[key(it.q)],'exam',s.un[key(it.q)]));s.done=true;S.cf=0;clearInterval(T);render();scrollTo(0,0)}
// 模擬試験: 分野ごとにほぼ均等、各分野で収録問題と自動生成をおよそ半々にする
function mockSet(n){
 const fs=fields(),per=fs.map((_,i)=>Math.floor(n/fs.length)+(i<n%fs.length?1:0)),out=[];
 shuf(fs).forEach((f,i)=>{const b=shuf(bank.filter(q=>q.field===f)),g=shuf(GEN.list.filter(x=>x.field===f)),m=per[i];
  for(let j=0;j<m;j++){const useG=g.length&&(j%2===1||!b.length);if(useG){const t=g[(j>>1)%g.length];out.push(GEN.generate(t.id,GEN.newSeed()))}else if(b.length)out.push(b.pop())}});
 return out.filter(Boolean).sort((a,b)=>fs.indexOf(a.field)-fs.indexOf(b.field));
}
function pool(fs,src){
 const b=src==='gen'?[]:bank.filter(q=>fs.includes(q.field)).map(q=>({k:q.id,q})),g=src==='bank'?[]:GEN.list.filter(x=>fs.includes(x.field)).map(x=>({k:'gen:'+x.id}));
 return{b,g};
}
function readFile(input,cb){const f=input.files[0];if(!f)return false;const r=new FileReader();r.onload=()=>cb(r.result);r.readAsText(f);return true}
function imp(txt){
 let j;try{j=JSON.parse(txt)}catch(e){S.msg='JSONとして読み込めません: '+e.message;return render()}
 const arr=Array.isArray(j)?j:j?.questions;if(!Array.isArray(arr)){S.msg='配列(または {"questions":[...]})で指定してください。';return render()}
 const ok=[],er=[];
 arr.forEach((q,i)=>{const m=[];if(!q.id)m.push('id');if(!q.field)m.push('field');if(!q.question)m.push('question');
  if(!Array.isArray(q.choices)||q.choices.length<2)m.push('choices');if(!Number.isInteger(q.answer)||q.answer<1||q.answer>(q.choices||[]).length)m.push('answer');
  if(String(q.id).startsWith('gen:'))m.push('id(gen:で始まるidは使えません)');
  m.length?er.push(`#${i+1}: ${m.join(', ')} が不足または不正`):ok.push({...q,id:String(q.id),gen:undefined,tpl:undefined,fig:undefined,fixed:undefined})});
 const map=new Map(user.map(q=>[q.id,q]));ok.forEach(q=>map.set(q.id,q));user=[...map.values()];sv(U,user);rebuild();
 S.msg=`${ok.length}問を取り込みました。`+(er.length?`\n${er.length}問はスキップ:\n`+er.slice(0,10).join('\n'):'');render();
}
function restore(txt){
 let j;try{j=JSON.parse(txt)}catch(e){S.msg='JSONとして読み込めません: '+e.message;return render()}
 const r=j?.records;if(!r||typeof r!=='object'){S.msg='記録のバックアップファイルではありません。';return render()}
 // 既存の記録と結合(同じ時刻の解答は重複させない)。間隔反復の状態は新しい方を採用する
 for(const[id,v]of Object.entries(r)){if(!Array.isArray(v?.a))continue;const cur=rec[id]=rec[id]||{a:[]},ts=new Set(cur.a.map(x=>x.t)),lt=cur.a.at(-1)?.t??0;v.a.forEach(x=>{if(!ts.has(x.t))cur.a.push(x)});cur.a.sort((a,b)=>a.t-b.t);if((v.a.at(-1)?.t??0)>lt){cur.box=v.box;cur.due=v.due}}
 if(j.flags&&typeof j.flags==='object')for(const[k,v]of Object.entries(j.flags))flags[k]={...flags[k],...v};
 if(Array.isArray(j.user)){const m=new Map(user.map(q=>[q.id,q]));j.user.forEach(q=>q?.id&&m.set(q.id,q));user=[...m.values()];sv(U,user);rebuild()}
 sv(R,rec);sv(FL,flags);S.msg='記録を読み込みました。';render();
}
const act={
 tab(d){S.tab=d.t;S.cf=0;S.msg='';render();scrollTo(0,0)},
 fall(d){document.querySelectorAll('.fc').forEach(x=>x.checked=!!d.v)},
 study(){const f=[...document.querySelectorAll('.fc:checked')].map(x=>x.value),n=Math.max(1,+$('sn').value||10),src=$('src').value,{b,g}=pool(f,src);
  let bs=shuf(b);if($('nu').checked)bs=[...bs.filter(x=>!last(x.k)),...bs.filter(x=>last(x.k))];
  // 収録問題と自動生成を交互に並べる
  const gs=shuf(g),out=[];let i=0,j=0;while(out.length<n&&(i<bs.length||gs.length)){if(gs.length&&(out.length%2===1||i>=bs.length))out.push(GEN.generate(gs[j++%gs.length].k.slice(4),GEN.newSeed()));else out.push(bs[i++].q)}
  start('study',shuf(out))},
 mock(){const n=Math.max(1,+$('mn').value||35);start('exam',mockSet(n),+$('mt').value||0)},
 exam(){const e=$('ex').value,m=+$('tl').value||0;
  start('exam',bank.filter(q=>q.exam===e).sort((a,b)=>(a.no??1e9)-(b.no??1e9)),m)},
 srs(){const n=Math.max(1,+($('rn')?.value)||20),wf=$('wf')?$('wf').checked:true;
  const its=items(),due=its.filter(it=>isDue(it.key)).sort((a,b)=>(rec[a.key].box??0)-(rec[b.key].box??0)||(rec[a.key].due??0)-(rec[b.key].due??0)).slice(0,n);
  const ks=due.map(it=>it.key);
  if(wf&&ks.length<n){const wk=weakFields().slice(0,3);const fill=shuf(its.filter(it=>wk.includes(it.field)&&!ks.includes(it.key)&&(rec[it.key]?.due??0)<=now()+DAY*3));fill.sort((a,b)=>wk.indexOf(a.field)-wk.indexOf(b.field));ks.push(...fill.slice(0,n-ks.length).map(it=>it.key))}
  start('srs',shuf(ks).map(instance))},
 review(){const sc=$('rs').value,ks=Object.keys(sc==='bm'||sc==='un'?flags:rec).filter(k=>{if(sc==='bm')return flags[k].bm;if(sc==='un')return flags[k].un;const a=rec[k]?.a||[];return sc==='ever'?a.some(x=>!x.ok):a.length&&!a[a.length-1].ok});
  start('review',shuf(ks).map(instance))},
 retry(){const s=S.sess;start('review',shuf(s.qs.filter(it=>s.ans[key(it.q)]!==it.q.answer-1||s.un[key(it.q)]).map(it=>it.q.gen?instance(it.q.tpl):it.q)))},
 pick(d){const s=S.sess,q=s.qs[s.i].q,k=key(q);S.cf=0;if(s.mode==='exam')s.ans[k]=+d.k;else{if(s.ans[k]!==undefined)return;s.ans[k]=+d.k;addRec(q,+d.k,s.mode,s.un[k])}render()},
 next(){const s=S.sess;S.cf=0;if(s.i+1<s.qs.length)s.i++;else if(s.mode!=='exam')s.done=true;render();scrollTo(0,0)},
 prev(){S.cf=0;if(S.sess.i>0)S.sess.i--;render();scrollTo(0,0)},
 go(d){S.cf=0;S.sess.i=+d.i;render();scrollTo(0,0)},
 pal(d,e){e.preventDefault();S.pal=!S.pal;render()},
 submit(){const s=S.sess;if(S.cf!=='sub'&&s.qs.some(it=>s.ans[key(it.q)]===undefined)){S.cf='sub';return render()}submit()},
 quit(){clearInterval(T);S.sess=null;S.cf=0;render()},
 bm(d){const f=flags[d.k]=flags[d.k]||{};if(f.bm)delete f.bm;else f.bm=1;if(!Object.keys(f).length)delete flags[d.k];sv(FL,flags);render()},
 // 自信なし: 解答前に付けると、その解答を「自信なし」として記録する(解答後に付けても目印として残る)
 un(){const s=S.sess,q=s.qs[s.i].q,k=key(q);s.un[k]=!s.un[k];
  if(s.mode!=='exam'&&s.ans[k]!==undefined){const f=flags[k]=flags[k]||{};if(s.un[k]){f.un=1;const r=rec[k];if(r){r.a[r.a.length-1].u=1;if(r.box>1){r.box=1;r.due=now()+DAY}}}else delete f.un;if(!Object.keys(f).length)delete flags[k];sv(FL,flags);sv(R,rec)}
  render()},
 sheet(d){S.sheet={k:d.s};render()},
 fsheet(d){S.sheet={k:'form',f:d.f};render()},
 close(){S.sheet=null;render()},
 tbl(d){S.tbl=d.t;render()},
 ck(d){const v=d.v;if(v==='C')S.calc='';else if(v==='⌫')S.calc=S.calc.slice(0,-1);else if(v==='='){try{const r=calcEval(S.calc);if(Number.isFinite(r))S.calc=String(+r.toPrecision(10))}catch(e){}}else S.calc+=v;render()},
 imp(){const t=$('ta').value.trim();if(!readFile($('fl'),imp)){if(t)imp(t);else{S.msg='ファイルを選ぶかJSONを貼り付けてください。';render()}}},
 bk(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:'stat2',version:2,exported:new Date().toISOString(),records:rec,flags,user},null,1)],{type:'application/json'}));a.download=`stat2-records-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},
 rr(){if(S.cf==='rr'){rec={};flags={};sv(R,rec);sv(FL,flags);S.cf=0;S.msg='解答記録と目印を削除しました。'}else S.cf='rr';render()},
 rb(){if(S.cf==='rb'){user=[];sv(U,user);rebuild();S.cf=0;S.msg='取り込んだ問題を削除しました。'}else S.cf='rb';render()}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled&&act[b.dataset.a])act[b.dataset.a](b.dataset,e)});
document.addEventListener('change',e=>{if(e.target.id==='rf')readFile(e.target,restore)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.sheet){S.sheet=null;render()}});
// 途中のセッション(模擬試験など)を復元する
{const s=ld(SS,null);if(s&&!s.done&&Array.isArray(s.qs)&&s.qs.length){S.sess=s;S.pal=s.mode==='exam';S.msg='前回の続きから再開しました。';tick()}}
render();
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
