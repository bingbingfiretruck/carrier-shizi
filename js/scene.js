/* 图画板：蜡笔风格的战斗机与航空母舰，全部现画 SVG */

var C = {
  line:"#4A4A4A", glass:"#BFE6F5", wheel:"#5A5A5A", hub:"#FFD166",
  missile:"#B9C2C9", missileTip:"#FF6B6B",
  flame:"#FFA94D", flame2:"#FF6B6B",
  sea:"#8ED6EF", seaDark:"#5FBEDF", sun:"#FFD166", star:"#FFC93C",
  skyDay:"#DAEFFF", cloud:"#FFFFFF",
  skyNight:"#1E2A4A", seaNight:"#2B4A6E", seaNightDark:"#1B3552",
  moon:"#FFE9A8", starLight:"#FFF3C4",
  army:"#7A9A5B", armyDark:"#5A7A42", armyLight:"#9DBB7C"
};

/* 五种机型，机身轮廓完全不同；再叠 6 种军绿 × 4 种花纹 × 导弹数 × 鲨鱼嘴 */
var AIRFRAMES = [
  { name:"截击机",
    body:"M60,70 L190,63 Q226,67 240,82 Q226,97 190,99 L60,99 Q40,84 60,70 Z",
    box:[60,63,180,36],
    nose:"M232,72 L276,82 L232,93 Z",
    cockpit:"M170,64 Q190,44 214,66 Z",
    wing:"M108,95 L170,95 L132,130 L94,130 Z",
    fin:"M64,68 L82,22 L100,30 L94,68 Z",
    stab:"M60,80 L22,70 L24,90 L60,93 Z",
    gear:[98,99,214,97], m1:[112,136,52,15], m2:[152,110,42,12] },

  { name:"重型攻击机",
    body:"M54,60 L198,56 Q240,64 246,84 Q240,104 198,108 L54,108 Q30,84 54,60 Z",
    box:[54,56,192,52],
    nose:"M240,64 Q278,84 240,104 Z",
    cockpit:"M156,58 Q184,32 214,60 Z",
    wing:"M98,104 L168,104 L164,138 L102,138 Z",
    fin:"M56,58 L70,26 L106,36 L98,58 Z",
    stab:"M54,80 L16,66 L18,90 L54,94 Z",
    gear:[100,108,212,106], m1:[104,142,58,16], m2:[150,112,44,13] },

  { name:"双垂尾机",
    body:"M62,72 L194,66 Q226,70 238,82 Q226,94 194,98 L62,98 Q46,85 62,72 Z",
    box:[62,66,176,32],
    nose:"M232,74 L288,82 L232,91 Z",
    cockpit:"M172,66 Q192,48 214,68 Z",
    wing:"M104,94 L178,94 L142,126 L100,126 Z",
    fin:"M54,66 L68,20 L84,28 L80,66 Z M80,66 L94,24 L110,32 L104,66 Z",
    stab:"M58,78 L22,68 L24,88 L58,92 Z",
    gear:[100,98,216,96], m1:[110,132,54,14], m2:[154,106,42,12] },

  { name:"前掠翼机",
    body:"M58,68 L186,62 Q222,68 236,82 Q222,96 186,100 L58,100 Q40,84 58,68 Z",
    box:[58,62,178,38],
    nose:"M228,72 L272,82 L228,92 Z",
    cockpit:"M164,64 Q188,40 212,66 Z",
    wing:"M94,96 L158,96 L190,130 L144,130 Z",
    fin:"M64,66 L74,14 L92,20 L92,66 Z",
    stab:"M58,80 L20,72 L22,90 L58,92 Z",
    gear:[104,100,210,98], m1:[116,134,52,15], m2:[156,108,40,12] },

  { name:"鸭翼机",
    body:"M60,70 L196,64 Q228,68 240,82 Q228,96 196,100 L60,100 Q42,84 60,70 Z",
    box:[60,64,180,36],
    nose:"M234,73 L280,82 L234,92 Z",
    cockpit:"M168,66 Q190,44 216,68 Z",
    wing:"M92,96 L170,96 L124,134 L86,134 Z M188,94 L222,94 L208,114 L182,114 Z",
    fin:"M62,68 L78,20 L98,28 L92,68 Z",
    stab:"M60,80 L26,72 L28,88 L60,92 Z",
    gear:[100,100,218,98], m1:[110,138,50,14], m2:[148,112,40,12] }
];

