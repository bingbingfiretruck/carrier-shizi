/* 用假的语音引擎驱动 speech.js，验证"听到 → 判定 → 通过"这条链路
   node test/speech-test.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const D = path.join(__dirname, "..");

const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = v) };
global.location = { search: "" };

/* 假引擎：可以手动喂识别结果，也能模拟引擎自己断开 */
class FakeSR {
  constructor(){ FakeSR.live.push(this); this.started = false; }
  start(){ if(this.started) throw new Error("already started"); this.started = true; }
  stop(){ this.started = false; }
  abort(){ this.started = false; }
  emit(texts, isFinal){
    if(!this.onresult) return;
    const results = [texts.map(t => ({ transcript: t }))];
    results[0].isFinal = !!isFinal;
    this.onresult({ resultIndex: 0, results: Object.assign(results, { length: 1 }) });
  }
  die(){ if(this.onend) this.onend(); }
  fail(err){ if(this.onerror) this.onerror({ error: err }); }
}
FakeSR.live = [];
global.window = { SpeechRecognition: FakeSR };

["js/data.js", "js/state.js", "js/lesson.js"].forEach(f =>
  vm.runInThisContext(fs.readFileSync(path.join(D, f), "utf8"), { filename: f }));
vm.runInThisContext(fs.readFileSync(path.join(D, "js/speech.js"), "utf8"), { filename: "speech.js" });

let pass = 0, fail = 0;
const ok = (n, c, e = "") => c ? (pass++, console.log("  ✔", n)) : (fail++, console.log("  ✗", n, e));
const latest = () => FakeSR.live[FakeSR.live.length - 1];

console.log("\n【听到正确的字，立刻通过】");
FakeSR.live = [];
let hit = null, failed = null;
let h = listen(texts => { const m = texts.some(t => isMatch(t, "水")); if(m) hit = texts; return m; },
               (r, heard) => { failed = { r, heard }; });
ok("识别引擎已启动", latest() && latest().started === true);
latest().emit(["水"]);
ok("念对了触发通过", !!hit, JSON.stringify(hit));
ok("没走失败分支", failed === null);
ok("通过后引擎已停", latest().started === false);
h.cancel();

console.log("\n【听成同音字也通过】");
FakeSR.live = []; hit = null; failed = null;
h = listen(texts => { const m = texts.some(t => isMatch(t, "水")); if(m) hit = texts; return m; }, () => {});
latest().emit(["谁"]);
ok("听成「谁」也算念对「水」", !!hit, JSON.stringify(hit));
h.cancel();

console.log("\n【先听错再听对，仍然通过】");
FakeSR.live = []; hit = null;
const seenByMatcher = [];
h = listen(texts => { seenByMatcher.push(texts.slice()); const m = texts.some(t => isMatch(t, "水"));
                      if(m) hit = texts; return m; }, () => {});
latest().emit(["火车"]);
ok("第一次听错不通过", hit === null);
latest().emit(["喝水"]);
ok("第二次听对就通过", !!hit);
ok("判定拿到的是累计内容，不是只有最后一句",
  seenByMatcher[1].length === 2 && seenByMatcher[1][0] === "火车", JSON.stringify(seenByMatcher[1]));
h.cancel();

console.log("\n【引擎中途自己断了会重开】");
FakeSR.live = []; hit = null;
h = listen(texts => { const m = texts.some(t => isMatch(t, "水")); if(m) hit = texts; return m; }, () => {});
const first = latest();
first.die();
setTimeout(() => {
  ok("断开后换了一个新引擎", FakeSR.live.length >= 2, FakeSR.live.length);
  ok("新引擎已经在听", latest().started === true);
  latest().emit(["水"]);
  ok("重开之后念对照样通过", !!hit);
  h.cancel();

  console.log("\n【没给麦克风权限要能报出来】");
  FakeSR.live = []; failed = null;
  const h2 = listen(() => false, (r, heard) => { failed = { r, heard }; });
  latest().fail("not-allowed");
  ok("权限被拒时明确返回 denied", failed && failed.r === "denied", JSON.stringify(failed));
  h2.cancel();

  console.log("\n【判定函数抛错不能把识别搞死】");
  FakeSR.live = []; failed = null;
  const h3 = listen(() => { throw new Error("boom"); }, (r) => { failed = r; });
  latest().emit(["水"]);
  ok("抛错会走 error 分支，不是静默卡死", failed === "error", failed);
  h3.cancel();

  console.log("\n" + (fail ? "✗ 失败 " + fail + " 项" : "✔ 全部通过") + "（共 " + (pass + fail) + " 项）");
  process.exit(fail ? 1 : 0);
}, 200);
