'use strict';
// 自動生成問題: 過去問の出題形式(5択・組合せ・出力表の読み取り・図表)にならい、数値を毎回変えて出題する
// 各生成器は make(R) で {question, choices, answer, explanation, fig?} を返す。fig は生成器が作る信頼済みHTML(SVG/表)
(function(){
const TB=window.STAT2_TABLES;
const GSRC='自動生成(過去問形式の練習問題)';
// ---------- 乱数・数値ユーティリティ ----------
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const mk=r=>({r,ri:(a,b)=>a+Math.floor(r()*(b-a+1)),pick:a=>a[Math.floor(r()*a.length)],shuf:a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}});
const fx=(v,d)=>{let s=(Math.round(v*10**d)/10**d).toFixed(d);return s==='-'+(0).toFixed(d)?(0).toFixed(d):s};
const sum=a=>a.reduce((s,x)=>s+x,0),mean=a=>sum(a)/a.length;
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
// 標準正規分布の上側確率(付表の値、zは小数第2位まで)
function Q(z){z=Math.round(z*100)/100;if(z<0)return 1-Q(-z);if(z>=3.5)return 0.0002;const r=Math.floor(z*10+1e-9),c=Math.round(z*100)-r*10;return TB.normal.v[r][c]}
const tq=(df,a)=>{const i=TB.t.df.indexOf(df),j=TB.t.alpha.indexOf(a);return i<0?NaN:TB.t.v[i][j]};
const cq=(df,a)=>{const i=TB.chi2.df.indexOf(df),j=TB.chi2.alpha.indexOf(a);return TB.chi2.v[i][j]};
// t分布の両側P値(出力表の表示用。シンプソン積分)
function lgam(x){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];let y=x,t=x+5.5;t-=(x+0.5)*Math.log(t);let s=1.000000000190015;for(const k of c)s+=k/++y;return -t+Math.log(2.5066282746310005*s/x)}
function tp2(t,v){t=Math.abs(t);const k=Math.exp(lgam((v+1)/2)-lgam(v/2))/Math.sqrt(v*Math.PI),f=x=>k*Math.pow(1+x*x/v,-(v+1)/2),n=400,h=t/n;let s=f(0)+f(t);for(let i=1;i<n;i++)s+=f(i*h)*(i%2?4:2);return Math.max(0,1-2*s*h/3)}
const pfmt=p=>p<0.0001?'< 0.0001':fx(p,4);

// ---------- 選択肢づくり ----------
// 数値の5択。誤答(典型的な間違い)を優先し、足りなければ近い値で補う。値の小さい順に並べ、正解の位置は偏らないようにする
function mc(R,ans,wrongs,o={}){
 const d=o.d??2,F=o.fmt||(v=>fx(v,d)),ok=v=>Number.isFinite(v)&&(o.min===undefined||v>=o.min)&&(o.max===undefined||v<=o.max);
 const seen=new Set([F(ans)]),pri=[],sec=[];
 const add=(v,arr)=>{if(!ok(v))return;const s=F(v);if(seen.has(s))return;seen.add(s);arr.push(v)};
 wrongs.forEach(v=>add(v,pri));
 const base=ans===0?(o.step||1):ans;
 for(const k of[0.1,0.2,0.3,0.5,0.75,1,1.5,2,3])for(const s of R.shuf([1,-1]))add(ans+s*k*Math.abs(base),sec);
 const below=[...pri.filter(v=>v<ans),...sec.filter(v=>v<ans)],above=[...pri.filter(v=>v>ans),...sec.filter(v=>v>ans)];
 let p=R.ri(0,4);p=Math.min(p,below.length);p=Math.max(p,4-above.length);
 const vals=[ans,...below.slice(0,p),...above.slice(0,4-p)].sort((a,b)=>a-b);
 return{choices:vals.map(F),answer:vals.indexOf(ans)+1,fixed:true};
}
// 文章の5択(並び順はシャッフル)
function mt(R,ans,wrongs){const c=R.shuf([ans,...wrongs.slice(0,4)]);return{choices:c,answer:c.indexOf(ans)+1,fixed:true}}
// 「Ⅰ〜Ⅲの正誤の組合せ」の5択(過去問の定番形式)
const CMB=[[1,0,0,'Ⅰのみ正しい'],[0,1,0,'Ⅱのみ正しい'],[0,0,1,'Ⅲのみ正しい'],[1,1,0,'ⅠとⅡのみ正しい'],[1,0,1,'ⅠとⅢのみ正しい'],[0,1,1,'ⅡとⅢのみ正しい'],[1,1,1,'ⅠとⅡとⅢはすべて正しい']];
// 順序の決まった選択肢群(全n個)から正解ciを含む5個を選ぶ。正解が何番目に来るかは偏らないようにする
function ordered(R,n,ci){
 const lo=R.shuf([...Array(ci).keys()]),hi=R.shuf([...Array(n-ci-1).keys()].map(i=>i+ci+1));
 let p=R.ri(0,4);p=Math.min(p,lo.length);p=Math.max(p,4-hi.length);
 return[...lo.slice(0,p),ci,...hi.slice(0,4-p)].sort((a,b)=>a-b);
}
function combo(R,truth){
 const ci=CMB.findIndex(c=>c[0]===+truth[0]&&c[1]===+truth[1]&&c[2]===+truth[2]),idx=ordered(R,CMB.length,ci);
 return{choices:idx.map(i=>CMB[i][3]),answer:idx.indexOf(ci)+1,fixed:true};
}
const TF=b=>b?'正しい':'誤り';
const ONE='最も適切なものを、次の①〜⑤のうちから一つ選べ。';
const CMBQ='次の記述Ⅰ〜Ⅲに関して、正しい記述の組合せとして最も適切なものを、次の①〜⑤のうちから一つ選べ。';

