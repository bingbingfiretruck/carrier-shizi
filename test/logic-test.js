/* 纯逻辑无头测试：node test/logic-test.js
   只加载不碰 DOM 的模块，用假日期驱动，验证选字/错题/打卡/建造规则 */
const fs = require("fs"), vm = require("vm"), path = require("path");
const D = path.join(__dirname, "..");

const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = v) };
global.location = { search: "" };
global.window = {};

["js/data.js", "js/state.js", "js/lesson.js", "js/scene.js", "js/carrier.js"].forEach(f => {
  vm.runInThisContext(fs.readFileSync(path.join(D, f), "utf8"), { filename: f });
});

/* 用固定的一周（2026-08-24 周一）替换真实日期 */
const MONDAY = new Date("2026-08-24T00:00:00");
let FAKE = "2026-08-24", FAKEDOW = 1, WEEK = "2026-W35", WEEK_START = 24;
global.todayKey = () => FAKE;
global.weekday = () => FAKEDOW;
global.isWeekend = () => FAKEDOW >= 6;
global.weekKey = () => WEEK;
const days = n => [0, 1, 2, 3, 4, 5, 6].slice(0, n).map(i => {
  const d = new Date(MONDAY); d.setDate(WEEK_START + i); return dateKey(d);
});
global.weekdayKeys = () => days(5);
global.weekKeys = () => days(7);
const setDay = dow => {
  FAKEDOW = dow;
  const d = new Date(MONDAY); d.setDate(WEEK_START + dow - 1); FAKE = dateKey(d);
};
const nextWeek = () => { WEEK = "2026-W36"; WEEK_START = 31; };
const thisWeek = () => { WEEK = "2026-W35"; WEEK_START = 24; };

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") =>
  cond ? (pass++, console.log("  ✔", name)) : (fail++, console.log("  ✗", name, extra));
const finishDay = () => { let n = 0; while (todayLesson().queue.length && n < 40) { markRight(currentChar()); n++; } };

console.log("\n【周一：正常学 10 个新字】");
setDay(1); syncWeek();
let l = todayLesson();
ok("发了 10 个新字", l.chars.length === 10, l.chars.length);
ok("第一个字是「的」", l.chars[0] === "的", l.chars[0]);
finishDay();
ok("当天队列清空", lessonFinished());
ok("出厂 1 架战斗机", state.jets === 1, state.jets);
ok("甲板停了 1 架", deckCount() === 1, deckCount());
ok("已学会 10 字", masteredCount() === 10, masteredCount());
ok("游标推进到 10", state.cursor === 10, state.cursor);

console.log("\n【同一天反复打开，字不能变】");
(function(){
  const key = todayKey();
  const first = todayLesson().chars.join("");
  const cur = state.cursor;
  const saved = JSON.parse(localStorage.getItem(LS_KEY));
  ok("当天课程立刻存进了浏览器", !!(saved && saved.days && saved.days[key]), Object.keys(saved.days || {}).join(","));
  ok("存下来的字跟屏幕上一致", saved.days[key].chars.join("") === first);
  global.state = loadState();                       // 模拟关掉网页再打开
  ok("重新打开还是同一组字", todayLesson().chars.join("") === first, todayLesson().chars.join(""));
  ok("游标没有被白白烧掉", state.cursor === cur, state.cursor + " vs " + cur);
})();

console.log("\n【连续几天，字必须不一样】");
(function(){
  const snapshot = localStorage.getItem(LS_KEY);     // 这一段会消耗字库，跑完要还原
  const seen = [];
  ["2026-09-01","2026-09-02","2026-09-03","2026-09-04","2026-09-07"].forEach(d => {
    const realKey = global.todayKey, realWd = global.weekday, realWe = global.isWeekend;
    global.todayKey = () => d;
    global.weekday = () => { const x = new Date(d + "T00:00:00").getDay(); return x === 0 ? 7 : x; };
    global.isWeekend = () => weekday() >= 6;
    global.state = loadState();
    seen.push(todayLesson().chars.join(""));
    global.todayKey = realKey; global.weekday = realWd; global.isWeekend = realWe;
  });
  ok("五个工作日发了五组不同的字", new Set(seen).size === 5, seen.join(" / "));
  ok("每组都是十个字", seen.every(s => s.length === 10));
  ok("组与组之间没有重复的字",
    new Set(seen.join("")).size === 50, new Set(seen.join("")).size);
  localStorage.setItem(LS_KEY, snapshot);
  global.state = loadState();                        // 还原现场，不影响后面的用例
})();

