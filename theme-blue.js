// Apresentação por função. As autorizações permanecem verificadas pelo servidor.
(()=>{
 const oldReportControls=reportControls;
 reportControls=function(){return oldReportControls().replace('Inclui saídas ou entradas confirmadas nesse intervalo, sem repetir o horário final no plantão seguinte.','Lista única com viatura, destino, saída e situação: Em missão ou Finalizado. Inclui as missões que continuam abertas e os retornos confirmados no período.');};
 const previousRender=render;
 render=function(){
  const role=state?.user?.role;
  if(role==='Supervisor da Frota - P4'&&page==='Relatórios')page='Viaturas';
  previousRender();
  if(state.needsDriverRegistration||!document.querySelector('.layout'))return;
  document.body.dataset.theme='blue';
  if(role==='Supervisor da Frota - P4')document.querySelectorAll('#sidebar [data-page="Relatórios"],.mobile-dock [data-go="Relatórios"]').forEach(b=>b.remove());
  document.querySelectorAll('.task-nav-group').forEach(g=>{if(!g.querySelector('button'))g.remove();});
  const heading=document.querySelector('.page-heading');
  const workspace={Administrador:['Administração','Gerencie a frota, os acessos e os registros.'],Motorista:['Meu serviço','Solicite sua saída e acompanhe suas movimentações.'],'Comandante da Guarda':['Guarda','Autorize saídas e confira as entradas do plantão.'],'Supervisor da Frota - P4':['Gestão da frota','Cadastre viaturas e mantenha a disponibilidade atualizada.']};
  const [label,hint]=workspace[role]||[role,'Recursos disponíveis conforme suas permissões.'];
  if(heading){const context=document.createElement('div');context.className='workspace-context';context.innerHTML='<span>'+svg('shield',18)+' '+esc(label)+'</span><p>'+esc(hint)+'</p>';heading.before(context);}
  if(page==='Painel'){
   document.querySelectorAll('.hero,.process-card').forEach(section=>section.remove());
   const title=document.querySelector('.page-heading h1'),description=document.querySelector('.page-heading p');
   if(role==='Motorista'){
    title.textContent='Meu serviço';description.textContent='Suas solicitações, missões e retornos em um só lugar.';document.querySelector('.side-stack')?.remove();document.querySelector('.hero')?.remove();
    const metrics=[['Em missão',state.trips.filter(t=>t.status==='Em serviço'||t.status==='Aguardando entrada').length,'Saída autorizada e entrada ainda não confirmada'],['Aguardando autorização',state.trips.filter(t=>t.status==='Aguardando saída').length,'Solicitações enviadas à Guarda'],['Finalizados',state.trips.filter(t=>t.status==='Concluída').length,'Seus retornos confirmados']];
    const stats=document.querySelector('.stats');if(stats)stats.innerHTML=metrics.map(([name,count,detail])=>'<article class="stat"><div class="stat-top"><span>'+name+'</span>'+svg('car',20)+'</div><strong>'+String(count).padStart(2,'0')+'</strong><small>'+detail+'</small></article>').join('');
   }
   if(role==='Comandante da Guarda'){title.textContent='Painel da Guarda';description.textContent='Acompanhe as missões e as autorizações do seu plantão.';}
   if(role==='Administrador'){title.textContent='Painel administrativo';description.textContent='Acompanhe a operação e acesse as ferramentas de gestão.';}
   const shortcuts=document.querySelector('.task-shortcuts');
   const recent=document.querySelector('.recent'),tabs=recent?.querySelector('.tabs');
   if(tabs&&role!=='Motorista'&&(!state.user.customRole||uiPermit('vehicles.read'))){
    const maintenance=document.createElement('button');maintenance.type='button';maintenance.dataset.filter='Manutenção';maintenance.textContent='Em manutenção';maintenance.className=dashboardFilter==='Manutenção'?'selected':'';maintenance.setAttribute('aria-pressed',String(dashboardFilter==='Manutenção'));maintenance.onclick=()=>{dashboardFilter='Manutenção';render();};tabs.append(maintenance);
    if(dashboardFilter==='Manutenção'){
     const vehicles=maintenanceVehicles(state.vehicles,searchTerm);
     recent.querySelector('h2').textContent='Viaturas em manutenção';recent.querySelector('.panel-head p').textContent='Viaturas indisponíveis para saída.';
     const search=recent.querySelector('#dashboard-search');if(search){search.placeholder='Buscar prefixo, placa ou modelo';search.setAttribute('aria-label','Buscar viatura em manutenção');}
     recent.querySelector('.tablewrap').innerHTML='<table class="maintenance-table"><thead><tr><th>Viatura / placa</th><th>Modelo</th><th>Situação</th></tr></thead><tbody>'+vehicles.map(v=>'<tr><td><b>'+esc(v.prefix)+'</b><br>'+esc(v.plate)+'</td><td>'+esc(v.model)+'</td><td><span class="badge warn">Em manutenção</span></td></tr>').join('')+'</tbody></table>'+(!vehicles.length?'<div class="empty">Nenhuma viatura em manutenção neste filtro.</div>':'');
     recent.querySelector('.panel-foot').textContent=vehicles.length+' viatura(s) em manutenção';recent.querySelector('[data-page="Movimentações"]').onclick=()=>{page='Viaturas';render();};
    }
   }
   if(shortcuts&&role==='Administrador')shortcuts.innerHTML=[['Acessos','users','Gerenciar usuários'],['Viaturas','car','Gerenciar viaturas'],['Relatórios','report','Relatórios do plantão']].map(([key,icon,text])=>'<button type="button" data-blue-go="'+key+'">'+svg(icon,22)+'<span>'+text+'</span>'+svg('chevron',16)+'</button>').join('');
   if(shortcuts&&role==='Comandante da Guarda')shortcuts.innerHTML=[['Comandante da Guarda','shield','Autorizações e entradas'],['Movimentações','arrows','Missões em andamento'],['Relatórios','report','Relatório do plantão']].map(([key,icon,text])=>'<button type="button" data-blue-go="'+key+'">'+svg(icon,22)+'<span>'+text+'</span>'+svg('chevron',16)+'</button>').join('');
  }
  document.querySelectorAll('[data-blue-go]').forEach(b=>b.onclick=()=>{page=b.dataset.blueGo;render();window.scrollTo({top:0,behavior:'smooth'});});
  document.querySelectorAll('[data-filter]').forEach(b=>{if(b.dataset.filter==='Em serviço')b.textContent='Em missão';if(b.dataset.filter==='Concluída')b.textContent='Finalizados';});
  document.querySelectorAll('#filter option').forEach(o=>{if(o.value==='Em serviço')o.textContent='Em missão';if(o.value==='Concluída')o.textContent='Finalizado';});
  document.querySelectorAll('.stat-top>span:first-child').forEach(s=>{if(s.textContent.trim()==='Em serviço')s.textContent='Em missão';});
  // Tabelas administrativas viram cartões com rótulos também em telas pequenas.
  document.querySelectorAll('table').forEach(table=>{const heads=[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());table.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{if(!td.dataset.label)td.dataset.label=heads[i]||'Ação';}));});
  document.querySelectorAll('button').forEach(b=>{if(/excluir/i.test(b.textContent)&&!b.classList.contains('password-toggle'))b.classList.add('danger-action');});
  document.querySelectorAll('#sidebar .rail-version span:last-child').forEach(s=>s.textContent='Theme Blue');
 };
})();
function maintenanceVehicles(vehicles,query=''){const search=query.trim().toLocaleLowerCase('pt-BR');return vehicles.filter(v=>!v.deleted&&v.status==='Manutenção'&&(!search||[v.prefix,v.plate,v.model].join(' ').toLocaleLowerCase('pt-BR').includes(search)));}

