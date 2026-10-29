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
const pfmt=p=>p<0.0001?'&lt; 0.0001':fx(p,4);

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
const CMB=[[1,0,0,'Ⅰのみ正しい'],[0,1,0,'Ⅱのみ正しい'],[0,0,1,'Ⅲのみ正しい'],[1,1,0,'ⅠとⅡのみ正しい'],[1,0,1,'ⅠとⅢのみ正しい'],[0,1,1,'ⅡとⅢのみ正しい'],[1,1,1,'ⅠとⅡとⅢはすべて正しい'],[0,0,0,'ⅠとⅡとⅢはすべて誤りである']];
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

// =====================================================================
// 過去問(2021年6月 問1〜問19)の出題形式を分析して追加した生成器
// 問題文・数値・題材は独自に作成しており、過去問の文面は使っていない
// =====================================================================
const frac=(n,d)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d)||1;n/=g;d/=g;return d===1?String(n):(n<0?'-':'')+`\\frac{${Math.abs(n)}}{${d}}`};
// (ア)(イ)(ウ)…の組合せ選択肢
const KANA=['ア','イ','ウ','エ'];
const pt=a=>a.map((v,i)=>`(${KANA[i]}) ${v}`).join('　');
function parts(R,ans,wrongs){const seen=new Set([pt(ans)]),w=[];for(const x of wrongs){const s=pt(x);if(!seen.has(s)){seen.add(s);w.push(s)}}return mt(R,pt(ans),w)}
// 付表から上側確率がpに最も近いzを探す
function zinv(p){let b=0,e=9;for(let i=0;i<350;i++){const z=i/100,d=Math.abs(Q(z)-p);if(d<e){e=d;b=z}}return b}
function nice(lo,hi){const r=(hi-lo)/4||1,m=10**Math.floor(Math.log10(r)),s=[1,2,2.5,5,10].map(k=>k*m).find(k=>k>=r);return{lo:Math.floor(lo/s)*s,hi:Math.ceil(hi/s)*s,s}}
// 目盛り付き散布図
function svgScatterAx(pts,xl,yl,title=''){
 const X=nice(Math.min(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[0]))),Y=nice(Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[1])));
 const L=46,B=36,T=30,sx=v=>L+(v-X.lo)/(X.hi-X.lo)*(W-L-MR),sy=v=>H-B-(v-Y.lo)/(Y.hi-Y.lo)*(H-B-T);
 let s=`<line class="ax" x1="${L}" y1="${H-B}" x2="${W-MR}" y2="${H-B}"/><line class="ax" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/>`;
 for(let v=X.lo;v<=X.hi+1e-9;v+=X.s)s+=`<line class="gr" x1="${sx(v)}" y1="${T}" x2="${sx(v)}" y2="${H-B}"/>`+tx(sx(v),H-B+13,+fx(v,2),'middle','sm');
 for(let v=Y.lo;v<=Y.hi+1e-9;v+=Y.s)s+=`<line class="gr" x1="${L}" y1="${sy(v)}" x2="${W-MR}" y2="${sy(v)}"/>`+tx(L-4,sy(v)+3,+fx(v,2),'end','sm');
 return svg(s+pts.map(p=>`<circle class="pt" cx="${sx(p[0])}" cy="${sy(p[1])}" r="2.8"/>`).join('')+tx((L+W-MR)/2,H-4,xl,'middle','sm')+tx(L-4,T-10,yl,'end','sm')+tx((L+W-MR)/2,14,title,'middle'));
}
function corr(xs,ys){const mx=mean(xs),my=mean(ys);return sum(xs.map((x,i)=>(x-mx)*(ys[i]-my)))/Math.sqrt(sum(xs.map(x=>(x-mx)**2))*sum(ys.map(y=>(y-my)**2)))}
const sdv=a=>{const m=mean(a);return Math.sqrt(mean(a.map(v=>(v-m)**2)))};
const nrm=R=>(R.r()+R.r()+R.r()+R.r()-2)*1.73;// 近似的な標準正規乱数

// ----- データの基礎 -----
// 問1型: 平均値と中央値の大小から分布の歪みを判断する
def('d_skew','データの基礎','平均値・中央値と分布の歪み',R=>{
 const ctx=R.pick([['ある地域の世帯の年間所得','万円',1,400,900],['ある国の過去40年間の年間物価上昇率','%',1,0.5,3],['ある部品が故障するまでの時間','時間',1,200,800],['平易なある試験の得点','点',-1,70,90],['ある病院の入院患者の在院日数','日',1,5,20],['ある定年制度のある職場の退職時年齢','歳',-1,55,62]]);
 const md=ctx[3]+R.r()*(ctx[4]-ctx[3]),d=(R.ri(15,60)/100)*md*ctx[2]*(ctx[1]==='歳'?0.05:1),mn=md+d,dg=ctx[1]==='%'?3:1;
 const C=['分布は右に長い裾をもち、歪度は正の値をとる。','分布は右に長い裾をもち、歪度は負の値をとる。','分布は左に長い裾をもち、歪度は正の値をとる。','分布は左に長い裾をもち、歪度は負の値をとる。','分布は左右対称であり、歪度は0である。'];
 const a=ctx[2]>0?1:4;
 return{question:`${ctx[0]}を調べたところ、平均値は ${fx(mn,dg)}${ctx[1]}、中央値は ${fx(md,dg)}${ctx[1]} であった。この分布の形と歪度について、${ONE}`,choices:C,answer:a,
  explanation:`平均値は外れた大きな(小さな)値に引っ張られる。平均値${a===1?'>':'<'}中央値なので、${a===1?'右':'左'}に長い裾をもつ分布で、歪度は${a===1?'正':'負'}になる。`};
});