console.log("\n【周二：连错两次进修理站，队尾复现】");
setDay(2);
l = todayLesson();
const bad = l.chars[0];
ok("周二取到新字且不重复", l.chars.every(c => !state.mastered[c]));
markWrong(bad);
ok("点一次不会就进修理站", !!state.wrongBook[bad], bad);
ok("这个字不再排回队尾", todayLesson().queue.indexOf(bad) < 0);
ok("队列只剩九个字", todayLesson().queue.length === 9, todayLesson().queue.length);
finishDay();
ok("走完十个字就算打卡完成", lessonFinished());
ok("没念对的字仍留在修理站", !!state.wrongBook[bad]);
ok("留下了曾错过的暗标记", state.everWrong[bad] === true);
ok("周二也出了飞机", state.jets === 2, state.jets);

console.log("\n【周三四五：甲板逐架停满】");
[3, 4, 5].forEach(d => { setDay(d); finishDay(); });
ok("甲板停了 5 架", deckCount() === 5, deckCount());
ok("周六周日位置还空着", deckSlots()[5] === false && deckSlots()[6] === false);
ok("五天不算满编", deckFull() === false);
ok("念对了 49 个字（周二有一个没念对）", masteredCount() === 49, masteredCount());
ok("游标照样推进到 50，明天发的是新字", state.cursor === 50, state.cursor);

console.log("\n【周六：复习日，不发新字】");
setDay(6);
l = todayLesson();
ok("模式为复习", l.mode === "review", l.mode);
ok("复习也是 10 个字", l.chars.length === 10, l.chars.length);
ok("复习字来自修理站或学过的字", l.chars.every(c => state.mastered[c] || state.wrongBook[c]));
ok("修理站里没念对过的字也会被拉来复习",
  l.chars.some(c => state.wrongBook[c] && !state.mastered[c]));
ok("复习不消耗新字库", state.cursor === 50, state.cursor);

console.log("\n【修理站优先级】");
const w1 = CHARS[3], w2 = CHARS[7];
state.wrongBook[w1] = { since: "x", miss: 2 };
state.wrongBook[w2] = { since: "x", miss: 2 };
const inBook = wrongList();
const rev = pickReviewChars(10);
ok("修理站的字整体排在最前（顺序随机，但都在前面）",
  rev.slice(0, Math.min(10, inBook.length)).every(c => inBook.indexOf(c) >= 0),
  rev.slice(0, inBook.length).join(""));
ok("新加的两个也在里面", rev.indexOf(w1) >= 0 && rev.indexOf(w2) >= 0);
ok("其余补齐到 10 个", rev.length === 10, rev.length);
ok("补齐的字不重复", new Set(rev).size === 10);
delete state.wrongBook[w1]; delete state.wrongBook[w2];

console.log("\n【修理站：只进不出，周一清空】");
(function () {
  const keep = { w: state.wrongBook, lw: state.lastWeek, f: state.fleet.slice(), d: state.days };
  state.wrongBook = {}; state.days = {};
  const a = CHARS[0], b = CHARS[1];
  markWrongLoose(a);
  ok("点了不会就进修理站", !!state.wrongBook[a]);
  ok("刚进来时是未修好状态", state.wrongBook[a].fixed === false);
  markRightLoose(a);
  ok("念对之后仍然留在修理站", !!state.wrongBook[a]);
  ok("记着是哪天进的站", state.wrongBook[a].since === todayKey(), state.wrongBook[a].since);
  ok("但标成了已修好", state.wrongBook[a].fixed === true);
  markWrongLoose(a);
  ok("再点一次不会，已修好标记会取消", state.wrongBook[a].fixed === false);
  markWrongLoose(b);
  ok("周末复习会把修理站的字全拉出来（含已修好的）", (function () {
    markRightLoose(b);
    const r = pickReviewChars(10);
    return r.indexOf(a) >= 0 && r.indexOf(b) >= 0;
  })());
  thisWeek(); state.lastWeek = "2026-W35";
  nextWeek(); syncWeek();
  ok("跨到新的一周，修理站原样保留", !!state.wrongBook[a] && !!state.wrongBook[b]);
  ok("已修好的字也还在", state.wrongBook[b].fixed === true);
  thisWeek();
  state.wrongBook = keep.w; state.lastWeek = keep.lw; state.fleet = keep.f; state.days = keep.d;
})();

