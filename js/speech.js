/* 语音：朗读（TTS）+ 听写判定（ASR），带"妈妈判定"兜底 */

var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
var srBroken = false;              // 连续失败后置位，之后全程走妈妈判定
var srFailStreak = 0;

function speechSupported(){ return !!SR && !srBroken; }

/* ---------- 朗读 ---------- */
function speak(text, cb){
  if(!("speechSynthesis" in window)){ if(cb) cb(); return; }
  try{
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.8;
    var called = false;
    u.onend = function(){ if(!called && cb){ called = true; cb(); } };
    window.speechSynthesis.speak(u);
    setTimeout(function(){ if(!called && cb){ called = true; cb(); } }, 3500);
  }catch(e){ if(cb) cb(); }
}

/* 教读：先说这个字怎么念，再组词，虚字再补一句 */
function teach(c, cb){
  var e = BY_CHAR[c];
  if(!e){ if(cb) cb(); return; }
  var steps = [c, e.word];
  if(e.sentence) steps.push(e.sentence);
  (function next(i){
    if(i >= steps.length){ if(cb) cb(); return; }
    speak(steps[i], function(){ setTimeout(function(){ next(i+1); }, 340); });
  })(0);
}

/* ---------- 听 ---------- */
/* onResult(transcripts[])；onFail(reason) reason: "unsupported" | "nomatch" | "error" */
function bumpFail(){
  srFailStreak++;
  if(srFailStreak >= 3) srBroken = true;   // 连着三次一个字都没听到 → 转妈妈判定
}

function newRecognizer(){
  var rec = new SR();
  rec.lang = "zh-CN";
  rec.continuous = true;        // 别一停顿就结束，孩子说话慢
  rec.interimResults = true;    // 边说边给结果，念对了立刻通过
  rec.maxAlternatives = 6;      // 多要几个候选，配合同音判定
  return rec;
}

/* 一次"听"最长开着这么久；期间引擎自己断了会自动重开 */
var LISTEN_MS = 9000;

/* onHeard(texts) 返回 true 表示听对了，立刻收工
   onFail(reason, heard) reason: "unsupported" | "denied" | "nomatch" */
function listen(onHeard, onFail){
  if(!speechSupported()){ onFail("unsupported", []); return { cancel:function(){} }; }
  var s = { rec:null, done:false, timer:null, heard:[], restarts:0 };
  s.stop = function(){
    if(s.timer){ clearTimeout(s.timer); s.timer = null; }
    killRec(s);
  };
  s.finish = function(reason){
    if(s.done) return;
    s.done = true;
    s.stop();
    if(reason){
      if(!s.heard.length) bumpFail(); else srFailStreak = 0;
      onFail(reason, s.heard);
    } else {
      srFailStreak = 0;
    }
  };
  spinUp(s, onHeard);
  s.timer = setTimeout(function(){ s.finish("nomatch"); }, LISTEN_MS);
  return { cancel: function(){ s.done = true; s.stop(); } };
}

function spinUp(s, onHeard){
  try{ s.rec = newRecognizer(); }catch(e){ s.finish("denied"); return; }
  s.rec.onresult = function(ev){
    var texts = collectTexts(ev);
    if(!texts.length) return;
    s.heard = s.heard.concat(texts);
    var hit = false;
    try{ hit = onHeard(s.heard); }          // 传至今听到的全部，别只看最后一段
    catch(e){ s.finish("error"); return; }
    if(hit) s.finish(null);
  };
  s.rec.onerror = function(ev){
    var err = ev && ev.error;
    if(err === "not-allowed" || err === "service-not-allowed"){ s.finish("denied"); return; }
    respin(s, onHeard);                       // no-speech / network / aborted 都重开
  };
  s.rec.onend = function(){ respin(s, onHeard); };
  try{ s.rec.start(); }catch(e){}
}

/* 引擎自己断了就重开，直到时间用完 */
function respin(s, onHeard){
  if(s.done) return;
  if(s.restarts++ > 12){ s.finish("nomatch"); return; }
  killRec(s);
  setTimeout(function(){ if(!s.done) spinUp(s, onHeard); }, 100);
}