// ----- 2変数・時系列 -----
// 問2型: 各年の値から年平均変化率(幾何平均)を求める。各年の変化率の算術平均が典型的な誤答
def('b_growth2','2変数・時系列','年次変化率の平均(幾何平均)',R=>{
 const n=4,v=[R.ri(80,300)];for(let i=0;i<n;i++)v.push(Math.round(v[i]*(1+R.ri(2,30)/100)));
 const ys=R.ri(1990,2015),g=(v[n]/v[0])**(1/n)-1,ar=mean(v.slice(1).map((x,i)=>x/v[i]-1));if(Math.abs(g-ar)<0.0015)return null;
 const what=R.pick([['ある遊園地の年間入場者数','万人'],['ある市の観光客数(1月)','千人'],['ある会社の売上高','億円']]);
 return{question:`${what[0]}は、${v.map((x,i)=>`${ys+i}年に ${x}${what[1]}`).join('、')}であった。${ys}年から${ys+n}年における年次変化率の平均(単位:%)として、${ONE}`,
  ...mc(R,g*100,[ar*100,(v[n]/v[0]-1)/n*100,((v[n]/v[0])**(1/(n+1))-1)*100,((v[n]/v[0])**(1/(n-1))-1)*100],{d:1,min:0,fmt:x=>fx(x,1)+'%'}),
  explanation:`毎年一定の率 $g$ で変化したとみなすと $(1+g)^{${n}}=\\dfrac{${v[n]}}{${v[0]}}$。\n$g=\\left(\\dfrac{${v[n]}}{${v[0]}}\\right)^{1/${n}}-1\\approx${fx(g*100,1)}\\%$。各年の変化率の算術平均 ${fx(ar*100,1)}% は誤り。`};
});
// 問4型: 基準年=100の指数のグラフと基準年の実数から、実数の増減を求める
def('b_idxabs','2変数・時系列','指数グラフから実数の増減を読む',R=>{
 const ctx=R.pick([['自動車の保有台数','台'],['宿泊施設の延べ宿泊者数','人'],['郵便物の取扱数','通'],['公衆電話の設置台数','台']]);
 const total=R.ri(20,90)*1e6+R.ri(0,999999),share=R.pick([5,8,10,12,15,20]),y0=R.pick([1995,2000,2005]),k=7,step=R.pick([3,4]);
 let I=[100];const trend=R.pick([-1,-1,1]);for(let i=1;i<k;i++)I.push(Math.round(I[i-1]*(1+trend*R.ri(1,9)/100+(R.r()-0.5)*0.03)));
 const ie=I[k-1],base=total*share/100,ans=base*(ie-100)/100/1e4,dir=ans<0?'減少':'増加',A=Math.abs(ans);if(A<5)return null;
 const fig=svgLine(I.map((_,i)=>String(y0+i*step)),I);
 return{fig,question:`次の図は、ある県の${ctx[0]}を ${y0}年を100とした指数で表したものである。${y0}年の全国の${ctx[0]}は ${total.toLocaleString()}${ctx[1]} であり、この県はそのうち ${share}% を占めていた。${y0}年から${y0+(k-1)*step}年にかけてのこの県の${ctx[0]}について、${ONE}`,
  ...mc(R,A,[Math.abs(total*(ie-100)/100/1e4),base*ie/100/1e4,Math.abs(base*(ie-100)/ie/1e4),Math.abs((ie-100)*share/100)],{d:0,min:0,fmt:x=>`${fx(x,0)}万${ctx[1]}程度${dir}した`}),
  explanation:`${y0}年のこの県の値は ${total.toLocaleString()}×${share/100}≈${fx(base/1e4,1)}万${ctx[1]}。指数が ${ie} なので変化は\n${fx(base/1e4,1)}万×$\\dfrac{${ie}-100}{100}$≈${fx(ans,0)}万${ctx[1]}。`};
});
// 問5〔2〕型: 1次変換による共分散・相関係数の変化
def('b_lincov','2変数・時系列','1次変換と共分散・相関係数',R=>{
 const b=R.pick([2,3,4,5,-2,0.5]),c0=R.pick([50,60,100]),k=R.pick([90,98,120,30]),bb=b===0.5?'\\frac{1}{2}':b;
 const fr=x=>Number.isInteger(x)?String(x):frac(1,Math.round(1/x)),inv=fr(1/b),sg=b>0?'1':'-1';
 const ctx=R.pick([['ある競技では、記録 $x$(m)から得点を','記録','得点','別の評価点 $z$'],['ある工場では、温度 $x$(℃)から指標を','温度','指標','品質スコア $z$']]);
 const ans=[inv,sg];
 const W2=[[fr(b),sg],[inv,inv],[fr(b),'1'],[fr(1/(b*b)),sg],[inv,b>0?'-1':'1'],[fr(b*b),sg]].map(([a,c])=>[a,c].map(s=>`$${s}$`));
 return{question:`${ctx[0]} $y=${c0}${b<0?'':'+'}${bb}(x-${k})$ により計算する。このとき、${ctx[1]} $x$ と${ctx[3]} の共分散は、${ctx[2]} $y$ と $z$ の共分散の(ア)倍となる。また、$x$ と $z$ の相関係数は、$y$ と $z$ の相関係数の(イ)倍となる。(ア)と(イ)に当てはまる数値の組合せとして、${ONE}`,
  ...parts(R,ans.map(s=>`$${s}$`),W2),
  explanation:`$x=${k}+\\dfrac{y-${c0}}{${bb}}$ なので $\\mathrm{Cov}(x,z)=\\dfrac{1}{${bb}}\\mathrm{Cov}(y,z)$。\n相関係数は正の1次変換で変わらず、負の係数なら符号だけが反転する。よって(イ)は $${sg}$。`};
});
// 問6型: 合計・不偏分散・積和から相関係数を求める
def('b_corrsum','2変数・時系列','合計・不偏分散・積和から相関係数',R=>{
 const n=R.pick([8,10,12]),r0=R.pick([0.5,0.7,0.85,0.9,-0.6,-0.8]);
 const xs=[],ys=[];for(let i=0;i<n;i++){const z=nrm(R),e=nrm(R);xs.push(Math.round((30+8*z)*10)/10);ys.push(Math.round((12+3*(r0*z+Math.sqrt(1-r0*r0)*e))*10)/10)}
 const Sx=sum(xs),Sy=sum(ys),Sxy=sum(xs.map((x,i)=>x*ys[i])),ux=sum(xs.map(x=>(x-Sx/n)**2))/(n-1),uy=sum(ys.map(y=>(y-Sy/n)**2))/(n-1);
 const sxx=+fx(ux,1),syy=+fx(uy,1),sx=+fx(Sx,1),sy=+fx(Sy,1),sxy=+fx(Sxy,1),cov=(sxy-sx*sy/n)/(n-1),r=cov/Math.sqrt(sxx*syy);if(Math.abs(r)>0.99)return null;
 return{question:`${R.pick(['ある店舗の','ある学校の','ある地域の'])} ${n} 件のデータについて、${R.pick(['気温 $x$ と来客数 $y$','勉強時間 $x$ と得点 $y$','広告費 $x$ と売上 $y$'])} を調べたところ、次の結果が得られた。\n$\\sum x_i=${sx},\\ s_x^2=${sxx},\\ \\sum y_i=${sy},\\ s_y^2=${syy},\\ \\sum x_iy_i=${sxy}$\nただし $s_x^2, s_y^2$ はそれぞれの不偏分散である。$x$ と $y$ の相関係数はいくらか。${ONE}`,
  ...mc(R,r,[cov,(sxy-sx*sy/n)/n/Math.sqrt(sxx*syy),r*r*Math.sign(r),cov/sxx],{d:2}),
  explanation:`偏差積和 $=\\sum x_iy_i-\\dfrac{(\\sum x_i)(\\sum y_i)}{n}=${fx(sxy-sx*sy/n,2)}$。不偏共分散 $=${fx(sxy-sx*sy/n,2)}/${n-1}=${fx(cov,2)}$。\n$r=\\dfrac{${fx(cov,2)}}{\\sqrt{${sxx}\\times${syy}}}\\approx${fx(r,2)}$。分母の $n-1$ はそろえること。`};
});
// 問5〔1〕型: 2つの散布図の分散・相関・回帰直線の切片(組合せ)
def('b_scat2','2変数・時系列','2つの散布図の比較(組合せ)',R=>{
 const N=40,mk2=(r,mx,sx,my,sy)=>{const p=[];for(let i=0;i<N;i++){const z=nrm(R),e=nrm(R);p.push([+(mx+sx*z).toFixed(1),+(my+sy*(r*z+Math.sqrt(1-r*r)*e)).toFixed(1)])}return p};
 const big=R.r()<0.5,A=big?mk2(0.9,50,15,50,3):mk2(0.9,50,3,50,12),Bp=mk2(R.pick([0.1,0.2,0.3]),87,0.8,90,9);
 // 切片の符号がランダムになるようYを平行移動し、半分の確率で図1と図2を入れ替える
 const b0=corr(A.map(p=>p[0]),A.map(p=>p[1]))*sdv(A.map(p=>p[1]))/sdv(A.map(p=>p[0])),a0=mean(A.map(p=>p[1]))-b0*mean(A.map(p=>p[0])),sh=R.pick([1,-1])*R.ri(5,40)-a0;
 A.forEach(p=>p[1]=+(p[1]+sh).toFixed(1));
 if(R.r()<0.4){const T2=A.map(p=>[...p]);A.splice(0,A.length,...Bp.map(p=>[...p]));Bp.splice(0,Bp.length,...T2)}
 const ax=A.map(p=>p[0]),ay=A.map(p=>p[1]),rA=corr(ax,ay),rB=corr(Bp.map(p=>p[0]),Bp.map(p=>p[1])),b=rA*sdv(ay)/sdv(ax),a=mean(ay)-b*mean(ax);
 const t=[sdv(ax)>sdv(ay),rA>rB,a>0];
 const fig=`<div class="figs">${svgScatterAx(A,'変数X','変数Y','図1')}${svgScatterAx(Bp,'変数U','変数V','図2')}</div>`;
 return{fig,question:`ある調査で得られた4つの変数について、XとYの散布図(図1)と、UとVの散布図(図2)を作成した。\nⅠ. XとYでは、Xの方が分散が大きい。\nⅡ. 図1の2変数の相関係数は、図2の2変数の相関係数より大きい。\nⅢ. 図1で、YをXに回帰した回帰直線の切片は正の値をとる。\n${CMBQ}`,...combo(R,t),
  explanation:`図1: 標準偏差 X≈${fx(sdv(ax),1)}、Y≈${fx(sdv(ay),1)}、相関係数≈${fx(rA,2)}、回帰直線 $\\hat y=${fx(a,1)}+${fx(b,3)}x$。図2の相関係数≈${fx(rB,2)}。\n軸の目盛りの幅で散らばりを比べ、切片は $x=0$ まで直線を延ばして判断する。Ⅰは${TF(t[0])}、Ⅱは${TF(t[1])}、Ⅲは${TF(t[2])}。`};
});

// ----- 確率 -----
// 問9型: 誕生日問題(式を選ぶ)
def('p_bday','確率','誕生日問題(式の選択)',R=>{
 const c=R.pick([[365,R.pick([20,23,25,30,40]),'1年を365日とし、人がそれぞれの日に生まれる確率はすべて等しいとする','同じ誕生日の人'],[12,R.pick([4,5,6]),'人がそれぞれの月に生まれる確率はすべて等しいとする','同じ誕生月の人'],[100,R.pick([10,15,20]),'1から100までの番号が書かれたくじを、元に戻しながら引くとする','同じ番号']]);
 const[d,n,pre,what]=c;let p=1;for(let i=0;i<n;i++)p*=(d-i)/d;
 const opts=[`$1-\\dfrac{${d}!}{${d}^{${n}}\\times${d-n}!}$`,`$\\left(\\dfrac{${d-1}}{${d}}\\right)^{${n}}$`,`$1-\\left(\\dfrac{${d-1}}{${d}}\\right)^{${n-1}}$`,`$1-\\left(\\dfrac{${d-1}}{${d}}\\right)^{${n}}$`,`$\\dfrac{${d}!}{${d}^{${n-1}}\\times${d-n}!}$`];
 const q=d===100?`${pre}。${n}回引いたとき、${what}が2回以上出る確率`:`${pre}。${n}人が無作為に集められたとき、この中に${what}が存在する確率`;
 return{question:`${q}はいくらか。${ONE}`,...mt(R,opts[0],opts.slice(1)),
  explanation:`余事象「全員が異なる」の確率は $\\dfrac{${d}}{${d}}\\times\\dfrac{${d-1}}{${d}}\\times\\cdots\\times\\dfrac{${d-n+1}}{${d}}=\\dfrac{${d}!}{${d}^{${n}}\\,${d-n}!}\\approx${fx(p,4)}$。\nよって求める確率は $1-${fx(p,4)}=${fx(1-p,4)}$。`};
});

