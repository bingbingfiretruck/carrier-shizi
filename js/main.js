/* 启动 */
(function(){
  el("btnExport").onclick = downloadProgress;
  el("btnImport").onclick = function(){ el("fileImport").click(); };
  el("fileImport").onchange = function(ev){
    var f = ev.target.files[0];
    if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      try{ importProgress(r.result); renderAll(); alert("进度已导入"); }
      catch(e){ alert("导入失败：" + e.message); }
    };
    r.readAsText(f);
    ev.target.value = "";
  };
  el("histPrev").onclick = function(){ shiftHistory(-1); };
  el("histNext").onclick = function(){ shiftHistory(1); };
  el("btnReset").onclick = function(){
    if(confirm("会清空所有学习进度、返工区和航母，确定吗？")){
      resetState();
      resetSpeechFallback();
      location.reload();
    }
  };

  /* iOS 需要一次用户手势才能出声 */
  document.addEventListener("click", function once(){
    audioCtx();
    document.removeEventListener("click", once);
  });

  syncWeek();
  renderAll();
})();
