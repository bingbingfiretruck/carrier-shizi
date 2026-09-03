/* 渲染与交互 */
var el = function(id){ return document.getElementById(id); };
var practice = null;          // 修理站单独练习时的队列
var dayReview = null;         // 定向复习某一天：{key,label,chars,queue,miss}
var histOffset = 0;           // 学过的字面板翻到第几周，0 = 本周
var listening = null;
var taughtCard = "";          // 已教读过的字，避免重复朗读

function activeChar(){
  if(dayReview) return dayReview.queue.length ? dayReview.queue[0] : null;
  if(practice) return practice.length ? practice[0] : null;
  return currentChar();
}
function activeMode(){
  if(dayReview) return "dayreview";
  return practice ? "practice" : todayLesson().mode;
}

/* 当前这一轮的进度，今天的课 / 定向复习共用 */
function sessionProgress(){
  if(dayReview)
    return { done: dayReview.chars.length - dayReview.queue.length,
             total: dayReview.chars.length, log: dayReview.log || [] };
  var l = todayLesson();
  return { done: passedCount(l), total: l.chars.length, log: l.log || [] };
}

/* ---------- 顶部 ---------- */
var DAY_NAMES = ["周一","周二","周三","周四","周五","周六","周日"];
var DAY_COLORS = ["#FF8A80","#FFBE7B","#FFD166","#A8E6CF","#7FD8D2","#8ED6EF","#C9B6E4"];
var SEG_COLORS = ["#FF8A80","#FFA46B","#FFD166","#D8E064","#A8E6CF",
                  "#7FD8D2","#8ED6EF","#9BB8F0","#C9B6E4","#FFAFCC"];

function renderTop(){
  var chip = el("daychip");
  chip.textContent = DAY_NAMES[weekday() - 1];
  chip.className = "daychip";
  chip.style.background = DAY_COLORS[weekday() - 1];
  el("tasktitle").textContent = taskTitle(todayLesson());
  var p = sessionProgress();
  el("counter").textContent = p.done + " / " + p.total;
  renderSegs(p);
}

/* 十格彩色进度条，念对一个亮一格 */
/* 念对的格子上彩色，没念对的上粉色，一眼看出今天哪几个字没过 */
function renderSegs(p){
  var box = el("segs");
  box.innerHTML = "";
  var total = p.total || 10;
  var log = p.log || [];
  for(var i = 0; i < total; i++){
    var d = document.createElement("i");
    if(i < p.done){
      var ok = log.length > i ? log[i] : 1;
      d.style.background = ok ? SEG_COLORS[i % SEG_COLORS.length] : "#FFC2CE";
    }
    box.appendChild(d);
  }
}

function taskTitle(l){
  if(dayReview) return "复习" + dayReview.label + "学的字";
  if(practice) return "修理站";
  var round = l.rounds || 1;
  if(round > 1) return "再巩固一遍 · 第 " + round + " 遍";
  if(l.mode === "review") return allCharsLearned() ? "全部学完 · 复习" : "复习日 · 把不会的修好";
  return "第 " + dayNumber() + " 天 · 画一架战斗机";
}

/* ---------- 字卡 ---------- */
function renderCard(){
  var c = activeChar();
  if(!c){ renderDone(); return; }
  var e = BY_CHAR[c];
  el("slab").style.display = "";
  el("glyph").textContent = c;
  el("hint").textContent = e.word;
  el("sentence").textContent = e.sentence || "";
  renderControls();
  autoTeach(c);
}

/* 学新字先教读：先说字怎么念，再组词；复习和巩固不教，那是考 */
function autoTeach(c){
  if(activeMode() !== "new") return;
  if((todayLesson().rounds || 1) > 1) return;
  if(taughtCard === c) return;
  taughtCard = c;
  setStatus("听一遍，然后跟着念");
  teach(c);
}

/* ---------- 画板 ---------- */
function todayVariant(){
  var l = todayLesson();
  return l.jetNo ? l.jetNo - 1 : state.jets;
}