console.log("\n【修理站按天分组，攒多了轮着抽】");
(function () {
  const keep = { w: state.wrongBook };
  state.wrongBook = {};
  const mk = (c, day, fixed) => { state.wrongBook[c] = { since: day, miss: 1, fixed: !!fixed }; };
  mk(CHARS[0], "2026-08-24"); mk(CHARS[1], "2026-08-24", true);
  mk(CHARS[2], "2026-08-25"); mk(CHARS[3], "2026-08-26", true);
  const g = wrongBookByDay();
  ok("按天分成三组", g.length === 3, g.length);
  ok("新的日期排在前面", g[0].date === "2026-08-26" && g[2].date === "2026-08-24", g.map(x => x.date).join(","));
  ok("同一天的字归在一起", g[2].chars.length === 2, g[2].chars.length);

  const pick = pickFromWrongBook(4);
  ok("四个字全抽得到", pick.length === 4, pick.length);
  ok("还没念对的排在前面",
    !state.wrongBook[pick[0]].fixed && !state.wrongBook[pick[1]].fixed,
    pick.join(""));

  for (let i = 0; i < 40; i++) mk(CHARS[10 + i], "2026-08-20", true);
  const seen = new Set();
  for (let i = 0; i < 30; i++) pickFromWrongBook(10).forEach(c => seen.add(c));
  ok("字攒到 44 个时，反复抽能覆盖到大部分（不是老抽同样十个）",
    seen.size > 25, seen.size + " / 44");
  ok("每次仍然只抽十个", pickFromWrongBook(10).length === 10);
  state.wrongBook = keep.w;
})();

console.log("\n【同音字判定】");
ok("念对本字算对", isMatch("水", "水"));
ok("念例词算对", isMatch("喝水", "水"));
ok("听成同音的「谁」也算对", isMatch("谁", "水"));
ok("听成同音的「税」也算对", isMatch("税", "水"));
ok("「是」听成「事/时/十」都算对",
  isMatch("事", "是") && isMatch("时", "是") && isMatch("十", "是"));
ok("「一」听成「衣/医」也算对", isMatch("衣", "一") && isMatch("医", "一"));
ok("多音字任一读音对上就算", isMatch("料", "了") && isMatch("乐", "了"));
ok("真念错了还是判错", isMatch("火车", "水") === false && isMatch("大", "小") === false);
ok("拼音表覆盖 800 字以上", Object.keys(PY).length >= 800, Object.keys(PY).length);
ok("500 个字全都有拼音", CHARS.every(c => !!PY[c]));

console.log("\n【判定】");
ok("念单字算对", isMatch("水", "水"));
ok("念例词算对", isMatch("喝水", "水"));
ok("带标点也算对", isMatch("喝水。", "水"));
ok("念错不算对", isMatch("火车", "水") === false);
ok("虚字念整句算对", isMatch("吃完了", "了"));

console.log("\n【满编出航与舰队】");
setDay(6); finishDay();
setDay(7); finishDay();
ok("七天全打卡 = 满编", deckFull() && deckCount() === 7, deckCount());
ok("本周记了 7 架", state.weekCounts["2026-W35"] === 7, state.weekCounts["2026-W35"]);
nextWeek(); syncWeek();
ok("跨周后上一艘进舰队", state.fleet.length === 1, state.fleet.length);
ok("并且标记为满编", state.fleet[0].full === true && state.fleet[0].count === 7);
ok("新的一周甲板清空", deckCount() === 0, deckCount());
thisWeek();

console.log("\n【五种机型】");
ok("有 5 种机型", AIRFRAMES.length === 5, AIRFRAMES.length);
ok("连续五天机型都不同", new Set([0, 1, 2, 3, 4].map(i => skinAt(i).frame.name)).size === 5);
ok("前 70 天外观零重复", (() => { const s = new Set(); for (let i = 0; i < 70; i++) s.add(jetLabel(i)); return s.size === 70; })());
ok("每种机型都画得出来", [0, 1, 2, 3, 4].every(i => jetSVG(10, false, false, i).length > 2000));
ok("甲板飞机机头朝飞行方向（水平镜像）", deckTransform(220).indexOf("-0.21") >= 0, deckTransform(220));

