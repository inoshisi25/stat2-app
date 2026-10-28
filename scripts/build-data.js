// data/questions.json を検証し、ブラウザ用の data/questions.js を生成する
// 使い方: node scripts/build-data.js
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','data');
const qs=JSON.parse(fs.readFileSync(path.join(dir,'questions.json'),'utf8'));
const er=[],ids=new Set();
qs.forEach((q,i)=>{
  const at=`#${i+1}(${q.id})`;
  if(!q.id||ids.has(q.id))er.push(`${at}: idが空または重複`);ids.add(q.id);
  if(!q.field||!q.question)er.push(`${at}: field/questionが空`);
  if(!Array.isArray(q.choices)||q.choices.length<2)er.push(`${at}: choicesが不正`);
  else if(new Set(q.choices).size!==q.choices.length)er.push(`${at}: 選択肢が重複`);
  if(!Number.isInteger(q.answer)||q.answer<1||q.answer>(q.choices||[]).length)er.push(`${at}: answerが範囲外`);
});
if(er.length){console.error(er.join('\n'));process.exit(1)}
fs.writeFileSync(path.join(dir,'questions.js'),'// 自動生成ファイル(編集は questions.json に対して行い、node scripts/build-data.js を実行)\nwindow.STAT2_QUESTIONS='+JSON.stringify(qs)+';\n');
const by={};qs.forEach(q=>by[q.field]=(by[q.field]||0)+1);
console.log(`${qs.length}問を書き出しました`);for(const[k,v]of Object.entries(by))console.log(`  ${k}: ${v}`);
