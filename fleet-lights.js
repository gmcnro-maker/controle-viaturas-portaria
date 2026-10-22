/* Indicadores da frota para Administração e P4, com rótulo além da cor. */
function fleetLightStatus(v,trips){
 if(v.status==='Manutenção')return {label:'Em manutenção',color:'#b91c1c'};
 if(v.status==='Inativa')return {label:'Inativa',color:'#64748b'};
 const transit=trips.some(t=>t.vehicleId===v.id&&t.status!=='Concluída'&&!t.entryAt&&(t.exitAt||['Em serviço','Aguardando entrada'].includes(t.status)));
 return transit?{label:'Em trânsito',color:'#eab308'}:{label:'Disponível',color:'#15803d'};
}
function fleetLightBadge(v){const s=fleetLightStatus(v,state.trips||[]);return '<span style="display:inline-flex;align-items:center;gap:.5rem;font-weight:600"><span aria-hidden="true" style="display:inline-block;width:.9rem;height:.9rem;flex:none;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff 0%,#ffffffaa 12%,'+s.color+' 45%,'+s.color+' 100%);border:1px solid #ffffff90;box-shadow:inset 0 -2px 3px #0004,0 0 4px '+s.color+',0 0 10px '+s.color+'99,0 0 0 3px '+s.color+'18"></span>'+s.label+'</span>';}
(()=>{const prior=render;render=function(){prior();if(!state||state.needsDriverRegistration||state.user.customRole||!['Administrador','Supervisor da Frota - P4'].includes(state.user.role)||!['Painel','Viaturas'].includes(page))return;
 document.querySelectorAll('[data-fleet]').forEach(b=>{const v=state.vehicles.find(v=>v.id===b.dataset.fleet),cells=b.closest('tr')?.querySelectorAll('td');if(v&&cells?.length>=4)cells[3].innerHTML=fleetLightBadge(v);});
 const host=document.querySelector('.page-heading');if(!host)return;const panel=document.createElement('section');panel.className='panel';panel.dataset.fleetLights='true';panel.innerHTML='<h2>Status das viaturas</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:1rem">'+state.vehicles.filter(v=>!v.deleted).map(v=>'<article style="border:1px solid #d7e3ef;border-radius:.75rem;padding:1rem;display:grid;gap:.7rem"><b>'+esc(v.prefix)+' · '+esc(v.plate)+'</b>'+fleetLightBadge(v)+'</article>').join('')+'</div>';host.after(panel);
};})();