var BASE_COLORS = [
  { body:"#7A9A5B", dark:"#54763C", light:"#9DBB7C", nose:"#4F6B39", name:"军绿" },
  { body:"#5F7F4A", dark:"#3D5730", light:"#87A56C", nose:"#33482A", name:"橄榄绿" },
  { body:"#8FAE6E", dark:"#688A48", light:"#B0C892", nose:"#5B7A3E", name:"草绿" },
  { body:"#6E8877", dark:"#4B6355", light:"#95AB9C", nose:"#3E564A", name:"灰绿" },
  { body:"#4F6B45", dark:"#33482C", light:"#77906B", nose:"#2A3D24", name:"墨绿" },
  { body:"#90A85A", dark:"#6B833C", light:"#B2C583", nose:"#5C7231", name:"黄绿" }
];
var PATTERN_NAMES = ["素色", "条纹", "迷彩", "飘带"];

/* 机型每天换，配色每天换，花纹两天换一次 */
function skinAt(i){
  i = Math.max(0, Math.floor(i || 0));
  var c = BASE_COLORS[i % BASE_COLORS.length];
  var f = AIRFRAMES[i % AIRFRAMES.length];
  return {
    body:c.body, dark:c.dark, light:c.light, nose:c.nose, cname:c.name,
    frame: f,
    pattern: Math.floor(i / 2) % PATTERN_NAMES.length,
    missiles: Math.floor(i / 3) % 2 ? 1 : 2,
    shark: Math.floor(i / 7) % 2
  };
}

/* 给孩子看的飞机名字，用来预告明天那架 */
function jetLabel(i){
  var k = skinAt(i);
  var t = k.cname + PATTERN_NAMES[k.pattern] + k.frame.name;
  if(k.shark) t += " · 鲨鱼嘴";
  if(k.missiles > 1) t += " · 双导弹";
  return t;
}

var CRAYON_DEFS =
  '<defs><filter id="cy" x="-25%" y="-25%" width="150%" height="150%">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" seed="11" result="n"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>' +
  '</filter></defs>';

/* 十个零件，顺序 = 念对第几个字就画出第几个 */
var JET_PARTS = [
  { key:"body", name:"机身" },   { key:"nose", name:"机头" },
  { key:"cockpit", name:"座舱" },{ key:"wing", name:"机翼" },
  { key:"fin", name:"尾翼" },    { key:"stab", name:"平尾" },
  { key:"wheelB", name:"后轮" }, { key:"wheelF", name:"前轮" },
  { key:"missile", name:"导弹" },{ key:"flame", name:"引擎" }
];
var JET_Z = ["stab","fin","wing","wheelB","wheelF","missile","flame","body","cockpit","nose"];

var STROKE = 'stroke="' + C.line + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

var PART_DRAW = {
  body:    function(s, k){ return shape(k.frame.body, k.body, s) + patternOn(k); },
  nose:    function(s, k){ return shape(k.frame.nose, k.nose, s) + sharkMouth(k); },
  cockpit: function(s, k){ return shape(k.frame.cockpit, C.glass, s); },
  wing:    function(s, k){ return shape(k.frame.wing, k.light, s); },
  fin:     function(s, k){ return shape(k.frame.fin, k.dark, s); },
  stab:    function(s, k){ return shape(k.frame.stab, k.dark, s); },
  wheelB:  function(s, k){ return wheel(s, k.frame.gear[0], k.frame.gear[1], 132, 142, 13, 4.5); },
  wheelF:  function(s, k){ return wheel(s, k.frame.gear[2], k.frame.gear[3], 118, 127, 10, 3.5); },
  missile: function(s, k){
    var m = missileAt(s, k.frame.m1[0], k.frame.m1[1], k.frame.m1[2], k.frame.m1[3]);
    if(k.missiles > 1) m += missileAt(s, k.frame.m2[0], k.frame.m2[1], k.frame.m2[2], k.frame.m2[3]);
    return m;
  },
  flame:   function(s){
    return '<g class="eflame"><path d="M22,74 L-2,82 L22,90 Z" fill="'+C.flame+'" '+s+'/>' +
           '<path d="M2,78 L-20,82 L2,86 Z" fill="'+C.flame2+'" '+s+'/></g>';
  }
};