// ----- 確率変数と確率分布 -----
// 問8型: 同時確率表から相関係数と独立性
def('r_joint','確率変数と確率分布','同時確率表と相関・独立性',R=>{
 const lab=(r,ind)=>`相関係数は $${r}$ であり、互いに${ind?'独立である':'独立ではない'}`;
 if(R.r()<0.5){
  const a=R.pick([1,2,3]),b=4-a,q=a+b,sq=R.r()<0.5;// (±1,0) に a/8、(0,±1) に b/8 ずつ
  const f=(x,y)=>(y===0&&x!==0)?frac(a,2*q):(x===0&&y!==0)?frac(b,2*q):'0';
  const fig=tbl(['$x\\backslash y$','$-1$','$0$','$1$'],[-1,0,1].map(x=>[`$${x}$`,...[-1,0,1].map(y=>`$${f(x,y)}$`)]),'$X$ と $Y$ の同時確率関数 $f(x,y)$');
  const V=sq?'X^2':'X',U=sq?'Y^2':'Y',ans=sq?lab('-1',false):lab('0',false);
  return{fig,question:`2つの離散型確率変数 $X, Y$ の同時確率関数 $f(x,y)=P(X=x,Y=y)$ が次の表で与えられている。確率変数 $${V}$ と $${U}$ の相関係数と独立性について、${ONE}`,
   ...mt(R,ans,[lab('0',true),sq?lab('0',false):lab('-1',false),lab('-\\frac{1}{2}',false),lab('-\\frac{1}{4}',false),lab('1',false)]),
   explanation:sq?`$X^2=1$ のとき必ず $Y=0$、$X^2=0$ のとき必ず $Y^2=1$ なので $Y^2=1-X^2$。完全な負の直線関係なので相関係数は $-1$ で、独立ではない。`:`$E[X]=E[Y]=0$、どのセルでも $xy=0$ なので $E[XY]=0$、$\\mathrm{Cov}(X,Y)=0$。しかし $f(0,0)=0\\ne P(X=0)P(Y=0)$ なので独立ではない。無相関でも独立とは限らない。`};
 }
 const ind=R.r()<0.4;let p;
 if(ind){const px=R.pick([0.2,0.4,0.5,0.6]),py=R.pick([0.3,0.5,0.6,0.8]);p=[[(1-px)*(1-py),(1-px)*py],[px*(1-py),px*py]]}
 else{let c;do{c=[R.ri(1,7),R.ri(1,7),R.ri(1,7)];}while(sum(c)>=19);p=[[c[0]/20,c[1]/20],[c[2]/20,(20-sum(c))/20]]}
 const px=p[1][0]+p[1][1],py=p[0][1]+p[1][1],cv=p[1][1]-px*py,r=cv/Math.sqrt(px*(1-px)*py*(1-py));if(!ind&&Math.abs(r)<0.03)return null;
 const fig=tbl(['$x\\backslash y$','$0$','$1$'],[0,1].map(x=>[`$${x}$`,...[0,1].map(y=>fx(p[x][y],2))]),'$X$ と $Y$ の同時確率関数');
 const rv=fx(r,2);
 return{fig,question:`2つの確率変数 $X, Y$ はそれぞれ0か1の値をとり、同時確率関数が次の表で与えられている。$X$ と $Y$ の相関係数と独立性について、${ONE}`,
  ...mt(R,lab(rv,ind),[lab(rv,!ind),lab(fx(cv,2),ind),lab(fx(-r,2),ind),lab(fx(r*r,2),!ind)]),
  explanation:`$P(X=1)=${fx(px,2)}$、$P(Y=1)=${fx(py,2)}$、$E[XY]=${fx(p[1][1],2)}$。\n$\\mathrm{Cov}=${fx(p[1][1],2)}-${fx(px,2)}\\times${fx(py,2)}=${fx(cv,4)}$、$\\rho=\\dfrac{${fx(cv,4)}}{\\sqrt{${fx(px*(1-px),4)}\\times${fx(py*(1-py),4)}}}=${rv}$。\n${ind?'すべてのセルで $f(x,y)=P(X=x)P(Y=y)$ が成り立つので独立':'$f(1,1)\\ne P(X=1)P(Y=1)$ なので独立ではない'}。`};
});
// 問11型: 累積分布関数から確率・期待値
def('r_cdf','確率変数と確率分布','累積分布関数から確率・期待値',R=>{
 const a=R.pick([1,2,4,5,10]),k=R.pick([1,1,2]),F=x=>x<0?0:x>=a?1:(x/a)**k;
 const Fx=a===1?(k===1?'x':'x^2'):(k===1?`\\dfrac{x}{${a}}`:`\\dfrac{x^2}{${a*a}}`);
 const def=`$$F(x)=\\begin{cases}0&(x<0)\\\\ ${Fx}&(0\\le x<${a})\\\\ 1&(${a}\\le x)\\end{cases}$$`;
 const ask=R.pick(['gt','gt','int','E']),stem=`確率変数 $X$ の累積分布関数 $F(x)$ が次で与えられている。\n${def}\n`;
 if(ask==='E'){const E=k*a/(k+1);return{question:`${stem}$E(X)$ の値はいくらか。${ONE}`,...mc(R,E,[a/2,a,a/(k+2),k===2?a/3:a*2/3],{d:2,min:0}),
  explanation:`確率密度関数は $f(x)=F'(x)=${k===1?`\\dfrac{1}{${a}}`:`\\dfrac{2x}{${a*a}}`}\\ (0\\le x<${a})$。\n$E(X)=\\int_0^{${a}} x f(x)\\,dx=${fx(E,2)}$。`}}
 if(ask==='int'){const b1=a*R.ri(1,4)/10,b2=a*R.ri(5,9)/10,p=F(b2)-F(b1);return{question:`${stem}$P(${+fx(b1,2)}<X\\le ${+fx(b2,2)})$ の値はいくらか。${ONE}`,...mc(R,p,[F(b2),1-F(b1),F(b2)+F(b1),(b2-b1)/a],{d:3,min:0,max:1}),
  explanation:`$P(a<X\\le b)=F(b)-F(a)=${fx(F(b2),4)}-${fx(F(b1),4)}=${fx(p,3)}$。`}}
 const b=R.pick([a,a*1.5,a*0.5,a*0.2,a*0.8]),p=1-F(b);
 return{question:`${stem}$P(X>${+fx(b,2)})$ の値はいくらか。${ONE}`,...mc(R,p,[F(b),1,0.5,b/(2*a)].filter(v=>v<=1),{d:3,min:0,max:1}),
  explanation:`$P(X>b)=1-F(b)=1-${fx(F(b),4)}=${fx(p,3)}$。${b>=a?`$F(${+fx(b,2)})=1$ なので確率は0。`:''}`};
});
// 問12型: 幾何分布とチェビシェフの不等式(大数の法則)
def('r_cheb','確率変数と確率分布','幾何分布とチェビシェフの不等式',R=>{
 const k=R.pick([2,3,4,5]),m=k,v=(k-1)*k,vv=`${v}`;
 const ans=[`$${m}$`,`$\\dfrac{${vv}}{n\\epsilon^2}$`];
 const W2=[[`$${m}$`,`$\\dfrac{${vv}}{n\\epsilon}$`],[`$${m}$`,`$\\dfrac{${vv}}{n}$`],[`$${frac(1,k)}$`,`$\\dfrac{${vv}}{n\\epsilon^2}$`],[`$${m-1}$`,`$\\dfrac{${vv}}{n\\epsilon^2}$`],[`$${m}$`,`$\\dfrac{${vv}}{\\epsilon^2}$`]];
 return{question:`確率関数が $P(X=x)=\\dfrac{1}{${k}}\\left(\\dfrac{${k-1}}{${k}}\\right)^{x-1}\\ (x=1,2,\\dots)$ の幾何分布に従う母集団から、大きさ $n$ の無作為標本を抽出し、標本平均を $\\bar X$ とする。母平均は(ア)、母分散は ${v} なので、チェビシェフの不等式 $P(|\\bar X-(\\text{ア})|\\ge\\epsilon)\\le(\\text{イ})$ が成り立つ($\\epsilon>0$)。(ア)と(イ)の組合せとして、${ONE}`,
  ...parts(R,ans,W2),
  explanation:`成功確率 $p=\\dfrac1{${k}}$ の幾何分布の平均は $\\dfrac1p=${m}$、分散は $\\dfrac{1-p}{p^2}=${v}$。\n$V[\\bar X]=\\dfrac{${v}}{n}$ なので $P(|\\bar X-${m}|\\ge\\epsilon)\\le\\dfrac{V[\\bar X]}{\\epsilon^2}=\\dfrac{${v}}{n\\epsilon^2}$。$n\\to\\infty$ で0に近づく(大数の法則)。`};
});

// ----- 正規分布と標本分布 -----
// 問10型: 確率からパーセント点(c)を逆算する
def('n_inv','正規分布と標本分布','確率から値を逆算(付表)',R=>{
 const mu=R.pick([50,60,100,170]),sd=R.pick([5,8,9,10,15]),z=R.ri(120,280)/100,p=Q(z),lower=R.r()<0.5,c=lower?mu-z*sd:mu+z*sd;
 const z2=zinv(2*p);
 return{question:`確率変数 $X$ が正規分布 $N(${mu},\\,${sd}^2)$ に従うとき、$P(X${lower?'\\le':'\\ge'} c)=${fx(p,4)}$ を満たす定数 $c$ の値はいくらか。付表を用いて、${ONE}`,
  ...mc(R,c,[lower?-z:z,lower?z:-z,lower?mu+z*sd:mu-z*sd,lower?mu-z2*sd:mu+z2*sd],{d:2}),
  explanation:`付表より上側確率が ${fx(p,4)} となるのは $z=${fx(z,2)}$。${lower?'下側なので $z=-'+fx(z,2)+'$。':''}\n$c=${mu}${lower?'-':'+'}${fx(z,2)}\\times${sd}=${fx(c,2)}$。標準化した値 $z$ のままや、符号の取り違えに注意。`};
});

