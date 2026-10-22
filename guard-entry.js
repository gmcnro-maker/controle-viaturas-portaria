// Entrada excepcional: o motorista vinculado à missão não é substituído.
function canGuardEntry(){return state?.user?.customRole?uiPermit('trips.confirm'):['Comandante da Guarda','Administrador'].includes(state?.user?.role);}
(()=>{
 const previousButton=actionButton;actionButton=function(trip){if(trip.status==='Em serviço'&&canGuardEntry())return '<button type="button" class="text-button" data-guard-entry="'+esc(trip.id)+'">Registrar entrada pela Guarda</button>';return previousButton(trip);};
 const previousBind=bind;bind=function(){previousBind();document.querySelectorAll('[data-guard-entry]').forEach(button=>button.onclick=()=>showAction(button.dataset.guardEntry,'guard-entry'));};
 const previousAction=showAction;showAction=function(id,action){
  if(action!=='guard-entry')return previousAction(id,action);
  if(!canGuardEntry())return notify('Entrada restrita à Guarda.');
  previousAction(id,'return');const form=document.querySelector('#action-form'),dialog=document.querySelector('#action-dialog');
  form.querySelector('h2').textContent='Registrar entrada pela Guarda';
  const info=document.createElement('p');info.textContent='Use quando a viatura já retornou e o motorista não lançou. Esta operação registra o retorno e confirma a entrada, identificando a Guarda responsável.';form.querySelector('h2').after(info);
  const reason=document.createElement('label');reason.innerHTML='Justificativa do lançamento pela Guarda<textarea name="guardReason" required maxlength="500" rows="3" placeholder="Explique por que o motorista não registrou o retorno"></textarea>';form.querySelector('.button-row').before(reason);
  const trip=state.trips.find(t=>t.id===id);form.elements.final.min=String(trip.initial);
  const submit=form.querySelector('button[type=submit]');submit.textContent='Confirmar entrada pela Guarda';
  form.onsubmit=async event=>{
   event.preventDefault();if(!form.reportValidity())return;submit.disabled=true;let data;
   try{data={final:form.elements.final.value,reason:form.elements.guardReason.value,photo:await readOdometerPhoto(form.elements.odometerPhoto.files[0]),...await collectInspection(form)};await api('trips/'+id+'/guard-entry',data);dialog.close();await refresh();notify('Entrada registrada pela Guarda. Viatura disponível.');}
   catch(error){let box=form.querySelector('[role=alert]');if(!box){box=document.createElement('p');box.setAttribute('role','alert');form.querySelector('.button-row').before(box);}box.textContent=error.message;box.hidden=false;}finally{data=null;submit.disabled=false;}
  };
 };
})();