function boardVariant(){
  if(dayReview){
    var d = state.days[dayReview.key] || {};
    return Math.max(0, (d.jetNo || 1) - 1);
  }
  return todayVariant();
}

function renderJet(animate){
  var p = sessionProgress();
  var n = p.total ? Math.round(p.done / p.total * JET_PARTS.length) : 0;
  el("jet").innerHTML = jetSVG(n, n >= JET_PARTS.length, animate, boardVariant());
  var next = n < JET_PARTS.length ? JET_PARTS[n].name : "";
  el("boardtip").textContent = next ? "再念对一个，画出" + next : "画好了，可以起飞";
}

/* voice = 小朋友自己念给程序听；parent = 妈妈按对错 */
function judgeMode(){
  if(state.judge === "parent") return "parent";
  if(state.judge === "voice" && SR) return "voice";
  return speechSupported() ? "voice" : "parent";
}

function renderControls(){
  var box = el("controls");
  box.innerHTML = "";
  if(judgeMode() === "voice") renderVoiceControls(box);
  else renderParentControls(box);
  box.appendChild(modeToggle());
  if(dayReview) box.appendChild(subButton("先不复习了，回到今天", exitDayReview));
}

function modeToggle(){
  var row = document.createElement("div");
  row.className = "modebar";
  var isParent = judgeMode() === "parent";
  var b = document.createElement("button");
  b.className = "modebtn" + (isParent ? " parent" : "");
  b.textContent = isParent ? "妈妈判定中 · 换成自己念" : "自己念给它听 · 换成妈妈判定";
  b.onclick = function(){
    state.judge = isParent ? "voice" : "parent";
    resetSpeechFallback();
    saveState();
    renderControls();
  };
  row.appendChild(b);
  if(!SR && !isParent){
    var t = document.createElement("div");
    t.className = "modenote";
    t.textContent = "这台设备不支持语音识别";
    row.appendChild(t);
  }
  return row;
}

function renderVoiceControls(box){
  var main = document.createElement("button");
  main.className = "btn-main";
  main.textContent = activeMode() === "new" ? "跟着念" : "念给它听";
  main.onclick = startListening;
  box.appendChild(main);
  box.appendChild(subRow());
}

function renderParentControls(box){
  var tip = document.createElement("div");
  tip.className = "status";
  tip.textContent = "孩子念完，你来点";
  box.appendChild(tip);
  var row = document.createElement("div");
  row.className = "judge";
  row.innerHTML = '<button class="yes">念对了</button><button class="no">还不会</button>';
  row.querySelector(".yes").onclick = function(){ onRight(); };
  row.querySelector(".no").onclick = function(){ onWrong(); };
  box.appendChild(row);
  box.appendChild(subRow());
}

function subRow(){
  var row = document.createElement("div");
  row.className = "btn-row";
  var again = document.createElement("button");
  again.className = "btn-sub";
  again.textContent = "再听一遍";
  again.onclick = function(){ teach(activeChar()); };
  var giveup = document.createElement("button");
  giveup.className = "btn-sub danger";
  giveup.textContent = "不认识";
  giveup.onclick = function(){ onWrong(); };
  row.appendChild(again);
  row.appendChild(giveup);
  return row;
}

function setStatus(t){ el("status").textContent = t || ""; }

/* ---------- 听 ---------- */
var listenStart = 0;

function startListening(){
  var c = activeChar();
  if(!c || listening) return;
  listenStart = new Date().getTime();
  var btn = document.querySelector(".btn-main");
  if(btn){
    btn.classList.add("listening");
    btn.textContent = "在听… 说完等一下";
    btn.onclick = stopListening;
  }
  setStatus("大声念出来，念对了自动进下一个");
  setTimeout(function(){
    var b = document.querySelector(".btn-main.listening");
    if(b && listening) b.textContent = "在听… 点这里停";
  }, 2000);
  listening = listen(function(heard){
    if(!heard.some(function(t){ return isMatch(t, c); })){ showHeard(heard); return false; }
    listening = null;
    setStatus("念对了！");
    onRight();
    return true;
  }, function(reason, heard){
    listening = null;
    onListenEnd(reason, heard);
  });
}