// ----- 統計的推定 -----
// 問7型: 標本抽出法の判断((ア)(イ)の組合せ)
const SAMP={'単純無作為抽出法':['全社員の名簿から乱数を用いて{m}人を選ぶ','全校生徒の名簿に番号をふり、乱数表で{m}人を選ぶ'],
 '系統抽出法':['名簿の先頭から{k}番目までの中から1人を無作為に選び、以後{k}人おきに選ぶ','製造ラインから最初の1個を無作為に決め、以後{k}個ごとに製品を抜き取る'],
 '層化抽出法':['全国を地方ごとに分け、各地方から人口に比例した人数を無作為に選ぶ','学年ごとに分け、各学年から在籍者数に比例した人数を無作為に選ぶ'],
 '集落抽出法':['市内の小学校の中から無作為にいくつかの学校を選び、選ばれた学校の児童全員を調べる','全国の店舗から無作為にいくつかの店舗を選び、その店舗の従業員全員に回答してもらう'],
 '二段抽出法':['市内の町丁目から無作為にいくつかを選び、選ばれた町丁目からそれぞれ無作為に{m}世帯を選ぶ','全国の高校から無作為にいくつかの高校を選び、選ばれた高校からそれぞれ{m}人の生徒を無作為に選ぶ'],
 '層化二段抽出法':['都道府県ごとに、無作為にいくつかの市町村を選び、選ばれた市町村から無作為に{m}人を選ぶ','事業部ごとに、無作為にいくつかの課を選び、選ばれた課から無作為に{m}人の社員を選ぶ']};
def('e_samp','統計的推定','標本抽出法の判断',R=>{
 const ms=Object.keys(SAMP),a=R.pick(ms);let b;do{b=R.pick(ms)}while(b===a);
 const fill=s=>s.replace('{m}',R.pick([5,10,20])).replace(/\{k\}/g,R.pick([10,20,50]));
 const sa=fill(R.pick(SAMP[a])),sb=fill(R.pick(SAMP[b]));
 const ans=[a,b],ws=[];for(let i=0;i<30&&ws.length<6;i++){const w=[R.r()<0.5?a:R.pick(ms),R.r()<0.5?b:R.pick(ms)];if(w[0]!==a||w[1]!==b)ws.push(w)}
 return{question:`次の2つの調査を考える。\n調査1: ${sa}。\n調査2: ${sb}。\n調査1の標本抽出法は(ア)であり、調査2の標本抽出法は(イ)である。(ア)と(イ)の組合せとして、${ONE}`,...parts(R,ans,ws),
  explanation:`調査1は${a}、調査2は${b}。\n層化:母集団を層に分け各層から抽出。集落:集団(集落)を選び、その中を全数調査。二段:集団を選び、さらにその中から個体を抽出。層化二段:層ごとに二段抽出を行う。系統:一定間隔で抽出。`};
});
// 問14型: 線形推定量の不偏性・分散
def('e_linest','統計的推定','推定量の不偏性と分散',R=>{
 const n=R.pick([4,5,6]),lab=i=>`\\hat\\mu_{${i+1}}`;
 const U=[{t:`\\frac{1}{${n}}\\sum_{i=1}^{${n}}X_i`,c:Array(n).fill(1/n)},{t:'\\frac{1}{2}(X_1+X_'+n+')',c:Array.from({length:n},(_,i)=>i===0||i===n-1?0.5:0)},{t:'X_1',c:Array.from({length:n},(_,i)=>i?0:1)},
  {t:`${frac(2,n*(n+1))}\\sum_{i=1}^{${n}}iX_i`,c:Array.from({length:n},(_,i)=>2*(i+1)/(n*(n+1)))},{t:'\\frac{1}{3}(X_1+2X_2)',c:Array.from({length:n},(_,i)=>i===0?1/3:i===1?2/3:0)}];
 const Bz=[{t:'\\frac{1}{2}(X_1+X_2+X_3)',c:Array.from({length:n},(_,i)=>i<3?0.5:0)},{t:`\\frac{1}{${n-1}}\\sum_{i=1}^{${n}}X_i`,c:Array(n).fill(1/(n-1))},{t:'X_1+X_2-X_3+X_4',c:Array.from({length:n},(_,i)=>[1,1,-1,1][i]??0).map((v,i)=>i<4?v:0)},{t:'\\frac{1}{4}(X_1+X_2)',c:Array.from({length:n},(_,i)=>i<2?0.25:0)}];
 const vr=e=>sum(e.c.map(c=>c*c)),stem=e=>`$n=${n}$ とし、確率変数 $X_1,\\dots,X_{${n}}$ が互いに独立に平均 $\\mu$、分散 $\\sigma^2$ の同じ分布に従うとする。$\\mu$ の推定量として、次の4つを考える。\n$${e.map((x,i)=>`${lab(i)}=${x.t}`).join(',\\quad ')}$\n`;
 if(R.r()<0.5){
  const biasIdx=R.ri(-1,3),es=R.shuf(U).slice(0,4);if(biasIdx>=0)es[biasIdx]=R.pick(Bz);
  const names=[0,1,2,3].map(lab),C=[0,1,2,3].map(j=>`$${names.filter((_,i)=>i!==j).join(', ')}$ は $\\mu$ の不偏推定量であるが、$${names[j]}$ は不偏推定量ではない。`).concat([`$${names.join(', ')}$ はすべて $\\mu$ の不偏推定量である。`]);
  return{question:`${stem(es)}4つの推定量の不偏性について、${ONE}`,choices:C,answer:biasIdx<0?5:biasIdx+1,fixed:true,
   explanation:`$E[\\sum c_iX_i]=\\mu\\sum c_i$ なので、係数の和が1なら不偏。\n係数の和: ${es.map((e,i)=>`$${lab(i)}$: ${fx(sum(e.c),3)}`).join('、')}。`};
 }
 const es=R.shuf(U).slice(0,4),v=es.map(vr),mn=Math.min(...v),ai=v.indexOf(mn);
 const C=[0,1,2,3].map(j=>`$${lab(j)}$ の分散が最も小さい。`).concat(['4つの推定量の分散はすべて等しい。']);
 return{question:`${stem(es)}4つの推定量はいずれも不偏推定量である。それぞれの分散について、${ONE}`,choices:C,answer:ai+1,fixed:true,
  explanation:`$V[\\sum c_iX_i]=\\sigma^2\\sum c_i^2$。\n${es.map((e,i)=>`$V[${lab(i)}]=${fx(v[i],4)}\\sigma^2$`).join('、')}。\n不偏な線形推定量の中では、標本平均の分散 $\\sigma^2/n$ が最小になる。`};
});
// 問17〔1〕型: 母比率の信頼区間を区間で選ぶ
def('e_cipi','統計的推定','母比率の信頼区間(区間を選ぶ)',R=>{
 const n=R.pick([400,500,600,800,1000]),k=R.ri(Math.round(n*0.3),Math.round(n*0.7)),p=k/n,se=Math.sqrt(p*(1-p)/n);
 const wide=R.shuf([2.576*se,2.326*se,1.96*se*Math.SQRT2,3.29*se]),nar=R.shuf([1.645*se,1.28*se,1.96*se/2,se]),kw=R.ri(0,4),hs=[1.96*se,...wide.slice(0,kw),...nar.slice(0,4-kw)].sort((a,b)=>b-a);
 const C=hs.map(h=>`$[${fx(p-h,3)},\\ ${fx(p+h,3)}]$`),ans=C[hs.indexOf(1.96*se)];if(new Set(C).size<5)return null;
 return{question:`${R.pick(['ある政策について','ある商品の購入意向について','ある番組の視聴について'])}、無作為に選んだ ${n} 人に調査したところ、${k} 人が「はい」と答えた。「はい」と答える人の母比率 $p$ の近似 95% 信頼区間として、${ONE}`,choices:C,answer:C.indexOf(ans)+1,fixed:true,
  explanation:`$\\hat p=${fx(p,3)}$、$\\sqrt{\\hat p(1-\\hat p)/n}=${fx(se,4)}$。\n$${fx(p,3)}\\pm1.96\\times${fx(se,4)}=${fx(p,3)}\\pm${fx(1.96*se,4)}$。他の選択肢は 2.576(99%)・1.645(90%)を使ったものや、標準誤差の計算を誤ったもの。`};
});
// 問15〔2〕型: 信頼区間の「幅」を指定したときの標本の大きさ(半幅との取り違えが典型的な誤り)
def('e_nw','統計的推定','信頼区間の幅と標本の大きさ',R=>{
 const sd=R.pick([6,8,10,12,15,20]),Wd=R.pick([2,3,4,5,6]),v=(2*1.96*sd/Wd)**2,ans=Math.ceil(v);if(ans<10)return null;
 return{question:`母分散が $\\sigma^2=${sd}^2$ である正規母集団の母平均 $\\mu$ を区間推定する。$\\mu$ の 95% 信頼区間の幅を ${Wd} 以下にしたい場合、最低限必要な標本の大きさはいくらか。${ONE}`,
  ...mc(R,ans,[Math.ceil((1.96*sd/Wd)**2),Math.ceil((2*1.645*sd/Wd)**2),Math.ceil((2*2.576*sd/Wd)**2),Math.ceil((2*1.96*sd/Wd)**2/2),Math.ceil(2*1.96*sd*sd/Wd)],{d:0,min:1}),
  explanation:`区間の幅は $2\\times1.96\\dfrac{${sd}}{\\sqrt n}$。これが ${Wd} 以下なので $\\sqrt n\\ge\\dfrac{2\\times1.96\\times${sd}}{${Wd}}=${fx(2*1.96*sd/Wd,3)}$、$n\\ge${fx(v,2)}$。\nよって ${ans}。幅の半分を ${Wd} とした ${Math.ceil((1.96*sd/Wd)**2)} は誤り。`};
});

