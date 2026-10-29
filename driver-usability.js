/* Câmera por gesto do usuário e consulta restrita da viatura selecionada. */
(()=>{
 const cameraIcon='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h5l2-3h4l2 3h5v15H3Z"/><circle cx="12" cy="13" r="4"/></svg>';
 function cameras(){app.querySelectorAll('#departure input[type=file],[data-inspection] input[type=file]').forEach(input=>{if(input.dataset.cameraReady)return;input.dataset.cameraReady='true';input.setAttribute('capture','environment');const label=input.closest('label');if(!label)return;const b=document.createElement('button');b.type='button';b.className='secondary ce-camera';b.innerHTML=cameraIcon+'<span>Tirar foto</span>';b.setAttribute('aria-label','Tirar foto');b.onclick=()=>input.click();input.before(b);});}
 new MutationObserver(cameras).observe(app,{childList:true,subtree:true});
 document.addEventListener('change',e=>{if(e.target.matches('input[type=file][data-camera-ready]')){const b=e.target.previousElementSibling;b?.querySelector('span')&&(b.querySelector('span').textContent=e.target.files.length?'Tirar outra foto':'Tirar foto');}});
 window.cep4ReservationAvailability=(form,error)=>{
  const vehicle=form.elements.vehicleId,start=form.elements.start,end=form.elements.end,submit=form.querySelector('[type=submit]');
  const box=document.createElement('section');box.className='ce-reservation-availability';box.setAttribute('aria-live','polite');vehicle.closest('label').after(box);
  let serial=0,loading=false,loaded='',windows=[],status='',failed=false;
  const iso=v=>v?new Date(v+':00-04:00').toISOString():'';
  function valid(show=false){
   const a=Date.parse(start.value+':00-04:00'),b=Date.parse(end.value+':00-04:00');
   const conflict=windows.find(w=>a<(w.end?Date.parse(w.end):Infinity)&&b>Date.parse(w.start));
   const unavailable=!!vehicle.value&&(loading||failed||loaded!==vehicle.value||status==='Em manutenção'||!!conflict);
   if(show&&unavailable)error.textContent=loading?'Aguarde a consulta da viatura.':failed?'Não foi possível verificar a disponibilidade. Selecione a viatura novamente.':'Data e horário indisponível, escolha novamente.';
   else if(!unavailable)error.textContent='';
   end.setCustomValidity(Number.isFinite(a)&&Number.isFinite(b)&&b<=a?'Informe um fim posterior ao início.':'');
   submit.disabled=unavailable||!vehicle.value||!Number.isFinite(a)||!Number.isFinite(b)||b<=a||b<=Date.now();
   const next=form.nextElementSibling?.querySelector('[data-next]'),datesVisible=!start.closest('label').classList.contains('ma-field-hidden')||!end.closest('label').classList.contains('ma-field-hidden');if(next)next.disabled=loading||failed||(datesVisible&&unavailable);
   box.classList.toggle('ce-unavailable',unavailable&&!loading);
   return !unavailable;
  }
  function paint(){box.replaceChildren();const h=document.createElement('b');h.textContent=loading?'Consultando viatura…':failed?'Consulta indisponível':status||'Selecione uma viatura';box.append(h);
   windows.forEach(w=>{const row=document.createElement('p'),date=document.createElement('strong');date.className='ce-busy-period';date.textContent=reservationDate(w.start)+' até '+(w.end?reservationDate(w.end):'retorno ainda não definido');row.append(date);const detail=document.createElement('span');detail.textContent=[w.status,w.rank&&!String(w.driverName||'').startsWith(w.rank+' ')?w.rank:'',w.driverName,w.phone?'Contato: '+w.phone:'',w.destination].filter(Boolean).join(' · ');row.append(document.createElement('br'),detail);box.append(row);});valid(true);}
  async function load(){const n=++serial;windows=[];loaded='';failed=false;status='';if(!vehicle.value){loading=false;paint();return;}loading=true;paint();try{const data=await window.cep4Api('reservations/availability',{vehicleId:vehicle.value});if(n!==serial)return;loaded=vehicle.value;windows=data.windows||[];status=data.status;}catch(e){if(n!==serial)return;failed=true;error.textContent=e.message;}finally{if(n===serial){loading=false;paint();}}}
  form.reservationAvailable=stage=>{const result=valid(true);if(stage==='step'&&!loading&&!failed&&loaded===vehicle.value&&start.closest('label').classList.contains('ma-field-hidden')&&end.closest('label').classList.contains('ma-field-hidden'))return true;return result;};vehicle.addEventListener('change',load);[start,end].forEach(f=>f.addEventListener('input',()=>valid(true)));load();
 };
})();
