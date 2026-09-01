/* 状态：本地 localStorage 为主存储，云端同步是叠加层（sync.js） */
var LS_KEY = "hmgd_v1";

function emptyState(){
  return {
    v: 2,
    cursor: 0,        // 已发放到 BANK 的第几个字
    mastered: {},     // 字 -> {d:首次学会日期, n:累计念对次数}
    wrongBook: {},    // 字 -> {since:进库日期, miss:累计错次}  修理站
    everWrong: {},    // 字 -> true  出库后保留的暗标记，周末抽取权重×3
    days: {},         // 日期 -> {mode, chars:[], done:[], plane:null}
    jets: 0,          // 累计出厂战斗机数，用于编号
    weekCounts: {},   // "2026-W35" -> 该周停了几架
    lastWeek: "",     // 上次打开时所在的周，用来判断航母该出航了
    judge: "",        // "" 自动 / "voice" 自己念 / "parent" 妈妈判定
    fleet: []         // 已出航的航母 [{week, count, full}]
  };
}

var state = loadState();

function loadState(){
  try{
    var raw = localStorage.getItem(LS_KEY);
    if(raw){
      var s = JSON.parse(raw);
      if(s && s.v === 2) return s;
    }
  }catch(e){}
  return emptyState();
}

function saveState(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
  if(typeof onStateSaved === "function") onStateSaved();
}

function resetState(){
  state = emptyState();
  saveState();
}

/* ---------- 日期 ---------- */
function todayKey(){ return dateKey(new Date()); }

function dateKey(d){
  return d.getFullYear() + "-" +
    String(d.getMonth()+1).padStart(2,"0") + "-" +
    String(d.getDate()).padStart(2,"0");
}

/* 周一=1 … 周日=7；支持 ?d=6 强制某天，方便测试 */
var forcedDay = null;
try{
  var m = location.search.match(/[?&]d=([1-7])/);
  if(m) forcedDay = parseInt(m[1], 10);
}catch(e){}

function weekday(){
  if(forcedDay) return forcedDay;
  var d = new Date().getDay();
  return d === 0 ? 7 : d;
}

function isWeekend(){ return weekday() >= 6; }

/* 白天还是晚上：6 点到 18 点算白天；?night=1 / ?day=1 可强制，方便看效果 */
var forcedNight = null;
try{
  if(/[?&]night=1/.test(location.search)) forcedNight = true;
  if(/[?&]day=1/.test(location.search)) forcedNight = false;
}catch(e){}
function isNight(){
  if(forcedNight !== null) return forcedNight;
  var h = new Date().getHours();
  return h < 6 || h >= 18;
}

/* ISO 周标识，用于"本周五天全勤" */
function weekKey(){
  var d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - weekday());
  var jan1 = new Date(d.getFullYear(), 0, 1);
  var w = Math.ceil(((d - jan1) / 86400000 + 1) / 7);
  return d.getFullYear() + "-W" + String(w).padStart(2,"0");
}

/* 本周一到周五各自的日期 key */
function weekdayKeys(){
  var now = new Date();
  var mon = new Date(now);
  mon.setDate(now.getDate() - (weekday() - 1));
  var out = [];
  for(var i=0;i<5;i++){
    var d = new Date(mon);
    d.setDate(mon.getDate() + i);
    out.push(dateKey(d));
  }
  return out;
}

/* 任意一周的七天日期 key；offset 0 = 本周，-1 = 上一周 */
function weekKeysOffset(offset){
  var now = new Date();
  var mon = new Date(now);
  mon.setDate(now.getDate() - (weekday() - 1) + (offset || 0) * 7);
  var out = [];
  for(var i=0;i<7;i++){
    var d = new Date(mon);
    d.setDate(mon.getDate() + i);
    out.push(dateKey(d));
  }
  return out;
}
function weekKeys(){ return weekKeysOffset(0); }


function masteredCount(){ return Object.keys(state.mastered).length; }
function wrongList(){ return Object.keys(state.wrongBook); }
function fleetFull(){ return state.fleet.filter(function(x){ return x.full; }).length; }
