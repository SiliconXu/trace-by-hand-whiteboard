/* Visual formula components. Embedded inside the app scope by build.py. */
var FORMULA_TEMPLATES=[
  ['blank','空白公式','','f(x)'],
  ['fraction','分數','\\frac{\\placeholder{}}{\\placeholder{}}','\\frac{a}{b}'],
  ['sqrt','根號','\\sqrt{\\placeholder{}}','\\sqrt{x}'],
  ['root','多次根號','\\sqrt[\\placeholder{}]{\\placeholder{}}','\\sqrt[n]{x}'],
  ['power','冪／上標','\\placeholder{}^{\\placeholder{}}','x^{2}'],
  ['subscript','下標','\\placeholder{}_{\\placeholder{}}','a_{i}'],
  ['sum','求和','\\sum_{i=1}^{n}\\placeholder{}','\\sum_{i=1}^{n}a_i'],
  ['complexity','時間複雜度','O(n)','O(n)'],
  ['nlogn','線性對數','O(n\\log n)','O(n\\log n)'],
  ['recurrence','遞推關係','T(n)=2T\\left(\\frac{n}{2}\\right)+n','T(n)'],
  ['dp','DP 狀態轉移','\\mathrm{dp}_{i}=\\max\\left(\\mathrm{dp}_{i-1},\\placeholder{}\\right)','\\mathrm{dp}_{i}']
];
var formulaEditor=null;
if(window.MathLive&&MathLive.MathfieldElement){
  MathLive.MathfieldElement.fontsDirectory=null; // Font faces are embedded in the page.
  MathLive.MathfieldElement.soundsDirectory=null;
  MathLive.MathfieldElement.keypressSound=null;
  MathLive.MathfieldElement.plonkSound=null;
  MathLive.MathfieldElement.computeEngine=null;
  MathLive.MathfieldElement.locale=LANG;
}
function formulaTemplate(id){return FORMULA_TEMPLATES.filter(function(t){return t[0]===id;})[0]||FORMULA_TEMPLATES[0];}
function formulaSize(it){var size=Number(it.fontSize);return isFinite(size)&&size>0?Math.max(14,Math.min(64,size)):24;}
function formulaMarkup(latex){
  latex=String(latex==null?'':latex);
  if(!latex) return '<span class="formula-empty">'+_T('雙擊編輯公式')+'</span>';
  if(window.MathLive&&MathLive.convertLatexToMarkup){
    try{return MathLive.convertLatexToMarkup(latex,{defaultMode:'displaystyle'});}catch(e){}
  }
  return esc(latex);
}
function formulaItemHtml(it){
  return '<div class="formula-view" data-formula-view tabindex="0" role="img" aria-label="'+esc(it.latex||_T('空白公式'))+'" title="'+_T('雙擊編輯公式')+'" style="font-size:'+formulaSize(it)+'px">'+formulaMarkup(it.latex)+'</div>';
}
function initFormulaPalette(){
  $('formulaPalette').innerHTML=FORMULA_TEMPLATES.map(function(t){
    return '<button class="pal formula-tile" type="button" data-add="formula" data-formula-template="'+t[0]+'" data-k="'+esc(_T('公式')+' '+_T(t[1])+' '+t[1]+' '+t[0])+'" title="'+esc(_T(t[1]))+'"><span class="formula-sample" aria-hidden="true">'+formulaMarkup(t[3])+'</span><span>'+_T(t[1])+'</span></button>';
  }).join('');
}
function copyFormulaLatex(latex){
  function fallback(){
    if(!formulaEditor&&sel&&byId(sel)&&byId(sel).type==='formula') openFormula(sel);
    if(!formulaEditor)return;
    $('formulaDetails').open=true;var source=$('formulaSource');source.value=latex;source.focus();source.select();
    $('formulaMessage').textContent=_T('請複製選取的 LaTeX');
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(latex).then(function(){if(formulaEditor)$('formulaMessage').textContent=_T('已複製');else toast(_T('已複製'));},fallback);
  }else fallback();
}
function closeFormula(save){
  if(!formulaEditor)return;
  var state=formulaEditor, it=byId(state.id), mf=state.field;
  if(save&&it){
    if(state.sourceDirty) mf.setValue($('formulaSource').value);
    it.latex=mf.getValue('latex'); it.fontSize=Number($('formulaFontSize').value);
  }
  formulaEditor=null;state.modal.remove();
  if(save&&it){renderAll();commit();}
  var view=itemsEl.querySelector('[data-id="'+state.id+'"] [data-formula-view]');if(view)view.focus();
}
function openFormula(id){
  var it=byId(id);if(!it||it.type!=='formula')return;
  if(formulaEditor){if(formulaEditor.id===id){formulaEditor.field.focus();return;}closeFormula(true);}
  if(!window.MathLive||!MathLive.MathfieldElement){toast(_T('公式編輯器尚未載入，請重新整理頁面'));return;}
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  sel=id;selEdge=null;clearMulti();setTool('select');renderAll();
  var modal=document.createElement('div');modal.className='modal formula-modal';
  var tools=[['fraction','分數','a/b'],['sqrt','根號','√'],['root','多次根號','ⁿ√'],['power','冪／上標','x²'],['subscript','下標','aᵢ'],['sum','求和','∑'],['paren','括號','( )']];
  modal.innerHTML='<div class="box formula-dialog" role="dialog" aria-modal="true" aria-labelledby="formulaHeading">'+
    '<div class="formula-heading"><b id="formulaHeading">'+_T('編輯公式')+'</b><button type="button" class="tb" id="formulaCancel">'+_T('取消')+'</button></div>'+
    '<p class="formula-hint">'+_T('選取內容後可套用分數、根號或上下標。按 Tab 切換空位；Ctrl/Cmd+Enter 完成。')+'</p>'+
    '<div class="formula-tools" role="toolbar" aria-label="'+_T('公式結構')+'">'+tools.map(function(t){return '<button type="button" class="tb" data-formula-insert="'+t[0]+'" title="'+_T(t[1])+'" aria-label="'+_T(t[1])+'">'+t[2]+'</button>';}).join('')+
    '<button type="button" class="tb" data-formula-command="moveToNextPlaceholder">'+_T('下一空位')+'</button><button type="button" class="tb" data-formula-command="undo">'+_T('復原')+'</button><button type="button" class="tb" data-formula-command="redo">'+_T('重做')+'</button></div>'+
    '<div id="formulaMathHost"></div><p class="formula-error" id="formulaError" role="status" hidden></p>'+
    '<details id="formulaDetails"><summary>'+_T('LaTeX 原始碼')+'</summary><textarea id="formulaSource" spellcheck="false" aria-label="'+_T('LaTeX 原始碼')+'"></textarea><button type="button" class="tb" id="formulaApply">'+_T('套用原始碼')+'</button></details>'+
    '<div class="formula-footer"><label>'+_T('字級')+' <select id="formulaFontSize" aria-label="'+_T('字級')+'">'+[14,16,20,24,28,32,40,48,56,64].concat([formulaSize(it)]).filter(function(n,i,a){return a.indexOf(n)===i;}).sort(function(a,b){return a-b;}).map(function(n){return '<option value="'+n+'"'+(n===formulaSize(it)?' selected':'')+'>'+n+'</option>';}).join('')+'</select></label>'+
    '<button type="button" class="tb" id="formulaCopy">'+_T('複製 LaTeX')+'</button><button type="button" class="tb formula-done" id="formulaDone">'+_T('完成')+'</button></div><p class="formula-hint" id="formulaMessage" role="status"></p></div>';
  document.body.appendChild(modal);
  var mf=new MathLive.MathfieldElement();
  mf.setAttribute('aria-label',_T('公式內容'));mf.setAttribute('math-virtual-keyboard-policy','manual');
  mf.style.fontSize=formulaSize(it)+'px';
  var state={id:id,modal:modal,field:mf,sourceDirty:false};formulaEditor=state;
  $('formulaMathHost').appendChild(mf);mf.menuItems=[];mf.popoverPolicy='off';mf.smartSuperscript=false;mf.setValue(String(it.latex||''));
  function updateSource(){
    if(formulaEditor!==state)return;
    $('formulaSource').value=mf.getValue('latex');state.sourceDirty=false;
    var errors=mf.errors||[];$('formulaError').hidden=!errors.length;
    $('formulaError').textContent=errors.length?_T('公式中有未完成的命令，可繼續編輯或修改原始碼。'):'';
  }
  function applySource(){mf.setValue($('formulaSource').value);updateSource();mf.focus();}
  mf.addEventListener('input',updateSource);
  $('formulaSource').oninput=function(){state.sourceDirty=true;};
  $('formulaApply').onclick=applySource;
  $('formulaCancel').onclick=function(){closeFormula(false);};$('formulaDone').onclick=function(){closeFormula(true);};
  $('formulaCopy').onclick=function(){copyFormulaLatex(state.sourceDirty?$('formulaSource').value:mf.getValue('latex'));};
  $('formulaFontSize').onchange=function(){mf.style.fontSize=this.value+'px';};
  modal.addEventListener('pointerdown',function(e){if(e.target.closest('[data-formula-insert],[data-formula-command]'))e.preventDefault();});
  modal.addEventListener('click',function(e){
    var insert=e.target.closest('[data-formula-insert]'), command=e.target.closest('[data-formula-command]');
    if(!insert&&!command)return;
    if(state.sourceDirty)applySource();
    mf.focus();
    if(command)mf.executeCommand(command.dataset.formulaCommand);
    if(insert){
      var base=mf.selectionIsCollapsed?'#?':'#0';
      var fragments={fraction:'\\frac{'+base+'}{#?}',sqrt:'\\sqrt{'+base+'}',root:'\\sqrt[#?]{'+base+'}',power:'{'+base+'}^{#?}',subscript:'{'+base+'}_{#?}',sum:'\\sum_{#?}^{#?}'+base,paren:'\\left('+base+'\\right)'};
      mf.insert(fragments[insert.dataset.formulaInsert],{selectionMode:'placeholder',insertionMode:'replaceSelection',format:'latex',focus:true,feedback:false});
    }
    updateSource();
  });
  modal.addEventListener('keydown',function(e){
    e.stopPropagation();if(e.isComposing)return;
    if(e.key==='Escape'){e.preventDefault();closeFormula(false);return;}
    if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();closeFormula(true);return;}
    if(e.key==='Tab'){
      var focusable=Array.from(modal.querySelectorAll('button,select,textarea,summary,math-field')).filter(function(el){return el.getClientRects().length>0;}), first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  updateSource();mf.focus();
  if(mf.value.indexOf('\\placeholder')>=0){mf.executeCommand('moveToMathfieldStart');mf.executeCommand('moveToNextPlaceholder');}
  else mf.executeCommand('moveToMathfieldEnd');
}
initFormulaPalette();