/* 主动叫停：不算错，回到可以再念的状态。
   刚开始听的两秒内点到不算停，免得着急连点两下反而把麦克风关了 */
function stopListening(){
  if(new Date().getTime() - listenStart < 2000) return;
  if(listening) listening.cancel();
  listening = null;
  setStatus("");
  renderControls();
}

/* 把听到的显示出来，大人才知道是没听见还是听错了 */
function showHeard(heard){
  var t = (heard[heard.length - 1] || "").trim();
  if(t) setStatus("听到「" + t + "」…");
}

/* 一个字只给一次机会：这次没念对，进修理站，换下一个 */
function onListenEnd(reason, heard){
  if(reason === "denied") return forceParentMode("浏览器不让用麦克风，已经换成妈妈判定");
  if(reason === "unsupported") return forceParentMode("这台设备不支持语音，已经换成妈妈判定");
  if(reason === "error") return forceParentMode("语音出错了，先用妈妈判定");
  var t = heard.length ? (heard[heard.length - 1] || "").trim() : "";
  setStatus(t ? "听到「" + t + "」，先放进修理站" : "没听到声音，先放进修理站");
  onWrong();
}

function forceParentMode(msg){
  state.judge = "parent";
  saveState();
  renderControls();
  setStatus(msg);
}

/* ---------- 判定结果 ---------- */
function onRight(){
  var c = activeChar();
  if(!c) return;
  sfxDrop();
  taughtCard = "";
  if(dayReview) return onRightDayReview(c);
  if(practice) return onRightPractice(c);
  var reward = markRight(c);
  renderTop();
  renderJet(true);
  if(reward && reward.landed){ setTimeout(function(){ showCelebrate(reward); }, 500); return; }
  setTimeout(renderAll, 260);
}

function onRightDayReview(c){
  dayReview.queue.shift();
  (dayReview.log = dayReview.log || []).push(1);
  markRightLoose(c);
  renderTop();
  renderJet(true);
  if(!dayReview.queue.length){ setTimeout(finishDayReview, 520); return; }
  setTimeout(renderAll, 260);
}

function onRightPractice(c){
  practice.shift();
  markRightLoose(c);
  setStatus("修好了");
  renderAll();
}

function onWrong(){
  var c = activeChar();
  if(!c) return;
  sfxNo();
  shakeSlab();
  taughtCard = "";
  if(dayReview) return onWrongDayReview(c);
  if(practice) return onWrongPractice(c);
  var reward = markWrong(c);
  renderTop();
  renderJet(true);
  if(reward && reward.landed){ setTimeout(function(){ showCelebrate(reward); }, 500); return; }
  setTimeout(renderAll, 260);
}

function shakeSlab(){
  var slab = el("slab");
  slab.classList.remove("shake");
  void slab.offsetWidth;
  slab.classList.add("shake");
}

function onWrongPractice(c){
  practice.shift();
  markWrongLoose(c);
  renderAll();
}

/* 定向复习里念错：进修理站，直接换下一个，一轮不重复 */
function onWrongDayReview(c){
  markWrongLoose(c);
  dayReview.log = dayReview.log || [];
  dayReview.log.push(0);
  dayReview.queue.shift();
  if(!dayReview.queue.length){ setTimeout(finishDayReview, 400); return; }
  renderAll();
}

/* 复习完这一天 → 那天的战斗机重新降落一次，并加一颗星 */
function finishDayReview(){
  if(!dayReview) return;
  var key = dayReview.key, label = dayReview.label, slot = dayReview.slot;
  var d = state.days[key];
  d.rounds = (d.rounds || 1) + 1;
  saveState();
  var jet = { variant: Math.max(0, (d.jetNo || 1) - 1), stars: Math.min(3, d.rounds - 1) };
  dayReview = null;
  renderExceptDeck();
  showCelebrate({ landed:true, name:d.plane || "战斗机", round:d.rounds, stars:jet.stars,
                  full:false, slot:slot, jet:jet, dayLabel:label });
}