// ---------- 図表(SVG・表) ----------
const W=360,H=220,ML=40,MR=12,MT=14,MB=30;
const svg=(body,h=H)=>`<svg class="gfig" viewBox="0 0 ${W} ${h}" role="img">${body}</svg>`;
const tx=(x,y,s,a='middle',c='')=>`<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${s}</text>`;
function axisY(lo,hi,step,sy,h=H){let s=`<line class="ax" x1="${ML}" y1="${MT}" x2="${ML}" y2="${h-MB}"/>`;for(let v=lo;v<=hi+1e-9;v+=step){const y=sy(v);s+=`<line class="gr" x1="${ML}" y1="${y}" x2="${W-MR}" y2="${y}"/>`+tx(ML-5,y+4,+fx(v,2),'end')}return s}
function svgHist(edges,freq,xl='',yl='度数'){
 const mx=Math.max(...freq),top=Math.ceil(mx/5)*5||5,sy=v=>H-MB-(v/top)*(H-MB-MT),bw=(W-ML-MR)/freq.length;
 let s=axisY(0,top,top/5,sy);
 freq.forEach((f,i)=>{const x=ML+i*bw;s+=`<rect class="bar" x="${x}" y="${sy(f)}" width="${bw}" height="${H-MB-sy(f)}"/>`+tx(x+bw/2,sy(f)-3,f,'middle','sm')});
 edges.forEach((e,i)=>s+=tx(ML+i*bw,H-MB+14,e));
 return svg(s+tx(W-MR,H-4,xl,'end','sm')+tx(6,MT-2,yl,'start','sm'));
}
function svgBox(groups,lo,hi,step){
 const h=40+groups.length*48,sx=v=>ML+(v-lo)/(hi-lo)*(W-ML-MR);let s='';
 for(let v=lo;v<=hi+1e-9;v+=step){const x=sx(v);s+=`<line class="gr" x1="${x}" y1="${MT}" x2="${x}" y2="${h-MB}"/>`+tx(x,h-MB+14,v)}
 groups.forEach((g,i)=>{const y=MT+20+i*48,[a,b,c,d,e]=g.v.map(sx);
  s+=tx(ML-8,y+4,g.name,'end')+`<line class="wh" x1="${a}" y1="${y}" x2="${b}" y2="${y}"/><line class="wh" x1="${d}" y1="${y}" x2="${e}" y2="${y}"/><line class="wh" x1="${a}" y1="${y-8}" x2="${a}" y2="${y+8}"/><line class="wh" x1="${e}" y1="${y-8}" x2="${e}" y2="${y+8}"/><rect class="box" x="${b}" y="${y-14}" width="${d-b}" height="28"/><line class="md" x1="${c}" y1="${y-14}" x2="${c}" y2="${y+14}"/>`});
 return svg(s,h);
}
function svgScatter(pts){
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const sx=v=>ML+(v-x0)/(x1-x0||1)*(W-ML-MR),sy=v=>H-MB-(v-y0)/(y1-y0||1)*(H-MB-MT);
 return svg(`<line class="ax" x1="${ML}" y1="${H-MB}" x2="${W-MR}" y2="${H-MB}"/><line class="ax" x1="${ML}" y1="${MT}" x2="${ML}" y2="${H-MB}"/>`+pts.map(p=>`<circle class="pt" cx="${sx(p[0])}" cy="${sy(p[1])}" r="3.2"/>`).join('')+tx(W-MR,H-10,'x','end')+tx(ML-8,MT+8,'y','end'));
}
function svgLine(labels,vals){
 const lo=Math.floor(Math.min(...vals)/10)*10,hi=Math.ceil(Math.max(...vals)/10)*10,sy=v=>H-MB-(v-lo)/(hi-lo||1)*(H-MB-MT),bw=(W-ML-MR)/labels.length,sx=i=>ML+bw*(i+0.5);
 let s=axisY(lo,hi,(hi-lo)/4,sy)+`<polyline class="ln" points="${vals.map((v,i)=>sx(i)+','+sy(v)).join(' ')}"/>`;
 vals.forEach((v,i)=>s+=`<circle class="pt" cx="${sx(i)}" cy="${sy(v)}" r="3"/>`+tx(sx(i),sy(v)-7,v,'middle','sm')+tx(sx(i),H-MB+14,labels[i],'middle','sm'));
 return svg(s);
}
const tbl=(head,rows,cap='')=>`<div class="tw"><table class="ft">${cap?`<caption>${cap}</caption>`:''}<tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;

// ---------- 生成器 ----------
const G=[];
const def=(id,field,title,make)=>G.push({id,field,title,make});

// ===== データの基礎 =====
def('d_var','データの基礎','分散・標準偏差の計算',R=>{
 const n=R.pick([5,6]);let x;do{x=Array.from({length:n},()=>R.ri(1,20))}while(new Set(x).size<3||(sum(x)%n));
 const m=mean(x),ss=sum(x.map(v=>(v-m)**2)),kind=R.pick(['u','sd']);
 if(kind==='u')return{question:`次の${n}個のデータがある。\n$${x.join(',\\ ')}$\nこのデータの不偏分散(偏差平方和を $n-1$ で割ったもの)はいくらか。${ONE}`,...mc(R,ss/(n-1),[ss/n,ss,Math.sqrt(ss/(n-1)),ss/(n-2)],{d:2,min:0}),
  explanation:`平均は $\\bar x=${fx(m,2)}$、偏差平方和は $\\sum (x_i-\\bar x)^2=${fx(ss,2)}$。\n不偏分散 $s^2=\\dfrac{${fx(ss,2)}}{${n-1}}=${fx(ss/(n-1),2)}$。$n$ で割ると ${fx(ss/n,2)} になる点に注意。`};
 return{question:`次の${n}個のデータがある。\n$${x.join(',\\ ')}$\nこのデータの標準偏差(偏差平方和を $n$ で割った分散の正の平方根)はいくらか。${ONE}`,...mc(R,Math.sqrt(ss/n),[Math.sqrt(ss/(n-1)),ss/n,Math.sqrt(ss)/n],{d:2,min:0}),
  explanation:`平均 $\\bar x=${fx(m,2)}$、偏差平方和 $=${fx(ss,2)}$。分散 $=${fx(ss,2)}/${n}=${fx(ss/n,3)}$、標準偏差 $=\\sqrt{${fx(ss/n,3)}}\\approx${fx(Math.sqrt(ss/n),2)}$。`};
});
def('d_wmean','データの基礎','全体の平均(加重平均)',R=>{
 const a=R.ri(2,6)*5,b=R.ri(2,8)*5,ma=R.ri(50,75),mb=R.ri(55,85);if(a===b||ma===mb)return null;
 const m=(a*ma+b*mb)/(a+b);
 return{question:`A組${a}人の平均点は${ma}点、B組${b}人の平均点は${mb}点であった。A組とB組を合わせた${a+b}人の平均点はいくらか。${ONE}`,...mc(R,m,[(ma+mb)/2,(b*ma+a*mb)/(a+b)],{d:1}),
  explanation:`全体の合計点を人数で割る。$\\dfrac{${a}\\times${ma}+${b}\\times${mb}}{${a+b}}=${fx(m,2)}$。単純平均 ${fx((ma+mb)/2,1)} は人数の違いを無視している。`};
});
def('d_zscore','データの基礎','標準化・偏差値',R=>{
 const mu=R.ri(10,14)*5,sd=R.pick([5,8,10,12,15,16,20]),z=R.pick([-1.5,-1,-0.5,0.5,1,1.25,1.5,2]),x=mu+z*sd;if(x!==Math.round(x))return null;
 return{question:`ある試験の得点の平均は${mu}点、標準偏差は${sd}点であった。得点が${x}点の受験者の偏差値はいくらか。${ONE}`,...mc(R,50+10*z,[50+z,50-10*z,50+10*(x-mu)/(sd*sd),x-mu+50],{d:1}),
  explanation:`標準化得点 $z=\\dfrac{${x}-${mu}}{${sd}}=${z}$。偏差値 $=50+10z=${fx(50+10*z,1)}$。`};
});
def('d_hist','データの基礎','ヒストグラムの読み取り',R=>{
 const k=6,w=10,lo=R.pick([0,10,20,30]),edges=Array.from({length:k+1},(_,i)=>lo+i*w);
 const f=Array.from({length:k},()=>R.ri(1,12)),N=sum(f),mids=edges.slice(0,k).map(e=>e+w/2),cls=i=>`${edges[i]}以上${edges[i+1]}未満`;
 const fig=svgHist(edges,f,'(点)');
 if(R.r()<0.5){
  if(N%2)f[R.ri(0,k-1)]++;const n=sum(f),cum=f.map((_,i)=>sum(f.slice(0,i+1)));const mi=cum.findIndex(c=>c>=n/2+1);
  if(cum.includes(n/2))return null;
  const pick=ordered(R,k,mi);
  return{fig:svgHist(edges,f,'(点)'),question:`次の図は、ある試験の得点のヒストグラムである(${n}人)。各階級は「以上・未満」で区切っている。中央値が含まれる階級として${ONE}`,
   choices:pick.map(cls),answer:pick.indexOf(mi)+1,fixed:true,
   explanation:`$n=${n}$ なので中央値は ${n/2} 番目と ${n/2+1} 番目の平均。累積度数は ${cum.join(', ')} で、${cls(mi)}の階級に含まれる。`};
 }
 const m=sum(f.map((v,i)=>v*mids[i]))/N;
 return{fig,question:`次の図は、ある試験の得点のヒストグラムである(${N}人)。各階級の値を階級値(階級の中央の値)で代表させたときの平均点はいくらか。${ONE}`,...mc(R,m,[mean(mids),sum(f.map((v,i)=>v*edges[i]))/N,sum(f.map((v,i)=>v*edges[i+1]))/N],{d:2}),
  explanation:`$\\bar x=\\dfrac{\\sum(\\text{階級値}\\times\\text{度数})}{${N}}=\\dfrac{${sum(f.map((v,i)=>v*mids[i]))}}{${N}}=${fx(m,2)}$。`};
});
def('d_box','データの基礎','箱ひげ図の読み取り(組合せ)',R=>{
 const g=['A','B','C'].map(name=>{const md=R.ri(40,70),q1=md-R.ri(3,15),q3=md+R.ri(3,15),mn=q1-R.ri(3,20),mx=q3+R.ri(3,20);return{name,v:[mn,q1,md,q3,mx]}});
 if(g.some(x=>x.v[0]<0||x.v[4]>100))return null;
 const iqr=x=>x.v[3]-x.v[1],rng=x=>x.v[4]-x.v[0];
 const [A,B,C]=g;const st=[];
 const s1=R.pick([[`Aの中央値はBの第3四分位数より大きい。`,A.v[2]>B.v[3]],[`Aの第1四分位数はCの中央値より小さい。`,A.v[1]<C.v[2]],[`Bの中央値はCの中央値より大きい。`,B.v[2]>C.v[2]]]);
 const s2=R.pick([[`四分位範囲が最も大きいのはBである。`,iqr(B)>iqr(A)&&iqr(B)>iqr(C)],[`Cの四分位範囲はAの四分位範囲より小さい。`,iqr(C)<iqr(A)]]);
 const s3=R.pick([[`範囲(最大値−最小値)が最も大きいのはCである。`,rng(C)>rng(A)&&rng(C)>rng(B)],[`Aでは、データの少なくとも半数が${A.v[1]}以上${A.v[3]}以下にある。`,true],[`Bでは、データの75%以上が${B.v[1]}以下である。`,false]]);
 st.push(s1,s2,s3);if(!st.some(s=>s[1]))return null;
 const all=[...g.map(x=>iqr(x)),...g.map(x=>rng(x))];if(new Set(all).size<all.length)return null;
 return{fig:svgBox(g,0,100,10),question:`次の図は、3つのグループA, B, Cの得点の箱ひげ図である(ひげの端は最小値・最大値)。\nⅠ. ${s1[0]}\nⅡ. ${s2[0]}\nⅢ. ${s3[0]}\n${CMBQ}`,...combo(R,st.map(s=>s[1])),
  explanation:g.map(x=>`${x.name}: 最小${x.v[0]}, Q1=${x.v[1]}, 中央値${x.v[2]}, Q3=${x.v[3]}, 最大${x.v[4]}(四分位範囲${iqr(x)}, 範囲${rng(x)})`).join('\n')+`\nⅠは${TF(s1[1])}、Ⅱは${TF(s2[1])}、Ⅲは${TF(s3[1])}。`};
});

// ===== 2変数・時系列 =====
def('b_corr','2変数・時系列','相関係数の計算',R=>{
 const sx=R.pick([2,3,4,5,6,8,10]),sy=R.pick([2,3,4,5,6,8,10,12]),r=R.pick([-0.8,-0.6,-0.5,-0.4,-0.3,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]),c=r*sx*sy;if(Math.abs(c*10-Math.round(c*10))>1e-9)return null;
 return{question:`2変数 $x, y$ について、$x$ の標準偏差が ${sx}、$y$ の標準偏差が ${sy}、$x$ と $y$ の共分散が ${fx(c,1)} であった。$x$ と $y$ の相関係数はいくらか。${ONE}`,...mc(R,r,[c/(sx*sx),c/(sy*sy),c/(sx+sy),c/(sx*sy*sx*sy)],{d:2,min:-1,max:1}),
  explanation:`$r=\\dfrac{s_{xy}}{s_x s_y}=\\dfrac{${fx(c,1)}}{${sx}\\times${sy}}=${fx(r,2)}$。`};
});
def('b_scatter','2変数・時系列','散布図と相関係数',R=>{
 const target=R.pick([-0.9,-0.5,0,0.5,0.9]);let pts,r;
 for(let t=0;t<50;t++){pts=[];for(let i=0;i<30;i++){const x=R.r()*2-1+(R.r()-0.5),e=(R.r()+R.r()+R.r()-1.5)*1.2;pts.push([x,0]);pts[i].e=e}
  const xs=pts.map(p=>p[0]),mx=mean(xs),sdx=Math.sqrt(mean(xs.map(v=>(v-mx)**2)));const es=pts.map(p=>p.e),me=mean(es),sde=Math.sqrt(mean(es.map(v=>(v-me)**2)));
  const b=target/Math.sqrt(1-target*target+1e-9);pts.forEach(p=>p[1]=Math.abs(target)>0.999?p[0]:b*(p[0]-mx)/sdx+(p.e-me)/sde);
  const ys=pts.map(p=>p[1]),my=mean(ys);r=sum(pts.map(p=>(p[0]-mx)*(p[1]-my)))/Math.sqrt(sum(xs.map(v=>(v-mx)**2))*sum(ys.map(v=>(v-my)**2)));
  if(Math.abs(r-target)<0.07)break}
 const opts=[-0.9,-0.5,0,0.5,0.9];
 return{fig:svgScatter(pts),question:`次の図は、2変数 $x, y$ の散布図である。$x$ と $y$ の相関係数に最も近い値を、次の①〜⑤のうちから一つ選べ。`,choices:opts.map(v=>fx(v,1)),answer:opts.indexOf(target)+1,fixed:true,
  explanation:`この散布図の相関係数は約 ${fx(r,2)}。右上がりなら正、右下がりなら負で、直線のまわりに集まるほど絶対値が1に近い。`};
});
def('b_index','2変数・時系列','物価指数(ラスパイレス・パーシェ)',R=>{
 const p0=[R.ri(5,20)*10,R.ri(5,20)*10],p1=p0.map(p=>p+R.ri(-2,6)*10),q0=[R.ri(2,10),R.ri(2,10)],q1=[R.ri(2,10),R.ri(2,10)];
 const L=sum(p1.map((p,i)=>p*q0[i]))/sum(p0.map((p,i)=>p*q0[i]))*100,P=sum(p1.map((p,i)=>p*q1[i]))/sum(p0.map((p,i)=>p*q1[i]))*100;if(Math.abs(L-P)<0.3)return null;
 const which=R.pick(['L','P']),ans=which==='L'?L:P,oth=which==='L'?P:L;
 const fig=tbl(['財','基準時点の価格','基準時点の数量','比較時点の価格','比較時点の数量'],[['A',p0[0],q0[0],p1[0],q1[0]],['B',p0[1],q0[1],p1[1],q1[1]]]);
 return{fig,question:`次の表は、2つの財A, Bの価格(円)と数量(個)である。基準時点を100としたときの比較時点の${which==='L'?'ラスパイレス':'パーシェ'}価格指数はいくらか。${ONE}`,...mc(R,ans,[oth,(p1[0]/p0[0]+p1[1]/p0[1])/2*100,Math.sqrt(L*P)],{d:1}),
  explanation:which==='L'?`ラスパイレス指数は基準時点の数量で加重する。$\\dfrac{\\sum p_1q_0}{\\sum p_0q_0}\\times100=\\dfrac{${sum(p1.map((p,i)=>p*q0[i]))}}{${sum(p0.map((p,i)=>p*q0[i]))}}\\times100=${fx(L,1)}$。`:`パーシェ指数は比較時点の数量で加重する。$\\dfrac{\\sum p_1q_1}{\\sum p_0q_1}\\times100=\\dfrac{${sum(p1.map((p,i)=>p*q1[i]))}}{${sum(p0.map((p,i)=>p*q1[i]))}}\\times100=${fx(P,1)}$。`};
});
def('b_growth','2変数・時系列','年平均成長率(幾何平均)',R=>{
 const g=R.pick([0.04,0.05,0.08,0.1,0.12,0.15,0.2]),n=R.pick([2,3]),a=R.pick([100,200,500]),b=a*(1+g)**n,tot=b/a-1;
 return{question:`ある企業の売上高は、${n}年間で ${a} 億円から ${fx(b,2)} 億円になった。この間の年平均成長率(毎年一定の率で成長したとみなす)は何%か。${ONE}`,...mc(R,g*100,[tot/n*100,tot*100,(Math.sqrt(b/a)-1)*100*(n===3?1:0.5)],{d:1,min:0,fmt:v=>fx(v,1)+'%'}),
  explanation:`$(1+g)^{${n}}=\\dfrac{${fx(b,2)}}{${a}}=${fx(b/a,4)}$ より $g=${fx(g*100,1)}\\%$。総増加率 ${fx(tot*100,1)}% を年数で割る算術平均は誤り。`};
});
def('b_ma','2変数・時系列','移動平均(折れ線グラフ)',R=>{
 const v=Array.from({length:7},()=>R.ri(10,40)*2),t=R.ri(2,6),k=R.pick([3,5]);if(k===5&&(t<3||t>5))return null;
 const h=(k-1)/2,ans=mean(v.slice(t-1-h,t+h));
 return{fig:svgLine(v.map((_,i)=>'第'+(i+1)+'期'),v),question:`次の図は、ある系列の第1期から第7期の値である。第${t}期を中心とする${k}項移動平均の値はいくらか。${ONE}`,...mc(R,ans,[v[t-1],mean(v),mean(v.slice(t-1,t-1+k).length===k?v.slice(t-1,t-1+k):v.slice(0,k))],{d:2}),
  explanation:`第${t-h}期〜第${t+h}期の${k}個の値 ${v.slice(t-1-h,t+h).join(', ')} の平均で ${fx(ans,2)}。`};
});

// ===== 確率 =====
def('p_bayes','確率','ベイズの定理',R=>{
 const pr=R.pick([0.01,0.02,0.05,0.1]),se=R.pick([0.8,0.9,0.95,0.99]),fp=R.pick([0.02,0.05,0.1]);
 const pp=pr*se+(1-pr)*fp,ans=pr*se/pp;
 return{question:`ある病気の有病率は ${pr*100}% である。この病気の検査は、病気の人が受けると ${fx(se*100,0)}% の確率で陽性となり、病気でない人が受けると ${fp*100}% の確率で陽性となる。無作為に選んだ1人が検査で陽性となったとき、この人が病気である確率はいくらか。${ONE}`,...mc(R,ans,[se,pr*se,1-fp,pr/pp*0.5],{d:3,min:0,max:1}),
  explanation:`$P(\\text{陽性})=${pr}\\times${se}+${fx(1-pr,2)}\\times${fp}=${fx(pp,4)}$。\n$P(\\text{病気}\\mid\\text{陽性})=\\dfrac{${fx(pr*se,4)}}{${fx(pp,4)}}\\approx${fx(ans,3)}$。感度 ${se} と混同しないこと。`};
});
def('p_atleast','確率','余事象(少なくとも1回)',R=>{
 const p=R.pick([0.1,0.2,0.25,0.3,0.4]),n=R.ri(2,5),ans=1-(1-p)**n;
 return{question:`1回の試行で成功する確率が ${p} である試行を、独立に ${n} 回行う。少なくとも1回成功する確率はいくらか。${ONE}`,...mc(R,ans,[n*p,p**n,(1-p)**n,1-p**n],{d:3,min:0,max:1}),
  explanation:`余事象「${n}回とも失敗」の確率は $(1-${p})^{${n}}=${fx((1-p)**n,4)}$。よって $1-${fx((1-p)**n,4)}=${fx(ans,3)}$。`};
});
def('p_union','確率','加法定理と独立性(組合せ)',R=>{
 const a=R.ri(2,7)/10,b=R.ri(2,7)/10,ind=R.r()<0.5,ab=ind?Math.round(a*b*100)/100:Math.round((a*b+R.pick([-0.06,-0.04,0.04,0.06]))*100)/100;if(ab<=0||ab>=Math.min(a,b))return null;
 const un=a+b-ab,s1v=R.pick([un,un+ab]),s2=Math.abs(ab-a*b)<1e-9,cond=ab/b,s3v=R.pick([cond,a]);
 const t=[Math.abs(s1v-un)<1e-9,s2,Math.abs(s3v-cond)<1e-9];if(!t.some(x=>x))return null;
 return{question:`事象A, Bについて $P(A)=${a}$、$P(B)=${b}$、$P(A\\cap B)=${ab}$ である。\nⅠ. $P(A\\cup B)=${fx(s1v,2)}$ である。\nⅡ. AとBは独立である。\nⅢ. $P(A\\mid B)=${fx(s3v,3)}$ である。\n${CMBQ}`,...combo(R,t),
  explanation:`$P(A\\cup B)=${a}+${b}-${ab}=${fx(un,2)}$。$P(A)P(B)=${fx(a*b,2)}$ なので${s2?'独立である':'独立ではない'}。$P(A\\mid B)=${ab}/${b}=${fx(cond,3)}$。`};
});
def('p_draw','確率','非復元抽出の確率',R=>{
 const r=R.ri(2,6),w=R.ri(2,6),N=r+w,ans=r*(r-1)/(N*(N-1));
 return{question:`赤玉 ${r} 個、白玉 ${w} 個が入った袋から、元に戻さずに玉を2個取り出す。2個とも赤玉である確率はいくらか。${ONE}`,...mc(R,ans,[(r/N)**2,r/N*(r-1)/N,2*r/N/(N-1),r*(r-1)/(N*N)],{d:3,min:0,max:1}),
  explanation:`$\\dfrac{${r}}{${N}}\\times\\dfrac{${r-1}}{${N-1}}=${fx(ans,3)}$。復元抽出の $(${r}/${N})^2=${fx((r/N)**2,3)}$ とは異なる。`};
});

// ===== 確率変数と確率分布 =====
def('r_binom','確率変数と確率分布','二項分布の確率・期待値・分散',R=>{
 const n=R.pick([4,5,6]),p=R.pick([0.2,0.3,0.4,0.5]),k=R.ri(1,n-1),C=(a,b)=>{let c=1;for(let i=0;i<b;i++)c=c*(a-i)/(i+1);return c};
 if(R.r()<0.5){const ans=C(n,k)*p**k*(1-p)**(n-k);
  return{question:`確率変数 $X$ が二項分布 $B(${n},\\,${p})$ に従うとき、$P(X=${k})$ はいくらか。${ONE}`,...mc(R,ans,[p**k*(1-p)**(n-k),C(n,k)*p**k,C(n,k)*p**(n-k)*(1-p)**k],{d:4,min:0,max:1}),
   explanation:`$P(X=${k})={}_{${n}}\\mathrm{C}_{${k}}\\,${p}^{${k}}(1-${p})^{${n-k}}=${C(n,k)}\\times${fx(p**k,4)}\\times${fx((1-p)**(n-k),4)}=${fx(ans,4)}$。`}}
 const N=R.pick([20,40,50,100]),v=N*p*(1-p);
 return{question:`確率変数 $X$ が二項分布 $B(${N},\\,${p})$ に従うとき、$X$ の分散 $V[X]$ はいくらか。${ONE}`,...mc(R,v,[N*p,Math.sqrt(v),N*p*p,p*(1-p)],{d:2,min:0}),
  explanation:`$V[X]=np(1-p)=${N}\\times${p}\\times${fx(1-p,1)}=${fx(v,2)}$。期待値は $np=${fx(N*p,1)}$。`};
});
def('r_lin','確率変数と確率分布','線形結合の分散',R=>{
 const a=R.pick([1,2,3,-2]),b=R.pick([1,-1,2,-3]),vx=R.ri(1,9),vy=R.ri(1,9),c=R.pick([0,0,1,-1,2]),ans=a*a*vx+b*b*vy+2*a*b*c;if(ans<=0)return null;
 const sx=(v,s)=>v===1?s:v===-1?'-'+s:v+s,expr=`${sx(a,'X')}${b>0?'+':''}${sx(b,'Y')}+5`;
 return{question:`確率変数 $X, Y$ について $V[X]=${vx}$、$V[Y]=${vy}$、$\\mathrm{Cov}(X,Y)=${c}$ である。$${expr}$ の分散はいくらか。${ONE}`,...mc(R,ans,[a*vx+b*vy,a*a*vx+b*b*vy,a*a*vx+b*b*vy-2*a*b*c,a*a*vx+b*b*vy+2*a*b*c+5,a*a*vx-b*b*vy],{d:0,min:0}),
  explanation:`$V[aX+bY+c']=a^2V[X]+b^2V[Y]+2ab\\,\\mathrm{Cov}(X,Y)$。\n$=${a*a}\\times${vx}+${b*b}\\times${vy}+2\\times(${a*b})\\times${c}=${ans}$。定数 5 は分散に影響しない。`};
});
def('r_pois','確率変数と確率分布','ポアソン分布',R=>{
 const l=R.pick([0.5,1,1.5,2,3]),k=R.pick([0,1,2]),f=x=>{let s=1;for(let i=2;i<=x;i++)s*=i;return s},p=j=>Math.exp(-l)*l**j/f(j),le=R.r()<0.5;
 const ans=le?sum([...Array(k+1).keys()].map(p)):p(k);
 return{question:`確率変数 $X$ が平均 ${l} のポアソン分布に従うとき、$P(X${le?'\\le':'='}${k})$ はいくらか。${ONE}`,...mc(R,ans,[le?p(k):sum([...Array(k+1).keys()].map(p)),1-ans,Math.exp(-l),l**k/f(k)*Math.exp(-1)],{d:3,min:0,max:1}),
  explanation:`$P(X=k)=e^{-\\lambda}\\dfrac{\\lambda^k}{k!}$、$\\lambda=${l}$、$e^{-${l}}\\approx${fx(Math.exp(-l),4)}$。\n${le?[...Array(k+1).keys()].map(j=>`P(X=${j})=${fx(p(j),4)}`).join('、')+` の和で ${fx(ans,3)}。`:`$P(X=${k})=${fx(ans,3)}$。`}`};
});
def('r_table','確率変数と確率分布','確率分布表から期待値・分散',R=>{
 const xs=[0,1,2,3],raw=xs.map(()=>R.ri(1,6)),t=sum(raw);if(10%t&&20%t&&t!==10&&t!==20&&t!==5)return null;
 const ps=raw.map(v=>v/t);if(ps.some(v=>Math.abs(v*100-Math.round(v*100))>1e-9))return null;
 const E=sum(xs.map((x,i)=>x*ps[i])),V=sum(xs.map((x,i)=>x*x*ps[i]))-E*E,ask=R.pick(['E','V']);
 const fig=tbl(['$x$',...xs],[['$P(X=x)$',...ps.map(v=>fx(v,2))]]);
 return{fig,question:`確率変数 $X$ の確率分布が次の表で与えられている。$X$ の${ask==='E'?'期待値 $E[X]$':'分散 $V[X]$'}はいくらか。${ONE}`,...(ask==='E'?mc(R,E,[mean(xs),sum(ps)*1.5,E*E],{d:2,min:0}):mc(R,V,[sum(xs.map((x,i)=>x*x*ps[i])),Math.sqrt(V),E],{d:2,min:0})),
  explanation:`$E[X]=\\sum x\\,p=${fx(E,2)}$、$E[X^2]=${fx(sum(xs.map((x,i)=>x*x*ps[i])),2)}$。\n$V[X]=E[X^2]-(E[X])^2=${fx(V,4)}$。`};
});

