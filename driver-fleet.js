function driverFleetRows(){return Array.isArray(state.fleet)?state.fleet:(state.vehicles||[]).filter(v=>['Ativa','Manutenção'].includes(v.status||'Ativa')).map(v=>({prefix:v.prefix,plate:v.plate,status:v.status==='Manutenção'?'Em manutenção':v.busy?'Em missão':'Disponível'}));}
function driverFleetGroup(row){return row.status==='Disponível'?'Disponíveis':row.status==='Em manutenção'?'Em manutenção':'Em missão';}
let driverFleetFilter='Disponíveis',driverFleetPage=0;
function driverFleetPanel(){
 const all=driverFleetRows(),groups=['Disponíveis','Em missão','Em manutenção'],rows=all.filter(v=>driverFleetGroup(v)===driverFleetFilter),size=matchMedia('(max-width:700px)').matches?2:6,pages=Math.max(1,Math.ceil(rows.length/size));driverFleetPage=Math.min(driverFleetPage,pages-1);
 return '<section class="panel driver-fleet"><h2>Status das viaturas</h2><div class="fleet-tabs" role="group" aria-label="Situação das viaturas">'+groups.map(group=>'<button type="button" data-fleet-filter="'+group+'" aria-pressed="'+(group===driverFleetFilter)+'" class="'+(group===driverFleetFilter?'':'secondary')+'">'+group+' ('+all.filter(v=>driverFleetGroup(v)===group).length+')</button>').join('')+'</div><div class="fleet-cards">'+rows.slice(driverFleetPage*size,(driverFleetPage+1)*size).map(v=>'<article class="fleet-status-card"><div><b>'+esc(v.prefix)+'</b><span>'+esc(v.plate)+'</span></div><span class="badge '+(v.status==='Disponível'?'good':'warn')+'">'+esc(v.status)+'</span></article>').join('')+'</div>'+(!rows.length?'<p>Nenhuma viatura nesta situação.</p>':'')+(pages>1?'<div class="fleet-pager"><button type="button" class="secondary" data-fleet-prev '+(driverFleetPage===0?'disabled':'')+'>Anterior</button><span>'+(driverFleetPage+1)+' de '+pages+'</span><button type="button" class="secondary" data-fleet-next '+(driverFleetPage===pages-1?'disabled':'')+'>Próximo</button></div>':'')+'</section>';
}
function bindDriverFleet(root=document){
 const repaint=()=>{const panel=root.querySelector('.driver-fleet');if(panel){panel.outerHTML=driverFleetPanel();bindDriverFleet(root);}};
 root.querySelectorAll('[data-fleet-filter]').forEach(b=>b.onclick=()=>{driverFleetFilter=b.dataset.fleetFilter;driverFleetPage=0;repaint();});root.querySelector('[data-fleet-prev]')?.addEventListener('click',()=>{driverFleetPage--;repaint();});root.querySelector('[data-fleet-next]')?.addEventListener('click',()=>{driverFleetPage++;repaint();});
}
(()=>{
 const previous=render;render=function(){previous();if(state?.user?.role==='Motorista'&&page==='Painel'){const heading=document.querySelector('.layout main .page-heading');heading?.insertAdjacentHTML('afterend',driverFleetPanel());bindDriverFleet(document.querySelector('.layout main'));}};
 const clear=window.cep4Clear;window.cep4Clear=function(...args){driverFleetFilter='Disponíveis';driverFleetPage=0;return clear(...args);};
})();