function shape(d, fill, s){ return '<path d="' + d + '" fill="' + fill + '" ' + s + '/>'; }

/* 机头的鲨鱼嘴，位置跟着机型的机头走 */
function sharkMouth(k){
  if(!k.shark) return "";
  var b = k.frame.box, x = b[0] + b[2] - 12, y = b[1] + b[3] / 2;
  return '<path d="M'+(x-4)+','+(y-4)+' L'+(x+26)+','+y+' L'+(x-4)+','+(y+5)+' Z" fill="#E8574A" stroke="none"/>' +
    '<path d="M'+x+','+(y-2)+' L'+(x+4)+','+(y+1.6)+' L'+(x+8)+','+(y-1.6)+' L'+(x+12)+','+(y+1.8)+
    ' L'+(x+16)+','+(y-1)+' L'+(x+19)+','+y+' L'+x+','+(y+2.4)+' Z" fill="#fff" stroke="none"/>';
}

/* 机身花纹：素色 / 竖条纹 / 迷彩斑块 / 飘带，按机型的机身框计算 */
function patternOn(k){
  var b = k.frame.box, x = b[0], y = b[1], w = b[2], h = b[3];
  if(k.pattern === 1)
    return '<rect x="'+(x + w * 0.32)+'" y="'+y+'" width="'+(w * 0.17)+'" height="'+(h + 2)+
           '" fill="'+k.dark+'" opacity=".85" stroke="none"/>';
  if(k.pattern === 2)
    return blob(k, x + w * 0.26, y + h * 0.38, w * 0.10, h * 0.26) +
           blob(k, x + w * 0.52, y + h * 0.72, w * 0.12, h * 0.20) +
           blob(k, x + w * 0.76, y + h * 0.32, w * 0.08, h * 0.24);
  if(k.pattern === 3)
    return '<rect x="'+(x + 6)+'" y="'+(y + h * 0.14)+'" width="'+(w - 24)+'" height="'+(h * 0.22)+
           '" fill="'+k.light+'" opacity=".95" stroke="none"/>';
  return "";
}
function blob(k, cx, cy, rx, ry){
  return '<ellipse cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" rx="'+rx.toFixed(1)+
         '" ry="'+ry.toFixed(1)+'" fill="'+k.dark+'" opacity=".8" stroke="none"/>';
}

/* 导弹：灰弹身 + 红尖头 + 尾部慢慢烧的小火 */
function missileAt(s, x, y, w, h){
  var mid = y + h / 2;
  return '<g><line x1="'+(x+28)+'" y1="'+(y-8)+'" x2="'+(x+28)+'" y2="'+y+'" '+s+'/>' +
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'" fill="'+C.missile+'" '+s+'/>' +
    '<path d="M'+(x+w)+','+y+' L'+(x+w+20)+','+mid+' L'+(x+w)+','+(y+h)+' Z" fill="'+C.missileTip+'" '+s+'/>' +
    '<g class="mflame"><path d="M'+x+','+(y+2)+' L'+(x-16)+','+mid+' L'+x+','+(y+h-2)+' Z" fill="'+C.flame+'" '+s+'/>' +
    '<path d="M'+(x-4)+','+(y+4)+' L'+(x-24)+','+mid+' L'+(x-4)+','+(y+h-4)+' Z" fill="'+C.flame2+'" stroke="none"/></g></g>';
}

/* 触地扬起的烟 */
function puffSVG(jx){
  var y = DECK_Y + 33;
  return [0,1,2].map(function(i){
    return '<circle cx="'+(jx - 10 + i * 14)+'" cy="'+y+'" r="'+(6 + i * 2)+
           '" fill="#FFFFFF" stroke="#C6D2D9" stroke-width="2"/>';
  }).join("");
}

/* 起落架：支柱 + 会转的轮子 */
function wheel(s, x, top, bottom, cy, r, hubR){
  return '<g><line x1="'+x+'" y1="'+top+'" x2="'+x+'" y2="'+bottom+'" '+s+'/>' +
         '<g class="wheel"><circle cx="'+x+'" cy="'+cy+'" r="'+r+'" fill="'+C.wheel+'" '+s+'/>' +
         '<circle cx="'+x+'" cy="'+cy+'" r="'+hubR+'" fill="'+C.hub+'" '+s+'/></g></g>';
}