function collectTexts(ev){
  var out = [];
  for(var i = ev.resultIndex; i < ev.results.length; i++){
    var alts = ev.results[i];
    for(var j = 0; j < alts.length; j++){
      var t = alts[j] && alts[j].transcript;
      if(t) out.push(t);
    }
  }
  return out;
}

function killRec(s){
  if(!s.rec) return;
  var r = s.rec;
  s.rec = null;
  r.onresult = r.onerror = r.onend = null;
  try{ r.abort(); }catch(e){}
  try{ r.stop(); }catch(e){}
}

function resetSpeechFallback(){ srBroken = false; srFailStreak = 0; }

/* ---------- 音效 ---------- */
var AC = null;
function audioCtx(){
  try{
    if(!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if(AC.state === "suspended") AC.resume();
    return AC;
  }catch(e){ return null; }
}
function tone(freq, at, dur, type, vol){
  var c = audioCtx(); if(!c) return;
  var o = c.createOscillator(), g = c.createGain();
  o.type = type || "square";
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.12, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  o.connect(g); g.connect(c.destination);
  o.start(at); o.stop(at + dur);
}
function sfxDrop(){ var c=audioCtx(); if(!c)return; var t=c.currentTime;
  tone(180,t,0.09,"square",0.2); tone(120,t+0.06,0.12,"square",0.18); }
function sfxNo(){ var c=audioCtx(); if(!c)return; var t=c.currentTime;
  tone(200,t,0.13,"sawtooth",0.12); tone(140,t+0.11,0.2,"sawtooth",0.1); }
function sfxWin(){ var c=audioCtx(); if(!c)return; var t=c.currentTime;
  [392,523,659,784].forEach(function(f,i){ tone(f,t+i*0.1,0.16,"square",0.14); }); }

/* ---------- 降落音效：引擎由远及近 → 触地 → 滑行减速 → 停稳 ---------- */
function noiseBurst(c, at, dur, freq, vol){
  var len = Math.max(1, Math.floor(c.sampleRate * dur));
  var buf = c.createBuffer(1, len, c.sampleRate);
  var d = buf.getChannelData(0);
  for(var i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  var src = c.createBufferSource(); src.buffer = buf;
  var f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq || 1800;
  var g = c.createGain(); g.gain.value = vol || 0.12;
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(at);
}

function engineSweep(c, t){
  var o = c.createOscillator(), g = c.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(54, t);
  o.frequency.linearRampToValueAtTime(98, t + 2.3);
  o.frequency.linearRampToValueAtTime(150, t + 3.6);    // 触地
  o.frequency.linearRampToValueAtTime(58, t + 5.4);     // 滑行减速
  g.gain.setValueAtTime(0.012, t);
  g.gain.linearRampToValueAtTime(0.08, t + 2.3);
  g.gain.linearRampToValueAtTime(0.15, t + 3.6);
  g.gain.linearRampToValueAtTime(0.001, t + 5.6);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 5.7);
}

function sfxLanding(){
  var c = audioCtx(); if(!c) return;
  var t = c.currentTime;
  engineSweep(c, t);
  noiseBurst(c, t + 3.6,  0.28, 2400, 0.15);   // 轮胎触地
  noiseBurst(c, t + 3.88, 0.75, 900,  0.07);   // 滑行摩擦
  noiseBurst(c, t + 4.6,  0.7,  600,  0.04);
  tone(587, t + 5.6,  0.14, "square", 0.11);   // 停稳
  tone(784, t + 5.75, 0.2,  "square", 0.11);
}

/* ---------- 满编出航：两声汽笛 + 破浪声 ---------- */
function hornBlast(c, t, freq, dur){
  var o = c.createOscillator(), g = c.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.linearRampToValueAtTime(freq * 0.94, t + dur);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.13, t + 0.14);
  g.gain.setValueAtTime(0.13, t + dur - 0.3);
  g.gain.linearRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function sfxHorn(){
  var c = audioCtx(); if(!c) return;
  var t = c.currentTime;
  hornBlast(c, t, 112, 1.15);
  hornBlast(c, t + 1.35, 96, 1.5);
  noiseBurst(c, t + 0.3, 3.8, 380, 0.035);
  [784, 988, 1175].forEach(function(f, i){ tone(f, t + 3.2 + i * 0.13, 0.2, "square", 0.1); });
}
