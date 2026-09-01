/* 舰队：一天一架战斗机，一周一艘航母（甲板七个位），出航后进舰队 */

var DECK_SIZE = 7;

/* 今天这架飞机已经画出几个零件 */
function partsDrawn(){
  var l = todayLesson();
  var per = l.chars.length || 10;
  return Math.round(passedCount(l) / per * JET_PARTS.length);
}
function nextPartName(){
  var i = partsDrawn();
  return i < JET_PARTS.length ? JET_PARTS[i].name : "";
}

/* 本周甲板：周一到周日七个位，打过卡的位上有飞机 */
function deckSlots(){
  return weekKeys().map(function(k){ return stampedOn(k); });
}

/* 甲板每个位的飞机：涂装编号 + 巩固星数；没打卡的是 null */
function deckJets(){
  return weekKeys().map(function(k){
    if(!stampedOn(k)) return null;
    var d = state.days[k];
    return { variant: Math.max(0, (d.jetNo || 1) - 1), stars: lessonStars(d) };
  });
}

/* 今天在甲板上的位次 0..6 */
function todayDeckIndex(){ return weekday() - 1; }
function deckCount(){
  return deckSlots().filter(Boolean).length;
}
function deckFull(){ return deckCount() >= DECK_SIZE; }

/* 跨周：上一艘航母满编与否都出航，进舰队 */
function syncWeek(){
  var wk = weekKey();
  if(!state.lastWeek){ state.lastWeek = wk; saveState(); return; }
  if(state.lastWeek === wk) return;
  var n = state.weekCounts[state.lastWeek] || 0;
  if(n > 0) state.fleet.push({ week: state.lastWeek, count: n, full: n >= DECK_SIZE });
  state.lastWeek = wk;
  saveState();
}

function jetName(n){ return "战斗机 " + n + " 号"; }

/* 明天那架的出厂编号：今天已完成就是下一架，还没完成就再往后一架 */
function tomorrowJetNo(){ return state.jets + (todayLesson().plane ? 1 : 2); }

/* ---------- 当天完成 ---------- */
/* 每练完一遍都要降落一次。第一遍是新飞机出厂，之后是同一架巡逻归来加星 */
function checkDayComplete(){
  var reward = { landed:false, plane:null, name:"", full:false, round:1, stars:0 };
  var l = todayLesson();
  if(l.queue.length > 0 || l.chars.length === 0) return reward;
  reward.landed = true;
  reward.round = l.rounds || 1;
  if(!l.plane){
    state.jets++;
    l.plane = jetName(state.jets);
    l.jetNo = state.jets;
    reward.plane = l.plane;
    var wk = weekKey();
    state.weekCounts[wk] = (state.weekCounts[wk] || 0) + 1;
    if(state.weekCounts[wk] >= DECK_SIZE) reward.full = true;
  }
  reward.name = l.plane;
  reward.stars = lessonStars(l);
  saveState();
  return reward;
}

/* 某天是否打过卡：以"出过飞机"为准，这样重学一遍时甲板上的飞机不会消失 */
function stampedOn(key){
  var d = state.days[key];
  return !!(d && d.plane);
}