// ----- 仮説検定 -----
// 問17〔2〕型: 二項分布の確率表を使った正確な検定(片側・両側のP値)
def('h_binex','仮説検定','二項分布による検定(P値の組合せ)',R=>{
 const n=R.pick([6,8,10]),C=(a,b)=>{let c=1;for(let i=0;i<b;i++)c=c*(a-i)/(i+1);return c},pr=Array.from({length:n+1},(_,k)=>+fx(C(n,k)/2**n,3));
 const x=R.pick([n-1,n-2]),h=n/2,one=+fx(sum(pr.slice(x)),3),two=+fx(2*one,3),px=pr[x],aw=+fx(2/n,3);if(one>=0.5||aw===pr[h])return null;
 const f=v=>fx(v,3);
 const fig=tbl(['$k$',...pr.map((_,k)=>k)],[['$P(X=k)$',...pr.map((v,k)=>k===h?'(ア)':f(v).replace(/^0/,''))]]);
 return{fig,question:`あるコインを ${n} 回投げ、表が出た回数を $X$ とする。表の出る確率を $p$ とし、$p=1/2$ と仮定すると $X$ の確率分布は次の表になる(小数第4位を四捨五入)。\nまず帰無仮説 $H_0:p=1/2$、対立仮説 $H_1:p>1/2$ として、$X\\ge c_1$ のとき $H_0$ を棄却する検定を考える。$X=${x}$ のとき、この検定のP値は(イ)である。次に対立仮説を $H_1:p\\ne1/2$ として、$|X-${h}|\\ge c_2$ のとき棄却する検定を考える。$X=${x}$ のとき、この検定のP値は(ウ)である。(ア)〜(ウ)に当てはまる数値の組合せとして、${ONE}`,
  ...parts(R,[f(pr[h]),f(one),f(two)],[[f(pr[h]),f(one),f(one)],[f(pr[h]),f(px),f(2*px)],[f(aw),f(one),f(one)],[f(aw),f(px),f(px)]]),
  explanation:`(ア) $P(X=${h})={}_{${n}}\\mathrm C_{${h}}/2^{${n}}=${f(pr[h])}$。\n(イ) 片側P値は $P(X\\ge${x})=${pr.slice(x).map(f).join('+')}=${f(one)}$。$P(X=${x})$ だけではない。\n(ウ) 両側P値は $P(|X-${h}|\\ge${x-h})$ で、分布が対称なので $2\\times${f(one)}=${f(two)}$。`};
});
// 問18型: t統計量・F統計量の構成((ア)〜(ウ)の組合せ)
def('h_build','仮説検定','検定統計量の分布の構成',R=>{
 const v=R.pick(['one','two','f']);
 if(v==='one'){const d='n-1',A='\\frac{\\bar X-\\mu}{\\sigma/\\sqrt n}',B='\\frac{(n-1)U^2}{\\sigma^2}';
  const ans=['$N(0,1)$',`$\\chi^2(${d})$`,`$\\dfrac{A}{\\sqrt{B/(${d})}}$`];
  return{question:`正規母集団 $N(\\mu,\\sigma^2)$ から大きさ $n$ の無作為標本を抽出し、標本平均を $\\bar X$、不偏分散を $U^2$ とする($\\sigma^2$ は未知)。\n$A=${A}\\sim(\\text{ア})$、$B=${B}\\sim(\\text{イ})$ が成り立ち、$A$ と $B$ は独立なので、$T=(\\text{ウ})$ は自由度 $n-1$ の $t$ 分布に従う。(ア)〜(ウ)の組合せとして、${ONE}`,
   ...parts(R,ans,[[`$\\chi^2(${d})$`,'$N(0,1)$',ans[2]],['$N(0,1)$','$N(0,1)$',ans[2]],['$N(0,1)$',`$\\chi^2(${d})$`,`$\\dfrac{A}{B/(${d})}$`],[`$t(${d})$`,`$\\chi^2(${d})$`,`$\\dfrac{A}{B/(${d})}$`],['$N(0,1)$',`$\\chi^2(n)$`,ans[2]]]),
   explanation:`$A$ は標準化した標本平均なので $N(0,1)$。$B=(n-1)U^2/\\sigma^2$ は自由度 $n-1$ の $\\chi^2$ 分布。\n$t$ 分布は「標準正規分布 ÷ $\\sqrt{\\chi^2/\\text{自由度}}$」で定義されるので $T=A/\\sqrt{B/(n-1)}$。`}}
 if(v==='two'){const d='m+n-2',ans=['$N(0,1)$',`$\\chi^2(${d})$`,`$\\dfrac{A}{\\sqrt{B/(${d})}}$`];
  return{question:`正規母集団 $N(\\mu_1,\\sigma^2)$ から大きさ $m$、$N(\\mu_2,\\sigma^2)$ から大きさ $n$ の標本を抽出し、標本平均を $\\bar X,\\bar Y$、不偏分散を $U_X^2,U_Y^2$ とする(共通の $\\sigma^2$ は未知)。\n$A=\\dfrac{\\bar X-\\bar Y-(\\mu_1-\\mu_2)}{\\sqrt{\\sigma^2/m+\\sigma^2/n}}\\sim(\\text{ア})$、$B=\\dfrac{(m-1)U_X^2+(n-1)U_Y^2}{\\sigma^2}\\sim(\\text{イ})$ なので、$H_0:\\mu_1=\\mu_2$ の下で $T=(\\text{ウ})$ は自由度 $m+n-2$ の $t$ 分布に従う。(ア)〜(ウ)の組合せとして、${ONE}`,
   ...parts(R,ans,[[`$\\chi^2(${d})$`,'$N(0,1)$',ans[2]],['$N(0,1)$','$N(0,1)$',ans[2]],['$N(0,1)$',`$\\chi^2(${d})$`,`$\\dfrac{A}{B/(${d})}$`],[`$t(m+n+2)$`,`$\\chi^2(${d})$`,`$\\dfrac{A}{B/(${d})}$`]]),
   explanation:`$A$ は $N(0,1)$、$B$ は自由度 $(m-1)+(n-1)=m+n-2$ の $\\chi^2$ 分布。$T=A/\\sqrt{B/(m+n-2)}$ が $t(m+n-2)$ に従う。`}}
 const ans=['$\\chi^2(m-1)$','$\\chi^2(n-1)$','$\\dfrac{A/(m-1)}{B/(n-1)}$'];
 return{question:`2つの正規母集団 $N(\\mu_1,\\sigma_1^2)$、$N(\\mu_2,\\sigma_2^2)$ から大きさ $m, n$ の標本を抽出し、不偏分散を $U_X^2,U_Y^2$ とする。\n$A=\\dfrac{(m-1)U_X^2}{\\sigma_1^2}\\sim(\\text{ア})$、$B=\\dfrac{(n-1)U_Y^2}{\\sigma_2^2}\\sim(\\text{イ})$ なので、$H_0:\\sigma_1^2=\\sigma_2^2$ の下で $F=(\\text{ウ})=U_X^2/U_Y^2$ は自由度 $(m-1,\\,n-1)$ の $F$ 分布に従う。(ア)〜(ウ)の組合せとして、${ONE}`,
  ...parts(R,ans,[['$\\chi^2(m)$','$\\chi^2(n)$',ans[2]],['$N(0,1)$','$N(0,1)$','$\\dfrac{A}{B}$'],[ans[0],ans[1],'$\\dfrac{A}{\\sqrt{B/(n-1)}}$'],[ans[0],ans[1],'$\\dfrac{A/(n-1)}{B/(m-1)}$']]),
  explanation:`$(m-1)U_X^2/\\sigma_1^2\\sim\\chi^2(m-1)$。$F$ 分布は「$\\chi^2$ をそれぞれの自由度で割ったものの比」で定義される。$\\sigma_1^2=\\sigma_2^2$ なら $\\dfrac{A/(m-1)}{B/(n-1)}=U_X^2/U_Y^2$。`};
});
// 問19型: 2×2分割表のカイ二乗統計量・自由度・P値の組合せ
def('h_ind2','仮説検定','独立性の検定(統計量・自由度・P値)',R=>{
 const n1=R.pick([10,15,20,25,30]),n2=R.pick([10,15,20,25,30]),a=R.ri(Math.ceil(n1*0.4),n1-1),c=R.ri(1,Math.floor(n2*0.6)),b=n1-a,d=n2-c,N=n1+n2,r1=a+c,r2=b+d;
 if(Math.min(r1,r2)<3)return null;
 const O=[a,b,c,d],E=[n1*r1/N,n1*r2/N,n2*r1/N,n2*r2/N],x2=sum(O.map((o,i)=>(o-E[i])**2/E[i]));if(x2<0.5||x2>11)return null;
 const P1=v=>2*Q(Math.sqrt(v)),P3=v=>Math.min(1,2*Q(Math.sqrt(v))+Math.sqrt(2*v/Math.PI)*Math.exp(-v/2));
 const xw=sum(O.map((o,i)=>(o-E[i])**2/o)),f2=v=>fx(v,2),f3=v=>fx(v,3);
 const ctx=R.pick([['対策講座を受講した','受講していない','合格','不合格'],['朝食をとる','朝食をとらない','体調良好','体調不良'],['新薬群','対照群','改善','改善なし']]);
 const fig=tbl(['',ctx[2],ctx[3],'計'],[[ctx[0],a,b,n1],[ctx[1],c,d,n2],['計',r1,r2,N]]);
 return{fig,question:`次の分割表について、行と列の要因が独立であるかを検定する。帰無仮説は「行と列の要因は独立である」である。このデータに対するピアソンのカイ二乗統計量の実現値は(ア)である。ピアソンのカイ二乗統計量は帰無仮説の下で近似的に自由度(イ)のカイ二乗分布に従うので、P値は(ウ)である。(ア)〜(ウ)に当てはまる数値の組合せとして、${ONE}`,
  ...parts(R,[f2(x2),'1',f3(P1(x2))],[[f2(x2),'3',f3(P3(x2))],[f2(x2),'1',f3(P1(x2)/2)],[f2(xw),'3',f3(P3(xw))],[f2(xw),'1',f3(P1(xw))]]),
  explanation:`期待度数は ${E.map(v=>fx(v,2)).join(', ')}。$\\chi^2=\\sum\\dfrac{(O-E)^2}{E}=${f2(x2)}$。自由度は $(2-1)(2-1)=1$。\n自由度1のカイ二乗分布は $Z^2$ の分布なので、P値 $=P(|Z|\\ge\\sqrt{${f2(x2)}})=2Q(${fx(Math.sqrt(x2),2)})\\approx${f3(P1(x2))}$。`};
});