/* ---------- 完工 ---------- */
function renderDone(){
  if(dayReview) return;
  el("slab").style.display = "none";
  el("boardtip").textContent = "";
  var l = todayLesson();
  var box = el("controls");
  box.innerHTML = "";
  box.appendChild(doneMessage(l));
  box.appendChild(bigButton("再学一遍这十个字", function(){
    if(replayLesson()){ taughtCard = ""; renderAll(); }
  }));
  if(wrongList().length){
    box.appendChild(subButton("去修理站（" + wrongList().length + "）", startPractice));
  }
  practice = null;
  setStatus("");
}

function doneMessage(l){
  var msg = document.createElement("div");
  msg.className = "status";
  var round = l.rounds || 1;
  msg.textContent = practice ? "修理站清空了" :
    (round > 1 ? "第 " + round + " 遍也过了，飞机加一颗星" : "今天的战斗机已经停上甲板");
  return msg;
}

function bigButton(text, fn){
  var b = document.createElement("button");
  b.className = "btn-main";
  b.textContent = text;
  b.onclick = fn;
  return b;
}
function subButton(text, fn){
  var row = document.createElement("div");
  row.className = "btn-row";
  var b = document.createElement("button");
  b.className = "btn-sub";
  b.textContent = text;
  b.onclick = fn;
  row.appendChild(b);
  return row;
}

function startPractice(){
  practice = pickFromWrongBook(10);
  taughtCard = "";
  renderAll();
}

function celebrateTitle(r){
  if(r.dayLabel) return r.dayLabel + "的字复习完了";
  return r.round > 1 ? "第 " + r.round + " 遍过了" : r.name + " 出厂";
}
function celebrateSub(r){
  if(r.full) return "七个位置全停满了，这艘航母满编出航！";
  if(r.dayLabel) return r.name + " 重新降落一次，拿第 " + r.stars + " 颗星";
  if(r.round > 1) return r.name + " 巡逻回来，再降落一次，拿第 " + r.stars + " 颗星";
  return "现在让它降落到甲板上";
}

function celebrateVariant(r){
  return r.jet ? r.jet.variant : todayVariant();
}

function showCelebrate(reward){
  sfxWin();
  var box = document.createElement("div");
  box.className = "celebrate";
  box.innerHTML = '<div class="cbox"><div class="big">' + celebrateTitle(reward) + '</div>' +
    '<div class="fly">' + jetSVG(JET_PARTS.length, true, false, celebrateVariant(reward)) + '</div>' +
    '<div class="sub">' + celebrateSub(reward) + '</div>' +
    '<button class="btn-main">降落</button></div>';
  box.querySelector("button").onclick = function(){
    box.remove();
    if(reward.full) pendingSail = true;
    renderExceptDeck();
    startLanding(typeof reward.slot === "number" ? reward.slot : todayDeckIndex(), reward.jet);
  };
  document.body.appendChild(box);
}

/* ---------- 降落长镜头 ----------
   8.6 秒：远景进场 → 镜头推近跟拍下滑 → 拉平触地扬烟 → 滑行减速 → 拉回全景 */
var LANDING_T = 6000;
var TOUCH = 0.60;                 // 触地时间点
var FULL_VIEW = [0, 0, 640, 250];
var CLOSE_W = 158;                // 特写时的镜头宽度，越小飞机越大

function startLanding(index, jetOverride){
  var i = typeof index === "number" ? index : todayDeckIndex();
  renderDeck(i, jetOverride);
  var g = document.querySelector(".carrier .landing");
  var svg = document.querySelector(".carrier");
  if(!g || !svg){ renderDeck(); return; }
  try{ el("carrier").scrollIntoView({ behavior:"smooth", block:"center" }); }catch(e){}
  setStatus("看它怎么降落");
  sfxLanding();
  landingGuard = setTimeout(function(){ finishLanding(svg); }, LANDING_T + 4000);
  runLanding(g, svg, DECK_X[i]);
}
var landingGuard = null;