console.log("\n【昼夜天空与出航】");
(function () {
  const real = global.isNight;
  global.isNight = () => false;
  const day = carrierSVG([null, null, null, null, null, null, null], 1, -1);
  global.isNight = () => true;
  const night = carrierSVG([null, null, null, null, null, null, null], 1, -1);
  global.isNight = real;
  ok("白天：蓝天 + 太阳 + 白云", day.indexOf("#DAEFFF") >= 0 && day.indexOf("cloud") >= 0);
  ok("白天没有星星和月亮", day.indexOf("stars") < 0 && day.indexOf("#FFE9A8") < 0);
  ok("夜晚：深蓝夜空 + 月亮", night.indexOf("#1E2A4A") >= 0 && night.indexOf("#FFE9A8") >= 0);
  ok("夜晚有 15 颗会眨的星星", (night.match(/class="tw"/g) || []).length === 15);
  ok("夜晚海面颜色也变深", night.indexOf("#2B4A6E") >= 0);
  ok("舰体单独分组，才能整艘开走", day.indexOf('class="ship"') >= 0);
  ok("天空不在舰体分组里，开走时留在原地",
    day.indexOf('class="sky"') < day.indexOf('class="ship"'));
})();

console.log("\n【战斗机十个零件】");
ok("十个零件对应十个字", JET_PARTS.length === 10);
ok("零件里有导弹和两个轮子",
  JET_PARTS.some(p => p.name === "导弹") && JET_PARTS.filter(p => /轮/.test(p.name)).length === 2);
state.days = {}; setDay(3);
ok("一个字没念，零件为 0", partsDrawn() === 0, partsDrawn());
markRight(todayLesson().queue[0]);
ok("念对 1 个 → 画出 1 个零件", partsDrawn() === 1, partsDrawn());
ok("下一个要画的是机头", nextPartName() === "机头", nextPartName());
finishDay();
ok("十个字念完 → 十个零件齐了", partsDrawn() === 10, partsDrawn());

console.log("\n【循环打卡：当天可以反复学】");
state.days = {}; setDay(4);
const day4 = todayLesson().chars.slice();
finishDay();
ok("第一遍完成，出厂一架", lessonFinished() && todayLesson().plane, todayLesson().plane);
ok("第一遍会触发降落", checkDayComplete().landed === true);
const jetsAfter1 = state.jets, cursorBefore = state.cursor;
ok("还没再来时是第 1 遍", (todayLesson().rounds || 1) === 1);
ok("再来一遍成功", replayLesson() === true);
ok("队列重新装满 10 个字", todayLesson().queue.length === 10, todayLesson().queue.length);
ok("还是同样这十个字", todayLesson().queue.slice().sort().join("") === day4.slice().sort().join(""));
ok("计数变成第 2 遍", todayLesson().rounds === 2, todayLesson().rounds);
ok("重学期间甲板上的飞机不会消失", stampedOn(todayKey()) === true);
ok("第二遍还没练完，先不给星", lessonStars(todayLesson()) === 0, lessonStars(todayLesson()));
finishDay();
const r2 = checkDayComplete();
ok("第二遍不会重复出厂飞机", state.jets === jetsAfter1, state.jets);
ok("第二遍也会触发降落", r2.landed === true);
ok("第二遍不发新飞机但认得是哪一架", r2.plane === null && !!r2.name, JSON.stringify([r2.plane, r2.name]));
ok("第二遍带上遍数与星数", r2.round === 2 && r2.stars === 1, r2.round + "/" + r2.stars);
ok("第二遍给 1 颗星", lessonStars(todayLesson()) === 1);
replayLesson(); finishDay();
ok("第三遍给 2 颗星", lessonStars(todayLesson()) === 2, lessonStars(todayLesson()));
for (let i = 0; i < 8; i++) { replayLesson(); finishDay(); }
ok("星星最多 3 颗", lessonStars(todayLesson()) === 3, lessonStars(todayLesson()));
ok("反复学不消耗新字库", state.cursor === cursorBefore, state.cursor + " vs " + cursorBefore);

console.log("\n【周末从零开始的兜底】");
(function () {
  const keep = { m: state.mastered, d: state.days, c: state.cursor, w: state.wrongBook };
  state.mastered = {}; state.wrongBook = {}; state.days = {}; state.cursor = 0;
  setDay(7);
  const l = todayLesson();
  ok("周日第一次打开也发十个字", l.chars.length === 10, l.chars.length);
  ok("没东西可复习时退回学新字", l.mode === "new", l.mode);
  ok("发的是字库开头的新字", l.chars[0] === "的", l.chars[0]);
  state.mastered = keep.m; state.days = keep.d; state.cursor = keep.c; state.wrongBook = keep.w;
})();

