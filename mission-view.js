function missionStatus(trip){return trip.status==='Aguardando saída'?'Aguardando':trip.status==='Em serviço'?'Liberado':trip.status==='Concluída'?'Finalizado':'Aguardando conferência do retorno';}
function missionPanel(id){
 const trip=state.trips.find(t=>t.id===id);if(!trip)return '<section class="panel"><h1>Missão indisponível</h1><p>Atualize os registros para consultar esta missão.</p></section>';
 const status=missionStatus(trip),v=vehicle(trip);return '<section class="panel mission-status"><span class="eyebrow">MINHA MISSÃO</span><h1>'+esc(v?.prefix||'Viatura')+'</h1><p role="status" aria-live="polite" class="badge '+(trip.status==='Em serviço'?'good':'warn')+'" style="font-size:1.3rem;padding:14px 20px">'+esc(status)+'</p><p>'+esc(trip.status==='Aguardando saída'?'Solicitação enviada. Aguarde a autorização do Comandante da Guarda.':trip.status==='Em serviço'?'Saída autorizada pela Guarda.':'Acompanhe a conferência da sua movimentação.')+'</p><p><b>Missão:</b> '+esc(trip.destination)+'</p><p><b>Odômetro inicial:</b> '+number(trip.initial)+' km</p>'+(trip.status==='Em serviço'?'<button type="button" data-mission-return="'+esc(trip.id)+'">Registrar retorno</button>':'')+'</section>';
}
(()=>{
 const table=tripTable;tripTable=function(trips,...args){const html=table(trips,...args);if(state?.user?.role!=='Motorista')return html;const box=document.createElement('div');box.innerHTML=html;box.querySelectorAll('tbody tr').forEach((row,i)=>{const cell=row.querySelector('td:last-child');if(cell&&trips[i])cell.insertAdjacentHTML('beforeend',' <button type="button" class="secondary" data-open-mission="'+esc(trips[i].id)+'">Ver missão</button>');});return box.innerHTML;};
 let selected=null;
 window.cep4OpenMission=id=>{if(state?.user?.role!=='Motorista')return;selected=id;page='Movimentações';if(matchMedia('(max-width:700px)').matches&&window.cep4MobileMission)window.cep4MobileMission(id);else render();};
 document.addEventListener('click',e=>{if(e.target.closest('[data-page],.brand'))selected=null;},true);
 const prior=render;render=function(){prior();if(state?.user?.role!=='Motorista')return;
 if(selected&&page==='Movimentações'&&!matchMedia('(max-width:700px)').matches){const main=document.querySelector('.layout main');if(main)main.innerHTML=missionPanel(selected);}
 document.querySelectorAll('[data-open-mission]').forEach(b=>b.onclick=()=>window.cep4OpenMission(b.dataset.openMission));
 document.querySelectorAll('[data-mission-return]').forEach(b=>b.onclick=()=>showAction(b.dataset.missionReturn,'return'));
 document.querySelectorAll('tbody tr').forEach(row=>{const b=row.querySelector('[data-return],[data-action],[data-correct]');const trip=state.trips.find(t=>t.id===(b?.dataset.return||b?.dataset.id||b?.dataset.correct));if(!trip||row.querySelector('[data-open-mission]'))return;const open=document.createElement('button');open.type='button';open.dataset.openMission=trip.id;open.className='secondary';open.textContent='Ver missão';open.onclick=()=>window.cep4OpenMission(trip.id);row.querySelector('td:last-child')?.append(open);});
 };
 const clear=window.cep4Clear;window.cep4Clear=function(...args){selected=null;return clear(...args);};
})();
