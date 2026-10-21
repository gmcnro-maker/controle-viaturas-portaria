// A primeira leitura pertence à solicitação de saída, nunca ao cadastro da viatura.
(()=>{
 const previous=render;
 render=function(){
  previous();
  if(!state)return;
  if(page==='Viaturas')document.querySelector('#register [name=odometer]')?.closest('label').remove();
  const form=document.querySelector('#departure');if(!form)return;
  const select=form.elements.vehicleId,reading=form.querySelector('#initial-reading'),toggle=form.querySelector('#exit-divergence');if(!select||!reading)return;
  const label=reading.closest('label'),hint=document.createElement('small');label.append(hint);
  function update(){
   const v=state.vehicles.find(item=>item.id===select.value),pending=!!v&&v.odometer==null;
   reading.type=pending?'number':'text';reading.readOnly=!pending;reading.required=pending;
   if(pending){reading.name='initial';reading.min='0';reading.step='1';reading.inputMode='numeric';reading.value='';reading.placeholder='Leitura atual do painel';}
   else{reading.removeAttribute('name');reading.value=v?number(v.odometer)+' km':'Selecione uma viatura';}
   label.firstChild.textContent=pending?'Odômetro inicial da primeira saída':'Odômetro inicial · automático';
   hint.textContent=pending?'Informe a leitura do painel. A Guarda conferirá ao autorizar a saída.':v?'Preenchido automaticamente pelo sistema.':'';
   if(form.previousElementSibling?.matches('p'))form.previousElementSibling.textContent='Na primeira saída, informe a leitura do painel. Nas seguintes, o sistema usa a última entrada confirmada.';
   if(toggle){toggle.disabled=pending;toggle.closest('label').hidden=pending;if(pending){toggle.checked=false;toggle.onchange();}}
  }
  select.onchange=update;update();
 };
 const previousAction=showAction;
 showAction=function(id,action){previousAction(id,action);const trip=state.trips.find(t=>t.id===id);if(action==='confirm-exit'&&trip?.firstReading){const note=document.createElement('p');note.className='alert';note.textContent='Primeira leitura informada na solicitação: '+number(trip.initial)+' km. Confira o painel antes de autorizar.';document.querySelector('#action-form h2')?.after(note);}};
})();
