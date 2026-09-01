/* 同步层：v0.1 只做本地导出/导入，GitHub 仓库同步接口预留在下方 */

function exportProgress(){
  return JSON.stringify(state);
}

function importProgress(text){
  var s = JSON.parse(text);
  if(!s || s.v !== 2) throw new Error("进度文件版本不对");
  state = s;
  saveState();
}

function downloadProgress(){
  var blob = new Blob([exportProgress()], { type:"application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "航母工地进度-" + todayKey() + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
}

/* ---------- GitHub 仓库同步（v0.2 接上）----------
   计划：私有仓库 carrier-data 里的 progress.json，走 GitHub Contents API。
   打开时 pull 一次，每次打卡后 push 一次；令牌存 localStorage。
   下面两个函数目前是空实现，onStateSaved 已经挂好钩子。 */
var syncConfig = { token:"", repo:"", path:"progress.json" };

function pullFromCloud(){ return Promise.resolve(null); }
function pushToCloud(){ return Promise.resolve(false); }

/* saveState() 每次都会调用它，v0.2 在这里做防抖上传 */
function onStateSaved(){}
