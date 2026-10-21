/* Exclusão de cadastro: Administrador e Supervisor P4; decisão final no servidor. */
(()=>{
 const prior=render;
 render=function(){
  prior();
  if(!state||state.needsDriverRegistration||page!=='Viaturas'||state.user.customRole||!['Administrador','Supervisor da Frota - P4'].includes(state.user.role))return;
  document.querySelectorAll('[data-fleet]').forEach(update=>{
   const id=update.dataset.fleet,v=state.vehicles.find(item=>item.id===id);if(!v)return;
   const button=document.createElement('button');button.type='button';button.className='secondary danger-action';button.dataset.fleetDelete=id;button.textContent='Excluir cadastro';update.after(document.createTextNode(' '),button);
   button.onclick=()=>{
    const dialog=document.querySelector('#action-dialog');
    dialog.innerHTML='<form id="fleet-delete-form"><h2>Excluir cadastro da viatura</h2><p><b>'+esc(v.prefix)+'</b> · '+esc(v.plate)+'</p><p>Viaturas com movimentações vinculadas não podem ser excluídas. Nesse caso, use Atualizar para alterar a situação e preservar o histórico.</p><label>Motivo da exclusão<input name="reason" required maxlength="500"></label><label>Digite EXCLUIR<input name="confirmation" required pattern="EXCLUIR" autocomplete="off"></label><p id="fleet-delete-error" role="alert"></p><div class="button-row"><button type="button" class="secondary" id="fleet-delete-cancel">Cancelar</button><button type="submit" class="danger-action">Excluir cadastro</button></div></form>';
    dialog.querySelector('#fleet-delete-cancel').onclick=()=>dialog.close();
    dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const form=event.target,b=form.querySelector('[type=submit]');b.disabled=true;try{await api('admin/records/delete',{entity:'vehicles',id,reason:form.elements.reason.value,confirmation:form.elements.confirmation.value});dialog.close();await refresh();notify('Cadastro de viatura excluído. Histórico da operação preservado.');}catch(error){dialog.querySelector('#fleet-delete-error').textContent=error.message;}finally{b.disabled=false;}};
    dialog.showModal();
   };
  });
 };
})();
