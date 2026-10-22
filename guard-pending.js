// Destaca todos os retornos já informados, sem depender das primeiras linhas do painel.
(()=>{
 const previous=render;render=function(){previous();if(page!=='Painel'||!canGuardEntry()||state?.needsDriverRegistration)return;
  const pending=state.trips.filter(t=>t.status==='Aguardando entrada');if(!pending.length)return;
  const panel=document.createElement('section');panel.className='panel';panel.id='guard-pending-entries';panel.innerHTML='<h2>Entradas aguardando conferência ('+pending.length+')</h2><p>O motorista já informou o retorno. Confira para finalizar a missão e liberar a viatura.</p>'+pending.map(t=>'<div style="padding:12px 0;border-bottom:1px solid #d8e5f3"><b>'+esc(vehicle(t)?.prefix)+' · '+esc(vehicle(t)?.plate)+'</b><p>'+esc(officer(t)?.name)+' · Odômetro final: '+number(t.final)+' km</p><button type="button" data-pending-trip="'+esc(t.id)+'" data-pending-action="'+(t.divergence?'correct':'confirm-entry')+'">'+(t.divergence?'Corrigir leitura e conferir':'Conferir entrada')+'</button></div>').join('');
  document.querySelector('.layout main .page-heading')?.after(panel);
  panel.querySelectorAll('[data-pending-trip]').forEach(b=>b.onclick=()=>showAction(b.dataset.pendingTrip,b.dataset.pendingAction));
 };
})();
