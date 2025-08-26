// Helper: uniqueify duplicate names
function normalizeStudents(lines){
  const counts = {};
  const out = [];
  for(let raw of lines){
    const s = raw.trim();
    if(!s) continue;
    counts[s] = (counts[s]||0) + 1;
    if(counts[s] > 1) out.push(s + ' (' + counts[s] + ')');
    else out.push(s);
  }
  return out;
}

// Pair key
function pairKey(a,b){ return a < b ? a+'||'+b : b+'||'+a }

// Score for a group
function groupScore(group, pairCounts){
  let s = 0;
  for(let i=0;i<group.length;i++)
    for(let j=i+1;j<group.length;j++)
      s += (pairCounts[pairKey(group[i],group[j])]||0);
  return s;
}

// Build day
function buildDay(students, tableSizes, pairCounts, trials=400){
  let best = null; let bestScore = Infinity;
  for(let t=0;t<trials;t++){
    const remaining = students.slice();
    shuffle(remaining);
    const groups = [];
    let ok = true; let score = 0;
    for(const size of tableSizes){
      if(remaining.length < size){ ok=false; break }
      let candidates = [];
      if(remaining.length <= 10){
        candidates = combinations(remaining, size);
      } else {
        const seen = new Set();
        let tries = 120;
        while(seen.size < 120 && tries-- > 0){
          const pick = sampleWithoutReplace(remaining, size);
          const key = pick.slice().sort().join('||');
          if(!seen.has(key)){ seen.add(key); candidates.push(pick) }
        }
      }
      if(candidates.length === 0){ ok=false; break }
      candidates.sort((a,b) => groupScore(a,pairCounts) - groupScore(b,pairCounts));
      const chosen = candidates[0];
      score += groupScore(chosen,pairCounts);
      groups.push(chosen.slice());
      for(const name of chosen){ 
        const idx = remaining.indexOf(name); 
        if(idx>=0) remaining.splice(idx,1) 
      }
    }
    if(ok && score < bestScore){ bestScore = score; best = groups; if(bestScore===0) break }
  }
  return {groups: best, score: bestScore};
}

// Generate schedule
function generateSchedule(students, days, tableSizes){
  const pairCounts = {};
  const schedule = [];
  for(let d=0; d<days; d++){
    const res = buildDay(students, tableSizes, pairCounts, 700);
    if(!res.groups) break;
    schedule.push(res);
    for(const g of res.groups){
      for(let i=0;i<g.length;i++) 
        for(let j=i+1;j<g.length;j++){
          const k = pairKey(g[i],g[j]); 
          pairCounts[k] = (pairCounts[k]||0) + 1;
        }
    }
  }
  return schedule;
}

// Utilities
function combinations(arr, k){
  const res = [];
  function go(start, cur){
    if(cur.length===k){ res.push(cur.slice()); return }
    for(let i=start;i<arr.length;i++){ cur.push(arr[i]); go(i+1,cur); cur.pop() }
  }
  go(0,[]); return res;
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } }
function sampleWithoutReplace(arr, k){ const pool = arr.slice(); shuffle(pool); return pool.slice(0,k) }

// Visual drawing
const canvas = document.getElementById('canvas');
function renderDay(groups, dayIndex, score){
  canvas.innerHTML = '';
  const dayHeader = document.createElement('h3');
  dayHeader.textContent = 'Dia ' + (dayIndex + 1);
  dayHeader.style.marginBottom = '20px';
  dayHeader.style.textAlign = 'center';
  dayHeader.style.color = 'var(--primary)';
  canvas.appendChild(dayHeader);
  const scoreEl = document.getElementById('scoreInfo'); 
  scoreEl.textContent = 'Score: '+score;

  for(let i=0;i<groups.length;i++){
    const g = groups[i];
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    const title = document.createElement('div');
    title.className = 'table-title';
    title.textContent = 'Mesa ' + (i+1);
    tableContainer.appendChild(title);
    const membersContainer = document.createElement('div');
    membersContainer.className = 'table-members';
    for(let k=0;k<g.length;k++){
      const member = document.createElement('div');
      member.className = 'member-card';
      member.textContent = g[k];
      membersContainer.appendChild(member);
    }
    tableContainer.appendChild(membersContainer);
    canvas.appendChild(tableContainer);
  }
}

// Wire UI
let currentSchedule = null; 
let currentDay = 0;

document.getElementById('generateBtn').addEventListener('click', ()=>{
  const raw = document.getElementById('studentsInput').value.split('\n');
  const students = normalizeStudents(raw);
  if(students.length < 5){ alert('Precisa ter ao menos 5 alunos'); return }
  const total = students.length;
  const base = Math.floor(total / 5);
  const rem = total % 5;
  const sizes = new Array(5).fill(base).map((v,i)=> v + (i<rem?1:0));
  const days = parseInt(document.getElementById('daysCount').value||6,10);
  document.getElementById('generateBtn').disabled = true; 
  document.getElementById('generateBtn').textContent='Gerando...';
  setTimeout(()=>{
    currentSchedule = generateSchedule(students, days, sizes);
    currentDay = 0;
    if(currentSchedule.length===0){ 
      alert('Não foi possível gerar rodízio com os parâmetros. Tente menos dias.'); 
    } else {
      renderDay(currentSchedule[currentDay].groups, currentDay, currentSchedule[currentDay].score);
      document.getElementById('dayLabel').textContent = 'Dia '+(currentDay+1);
    }
    document.getElementById('generateBtn').disabled = false; 
    document.getElementById('generateBtn').textContent='Gerar rodízio';
  }, 50);
});

document.getElementById('prevDay').addEventListener('click', ()=>{
  if(!currentSchedule) return; 
  currentDay = Math.max(0,currentDay-1); 
  renderDay(currentSchedule[currentDay].groups, currentDay, currentSchedule[currentDay].score); 
  document.getElementById('dayLabel').textContent='Dia '+(currentDay+1);
});

document.getElementById('nextDay').addEventListener('click', ()=>{
  if(!currentSchedule) return; 
  currentDay = Math.min(currentSchedule.length-1,currentDay+1); 
  renderDay(currentSchedule[currentDay].groups, currentDay, currentSchedule[currentDay].score); 
  document.getElementById('dayLabel').textContent='Dia '+(currentDay+1);
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  const instruction = document.createElement('div');
  instruction.style.textAlign = 'center';
  instruction.style.padding = '40px 20px';
  instruction.style.color = '#6c757d';
  instruction.innerHTML = '<p>Clique em "Gerar rodízio" para criar a distribuição de mesas.</p>';
  canvas.appendChild(instruction);
});
