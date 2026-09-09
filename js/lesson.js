/* 选字与判定：这一层是纯逻辑，不碰 DOM */
var PER_DAY = 10;

/* 今天该学第几组：按开学日往后数，跟存储无关 */
/* 当前在学哪一天：默认今天；补打卡/提前学时切到别的日子 */
var activeDay = null;
function activeKey(){ return activeDay || todayKey(); }
function setActiveDay(key){ activeDay = (key && key !== todayKey()) ? key : null; }

function weekdayOf(key){
  var p = key.split("-");
  var w = new Date(+p[0], +p[1] - 1, +p[2]).getDay();
  return w === 0 ? 7 : w;
}

/* 某一天该学第几组：按开学日往后数 */
function groupFor(key){ return schoolDayIndex(key) % Math.ceil(CHARS.length / PER_DAY); }
function todayGroup(){ return groupFor(activeKey()); }

/* 某一天（周一到周五）那十个字，周末返回 null（周末是复习，字要临时抽） */
function charsForDate(key){
  if(weekdayOf(key) >= 6) return null;
  var g = groupFor(key);
  return CHARS.slice(g * PER_DAY, g * PER_DAY + PER_DAY);
}

function todayLesson(){
  var key = activeKey();
  if(!state.days[key]){
    state.days[key] = newLesson(key);
    saveState();          // 立刻落盘：刷新页面不会重新抽一组字
  }
  return state.days[key];
}

