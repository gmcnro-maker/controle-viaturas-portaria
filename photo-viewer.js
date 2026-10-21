// Imagens privadas são lidas pela mesma rota autorizada e exibidas em memória.
(()=>{
 let viewer=null,url=null;
 function cleanup(){if(url)URL.revokeObjectURL(url);url=null;viewer?.remove();viewer=null;}
 downloadOdometer=async function(id){
  if(viewer?.open)return;
  const dialog=document.createElement('dialog');viewer=dialog;dialog.setAttribute('aria-label','Fotografia da viatura');dialog.style.cssText='width:min(94vw,1100px);max-width:94vw;max-height:92dvh;padding:18px';dialog.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px"><h2>Fotografia da viatura</h2><button type="button" class="secondary" aria-label="Fechar fotografia">Fechar ✕</button></div><p role="status">Carregando fotografia…</p><img alt="Fotografia anexada à movimentação" hidden style="display:block;max-width:100%;max-height:72dvh;object-fit:contain;margin:auto">';document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(viewer===dialog)cleanup();},{once:true});dialog.showModal();
  try{if(!id)throw Error('Fotografia não encontrada.');const file=await api('files/read',{fileId:id});if(viewer!==dialog||!dialog.open)return;if(!['image/jpeg','image/png'].includes(file.mime))throw Error('Este arquivo não é uma fotografia.');url=URL.createObjectURL(new Blob([Uint8Array.from(atob(file.data),c=>c.charCodeAt(0))],{type:file.mime}));const img=dialog.querySelector('img');img.src=url;img.hidden=false;dialog.querySelector('[role=status]').textContent='Clique em Fechar para voltar à conferência.';}catch(error){if(dialog.open)dialog.querySelector('[role=status]').textContent=error.message;}
 };
 const action=showAction;showAction=function(id,kind){action(id,kind);const trip=state.trips.find(t=>t.id===id),form=document.querySelector('#action-form');if(!form||!trip?.entryPhoto||!['confirm-entry','correct'].includes(kind))return;const b=document.createElement('button');b.type='button';b.textContent='Ver foto do odômetro de entrada';b.onclick=()=>downloadOdometer(trip.entryPhoto.id);form.querySelector('h2').after(b);};
 const previous=render;render=function(){previous();document.querySelectorAll('[data-file-download]').forEach(b=>{const file=state?.files?.find(f=>f.id===b.dataset.fileDownload);if(file&&['image/jpeg','image/png'].includes(file.mime))b.onclick=()=>downloadOdometer(file.id);});};
 const clear=window.cep4Clear;window.cep4Clear=function(...args){viewer?.close();cleanup();return clear(...args);};
})();