// ===== 正規分布と標本分布 =====
def('n_prob','正規分布と標本分布','正規分布の確率(付表)',R=>{
 const mu=R.pick([50,60,100,170]),sd=R.pick([4,5,10,20]),z=R.ri(30,250)/100,x=mu+z*sd,ans=Q(z);
 if(R.r()<0.5)return{question:`確率変数 $X$ が正規分布 $N(${mu},\\,${sd*sd})$ に従うとき、$P(X\\ge ${fx(x,2).replace(/\.?0+$/,'')})$ はいくらか。付表を用いて、${ONE}`,...mc(R,ans,[1-ans,Q(z/2),Q(z*sd/(sd*sd)*sd/2),0.5-ans],{d:4,min:0,max:1}),
  explanation:`標準化すると $z=\\dfrac{${fx(x,2).replace(/\.?0+$/,'')}-${mu}}{${sd}}=${fx(z,2)}$。付表より $P(Z\\ge ${fx(z,2)})=${fx(ans,4)}$。分散 ${sd*sd} ではなく標準偏差 ${sd} で割ること。`};
 const z2=R.ri(30,200)/100,lo=mu-z2*sd,p=1-ans-Q(z2);
 return{question:`確率変数 $X$ が正規分布 $N(${mu},\\,${sd*sd})$ に従うとき、$P(${fx(lo,2).replace(/\.?0+$/,'')}\\le X\\le ${fx(x,2).replace(/\.?0+$/,'')})$ はいくらか。付表を用いて、${ONE}`,...mc(R,p,[1-ans,ans+Q(z2),0.5-ans+0.5-Q(z2)-0.5,1-Q(z2)],{d:4,min:0,max:1}),
  explanation:`$z_1=${fx(-z2,2)}$、$z_2=${fx(z,2)}$。$P=1-P(Z\\ge${fx(z,2)})-P(Z\\le${fx(-z2,2)})=1-${fx(ans,4)}-${fx(Q(z2),4)}=${fx(p,4)}$。`};
});
def('n_mean','正規分布と標本分布','標本平均の分布',R=>{
 const n=R.pick([16,25,36,49,64,100]),se=R.pick([0.5,1,1.5,2,2.5]),sd=se*Math.sqrt(n),mu=R.pick([50,100,200]),z=R.ri(50,250)/100,c=mu+z*se;
 if(sd!==Math.round(sd)||Math.abs(c*100-Math.round(c*100))>1e-6)return null;
 return{question:`平均 ${mu}、標準偏差 ${sd} の正規母集団から大きさ ${n} の無作為標本を抽出する。標本平均 $\\bar X$ が ${+fx(c,2)} 以上となる確率はいくらか。付表を用いて、${ONE}`,...mc(R,Q(z),[Q((c-mu)/sd),1-Q(z),Q(z/2),2*Q(z)],{d:4,min:0,max:1}),
  explanation:`$\\bar X\\sim N\\left(${mu},\\,\\dfrac{${sd}^2}{${n}}\\right)$、標準誤差 $\\dfrac{${sd}}{\\sqrt{${n}}}=${se}$。\n$z=\\dfrac{${+fx(c,2)}-${mu}}{${se}}=${fx(z,2)}$、$P(Z\\ge${fx(z,2)})=${fx(Q(z),4)}$。`};
});
def('n_binapx','正規分布と標本分布','二項分布の正規近似',R=>{
 const n=R.pick([100,400,900,2500]),p=R.pick([0.5,0.5,0.2,0.1]),mu=n*p,sd=Math.sqrt(n*p*(1-p));if(sd!==Math.round(sd))return null;
 const z=R.pick([1,1.5,2,2.5,1.2,0.8]),k=mu+z*sd;if(k!==Math.round(k))return null;
 return{question:`確率変数 $X$ が二項分布 $B(${n},\\,${p})$ に従う。正規分布で近似したとき、$P(X\\ge ${k})$ の近似値はいくらか(連続修正は行わない)。付表を用いて、${ONE}`,...mc(R,Q(z),[Q((k-mu)/(sd*sd)),1-Q(z),Q(z*2),Q(z/2)],{d:4,min:0,max:1}),
  explanation:`$E[X]=np=${mu}$、$V[X]=np(1-p)=${sd*sd}$、標準偏差 ${sd}。\n$z=\\dfrac{${k}-${mu}}{${sd}}=${fx(z,2)}$、$P(Z\\ge${fx(z,2)})=${fx(Q(z),4)}$。`};
});