// ----- 回帰分析 -----
// 問16型: 定数項を含まない回帰モデル(推定量の式・残差の性質)
def('g_noint','回帰分析と分散分析','定数項なし回帰と残差の性質',R=>{
 const v=R.pick(['f','p','n']);
 if(v==='f'){const opts=['$\\hat\\beta=\\dfrac{\\sum x_iy_i}{\\sum x_i^2}$','$\\hat\\beta=\\dfrac{\\sum x_iy_i}{\\sum y_i^2}$','$\\hat\\beta=\\dfrac{\\sum x_iy_i}{\\sum u_i^2}$','$\\hat\\beta=\\dfrac{\\sum x_iy_i}{\\sum x_i}$','$\\hat\\beta=\\dfrac{\\sum x_iy_i}{\\sum y_i}$'];
  return{question:`被説明変数 $y$ と説明変数 $x$ に対して、定数項を含まない単回帰モデル $y_i=\\beta x_i+u_i\\ (i=1,\\dots,n)$ を当てはめる。$\\beta$ の最小二乗推定量 $\\hat\\beta$ の式として、${ONE}`,...mt(R,opts[0],opts.slice(1)),
   explanation:`$S(\\beta)=\\sum(y_i-\\beta x_i)^2$ を $\\beta$ で微分して0とおくと $\\sum x_i(y_i-\\beta x_i)=0$、よって $\\hat\\beta=\\dfrac{\\sum x_iy_i}{\\sum x_i^2}$。`}}
 if(v==='n'){const xs=Array.from({length:4},()=>R.ri(1,9)),ys=xs.map(x=>x*R.ri(1,4)+R.ri(-3,3)),b=sum(xs.map((x,i)=>x*ys[i]))/sum(xs.map(x=>x*x));
  return{fig:tbl(['$i$',1,2,3,4],[['$x_i$',...xs],['$y_i$',...ys]]),question:`次の4組のデータに、定数項を含まない回帰モデル $y_i=\\beta x_i+u_i$ を当てはめる。$\\beta$ の最小二乗推定値はいくらか。${ONE}`,
   ...mc(R,b,[sum(ys)/sum(xs),sum(xs.map((x,i)=>x*ys[i]))/sum(ys.map(y=>y*y)),mean(ys.map((y,i)=>y/xs[i]))],{d:3}),
   explanation:`$\\hat\\beta=\\dfrac{\\sum x_iy_i}{\\sum x_i^2}=\\dfrac{${sum(xs.map((x,i)=>x*ys[i]))}}{${sum(xs.map(x=>x*x))}}=${fx(b,3)}$。`}}
 const withC=R.r()<0.4,t=withC?[1,1,1]:[0,1,0];
 return{question:`被説明変数 $y$ と説明変数 $x$ に対して、${withC?'定数項を含む単回帰モデル $y_i=\\alpha+\\beta x_i+u_i$':'定数項を含まない単回帰モデル $y_i=\\beta x_i+u_i$'} を最小二乗法で当てはめ、予測値を $\\hat y_i$、残差を $\\hat u_i=y_i-\\hat y_i$ とする。\nⅠ. $\\sum_{i=1}^n\\hat u_i=0$ が常に成り立つ。\nⅡ. $\\sum_{i=1}^n\\hat u_ix_i=0$ が常に成り立つ。\nⅢ. $\\frac1n\\sum_{i=1}^n\\hat y_i=\\bar y$ が常に成り立つ。\n${CMBQ}`,...combo(R,t),
  explanation:withC?`定数項を含むモデルの正規方程式は $\\sum\\hat u_i=0$ と $\\sum\\hat u_ix_i=0$。前者から $\\sum\\hat y_i=\\sum y_i$ も成り立つので、すべて正しい。`:`定数項がないと正規方程式は $\\sum x_i\\hat u_i=0$ だけ。$\\sum\\hat u_i=0$ は一般に成り立たず、Ⅲも成り立たない。Ⅱのみ正しい。`};
});

// ----- 記述の正誤(問13・問16〔2〕型)。各分野の記述からランダムに3つ選ぶ -----
const STMT={
'データの基礎':[['右に長い裾をもつ分布では、一般に平均値は中央値より大きい。',1],['中央値は平均値よりも外れ値の影響を受けやすい。',0],['変動係数は測定単位に依存しない。',1],['標準偏差の単位は、データの単位の2乗である。',0],['箱ひげ図の箱の長さは四分位範囲を表す。',1],['すべてのデータに同じ定数を加えると、分散も同じだけ増える。',0],['データを標準化すると平均は0、標準偏差は1になる。',1],['最頻値は必ず1つに定まる。',0]],
'2変数・時系列':[['相関係数は、一方の変数を正の定数倍しても変わらない。',1],['相関係数が0なら、2変数の間には何の関係もない。',0],['2変数に強い相関があれば、一方が他方の原因であると言える。',0],['相関係数は外れ値の影響を受けやすい。',1],['ラスパイレス指数は比較時点の数量で加重する。',0],['前年同月比をとると、季節変動の影響をおおむね取り除ける。',1],['成長率の平均を求めるには、幾何平均を用いるのが適切である。',1],['移動平均をとると、不規則変動が大きくなる。',0]],
'確率':[['$P(A)>0,\\ P(B)>0$ で $A$ と $B$ が排反なら、$A$ と $B$ は独立ではない。',1],['$A$ と $B$ が独立なら、$A$ と $B$ は排反である。',0],['$A$ と $B$ が独立なら、$A$ と $\\bar B$ も独立である。',1],['$P(A\\mid B)=P(B\\mid A)$ が常に成り立つ。',0],['$P(A\\cup B)\\le P(A)+P(B)$ が常に成り立つ。',1],['ベイズの定理は、事前確率と尤度から事後確率を求めるものである。',1]],
'確率変数と確率分布':[['$X$ と $Y$ が独立なら $\\mathrm{Cov}(X,Y)=0$ である。',1],['$\\mathrm{Cov}(X,Y)=0$ なら $X$ と $Y$ は独立である。',0],['$X$ と $Y$ が独立なら $V[X-Y]=V[X]-V[Y]$ である。',0],['ポアソン分布の期待値と分散は等しい。',1],['二項分布 $B(n,p)$ の分散は $np$ である。',0],['指数分布は無記憶性をもつ。',1],['一様分布 $U(0,1)$ の分散は $\\frac{1}{2}$ である。',0]],
'正規分布と標本分布':[['標本平均の分散は、標本の大きさ $n$ に反比例する。',1],['中心極限定理は、母集団分布が正規分布の場合にしか成り立たない。',0],['$t$ 分布は自由度が大きくなると標準正規分布に近づく。',1],['自由度 $k$ のカイ二乗分布の期待値は $2k$ である。',0],['独立な正規分布に従う確率変数の和は、正規分布に従う。',1],['$t$ 分布の裾は標準正規分布より軽い。',0]],
'統計的推定':[['推定量は確率変数である。',1],['一致推定量とは、標本の大きさを大きくすると母数に確率収束する推定量である。',1],['一致推定量は常に不偏推定量である。',0],['偏差平方和を $n$ で割った標本分散は、母分散の不偏推定量である。',0],['平均二乗誤差は、推定量の分散とバイアスの2乗の和に等しい。',1],['95%信頼区間とは、母数が95%の確率でその区間内に入る区間のことである。',0],['他の条件が同じなら、信頼係数を大きくすると信頼区間の幅は広くなる。',1],['標本の大きさを4倍にすると、母平均の信頼区間の幅はおよそ $\\frac14$ になる。',0]],
'仮説検定':[['第1種の過誤の確率は有意水準に等しい。',1],['P値は帰無仮説が正しい確率である。',0],['帰無仮説が棄却されなかったことは、帰無仮説が正しいことを意味しない。',1],['有意水準を小さくすると、第2種の過誤の確率も小さくなる。',0],['標本の大きさを大きくすると、一般に検出力は高くなる。',1],['有意水準5%で棄却される検定は、有意水準10%でも棄却される。',1],['検出力とは、帰無仮説が正しいときにそれを棄却しない確率である。',0],['有意水準1%で棄却されない検定は、有意水準5%でも棄却されない。',0]],
'回帰分析と分散分析':[['定数項を含む単回帰の最小二乗法では、残差の和は0になる。',1],['定数項を含まない回帰モデルでも、残差の和は常に0になる。',0],['単回帰の決定係数は、$x$ と $y$ の相関係数の2乗に等しい。',1],['説明変数を追加すると、決定係数は必ず減少する。',0],['自由度調整済み決定係数は、説明変数を追加しても増えるとは限らない。',1],['説明変数どうしの相関が強いほど、偏回帰係数の推定は安定する。',0],['一元配置分散分析では、総平方和は水準間平方和と残差平方和の和に等しい。',1],['単回帰の傾きの符号は、相関係数の符号と異なることがある。',0]]};
Object.entries(STMT).forEach(([f,pool],i)=>def('s_'+i,f,'記述の正誤(組合せ)',R=>{
 const s=R.shuf(pool).slice(0,3);
 return{question:`次の記述Ⅰ〜Ⅲは、${f}に関するものである。\nⅠ. ${s[0][0]}\nⅡ. ${s[1][0]}\nⅢ. ${s[2][0]}\n${CMBQ}`,...combo(R,s.map(x=>x[1])),
  explanation:s.map((x,j)=>`${['Ⅰ','Ⅱ','Ⅲ'][j]}は${TF(x[1])}。`).join('\n')+'\n記述が誤りの場合は、公式・用語まとめで該当する項目を確認しよう。'};
}));