function jetPart(key, skin){
  return PART_DRAW[key] ? PART_DRAW[key](STROKE, skin || skinAt(0)) : "";
}
function jetBody(skin, keys){
  return keys.map(function(k){ return jetPart(k, skin); }).join("");
}

/* n = 已画出的零件数；spin = 轮子转；variant = 第几种涂装 */
function jetSVG(n, spin, animateLast, variant){
  var skin = skinAt(variant || 0);
  var shown = {};
  for(var i=0;i<n && i<JET_PARTS.length;i++) shown[JET_PARTS[i].key] = true;
  var last = (animateLast && n > 0 && n <= JET_PARTS.length) ? JET_PARTS[n-1].key : "";
  var body = JET_Z.filter(function(k){ return shown[k]; }).map(function(k){
    var g = jetPart(k, skin);
    return k === last ? '<g class="drawn">' + g + "</g>" : g;
  }).join("");
  return '<svg class="jet' + (spin ? " spin" : "") + '" viewBox="-24 10 310 150" ' +
         'xmlns="http://www.w3.org/2000/svg">' + CRAYON_DEFS +
         '<g class="ghost" opacity="0.08">' + jetBody(skin, JET_Z) + '</g>' +
         '<g filter="url(#cy)">' + body + '</g></svg>';
}

/* ---------- 航母 ---------- */
var DECK_X = [80, 150, 220, 290, 360, 430, 500];
var DECK_VIEW_W = 640;
var DECK_Y = 113;
var DECK_SCALE = 0.21;

/* jets = 七个位，每个是 null 或 {variant, stars}；landing = 正在降落的位次 */
function carrierSVG(jets, today, landing){
  var s = 'stroke="' + C.line + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
  var night = isNight();
  var ship = [hullSVG(s, night), islandSVG(s)];
  var flying = landing >= 0;
  jets.forEach(function(j, i){
    if(!j){ if(!flying) ship.push(deckSlot(DECK_X[i], i + 1 === today)); return; }
    ship.push(deckJet(DECK_X[i], j, i === landing));
  });
  return '<svg class="carrier' + (night ? " night" : "") + '" viewBox="0 0 640 250" ' +
         'xmlns="http://www.w3.org/2000/svg">' + CRAYON_DEFS +
         skySVG(night) +
         '<g filter="url(#cy)">' + seaSVG(night) +
         '<g class="ship">' + ship.join("") + '</g></g></svg>';
}

/* 天空：白天蓝天白云加太阳，晚上深蓝夜空加月亮星星 */
function skySVG(night){
  var bg = '<rect x="-20" y="-20" width="700" height="245" fill="' +
           (night ? C.skyNight : C.skyDay) + '"/>';
  return '<g class="sky">' + bg + (night ? nightSky() : daySky()) + '</g>';
}

function daySky(){
  var s = 'stroke="' + C.line + '" stroke-width="4" stroke-linejoin="round"';
  return '<g filter="url(#cy)"><circle cx="70" cy="44" r="23" fill="' + C.sun + '" ' + s + '/>' +
         cloud(150, 34, 0.9) + cloud(300, 58, 0.65) + cloud(430, 28, 1.05) + '</g>';
}

/* 外层 g 只做飘动动画，内层 g 定位，两个 transform 不能写在同一个元素上 */
function cloud(x, y, k){
  return '<g class="cloud" style="animation-delay:' + (-x / 55).toFixed(1) + 's">' +
         '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' +
         '<path d="M0,22 Q0,5 17,5 Q23,-9 40,-5 Q57,-11 61,5 Q78,5 78,22 Z" fill="' + C.cloud +
         '" stroke="' + C.line + '" stroke-width="4" stroke-linejoin="round"/></g></g>';
}

function nightSky(){
  var s = 'stroke="' + C.line + '" stroke-width="3.5" stroke-linejoin="round"';
  var moon = '<g filter="url(#cy)"><circle cx="86" cy="48" r="25" fill="' + C.moon + '" ' + s + '/>' +
             crater(78, 39, 6) + crater(95, 52, 4.5) + crater(80, 58, 3.5) + '</g>';
  return moon + '<g class="stars">' + starField() + '</g>';
}