// ===== 統計的推定 =====
def('e_ci_z','統計的推定','母平均の信頼区間(母分散既知)',R=>{
 const n=R.pick([16,25,36,64,100]),sd=R.pick([4,5,8,10,12,20]),m=R.ri(40,120),lv=R.pick([[0.95,1.96],[0.99,2.576],[0.90,1.645]]),se=sd/Math.sqrt(n),h=lv[1]*se;
 const F=v=>`[${fx(m-v,2)},\\ ${fx(m+v,2)}]`;const cs=[h,lv[1]*sd/n,(lv[1]===1.96?2.576:1.96)*se,lv[1]*se/2,lv[1]*sd*sd/n,lv[1]*sd/Math.sqrt(n)*2];
 const seen=new Set,c=cs.filter(v=>{const k=fx(v,2);if(seen.has(k))return false;seen.add(k);return true}).slice(0,5);while(c.length<5)c.push(h*(1+0.3*c.length));
 const ord=R.shuf(c),cho=ord.map(v=>'$'+F(v)+'$');
 return{question:`母標準偏差が ${sd} であることがわかっている正規母集団から、大きさ ${n} の標本を抽出したところ、標本平均は ${m} であった。母平均 $\\mu$ の ${lv[0]*100}% 信頼区間はどれか。${ONE}`,choices:cho,answer:ord.indexOf(h)+1,fixed:true,
  explanation:`$\\bar x\\pm z_{${fx((1-lv[0])/2,3).replace(/0+$/,'')}}\\dfrac{\\sigma}{\\sqrt n}=${m}\\pm${lv[1]}\\times\\dfrac{${sd}}{${Math.sqrt(n)}}=${m}\\pm${fx(h,2)}$。`};
});
def('e_ci_t','統計的推定','母平均の信頼区間(t分布)',R=>{
 const n=R.pick([9,16,25]),s=R.pick([3,4,5,6,8,10]),m=R.ri(20,80),t=tq(n-1,0.025),h=t*s/Math.sqrt(n),z=1.96*s/Math.sqrt(n);
 return{question:`正規母集団から大きさ ${n} の標本を抽出したところ、標本平均は ${m}、不偏分散の正の平方根 $s$ は ${s} であった。母平均の 95% 信頼区間の上限はいくらか。付表を用いて、${ONE}`,...mc(R,m+h,[m+z,m+tq(n,0.025)*s/Math.sqrt(n),m+tq(n-1,0.05)*s/Math.sqrt(n),m+t*s/n],{d:2}),
  explanation:`母分散が未知なので自由度 $${n}-1=${n-1}$ の $t$ 分布を用いる。$t_{0.025}(${n-1})=${t}$。\n上限 $=${m}+${t}\\times\\dfrac{${s}}{\\sqrt{${n}}}=${fx(m+h,2)}$。`};
});
def('e_ci_p','統計的推定','母比率の信頼区間',R=>{
 const n=R.pick([100,400,600,900,1600]),k=R.ri(2,8)*n/20,p=k/n,se=Math.sqrt(p*(1-p)/n),h=1.96*se;
 return{question:`ある意見について ${n} 人に調査したところ、${k} 人が賛成した。母比率の 95% 信頼区間の幅(上限−下限)はいくらか。${ONE}`,...mc(R,2*h,[h,2*1.96*Math.sqrt(p*(1-p))/n,2*1.645*se,2*2.576*se],{d:4,min:0}),
  explanation:`$\\hat p=${fx(p,3)}$、標準誤差 $\\sqrt{\\dfrac{\\hat p(1-\\hat p)}{n}}=${fx(se,4)}$。\n幅は $2\\times1.96\\times${fx(se,4)}=${fx(2*h,4)}$。`};
});
def('e_n','統計的推定','必要な標本の大きさ',R=>{
 if(R.r()<0.5){const e=R.pick([0.02,0.03,0.04,0.05]),v=1.96**2*0.25/(e*e),ans=Math.ceil(v);
  return{question:`母比率を信頼係数 95% で推定するとき、信頼区間の幅の半分(誤差)を ${e} 以下にしたい。母比率の見当がつかないとき、必要な標本の大きさの最小値はいくらか。${ONE}`,...mc(R,ans,[Math.ceil(1.96*0.25/(e*e)),Math.ceil(1.96**2*0.25/(e*e)/4),Math.ceil(1.645**2*0.25/(e*e)),Math.ceil(2.576**2*0.25/(e*e)),Math.ceil(1.96**2*0.5/(e*e))],{d:0,min:1}),
   explanation:`$1.96\\sqrt{\\dfrac{p(1-p)}{n}}\\le ${e}$。$p(1-p)$ は $p=0.5$ で最大 0.25 なので、$n\\ge\\left(\\dfrac{1.96}{${e}}\\right)^2\\times0.25=${fx(v,2)}$。切り上げて ${ans}。`}}
 const sd=R.pick([5,10,15,20]),e=R.pick([1,2,3,4]),v=(1.96*sd/e)**2,ans=Math.ceil(v);
 return{question:`母標準偏差が ${sd} の母集団について、母平均を信頼係数 95% で推定する。信頼区間の幅の半分を ${e} 以下にするために必要な標本の大きさの最小値はいくらか。${ONE}`,...mc(R,ans,[Math.ceil(1.96*sd/e),Math.ceil((1.96*sd/e/2)**2),Math.ceil((1.645*sd/e)**2),Math.ceil((2.576*sd/e)**2),Math.ceil(1.96*sd*sd/e)],{d:0,min:1}),
  explanation:`$1.96\\dfrac{${sd}}{\\sqrt n}\\le ${e}$ より $n\\ge\\left(\\dfrac{1.96\\times${sd}}{${e}}\\right)^2=${fx(v,2)}$。切り上げて ${ans}。`};
});

