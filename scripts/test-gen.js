// 自動生成問題の検査: node scripts/test-gen.js [回数]
global.window={};require('../data/tables.js');require('../js/gen.js');
const G=window.STAT2_GEN,N=+process.argv[2]||300;let bad=0;const pos=[0,0,0,0,0,0];
for(const g of G.list){let fail=0,ok=0;const p=[0,0,0,0,0,0];
 for(let s=1;s<=N;s++){const q=G.generate(g.id,s*104729);
  if(!q){fail++;continue}
  const txt=q.question+q.choices.join()+q.explanation+(q.fig||'');
  const err=[];if(/NaN|undefined|Infinity|null/.test(txt))err.push('NaN/undefined');
  if(!(q.answer>=1&&q.answer<=5))err.push('answer');
  if(err.length){bad++;if(bad<6)console.log(g.id,err,q.question.slice(0,80),q.choices)}
  ok++;p[q.answer]++;pos[q.answer]++}
 console.log(g.id.padEnd(10),'ok',ok,'fail',fail,'pos',p.slice(1).join('/'));
 if(fail>N*0.02)bad++}
console.log('total pos',pos.slice(1).join('/'),'bad',bad);process.exit(bad?1:0);
