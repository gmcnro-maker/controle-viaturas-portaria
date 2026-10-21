function driverFleetRows(){return Array.isArray(state.fleet)?state.fleet:(state.vehicles||[]).filter(v=>['Ativa','Manutenção'].includes(v.status||'Ativa')).map(v=>({prefix:v.prefix,plate:v.plate,status:v.status==='Manutenção'?'Em manutenção':v.busy?'Em missão':'Disponível'}));}
function driverFleetStatus(row){return row.status==='Disponível'?'Disponível':['Manutenção','Em manutenção'].includes(row.status)?'Manutenção':row.status==='Aguardando liberação'?'Aguardando liberação':'Missão';}
function driverFleetPanel(){
 const rows=driverFleetRows();
 return '<section class="panel driver-fleet"><h2>Status das viaturas</h2><div class="fleet-cards">'+rows.map(v=>'<article class="fleet-status-card"><div><b>'+esc(v.prefix)+'</b><span>'+esc(v.plate)+'</span></div><span class="badge '+(v.status==='Disponível'?'good':'warn')+'">'+esc(driverFleetStatus(v))+'</span></article>').join('')+'</div>'+(!rows.length?'<p>Nenhuma viatura cadastrada.</p>':'')+'</section>';
}
function bindDriverFleet(){}
(()=>{
 const previous=render;render=function(){previous();if(state?.user?.role==='Motorista'&&page==='Painel'){const heading=document.querySelector('.layout main .page-heading');heading?.insertAdjacentHTML('afterend',driverFleetPanel());}};
})();