function runLanding(g, svg, x){
  var t0 = null, phase = "";
  function frame(now){
    if(t0 === null) t0 = now;
    var p = Math.min(1, (now - t0) / LANDING_T);
    var f = flightAt(p, x);
    g.setAttribute("transform", deckTransform(f.x, f.y, f.rot));
    svg.setAttribute("viewBox", cameraAt(p, f).join(" "));
    phase = updateWheels(g, p, phase, f);
    if(p < 1) requestAnimationFrame(frame);
    else finishLanding(svg);
  }
  requestAnimationFrame(frame);
}

/* 飞行轨迹：从右上方远处缓缓下滑，触地后在甲板上滑行减速 */
function flightAt(p, x){
  var sx = x + 470, sy = -40, tx = x + 172;
  if(p < TOUCH){
    var q = p / TOUCH;
    return { x: sx + (tx - sx) * q, y: sy + (DECK_Y - sy) * smooth(q), rot: flareRot(q) };
  }
  var r = (p - TOUCH) / (1 - TOUCH);
  return { x: tx + (x - tx) * (1 - Math.pow(1 - r, 3.2)), y: DECK_Y, rot: 0 };
}
function smooth(t){ return t * t * (3 - 2 * t); }

/* 下滑时机头略低，快接地时抬头拉平，触地后归零 */
function flareRot(q){
  if(q < 0.72) return 7;
  if(q < 0.90) return 7 - (q - 0.72) / 0.18 * 13;
  return -6 + (q - 0.90) / 0.10 * 6;
}

/* 镜头：先全景，推近跟住飞机，停稳后拉回全景 */
function cameraAt(p, f){
  var z = zoomAt(p);
  var vw = FULL_VIEW[2] - (FULL_VIEW[2] - CLOSE_W) * z;
  var vh = vw * FULL_VIEW[3] / FULL_VIEW[2];
  var fx = FULL_VIEW[2] / 2, fy = FULL_VIEW[3] / 2;
  var cx = fx + (f.x + 4 - fx) * z;
  var cy = fy + (f.y + 18 - fy) * z;
  return [cx - vw / 2, cy - vh / 2, vw, vh];
}
function zoomAt(p){
  if(p < 0.04) return 0;
  if(p < 0.20) return smooth((p - 0.04) / 0.16);
  if(p < 0.82) return 1;
  return 1 - smooth((p - 0.82) / 0.18);
}

/* 轮子：进场空转 → 触地猛转 → 滑行渐慢 → 停住 */
function updateWheels(g, p, phase, f){
  var next = p < TOUCH ? "approach"
           : (p < TOUCH + 0.10 ? "touch" : (p < 0.90 ? "slowing" : "stopped"));
  if(next === phase) return phase;
  g.setAttribute("class", "landing " + next);
  if(next === "touch") addPuff(f.x);
  return next;
}

function addPuff(jx){
  var svg = document.querySelector(".carrier");
  if(!svg) return;
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "puff");
  g.innerHTML = puffSVG(jx);
  svg.appendChild(g);
  setTimeout(function(){ if(g.parentNode) g.parentNode.removeChild(g); }, 1300);
}

function finishLanding(svg){
  if(landingGuard){ clearTimeout(landingGuard); landingGuard = null; }
  if(svg) svg.setAttribute("viewBox", FULL_VIEW.join(" "));
  setStatus("");
  renderDeck();
  if(pendingSail){ pendingSail = false; setTimeout(sailAway, 600); }
}

/* ---------- 满编出航 ---------- */
var SAIL_T = 4600;
var pendingSail = false;
var sailGuard = null;

function sailAway(){
  var svg = document.querySelector(".carrier");
  var ship = svg && svg.querySelector(".ship");
  if(!ship) return;
  setStatus("满编出航！七架战斗机跟着一起走");
  sfxHorn();
  sailGuard = setTimeout(finishSail, SAIL_T + 3000);
  runSail(ship);
}

