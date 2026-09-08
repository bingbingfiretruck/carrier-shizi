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
    savedAt: 0,       // 上次保存时间，两份备份里挑新的
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

var storageBroken = false;

function saveState(){
  state.savedAt = new Date().getTime();
  var json = JSON.stringify(state);
  try{ localStorage.setItem(LS_KEY, json); storageBroken = false; }
  catch(e){ storageBroken = true; }     // 浏览器不让存（无痕/禁 Cookie），界面要大声提示
  idbSave(json);
  if(typeof onStateSaved === "function") onStateSaved();
}

/* 探测这个浏览器到底存不存得住东西 */
function storageWorks(){
  try{ localStorage.setItem("__" + LS_KEY, "1"); localStorage.removeItem("__" + LS_KEY); return true; }
  catch(e){ return false; }
}

/* ---------- 第二份备份：IndexedDB ----------
   有些浏览器清 localStorage 不清 IndexedDB，两边都存，谁新用谁 */
var IDB_STORE = "kv";
function idbOpen(cb){
  try{
    var req = indexedDB.open(LS_KEY + "_db", 1);
    req.onupgradeneeded = function(){ req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = function(){ cb(req.result); };
    req.onerror = function(){ cb(null); };
  }catch(e){ cb(null); }
}
function idbSave(json){
  idbOpen(function(db){
    if(!db) return;
    try{ db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(json, LS_KEY); }catch(e){}
  });
}
function idbLoad(cb){
  idbOpen(function(db){
    if(!db) return cb(null);
    try{
      var r = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(LS_KEY);
      r.onsuccess = function(){ cb(r.result || null); };
      r.onerror = function(){ cb(null); };
    }catch(e){ cb(null); }
  });
}

/* 启动时看备份里有没有更新的记录，有就用备份 */
function restoreFromBackup(cb){
  idbLoad(function(json){
    try{
      var s = json ? JSON.parse(json) : null;
      if(s && s.v === 2 && (s.savedAt || 0) > (state.savedAt || 0)) state = s;
    }catch(e){}
    cb();
  });
}

/* 开机自检：真的能存能读吗 */
function storageWorks(){
  try{
    localStorage.setItem("__t", "1");
    var ok = localStorage.getItem("__t") === "1";
    localStorage.removeItem("__t");
    return ok;
  }catch(e){ return false; }
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

/* 开学日（固定），今天是开学第几个上学日就学第几组字。
   跟存储无关，所以就算浏览器把记录清了，明天也绝不会再是同样十个字。 */
var EPOCH = new Date(2026, 8, 7);            // 2026-09-07 周一
function schoolDayIndex(key){
  var p = (key || todayKey()).split("-");
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  var days = Math.round((d - EPOCH) / 86400000);
  if(days < 0) days = 0;
  return Math.floor(days / 7) * 5 + Math.min(days % 7, 4);   // 周六日不往前走
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
