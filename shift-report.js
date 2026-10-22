// O PDF continua privado no Drive; a leitura usa a sessão autorizada do aplicativo.
function shiftReportPeriod(start,end){
 const format=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
 if(!format.test(start)||!format.test(end))throw Error('Preencha início e fim do plantão.');
 const from=start+':00-04:00',to=end+':00-04:00';
 if(!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||Date.parse(to)<=Date.parse(from))throw Error('O fim do plantão deve ser posterior ao início.');
 return {start:from,end:to};
}
(()=>{
 let documentPdf=null,pending=false,session=0;
 function clearPdf(){if(documentPdf)URL.revokeObjectURL(documentPdf.url);documentPdf=null;}
 function previewPdf(){
  if(!documentPdf)return;
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','PDF do plantão');dialog.style.cssText='width:95vw;max-width:1100px;height:90dvh;padding:16px';
  const close=document.createElement('button');close.textContent='Fechar';close.onclick=()=>dialog.close();
  const frame=document.createElement('iframe');frame.title='Relatório de movimentação de viaturas';frame.src=documentPdf.url;frame.style.cssText='width:100%;height:calc(100% - 60px);border:0;display:block;margin-top:12px';
  dialog.append(close,frame);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
 }
 function actions(){
  const target=document.querySelector('#report-link');if(!target||!documentPdf)return;
  target.replaceChildren();const summary=document.createElement('p'),local=value=>{const [date,time]=value.split('T');return date.split('-').reverse().join('/')+' às '+time;};summary.textContent='PDF pronto: '+local(documentPdf.start)+' até '+local(documentPdf.end)+' (Cuiabá).';target.append(summary);
  const controls=document.createElement('div');controls.style.cssText='display:flex;gap:12px;flex-wrap:wrap';
  const view=document.createElement('button');view.type='button';view.textContent='Visualizar PDF';view.onclick=previewPdf;
  const download=document.createElement('a');download.href=documentPdf.url;download.download=documentPdf.name;download.textContent='Baixar PDF';download.className='secondary';download.style.cssText='display:inline-flex;align-items:center;padding:12px 18px;border:1px solid #b6cbe3;border-radius:10px';
  const print=document.createElement('button');print.type='button';print.textContent='Imprimir';print.onclick=()=>{
   const frame=document.createElement('iframe');frame.title='Impressão do relatório do plantão';frame.style.cssText='position:fixed;width:1px;height:1px;left:-9999px';frame.src=documentPdf.url;
   frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print();}catch{notify('Use Visualizar PDF e a opção de impressão do leitor de PDF.');}};document.body.append(frame);setTimeout(()=>frame.remove(),300000);
  };
  controls.append(view,download,print);target.append(controls);
 }
 const oldControls=reportControls;reportControls=function(){return oldControls().replace('Gerar PDF do plantão no Drive','Gerar relatório do plantão').replace('Lista única com viatura, destino, saída e situação: Em missão ou Finalizado.','Movimentações com motorista, matrícula, destino, saída e retorno. Situação: Em missão, Aguardando conferência ou Finalizado.');};
 const oldBind=bind;bind=function(){oldBind();
  for(const [id,key] of [['report-start','start'],['report-end','end']])document.querySelector('#'+id)?.addEventListener('input',e=>{if(key==='start')reportStart=e.target.value;else reportEnd=e.target.value;});
  const original=document.querySelector('#period-pdf');if(!original)return;
  const button=original.cloneNode(true);original.replaceWith(button);button.disabled=pending;actions();
  button.onclick=async()=>{
   if(pending)return;const start=document.querySelector('#report-start').value,end=document.querySelector('#report-end').value;let period;
   try{period=shiftReportPeriod(start,end);}catch(error){notify(error.message);return;}
   reportStart=start;reportEnd=end;pending=true;button.disabled=true;button.textContent='Preparando PDF…';const current=session;
   try{
    const result=await api('reports/pdf',period);if(current!==session)return;
    if(!result.id)throw Error('O relatório foi registrado, mas não retornou um identificador. Gere novamente.');
    const file=await api('files/read',{fileId:result.id});if(current!==session)return;
    if(file.mime!=='application/pdf')throw Error('O arquivo recebido não é um PDF válido.');
    const bytes=Uint8Array.from(atob(file.data),c=>c.charCodeAt(0));clearPdf();documentPdf={url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),name:file.name||'CE-P4-plantao.pdf',start,end};actions();notify('Relatório pronto para baixar ou imprimir.');
   }catch(error){if(current===session)notify(error.message);}finally{if(current===session){pending=false;const active=document.querySelector('#period-pdf');if(active){active.disabled=false;active.textContent='Gerar relatório do plantão';}}}
  };
 };
 const oldRender=render;render=function(){oldRender();if(page==='Relatórios'&&document.querySelector('#period-pdf'))document.querySelector('#print')?.closest('.panel')?.remove();};
 const oldClear=window.cep4Clear;window.cep4Clear=function(...args){session++;pending=false;clearPdf();document.querySelectorAll('dialog[aria-label="PDF do plantão"]').forEach(d=>d.remove());return oldClear?.(...args);};
})();