function runSail(ship){
  var t0 = null;
  function frame(now){
    if(t0 === null) t0 = now;
    var p = Math.min(1, (now - t0) / SAIL_T);
    var dx = -780 * p * p;                              // 慢慢加速开走
    var dy = Math.sin(p * Math.PI * 5) * 3.5 * (1 - p); // 破浪时轻微起伏
    ship.setAttribute("transform", "translate(" + dx.toFixed(1) + "," + dy.toFixed(1) + ")");
    if(p < 1) requestAnimationFrame(frame);
    else finishSail();
  }
  requestAnimationFrame(frame);
}

function finishSail(){
  if(sailGuard){ clearTimeout(sailGuard); sailGuard = null; }
  setStatus("");
  renderDeck();
}

/* ---------- 甲板 ---------- */
function renderDeck(landing, jetOverride){
  var flying = typeof landing === "number" && landing >= 0;
  var jets = deckJets(), today = weekday();
  if(flying && jetOverride) jets[landing] = jetOverride;
  el("carrier").innerHTML = carrierSVG(jets, today, flying ? landing : -1);
  el("deckwrap").className = "deckwrap crayon" + (isNight() ? " night" : "");
  el("decklabels").style.visibility = flying ? "hidden" : "";
  renderDeckButton(flying);
  var box = el("decklabels");
  box.innerHTML = "";
  DAY_NAMES.forEach(function(n, i){
    var s = document.createElement("span");
    s.textContent = n.replace("周","");
    s.className = (jets[i] ? "on " : "") + (i + 1 === today ? "today" : "");
    s.style.left = (DECK_X[i] / DECK_VIEW_W * 100) + "%";
    if(jets[i] || i + 1 === today) s.style.color = DAY_COLORS[i];
    box.appendChild(s);
  });
}

function renderDeckButton(flying){
  var box = el("deckbtn");
  box.innerHTML = "";
  if(flying || !deckFull()) return;
  var b = document.createElement("button");
  b.className = "hbtn sail";
  b.textContent = "再看一次航母出航";
  b.onclick = sailAway;
  box.appendChild(b);
}

function renderRework(){
  var box = el("rework");
  box.innerHTML = "";
  var list = wrongList();
  el("reworkCount").textContent = list.length ? "共 " + list.length + " 字" : "";
  if(!list.length){ box.innerHTML = '<div class="empty">还没有点过不会的字</div>'; return; }
  var groups = wrongBookByDay();
  groups.slice(0, REWORK_DAYS).forEach(function(g){ box.appendChild(reworkGroup(g)); });
  if(groups.length > REWORK_DAYS) box.appendChild(reworkMore(groups));
}

var REWORK_DAYS = 8;

function reworkGroup(g){
  var wrap = document.createElement("div");
  wrap.className = "rgroup";
  var t = document.createElement("div");
  t.className = "rday";
  t.textContent = dayLabelOf(g.date);
  wrap.appendChild(t);
  var row = document.createElement("div");
  row.className = "bricks";
  g.chars.forEach(function(c){ row.appendChild(reworkBrick(c)); });
  wrap.appendChild(row);
  return wrap;
}

function reworkBrick(c){
  var d = document.createElement("div");
  var fixed = state.wrongBook[c].fixed;
  d.className = "rb" + (fixed ? " fixed" : "");
  d.textContent = c;
  d.title = fixed ? "念对过了，但一直留在修理站反复复习" : "还没念对过";
  return d;
}

function reworkMore(groups){
  var n = groups.slice(REWORK_DAYS).reduce(function(a, g){ return a + g.chars.length; }, 0);
  var d = document.createElement("div");
  d.className = "empty";
  d.textContent = "还有 " + (groups.length - REWORK_DAYS) + " 天的 " + n + " 个字，周末照样会抽到";
  return d;
}

/* 把日期 key 变成「8/25 周一」 */
function dayLabelOf(key){
  var p = (key || "").split("-");
  if(p.length < 3) return "以前";
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  var w = d.getDay();
  return (+p[1]) + "/" + (+p[2]) + " " + DAY_NAMES[(w === 0 ? 7 : w) - 1];
}