function shuffle(a){
  for(var i=a.length-1;i>0;i--){
    var j = Math.floor(Math.random()*(i+1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function buildWeightedPool(exclude){
  var pool = [];
  Object.keys(state.mastered).forEach(function(c){
    if(exclude.indexOf(c) >= 0) return;
    var times = state.everWrong[c] ? 3 : 1;
    for(var k=0;k<times;k++) pool.push(c);
  });
  return pool;
}

/* 从修理站挑 n 个：还没念对过的排前面，已修好的随机轮换。
   修理站的字永远不出库，所以攒多了要靠随机保证每个字都轮得到。 */
function pickFromWrongBook(n){
  var list = wrongList();
  var todo = [], done = [];
  list.forEach(function(c){
    (state.wrongBook[c].fixed ? done : todo).push(c);
  });
  return shuffle(todo).concat(shuffle(done)).slice(0, n);
}

/* 按进站日期分组，新的在前 */
function wrongBookByDay(){
  var map = {};
  wrongList().forEach(function(c){
    var d = state.wrongBook[c].since || "";
    (map[d] = map[d] || []).push(c);
  });
  return Object.keys(map).sort().reverse().map(function(d){
    return { date: d, chars: map[d] };
  });
}

/* 周末：修理站优先 → 曾错过的（权重×3）→ 已学字随机补齐 */
function pickReviewChars(n){
  var out = pickFromWrongBook(n);
  if(out.length >= n) return out.slice(0, n);
  var pool = buildWeightedPool(out);
  shuffle(pool);
  for(var i=0;i<pool.length && out.length<n;i++){
    if(out.indexOf(pool[i]) < 0) out.push(pool[i]);
  }
  return out;
}

/* 周一到周五：直接取今天这一组的十个字 */
function pickNewChars(n){
  var g = todayGroup();
  return CHARS.slice(g * n, g * n + n);
}

function newLesson(key){
  key = key || activeKey();
  var review = weekdayOf(key) >= 6;
  var chars = review ? pickReviewChars(PER_DAY) : (charsForDate(key) || []);
  if(!chars.length && review){ chars = pickNewChars(PER_DAY); review = false; }
  if(!chars.length){ chars = pickReviewChars(PER_DAY); review = true; }
  if(!review && chars.length) state.cursor = Math.max(state.cursor || 0, CHARS.indexOf(chars[chars.length - 1]) + 1);
  var l = { mode: review ? "review" : "new", chars: chars, done: [], log: [],
            queue: chars.slice(), miss: {}, plane: null, rounds: 1, jetNo: 0 };
  saveState();
  return l;
}

/* 当天再来一遍：同样十个字打乱重练，巩固次数 +1 */
function replayLesson(){
  var l = todayLesson();
  if(l.queue.length || !l.chars.length) return false;
  l.rounds = (l.rounds || 1) + 1;
  l.queue = shuffle(l.chars.slice());
  l.done = [];
  l.log = [];
  l.miss = {};
  saveState();
  return true;
}

/* 巩固星数：练完一遍才给一颗，最多三颗；正在练的这遍不算 */
function lessonStars(l){
  var r = (l.rounds || 1) - 1;
  if(l.queue && l.queue.length) r -= 1;
  return Math.min(3, Math.max(0, r));
}

function allCharsLearned(){ return masteredCount() >= CHARS.length; }

/* 今天是第几个学习日：按字库已经发到哪儿算 */
function dayNumber(){ return todayGroup() + 1; }

function currentChar(){
  var l = todayLesson();
  return l.queue.length ? l.queue[0] : null;
}

function lessonFinished(){
  var l = todayLesson();
  return l.chars.length > 0 && l.queue.length === 0;
}

/* 走过的字数（念对的 + 没念对的），飞机零件按这个画 */
function passedCount(l){ return l.chars.length - l.queue.length; }

/* ---------- 判定 ---------- */
function normalize(t){
  return (t || "").replace(/[\s，。！？、,.!?~·]/g, "");
}

function isMatch(transcript, c){
  var t = normalize(transcript);
  if(!t) return false;
  var e = BY_CHAR[c];
  if(t.indexOf(c) >= 0) return true;
  if(e && e.word && t.indexOf(e.word) >= 0) return true;
  if(e && e.sentence && t.indexOf(normalize(e.sentence)) >= 0) return true;
  return soundsLike(t, c);
}

/* 同音兜底：识别结果里只要有一个字跟目标字读音相同就算念对。
   语音识别把「水」听成「谁」「税」这类是常事，字面比对会全判错。 */
function soundsLike(t, c){
  var target = PY[c];
  if(!target) return false;
  for(var i = 0; i < t.length; i++){
    if(sharePinyin(PY[t.charAt(i)], target)) return true;
  }
  return false;
}

/* ---------- 念对 ---------- */
/* 修理站和定向复习用这个：只更新掌握程度与修理站，不动当天那一课的进度 */
function markRightLoose(c){
  if(!c || !BY_CHAR[c]) return;
  var m = state.mastered[c];
  state.mastered[c] = { d: m ? m.d : todayKey(), n: (m ? m.n : 0) + 1 };
  // 标成"已修好"，但绝不出库 —— 进过修理站的字要一直留着反复复习
  if(state.wrongBook[c]) state.wrongBook[c].fixed = true;
  saveState();
}

function markRight(c){
  if(!c || !BY_CHAR[c]) return { landed:false, plane:null, name:"", full:false, round:1, stars:0 };
  var l = todayLesson();
  if(l.done.indexOf(c) < 0) l.done.push(c);
  (l.log = l.log || []).push(1);
  l.queue = l.queue.filter(function(x){ return x !== c; });
  markRightLoose(c);
  saveState();
  return checkDayComplete();
}

/* 定向复习里念错：直接进修理站，不动当天那一课 */
function markWrongLoose(c){
  if(!c || !BY_CHAR[c]) return;
  putInWrongBook(c);
  saveState();
}

/* 进修理站。一旦进来，这一周都不会因为念对而出去 —— 周末必须再练一遍。
   每周一自动清空（syncWeek 里做），所以不会越滚越多。 */
function putInWrongBook(c){
  var old = state.wrongBook[c];
  state.wrongBook[c] = {
    since: old ? old.since : todayKey(),
    miss: (old ? old.miss : 0) + 1,
    fixed: false
  };
  state.everWrong[c] = true;
}


/* ---------- 念错 / 不认识 ---------- */
/* 一轮里每个字只出现一次：没念对就进修理站，直接换下一个，不再排回队尾 */
function markWrong(c){
  var blank = { landed:false, plane:null, name:"", full:false, round:1, stars:0 };
  if(!c || !BY_CHAR[c]) return blank;
  var l = todayLesson();
  if(l.queue.indexOf(c) < 0) return blank;
  l.miss[c] = (l.miss[c] || 0) + 1;
  (l.log = l.log || []).push(0);
  putInWrongBook(c);
  l.queue = l.queue.filter(function(x){ return x !== c; });
  saveState();
  return checkDayComplete();
}