var STAR_SPOTS = [
  [180,26,5],[232,54,3.5],[286,20,4],[338,48,3],[392,30,5],[444,62,3.5],
  [498,24,4],[152,72,3],[262,88,3.5],[356,80,3],[470,96,3],[540,40,4.5],
  [206,110,3],[416,110,3.5],[132,44,3]
];
function starField(){
  return STAR_SPOTS.map(function(p, i){
    return '<path class="tw" style="animation-delay:' + (i * 0.23).toFixed(2) + 's" d="' +
           starPath(p[0], p[1], p[2]) + '" fill="' + C.starLight + '"/>';
  }).join("");
}

function crater(x, y, r){
  return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#E8CF88" stroke="none"/>';
}

function starPath(x, y, r){
  var k = r * 0.34;
  return "M" + x + "," + (y - r) + " L" + (x + k) + "," + (y - k) + " L" + (x + r) + "," + y +
         " L" + (x + k) + "," + (y + k) + " L" + x + "," + (y + r) + " L" + (x - k) + "," + (y + k) +
         " L" + (x - r) + "," + y + " L" + (x - k) + "," + (y - k) + " Z";
}

function seaSVG(night){
  return '<path d="M-20,196 Q20,186 60,196 T140,196 T220,196 T300,196 T380,196 T460,196 T540,196 ' +
         'T620,196 T700,196 L700,250 L-20,250 Z" fill="' + (night ? C.seaNight : C.sea) +
         '" stroke="' + (night ? C.seaNightDark : C.seaDark) + '" stroke-width="4"/>';
}
function hullSVG(s, night){
  return '<path d="M40,168 L600,168 L562,214 Q320,228 78,214 Z" fill="' + C.army + '" ' + s + '/>' +
         '<rect x="26" y="146" width="588" height="24" rx="6" fill="' + C.armyDark + '" ' + s + '/>' +
         '<rect x="30" y="146" width="580" height="11" fill="' + C.armyLight + '" stroke="none"/>';
}
function islandSVG(s){
  return '<g><rect x="546" y="86" width="62" height="60" rx="8" fill="' + C.armyDark + '" ' + s + '/>' +
         '<rect x="560" y="100" width="14" height="14" rx="3" fill="' + C.glass + '" ' + s + '/>' +
         '<rect x="582" y="100" width="14" height="14" rx="3" fill="' + C.glass + '" ' + s + '/>' +
         '<line x1="577" y1="86" x2="577" y2="54" ' + s + '/>' +
         '<circle cx="577" cy="48" r="9" fill="' + C.sun + '" ' + s + '/></g>';
}

/* 甲板上的飞机水平镜像，机头朝左 —— 也就是朝着飞行方向，从舰尾进场 */
function deckTransform(x, y, rot){
  var t = "translate(" + (x + 27) + "," + (y === undefined ? DECK_Y : y) +
          ") scale(" + (-DECK_SCALE) + "," + DECK_SCALE + ")";
  return rot ? t + " rotate(" + rot.toFixed(2) + ",128,82)" : t;
}

function deckJet(x, j, landing){
  var cls = landing ? ' class="landing"' : "";
  var pos = landing ? deckTransform(x + 470, -40) : deckTransform(x);
  return '<g' + cls + ' transform="' + pos + '">' + jetBody(skinAt(j.variant), JET_Z) + '</g>' +
         (j.stars ? starsSVG(x, j.stars) : "");
}

/* 巩固几遍就给几颗星 */
function starsSVG(x, n){
  var out = "";
  for(var i=0;i<n;i++){
    var cx = x - (n - 1) * 7 + i * 14;
    out += '<circle cx="' + cx + '" cy="82" r="5" fill="' + C.star +
           '" stroke="' + C.line + '" stroke-width="2.5"/>';
  }
  return out;
}

function deckSlot(x, isToday){
  return '<circle cx="' + x + '" cy="128" r="21" fill="none" stroke="' +
         (isToday ? C.sun : "#C8D2D8") + '" stroke-width="5" stroke-dasharray="8 7" stroke-linecap="round"/>';
}