function renderFleet(){
  var box = el("fleet");
  box.innerHTML = "";
  if(!state.fleet.length){ box.innerHTML = '<div class="empty">这是第一艘，还在港里</div>'; return; }
  state.fleet.slice(-8).reverse().forEach(function(s){
    var d = document.createElement("div");
    d.className = "ship" + (s.full ? " full" : "");
    d.textContent = s.count + " 架" + (s.full ? " · 满编" : "");
    box.appendChild(d);
  });
}

/* 明天来的是哪一架，给孩子一个盼头 */
function renderTomorrow(){
  var no = tomorrowJetNo();
  el("tomorrow").innerHTML = jetSVG(JET_PARTS.length, false, false, no - 1);
  el("tomorrowName").textContent = jetLabel(no - 1);
}

/* ---------- 学过的字 ---------- */
function renderHistory(){
  var box = el("history");
  box.innerHTML = "";
  weekKeysOffset(histOffset).forEach(function(k, i){ box.appendChild(historyRow(k, i)); });
  el("histLabel").textContent = histLabelText();
  el("histNext").disabled = histOffset >= 0;
}

function histLabelText(){
  if(histOffset === 0) return "本周";
  if(histOffset === -1) return "上一周";
  return (-histOffset) + " 周前";
}

function historyRow(key, i){
  var d = state.days[key];
  var row = document.createElement("div");
  row.className = "hrow";
  row.appendChild(dayTag(i));
  if(!d || !d.chars.length){
    var e = document.createElement("span");
    e.className = "hempty";
    e.textContent = "还没学";
    row.appendChild(e);
    return row;
  }
  row.appendChild(charsCell(d));
  row.appendChild(d.plane ? reviewButton(key, i) : doingTag());
  return row;
}

function doingTag(){
  var t = document.createElement("span");
  t.className = "hdoing";
  t.textContent = "学习中";
  return t;
}

function dayTag(i){
  var t = document.createElement("span");
  t.className = "hday";
  t.textContent = DAY_NAMES[i].replace("周", "");
  t.style.background = DAY_COLORS[i];
  return t;
}

function charsCell(d){
  var cs = document.createElement("span");
  cs.className = "hchars";
  cs.textContent = d.chars.join(" ");
  var stars = lessonStars(d);
  if(stars) cs.textContent += "  " + new Array(stars + 1).join("★");
  return cs;
}

function reviewButton(key, i){
  var b = document.createElement("button");
  b.className = "hbtn";
  b.textContent = "复习";
  b.onclick = function(){ startDayReview(key, DAY_NAMES[i], i); };
  return b;
}

/* 定向复习某一天：把那天的十个字打乱重来 */
function startDayReview(key, label, slot){
  var d = state.days[key];
  if(!d || !d.chars.length) return;
  dayReview = { key:key, label:label, slot:slot, chars:d.chars.slice(),
                queue:shuffle(d.chars.slice()), log:[], miss:{} };
  practice = null;
  taughtCard = "";
  renderAll();
  try{ el("slab").scrollIntoView({ behavior:"smooth", block:"center" }); }catch(e){}
}

function exitDayReview(){
  dayReview = null;
  taughtCard = "";
  renderAll();
}

function shiftHistory(delta){
  histOffset = Math.min(0, histOffset + delta);
  renderHistory();
}

function renderExceptDeck(){
  syncWeek();
  renderTop();
  renderCard();
  renderJet(false);
  renderRework();
  renderFleet();
  renderTomorrow();
  renderHistory();
  el("progress").textContent = masteredCount() + " / " + CHARS.length + " 字 · 出厂 " +
    state.jets + " 架 · 舰队 " + state.fleet.length + " 艘";
}

function renderStorageWarning(){
  var box = el("warn");
  if(!box) return;
  var bad = !storageWorks() || storageBroken;
  box.style.display = bad ? "" : "none";
  if(bad) box.textContent = "这个浏览器不让保存进度，关掉网页学过的就没了。" +
    "换个浏览器，或者关掉无痕/隐私模式再打开。";
}

function renderAll(){
  renderStorageWarning();
  renderExceptDeck();
  renderDeck();
}