console.log("\n【字库学完后的兜底】");
(function () {
  const keep = { m: state.mastered, d: state.days, c: state.cursor };
  state.mastered = {}; CHARS.forEach(c => (state.mastered[c] = { d: "x", n: 1 }));
  state.cursor = CHARS.length; state.days = {}; setDay(2);
  ok("全部学完后不发空课", todayLesson().chars.length === 10, todayLesson().chars.length);
  ok("自动转成复习模式", todayLesson().mode === "review", todayLesson().mode);
  ok("allCharsLearned 为真", allCharsLearned() === true);
  state.mastered = keep.m; state.days = keep.d; state.cursor = keep.c;
})();

console.log("\n【甲板飞机的涂装与星数】");
state.days = {}; setDay(1); finishDay();
const dj = deckJets();
ok("周一位上有飞机", !!dj[0], JSON.stringify(dj[0]));
ok("飞机带涂装编号", typeof dj[0].variant === "number");
ok("没打卡的位是 null", dj[4] === null);
ok("今天的甲板位次 = 周几-1", todayDeckIndex() === 0, todayDeckIndex());

console.log("\n【学过的字：按天留存，可定向复习】");
state.days = {}; state.mastered = {}; state.cursor = 0; state.wrongBook = {};
setDay(1); const monChars = todayLesson().chars.slice(); finishDay();
setDay(2); const tueChars = todayLesson().chars.slice(); finishDay();
ok("周一那十个字原样留着", state.days[days(7)[0]].chars.join("") === monChars.join(""));
ok("周二留的是另外十个字", state.days[days(7)[1]].chars.join("") === tueChars.join(""));
ok("两天的字不重叠", monChars.every(c => tueChars.indexOf(c) < 0));
ok("每天都记下了是哪一架飞机", !!state.days[days(7)[0]].jetNo && !!state.days[days(7)[1]].jetNo);

console.log("\n【翻周与松耦合记账】");
ok("weekKeysOffset 给出七天", weekKeysOffset(0).length === 7);
ok("上一周比本周早七天", (() => {
  const a = new Date(weekKeysOffset(0)[0]), b = new Date(weekKeysOffset(-1)[0]);
  return Math.round((a - b) / 86400000) === 7;
})());
setDay(3);
const before = todayLesson().done.length;
markRightLoose(monChars[0]);
ok("定向复习念对，不会算进今天的进度", todayLesson().done.length === before, todayLesson().done.length);
ok("但掌握次数会累加", state.mastered[monChars[0]].n >= 2, state.mastered[monChars[0]].n);
markWrongLoose(monChars[1]);
ok("定向复习念错，进修理站", !!state.wrongBook[monChars[1]]);
ok("念错也不会污染今天的进度", todayLesson().done.length === before);
markRightLoose(monChars[1]);
ok("再念对也不出库，只是标成已修好",
  !!state.wrongBook[monChars[1]] && state.wrongBook[monChars[1]].fixed === true);

console.log("\n【一轮里每个字只出现一次】");
state.days = {}; state.wrongBook = {}; setDay(3);
const round = todayLesson().chars.slice();
markWrong(round[0]);
ok("念不对的字直接离开队列", todayLesson().queue.indexOf(round[0]) < 0);
ok("再对同一个字判错也不会重复入队", (function(){
  markWrong(round[0]);
  return todayLesson().queue.indexOf(round[0]) < 0 && todayLesson().queue.length === 9;
})(), todayLesson().queue.length);
markRight(round[1]);
markWrong(round[2]);
ok("对错混着走，队列每次只少一个", todayLesson().queue.length === 7, todayLesson().queue.length);
ok("走过的字数按对错都算", passedCount(todayLesson()) === 3, passedCount(todayLesson()));
ok("对错顺序记了下来", todayLesson().log.join("") === "010", todayLesson().log.join(""));
while(todayLesson().queue.length) markRight(todayLesson().queue[0]);
ok("十个字走完就出飞机", !!todayLesson().plane, todayLesson().plane);
ok("念错的两个字留在修理站", !!state.wrongBook[round[0]] && !!state.wrongBook[round[2]]);
ok("飞机零件按走过的字数画满", partsDrawn() === 10, partsDrawn());

console.log("\n" + (fail ? "✗ 失败 " + fail + " 项" : "✔ 全部通过") + "（共 " + (pass + fail) + " 项）");
process.exit(fail ? 1 : 0);
