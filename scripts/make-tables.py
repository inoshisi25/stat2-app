# 付表(数表)を生成して data/tables.js に書き出す。要 scipy: python3 scripts/make-tables.py
import json, os
from scipy import stats
T = {}
# 標準正規分布の上側確率 Q(z)  z = 0.00 .. 3.49
T['normal'] = {'rows': [round(r/10, 1) for r in range(35)], 'cols': [c/100 for c in range(10)],
  'v': [[round(float(stats.norm.sf(r/10 + c/100)), 4) for c in range(10)] for r in range(35)]}
# 標準正規分布の上側パーセント点
T['zq'] = {str(a): round(float(stats.norm.isf(a)), 3) for a in [0.1, 0.05, 0.025, 0.01, 0.005]}
dfs = list(range(1, 31)) + [40, 60, 120]
T['t'] = {'alpha': [0.1, 0.05, 0.025, 0.01, 0.005], 'df': dfs + ['∞'],
  'v': [[round(float(stats.t.isf(a, d)), 3) for a in [0.1, 0.05, 0.025, 0.01, 0.005]] for d in dfs] +
       [[round(float(stats.norm.isf(a)), 3) for a in [0.1, 0.05, 0.025, 0.01, 0.005]]]}
ca = [0.995, 0.99, 0.975, 0.95, 0.9, 0.1, 0.05, 0.025, 0.01, 0.005]
cd = list(range(1, 31)) + [40, 50, 60, 80, 100]
T['chi2'] = {'alpha': ca, 'df': cd, 'v': [[round(float(stats.chi2.isf(a, d)), 3) for a in ca] for d in cd]}
d1 = list(range(1, 11)) + [12, 15, 20]
d2 = list(range(1, 31)) + [40, 60, 120]
for a in [0.05, 0.025]:
  T['f' + str(a)[2:]] = {'alpha': a, 'df1': d1, 'df2': d2, 'v': [[round(float(stats.f.isf(a, m, n)), 2) for m in d1] for n in d2]}
out = os.path.join(os.path.dirname(__file__), '..', 'data', 'tables.js')
open(out, 'w').write('// 自動生成ファイル(scripts/make-tables.py)\nwindow.STAT2_TABLES=' + json.dumps(T, ensure_ascii=False) + ';\n')
print('ok', os.path.getsize(out))