// ===== 仮説検定 =====
def('h_z','仮説検定','母平均の検定(統計量と結論)',R=>{
 const n=R.pick([16,25,36,64,100]),sd=R.pick([4,5,8,10,12]),mu=R.ri(10,20)*5,z=R.pick([1.25,1.5,1.75,2,2.25,2.5,2.75,3]),se=sd/Math.sqrt(n),xb=mu+z*se*R.pick([1,-1]);
 if(Math.abs(xb*100-Math.round(xb*100))>1e-6)return null;
 const al=R.pick([[0.05,1.96],[0.01,2.576]]),rej=Math.abs(z)>al[1],zz=(xb-mu)/se;
 const zw=(xb-mu)/sd,zw2=(xb-mu)/(sd/n);const opts=[[zz,rej],[zz,!rej],[zw,Math.abs(zw)>al[1]],[zw2,Math.abs(zw2)>al[1]],[zw,!(Math.abs(zw)>al[1])]];
 const seen=new Set,o=opts.filter(x=>{const k=fx(x[0],2)+x[1];if(seen.has(k))return false;seen.add(k);return true}),lab=x=>`$z=${fx(x[0],2)}$ で、帰無仮説は${x[1]?'棄却される':'棄却されない'}`;
 return{question:`母標準偏差が ${sd} の正規母集団について、帰無仮説 $H_0:\\mu=${mu}$、対立仮説 $H_1:\\mu\\ne${mu}$ を有意水準 ${al[0]*100}% で検定する。大きさ ${n} の標本の標本平均は ${+fx(xb,2)} であった。検定統計量の値と結論の組合せとして${ONE}`,...mt(R,lab(o[0]),o.slice(1).map(lab)),
  explanation:`$z=\\dfrac{\\bar x-\\mu_0}{\\sigma/\\sqrt n}=\\dfrac{${+fx(xb,2)}-${mu}}{${sd}/${Math.sqrt(n)}}=${fx(zz,2)}$。\n両側 ${al[0]*100}% の棄却域は $|z|>${al[1]}$ なので、帰無仮説は${rej?'棄却される':'棄却されない'}。`};
});
def('h_pval','仮説検定','P値の計算',R=>{
 const z=R.ri(100,300)/100,two=R.r()<0.6,p=two?2*Q(z):Q(z);
 return{question:`標準正規分布を用いた${two?'両側':'片側(上側)'}検定で、検定統計量の値が $z=${fx(z,2)}$ であった。P値はいくらか。付表を用いて、${ONE}`,...mc(R,p,[two?Q(z):2*Q(z),1-Q(z),1-2*Q(z),Q(z)/2],{d:4,min:0,max:1}),
  explanation:`付表より $P(Z\\ge${fx(z,2)})=${fx(Q(z),4)}$。${two?`両側検定なので2倍して ${fx(p,4)}。`:`片側検定なのでそのまま ${fx(p,4)}。`}`};
});
def('h_prop','仮説検定','母比率の検定',R=>{
 const n=R.pick([100,400,900,2500]),p0=0.5,se=Math.sqrt(p0*(1-p0)/n),z=R.pick([1,1.5,2,2.5,3,-2,-1.5]),ph=p0+z*se;
 return{question:`あるコインについて、帰無仮説 $H_0:p=0.5$ を検定する。${n} 回投げたところ、表が ${Math.round(ph*n)} 回出た。検定統計量 $z=\\dfrac{\\hat p-p_0}{\\sqrt{p_0(1-p_0)/n}}$ の値はいくらか。${ONE}`,...mc(R,z,[z/2,z*2,(ph-p0)/Math.sqrt(p0*(1-p0))*10,(ph-p0)/(p0*(1-p0)/n)/100],{d:2}),
  explanation:`$\\hat p=${fx(ph,3)}$、$\\sqrt{0.5\\times0.5/${n}}=${fx(se,4)}$。$z=\\dfrac{${fx(ph,3)}-0.5}{${fx(se,4)}}=${fx(z,2)}$。`};
});
def('h_gof','仮説検定','適合度のカイ二乗検定',R=>{
 const k=R.pick([4,6]),N=k*R.pick([10,20,30]),e=N/k;let o=Array(k).fill(e);
 for(let t=0;t<k;t++){const i=R.ri(0,k-1),j=R.ri(0,k-1),d=R.ri(1,Math.max(1,e/4|0));if(o[i]-d>0){o[i]-=d;o[j]+=d}}
 const x2=sum(o.map(v=>(v-e)**2/e)),crit=cq(k-1,0.05);if(x2===0)return null;
 return{fig:tbl(['区分',...o.map((_,i)=>i+1),'計'],[['観測度数',...o,N]]),question:`${k===6?'サイコロを':'4つの区分に分類する試行を'} ${N} 回行った結果が次の表である。「各区分の出る確率はすべて等しい」という帰無仮説の適合度検定の検定統計量 $\\chi^2$ の値と、有意水準 5% での結論の組合せとして${ONE}`,
  ...mt(R,`$\\chi^2=${fx(x2,2)}$ で、帰無仮説は${x2>crit?'棄却される':'棄却されない'}`,[`$\\chi^2=${fx(x2,2)}$ で、帰無仮説は${x2>crit?'棄却されない':'棄却される'}`,`$\\chi^2=${fx(x2*e,2)}$ で、帰無仮説は棄却される`,`$\\chi^2=${fx(Math.sqrt(x2),2)}$ で、帰無仮説は棄却されない`,`$\\chi^2=${fx(x2/k,2)}$ で、帰無仮説は棄却されない`]),
  explanation:`期待度数は各 ${e}。$\\chi^2=\\sum\\dfrac{(O-E)^2}{E}=${fx(x2,2)}$。\n自由度 ${k}-1=${k-1}、$\\chi^2_{0.05}(${k-1})=${crit}$ なので${x2>crit?'棄却される':'棄却されない'}。`};
});
def('h_ind','仮説検定','分割表の独立性の検定',R=>{
 const a=R.ri(10,40),b=R.ri(10,40),c=R.ri(10,40),d=R.ri(10,40),N=a+b+c+d,r1=a+b,r2=c+d,c1=a+c,c2=b+d;
 const E=[r1*c1/N,r1*c2/N,r2*c1/N,r2*c2/N],O=[a,b,c,d],x2=sum(O.map((o,i)=>(o-E[i])**2/E[i]));
 const ask=R.pick(['E','X']);
 const fig=tbl(['','賛成','反対','計'],[['男性',a,b,r1],['女性',c,d,r2],['計',c1,c2,N]]);
 if(ask==='E')return{fig,question:`次の分割表について、性別と賛否が独立であるという帰無仮説の下で、「男性・賛成」のセルの期待度数はいくらか。${ONE}`,...mc(R,E[0],[N/4,r1/2,c1/2,a*c1/N],{d:2,min:0}),
  explanation:`期待度数 $=\\dfrac{\\text{行の合計}\\times\\text{列の合計}}{\\text{総数}}=\\dfrac{${r1}\\times${c1}}{${N}}=${fx(E[0],2)}$。`};
 return{fig,question:`次の分割表について、性別と賛否の独立性のカイ二乗検定(補正なし)を行う。検定統計量 $\\chi^2$ の値はいくらか。${ONE}`,...mc(R,x2,[x2/2,x2*2,sum(O.map((o,i)=>Math.abs(o-E[i])/E[i])),sum(O.map((o,i)=>(o-E[i])**2/o))],{d:2,min:0}),
  explanation:`期待度数は ${E.map(v=>fx(v,2)).join(', ')}。\n$\\chi^2=\\sum\\dfrac{(O-E)^2}{E}=${fx(x2,2)}$(自由度1、5%の棄却点は 3.841 なので${x2>3.841?'棄却される':'棄却されない'})。`};
});

