/* Indicadores da frota para Administração e P4, com rótulo além da cor. */
const fleetStatuses={
 available:{label:'Disponível',color:'#15803d'},
 transit:{label:'Em trânsito',color:'#eab308'},
 maintenance:{label:'Em manutenção',color:'#b91c1c'},
 inactive:{label:'Inativa',color:'#64748b'}
};
function fleetLightStatus(v,trips){
 if(v.status==='Manutenção')return fleetStatuses.maintenance;
 if(v.status==='Inativa')return fleetStatuses.inactive;
 const transit=trips.some(t=>t.vehicleId===v.id&&t.status!=='Concluída'&&!t.entryAt&&(t.exitAt||['Em serviço','Aguardando entrada'].includes(t.status)));
 return transit?fleetStatuses.transit:fleetStatuses.available;
}
function fleetLed(status){return '<span class="fleet-led" aria-hidden="true" style="--fleet-led:'+status.color+'"></span>';}
function fleetLightBadge(v){const status=fleetLightStatus(v,state.trips||[]);return '<span class="fleet-light-label">'+fleetLed(status)+status.label+'</span>';}
function fleetVehicleIcon(vehicle){
 const name=[vehicle.prefix,vehicle.model].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const path=/onibus/.test(name)
  ? 'M3 17V6a2 2 0 0 1 2-2h13a3 3 0 0 1 3 3v10H3Zm0-5h18M8 5v7m6-7v7M6 17v2m12-2v2'
  : /ranger|caminhonete|picape|pick.up/.test(name)
   ? 'M2 15v-4h7l2-5h5l4 5 2 1v3M2 15v2h3m4 0h6m4 0h3v-2M10 11h10M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'
   : 'M2 15v-3l4-1 3-5h6l4 5 3 1v3m0 0v2h-3m-4 0H9m-4 0H2v-2m4-4h13M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z';
 return '<svg class="fleet-vehicle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';
}
(()=>{const prior=render;render=function(){prior();if(!state||state.needsDriverRegistration||state.user.customRole||!['Administrador','Supervisor da Frota - P4'].includes(state.user.role)||!['Painel','Viaturas'].includes(page))return;
 document.querySelectorAll('[data-fleet]').forEach(b=>{const v=state.vehicles.find(v=>v.id===b.dataset.fleet),cells=b.closest('tr')?.querySelectorAll('td');if(v&&cells?.length>=4)cells[3].innerHTML=fleetLightBadge(v);});
 const host=document.querySelector('.page-heading');if(!host)return;
 const vehicles=state.vehicles.filter(v=>!v.deleted).map(v=>({vehicle:v,status:fleetLightStatus(v,state.trips||[])}));
 const legend=Object.values(fleetStatuses).filter(s=>s!==fleetStatuses.inactive||vehicles.some(v=>v.status===s));
 const panel=document.createElement('section');panel.className='panel';panel.dataset.fleetLights='true';
 panel.innerHTML='<header class="fleet-status-heading"><h2>Status</h2><ul class="fleet-status-legend" aria-label="Legenda de status">'+legend.map(s=>'<li>'+fleetLed(s)+s.label+'</li>').join('')+'</ul></header><div class="fleet-status-grid">'+vehicles.map(({vehicle:v,status})=>'<article title="'+esc([v.prefix,v.plate,status.label].join(' · '))+'">'+fleetVehicleIcon(v)+'<b>'+esc(v.plate||v.prefix)+'</b><span class="fleet-status-accessible">'+esc(status.label)+'</span>'+fleetLed(status)+'</article>').join('')+'</div>';
 host.after(panel);
};})();