// ----- 過去問(2021年6月 問20〜問22)の形式 -----
// 問20型: 多重比較とボンフェローニ法
def('h_bonf','仮説検定','多重比較とボンフェローニ法',R=>{
 const v=R.pick([1,4]),sd=Math.sqrt(v),k=R.pick([3,4]),m=k*(k-1)/2;
 const stem=`${k}つのグループ $A_1,\\dots,A_{${k}}$ から大きさ1の標本 $X_j$ をそれぞれ抽出する。$X_j$ は互いに独立に平均 $\\mu_j$、分散 ${v} の正規分布に従う。異なる2つのグループの標本 $X_j, X_k$ に対して $|X_j-X_k|>z$ であれば帰無仮説「$\\mu_j=\\mu_k$」を棄却する検定を考え、この検定の第1種の過誤の確率を $\\alpha_{jk}(z)$ とする。\n`;
 const sq=v===1?'\\sqrt2':'2\\sqrt2';
 if(R.r()<0.4){const c=R.pick([[1.645,'0.100'],[1.96,'0.050'],[2.576,'0.010']]),C=['0.010','0.025','0.050','0.100','0.200'];
  return{question:`${stem}$\\alpha_{12}(${c[0]}\\times${sq})$ の値はいくらか。${ONE}`,choices:C,answer:C.indexOf(c[1])+1,fixed:true,
   explanation:`$H_0$ の下で $X_1-X_2\\sim N(0,\\,2\\times${v})$、標準偏差は $${sq}$。\nよって $\\alpha_{12}=P(|Z|>${c[0]})=${c[1]}$(両側)。片側の値と取り違えないこと。`}}
 const A=R.pick([0.05,0.1]),per=A/m,z0=zinv(per/2),z=z0*Math.SQRT2*sd,pct=frac(Math.round(A*100),m);
 const pairs=[];for(let i=1;i<=k;i++)for(let j=i+1;j<=k;j++)pairs.push(`|X_${i}-X_${j}|>z`);
 return{question:`${stem}$${pairs.join('\\ \\text{または}\\ ')}$ であれば帰無仮説「すべての $\\mu_j$ が等しい」を棄却する検定を考える。ボンフェローニの不等式より、この検定の第1種の過誤の確率は各 $\\alpha_{jk}(z)$ の和以下なので、各項が $${pct}\\%$ となるように $z$ を定めれば、全体を ${A*100}% 以下に抑えられる。このときの $z$ の値として、付表を用いて、${ONE}`,
  ...mc(R,z,[z0*sd,zinv(per)*Math.SQRT2*sd,(A===0.05?1.96:1.645)*Math.SQRT2*sd,z0*2*sd],{d:3,min:0}),
  explanation:`比較は ${m} 組。各組の有意水準は $${A*100}/${m}=${pct}\\%$(両側)。\n$X_j-X_k\\sim N(0,${2*v})$ なので $P(|Z|>z/${sq})=${fx(per,4)}$、付表より $z/${sq}\\approx${fx(z0,2)}$、$z\\approx${fx(z,3)}$。$\\sqrt2$ を掛け忘れた ${fx(z0*sd,3)} は誤り。`};
});
// 問21型: 一元配置の実験(実験手順・自由度・水準の母平均の信頼区間)
const EXP=[['照明','教室','室','作業ミスの数(件)',['照明A','照明B','照明C'],[24,19,15]],['肥料','畑の区画','区画','収穫量(kg)',['肥料A','肥料B','肥料C'],[52,58,61]],['学習法','生徒','人','テストの点(点)',['講義型','演習型','反転授業'],[62,68,71]],['洗剤','布','枚','汚れの残り(%)',['洗剤A','洗剤B','洗剤C'],[30,24,21]]];
def('g_aov1','回帰分析と分散分析','一元配置実験(手順・自由度・区間推定)',R=>{
 const c=R.pick(EXP),k=3,r=R.pick([3,4,5]),N=k*r,sp=c[5].map(m=>m*R.ri(90,110)/100),sd=Math.abs(sp[0]-sp[2])*R.ri(15,35)/100;
 const y=sp.map(m=>Array.from({length:r},()=>+(m+sd*nrm(R)).toFixed(1))),ms=y.map(mean),g=mean(y.flat());
 const ssa=r*sum(ms.map(m=>(m-g)**2)),sse=sum(y.map((row,j)=>sum(row.map(v=>(v-ms[j])**2)))),mse=sse/(N-k);
 const fig=tbl([c[0],...Array.from({length:r},(_,i)=>`${i+1}回目`)],y.map((row,j)=>[`${j+1}(${c[4][j]})`,...row.map(v=>fx(v,1))]),`実験結果(${c[3]})`)+tbl(['要因','平方和','自由度','平均平方','$F_0$'],[[c[0],fx(ssa,1),'−','−','−'],['誤差E',fx(sse,1),'−','−',''],['総',fx(ssa+sse,1),'−','','']],'分散分析表');
 const stem=`${k}種類の${c[0]}(${c[4].join('、')})の効果を比べるため、繰り返し ${r} 回の一元配置実験を行い、合計 ${N} 回測定した。データの構造は $y_{ji}=\\mu+\\alpha_j+\\epsilon_{ji}$($\\epsilon_{ji}$ は独立に $N(0,\\sigma^2)$ に従う)とする。\n`;
 const v=R.pick(['df','ci','ci','plan']);
 if(v==='plan'){const u=c[1],n=c[2];
  const ok=`全体の${u}から無作為に ${N}${n}を選び、それらに ${k} 種類の${c[0]}を無作為に割り付け、測定の順序も無作為に決めて実施した。`;
  return{question:`${stem}この実験の手順として、${ONE}`,...mt(R,ok,[`${u}を古い順に並べ、最初の ${r}${n}に${c[0]}1、次の ${r}${n}に${c[0]}2、最後の ${r}${n}に${c[0]}3を施し、この順序で測定した。`,`${u}を古い順に ${N}${n}選び、${c[0]}を無作為に割り付けたうえで、${c[0]}1の${u}から順に測定した。`,`1つの${u}に、無作為に決めた順序で ${k} 種類の${c[0]}を施し、それぞれ ${r} 回ずつ測定を繰り返した。`,`1つの${u}に、作業時間の短い順に${c[0]}を施し、それぞれ ${r} 回ずつ測定を繰り返した。`]),
   explanation:`フィッシャーの3原則(無作為化・反復・局所管理)。対象の選び方・処理の割り付け・測定の順序をすべて無作為にすることで、古さや時間の経過などの影響が特定の処理に偏らないようにする。1つの対象に処理を重ねると、処理の効果が分離できない。`}}
 if(v==='df'){const ans=`$\\nu_1=${k-1},\\ \\nu_2=${N-k}$`,W2=[[1,N-k],[k-1,N-1],[k,N-k-1],[k,N-k],[k-1,N-k+1]].map(([a,b])=>`$\\nu_1=${a},\\ \\nu_2=${b}$`);
  return{fig,question:`${stem}分散分析表を完成させるには、検定統計量 $F_0$ が従う $F$ 分布の自由度 $(\\nu_1,\\nu_2)$ が必要である。自由度として、${ONE}`,...mt(R,ans,W2),
   explanation:`水準間の自由度は 水準数−1=${k-1}、誤差の自由度は 総数−水準数=${N}−${k}=${N-k}。全体の自由度 ${N-1} はその和。`}}
 const j=R.ri(0,k-1),t=tq(N-k,0.025),se=Math.sqrt(mse/r),h=t*se,ys=ms[j];
 const wide=R.shuf([t*Math.sqrt(2*mse/r),t*Math.sqrt(mse),tq(N-k,0.005)*se]),nar=R.shuf([1.96*se,t*Math.sqrt(mse/N),t*se/2,tq(N-k,0.05)*se]),kw=R.ri(0,3),hs=[h,...wide.slice(0,kw),...nar.slice(0,4-kw)].sort((a,b)=>a-b);
 const C=hs.map(x=>`$[${fx(ys-x,1)},\\ ${fx(ys+x,1)}]$`);if(new Set(C).size<5)return null;
 return{fig,question:`${stem}${c[0]}${j+1}(${c[4][j]})を施したときの母平均 $\\mu+\\alpha_{${j+1}}$ の 95% 信頼区間として、付表を用いて、${ONE}`,choices:C,answer:hs.indexOf(h)+1,fixed:true,
  explanation:`点推定値は水準の標本平均 $${fx(ys,2)}$。誤差の平均平方 $=${fx(sse,1)}/${N-k}=${fx(mse,2)}$ が $\\sigma^2$ の推定値。\n$${fx(ys,2)}\\pm t_{0.025}(${N-k})\\sqrt{\\dfrac{${fx(mse,2)}}{${r}}}=${fx(ys,2)}\\pm${t}\\times${fx(se,3)}=${fx(ys,2)}\\pm${fx(h,2)}$。自由度は誤差の自由度 ${N-k} を使う。他の選択肢は 1.96 や 90%・99% の点、$\\sqrt{MSE/${N}}$ などを使ったもの。`};
});
// 問22型: 重回帰の出力表(t値の穴埋め・係数の解釈・モデルの比較)
const VARS=[['log(1人当たり所得)',0],['平均年齢',0],['log(人口密度)',0],['15歳未満人口の割合',0],['政令指定都市ダミー',1],['log(気温)',0],['持ち家率',0]];
def('g_mreg','回帰分析と分散分析','重回帰の出力表(解釈・モデル比較)',R=>{
 const n=R.pick([40,45,47,50]),dum=VARS[4],others=R.shuf(VARS.filter(x=>!x[1])).slice(0,4),vs=[...others,dum],p=vs.length,df=n-p-1;
 const rows=vs.map((x,i)=>{const se=R.ri(30,600)/1000,tt=R.pick([1,1,-1])*(i<2?R.ri(25,90)/10:R.ri(2,22)/10),est=x[1]?-R.ri(10,35)/100:tt*se*(1+R.ri(-40,40)/1000);return{n:x[0],est:+fx(est,3),se:x[1]?+fx(Math.abs(est)/R.ri(22,40)*10,3):+fx(se,3)}});
 rows.forEach(r=>{r.t=r.est/r.se;r.p=tp2(r.t,df)});
 const c0={n:'定数項',est:+fx(-R.ri(30,120)/10,3),se:+fx(R.ri(15,45)/10,3)};c0.t=c0.est/c0.se;c0.p=tp2(c0.t,df);
 const R2=R.ri(70,90)/100,adj=(r2,k)=>1-(1-r2)*(n-1)/(n-k-1),Fs=(r2,k)=>r2/k/((1-r2)/(n-k-1));
 const show=(rs,r2,k,blank,cc=c0)=>tbl(['','Estimate','Std. Error','t value','Pr(>|t|)'],[cc,...rs].map(r=>[r.n,fx(r.est,3),fx(r.se,3),r===blank?'(ア)':fx(r.t,3),pfmt(r.p)]))+`<div class="meta">Multiple R-squared: ${fx(r2,4)}, Adjusted R-squared: ${fx(adj(r2,k),4)}<br>F-statistic: ${fx(Fs(r2,k),2)} on ${k} and ${n-k-1} DF</div>`;
 const stem=`ある被説明変数(都道府県別の1人当たり施設数の対数値)を、次の説明変数で重回帰モデルにより推定した(データ数 $n=${n}$)。政令指定都市ダミーは、政令指定都市をもつ都道府県で1、それ以外で0をとる。`;
 const v=R.pick(['t','int','cmp']);
 if(v==='t'){const b=R.r()<0.5?c0:R.pick(rows);
  return{fig:show(rows,R2,p,b),question:`${stem}次の表はモデルの出力結果である。(ア)に入る数値はいくらか。${ONE}`,...mc(R,b.t,[b.se/b.est,b.est*b.se,-b.t,b.t/Math.sqrt(n)],{d:3}),
   explanation:`t値 $=\\dfrac{\\text{Estimate}}{\\text{Std. Error}}=\\dfrac{${fx(b.est,3)}}{${fx(b.se,3)}}=${fx(b.t,3)}$。`}}
 if(v==='int'){const d=rows[p-1],pct=Math.round(Math.abs(Math.exp(d.est)-1)*10),ns=rows.filter(r=>r.p>0.1),pos=rows.filter(r=>r.p<0.05&&!r.n.includes('ダミー'));if(!ns.length||!pos.length||pct<1)return null;const q=R.pick(pos),nv=R.pick(ns);
  const ok=`他の変数が同じ値である場合、政令指定都市をもつ都道府県は、被説明変数(1人当たり施設数)が約${pct}割少ない傾向にある。`;
  return{fig:show(rows,R2,p,null),question:`${stem}次の表はモデルの出力結果である。被説明変数は対数値であることに注意して、結果の説明として${ONE}`,...mt(R,ok,['定数項は、P値が最も小さいため、最も説明力がある説明変数である。',`有意水準を10%とした場合、${nv.n}にかかる係数がゼロであるという帰無仮説は棄却される。`,`他の変数が同じ値である場合、${q.n}が${q.est>0?'低い':'高い'}都道府県では、1人当たり施設数が多い傾向にある。`,'統計的な有意性が確認されたいくつかの説明変数については、被説明変数への因果関係が存在すると考えられる。']),
   explanation:`被説明変数が対数なので、ダミーの係数 $${fx(d.est,3)}$ は $e^{${fx(d.est,3)}}\\approx${fx(Math.exp(d.est),3)}$ 倍、つまり約${pct}割少ないことを表す。\n定数項は説明変数ではない。${nv.n}のP値 ${pfmt(nv.p)} は 0.1 より大きいので棄却されない。${q.n}の係数は${q.est>0?'正':'負'}。有意性は因果関係を意味しない。`}}
 // モデル比較: Aは全変数、Bは一部の変数を除いたモデル
 const drop=rows.filter(r=>r.p>0.05&&!r.n.includes('ダミー'));if(!drop.length)return null;
 const dropAll=R.r()<0.6,dr=dropAll?drop:drop.slice(0,Math.max(1,drop.length-1)),keepNs=!dropAll&&drop.length>1;
 const rb=rows.filter(r=>!dr.includes(r)).map(r=>{const se=+fx(r.se*R.ri(85,105)/100,3),est=+fx(r.est*R.ri(85,115)/100,3);return{n:r.n,est,se,t:est/se,p:tp2(est/se,n-(p-dr.length)-1)}}),kb=rb.length;
 const aA=adj(R2,p),better=R.r()<0.5,aT=better?aA+R.ri(1,6)/1000:aA-R.ri(2,20)/1000,R2b=1-(1-aT)*(n-kb-1)/(n-1);if(R2b>=R2)return null;const aB=adj(R2b,kb);
 const cA=TB.f05.v[TB.f05.df2.indexOf(n-p-1)]?.[TB.f05.df1.indexOf(p)]??2.45,t=[dr.length===drop.length,aB>aA,Fs(R2,p)>cA&&Fs(R2b,kb)>cA];
 const fig=`<p class="meta">モデルA(すべての説明変数)</p>`+show(rows,R2,p,null)+`<p class="meta">モデルB(一部の説明変数を除いたもの)</p>`+show(rb,R2b,kb,null,(()=>{const e=+fx(c0.est*R.ri(85,115)/100,3),se=+fx(c0.se*R.ri(85,105)/100,3);return{n:'定数項',est:e,se,t:e/se,p:tp2(e/se,n-kb-1)}})());
 return{fig,question:`${stem}すべての説明変数を用いたモデルA と、一部の説明変数を除いたモデルB の出力結果が次の表である。\nⅠ. モデルBは、モデルAの結果において有意水準5%で有意でない説明変数をすべて除いたモデルである。\nⅡ. 自由度調整済み決定係数を基準とすると、モデルBが選択される。\nⅢ. モデルAとBの両方において、説明変数にかかるすべての係数がゼロであるという帰無仮説は有意水準5%で棄却される。\n${CMBQ}`,...combo(R,t),
  explanation:`Ⅰ: モデルAで5%有意でない説明変数は ${drop.map(r=>r.n).join('、')}。${t[0]?'すべて除かれているので正しい。':'Bに残っているものがあるので誤り。'}\nⅡ: 調整済み $R^2$ は A ${fx(aA,4)}、B ${fx(aB,4)} なので${t[1]?'Bが選ばれ正しい':'Aが選ばれ誤り'}。決定係数そのものは変数の多いAが常に大きい。\nⅢ: F統計量は A ${fx(Fs(R2,p),2)}、B ${fx(Fs(R2b,kb),2)} で、いずれも5%の棄却点(Aでは約 ${cA})より大きいので正しい。`};
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