// ===== 回帰分析と分散分析 =====
def('g_pred','回帰分析と分散分析','回帰直線と予測値',R=>{
 const r=R.pick([0.4,0.5,0.6,0.75,0.8,-0.5,-0.6]),sx=R.pick([2,4,5,10]),sy=R.pick([4,5,8,10,20]),mx=R.ri(10,50),my=R.ri(30,100),b=r*sy/sx,x0=mx+R.pick([-2,2,3,5]),ans=my+b*(x0-mx);
 return{question:`変数 $x$ の平均は ${mx}、標準偏差は ${sx}、変数 $y$ の平均は ${my}、標準偏差は ${sy}、$x$ と $y$ の相関係数は ${r} である。$y$ を $x$ に回帰した最小二乗回帰直線による、$x=${x0}$ のときの $y$ の予測値はいくらか。${ONE}`,...mc(R,ans,[my+r*sx/sy*(x0-mx),my+r*(x0-mx),my+b*x0,my+r*sy*(x0-mx)],{d:2}),
  explanation:`傾き $b=r\\dfrac{s_y}{s_x}=${r}\\times\\dfrac{${sy}}{${sx}}=${fx(b,3)}$。回帰直線は $(\\bar x,\\bar y)$ を通るので\n$\\hat y=${my}+${fx(b,3)}\\times(${x0}-${mx})=${fx(ans,2)}$。`};
});
def('g_out','回帰分析と分散分析','回帰分析の出力表の読み取り',R=>{
 const n=R.ri(12,32),df=n-2,b=R.ri(20,200)/100*R.pick([1,1,-1]),se=R.ri(8,60)/100,a=R.ri(50,500)/10,sea=R.ri(10,80)/10,t=b/se,ta=a/sea,r2=t*t/(t*t+df);
 const ask=R.pick(['t','ci','r2']);
 const fig=tbl(['','Estimate','Std. Error','t value','Pr(>|t|)'],[['(Intercept)',fx(a,2),fx(sea,2),fx(ta,3),pfmt(tp2(ta,df))],['x',fx(b,2),fx(se,2),ask==='t'?'(ア)':fx(t,3),pfmt(tp2(t,df))]],'')+`<div class="meta">Residual standard error: ${fx(R.ri(10,90)/10,2)} on ${df} degrees of freedom<br>Multiple R-squared: ${ask==='r2'?'(イ)':fx(r2,4)}</div>`;
 const stem=`ある変数 $y$ を変数 $x$ に回帰した(データ数 $n=${n}$)。次の表はその出力結果の一部である。`;
 if(ask==='t')return{fig,question:`${stem}表中の(ア)に入る値はいくらか。${ONE}`,...mc(R,t,[b*se,se/b,b/se/Math.sqrt(n),b/(se*se)],{d:3}),
  explanation:`t値 $=\\dfrac{\\text{推定値}}{\\text{標準誤差}}=\\dfrac{${fx(b,2)}}{${fx(se,2)}}=${fx(t,3)}$。`};
 if(ask==='r2')return{fig,question:`${stem}単回帰では、傾きのt値 $t$ と決定係数 $R^2$ の間に $R^2=\\dfrac{t^2}{t^2+(n-2)}$ の関係がある。(イ)に入る値はいくらか。${ONE}`,...mc(R,r2,[t*t/(t*t+n),Math.abs(t)/(Math.abs(t)+df),t*t/df,Math.sqrt(r2)],{d:4,min:0,max:1}),
  explanation:`$R^2=\\dfrac{${fx(t,3)}^2}{${fx(t,3)}^2+${df}}=${fx(r2,4)}$。`};
 if(!TB.t.df.includes(df))return null;const tc=tq(df,0.025),lo=b-tc*se;
 return{fig,question:`${stem}$x$ の係数(傾き)の 95% 信頼区間の下限はいくらか。付表を用いて、${ONE}`,...mc(R,lo,[b-1.96*se,b-tq(df,0.05)*se,b-tc*se/Math.sqrt(n),b-tq(n-1,0.025)*se],{d:3}),
  explanation:`自由度 $n-2=${df}$ の $t$ 分布を用いる。$t_{0.025}(${df})=${tc}$。\n下限 $=${fx(b,2)}-${tc}\\times${fx(se,2)}=${fx(lo,3)}$。`};
});
def('g_anova','回帰分析と分散分析','分散分析表の穴埋め',R=>{
 const k=R.pick([3,4]),m=R.pick([5,6,8,10]),N=k*m,d1=k-1,d2=N-k,msw=R.ri(4,30),F=R.ri(10,80)/10,msb=F*msw,ssb=msb*d1,ssw=msw*d2;
 if(ssb!==Math.round(ssb*10)/10)return null;
 const fig=tbl(['要因','平方和','自由度','平均平方','F値'],[['水準間',fx(ssb,1),'(ア)',fx(msb,2),'(イ)'],['残差',fx(ssw,1),d2,fx(msw,2),''],['全体',fx(ssb+ssw,1),N-1,'','']]);
 const crit=TB.f05.v[TB.f05.df2.indexOf(d2)]?.[TB.f05.df1.indexOf(d1)];
 if(R.r()<0.5||!crit)return{fig,question:`${k}つの水準について各 ${m} 個のデータを取り、一元配置分散分析を行った。次の分散分析表の(イ)に入るF値はいくらか。${ONE}`,...mc(R,F,[ssb/ssw,msw/msb,ssb/msw,msb/(ssw/(N-1))],{d:2,min:0}),
  explanation:`(ア)の自由度は ${k}−1=${d1}。平均平方 $=${fx(ssb,1)}/${d1}=${fx(msb,2)}$。\n$F=\\dfrac{${fx(msb,2)}}{${fx(msw,2)}}=${fx(F,2)}$。`};
 return{fig,question:`${k}つの水準について各 ${m} 個のデータを取り、一元配置分散分析を行った結果が次の表である。有意水準 5% で「水準間で母平均に差はない」という帰無仮説を検定するとき、F値と棄却限界値の組合せとして${ONE}`,
  ...mt(R,`F値 ${fx(F,2)}、棄却限界値 ${crit}(${F>crit?'棄却される':'棄却されない'})`,[`F値 ${fx(F,2)}、棄却限界値 ${crit}(${F>crit?'棄却されない':'棄却される'})`,`F値 ${fx(ssb/ssw,2)}、棄却限界値 ${crit}(棄却されない)`,`F値 ${fx(F,2)}、棄却限界値 ${TB.f05.v[TB.f05.df2.indexOf(d2)]?.[TB.f05.df1.indexOf(d1)+1]??'3.00'}(棄却される)`,`F値 ${fx(msw/msb,2)}、棄却限界値 ${crit}(棄却されない)`]),
  explanation:`$F=\\dfrac{${fx(msb,2)}}{${fx(msw,2)}}=${fx(F,2)}$。自由度 $(${d1},\\,${d2})$ のF分布の上側5%点は ${crit}。${F>crit?'F値の方が大きいので棄却される':'F値の方が小さいので棄却されない'}。`};
});
def('g_r2','回帰分析と分散分析','決定係数と相関係数',R=>{
 const st=R.ri(10,40)*10,r2=R.pick([0.36,0.49,0.64,0.81,0.25,0.5,0.75]),se=st*(1-r2),neg=R.r()<0.4;
 if(R.r()<0.5)return{question:`単回帰分析で、総平方和が ${st}、残差平方和が ${fx(se,1)} であった。決定係数 $R^2$ はいくらか。${ONE}`,...mc(R,r2,[1-r2,se/st,Math.sqrt(r2),(st-se)/se],{d:2,min:0,max:1}),
  explanation:`$R^2=1-\\dfrac{\\text{残差平方和}}{\\text{総平方和}}=1-\\dfrac{${fx(se,1)}}{${st}}=${fx(r2,2)}$。`};
 const r=Math.sqrt(r2)*(neg?-1:1);
 return{question:`単回帰分析の決定係数が ${r2} で、推定された傾きが${neg?'負':'正'}であった。$x$ と $y$ の相関係数はいくらか。${ONE}`,...mc(R,r,[-r,r2*(neg?-1:1),r2,1-r2],{d:2,min:-1,max:1}),
  explanation:`単回帰では $R^2=r^2$。$r=\\pm\\sqrt{${r2}}=\\pm${fx(Math.sqrt(r2),2)}$。相関係数の符号は傾きの符号と一致するので ${fx(r,2)}。`};
});

// ---------- 公開API ----------
function generate(id,seed){
 const g=G.find(x=>x.id===id);if(!g)return null;
 for(let t=0;t<60;t++){const s=(seed+t*7919)>>>0,q=g.make(mk(rng(s)));
  if(q&&q.choices.length===5&&new Set(q.choices).size===5)return{...q,id:`gen:${id}:${s}`,tpl:'gen:'+id,field:g.field,title:g.title,source:GSRC,gen:true}}
 return null;
}
window.STAT2_GEN={list:G.map(({id,field,title})=>({id,field,title})),generate,newSeed:()=>Math.random()*4294967296>>>0,Q};
})();
