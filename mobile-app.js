/* Navegação móvel sobre os formulários existentes; sem duplicar operações ou permissões. */
(()=>{
 const media=matchMedia('(max-width:700px)'),desktopRender=render;
 const appOnly=()=>state?.user?.role==='Motorista'&&state?.access?.internal===true;
 const appLayout=()=>media.matches||appOnly();
 let route={home:true},stack=[],direction='forward',owner='',tasks=[],activeTask=null;
 const hiddenClass='ma-hidden';
 const make=(tag,cls,html)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n;};
 function navigate(next,back=false){
  if(!back)stack.push({...route});route=next;direction=back?'back':'forward';
  if(next.page)page=next.page;render();
 }
 function back(){navigate(stack.pop()||{home:true},true);}
 function openDriverReturn(){
  navigate({page:'Movimentações',taskLabel:'Registrar retorno'});
  const returns=[...document.querySelectorAll('.ma-body [data-return]')];
  if(returns.length===1)showAction(returns[0].dataset.return,'return');
  else if(!returns.length)notify('Você não tem viatura em missão para registrar retorno.');
 }
 window.cep4MobileMission=id=>navigate({page:'Movimentações',missionId:id});
 function fields(form){return [...form.querySelectorAll('label')].filter(l=>l.querySelector('input:not([type=hidden]),select,textarea')&&!l.closest('[hidden]'));}
 function wizard(form){
  if(form.dataset.mobileWizard)return;form.dataset.mobileWizard='true';form.noValidate=true;
  let index=0,groups=[],labels=[];
  const controls=make('div','ma-form-controls');controls.innerHTML='<button type="button" class="secondary" data-prev>Anterior</button><span aria-live="polite"></span><button type="button" data-next>Próximo '+svg('arrow',17)+'</button>';
  const review=form.id==='departure'?make('div','ma-review'):null;if(review)form.before(review);
  form.after(controls);const prior=controls.querySelector('[data-prev]'),next=controls.querySelector('[data-next]'),count=controls.querySelector('span');
  const submitButtons=[...form.querySelectorAll('button')].filter(b=>b.type==='submit');
  function paint(){
   labels=fields(form);groups=[];for(const label of labels){const inspection=label.closest('[data-inspection]'),existing=inspection&&groups.find(g=>g.some(l=>l.closest('[data-inspection]')===inspection));if(existing){existing.push(label);continue;}const large=!!label.querySelector('textarea,input[type=file]'),last=groups.at(-1);if(large||!last||last.length===2||last.some(l=>l.querySelector('textarea,input[type=file]')))groups.push([label]);else last.push(label);}if(!groups.length)groups=[[]];index=Math.min(index,groups.length-1);
   labels.forEach(l=>l.classList.toggle('ma-field-hidden',!groups[index].includes(l)));
   form.querySelectorAll('fieldset').forEach(f=>f.classList.toggle('ma-field-hidden',![...f.querySelectorAll('label')].some(l=>!l.classList.contains('ma-field-hidden'))));
   submitButtons.forEach(b=>b.classList.toggle('ma-field-hidden',index!==groups.length-1));
   prior.disabled=index===0;next.hidden=index===groups.length-1;count.textContent=(index+1)+' de '+groups.length;
   controls.hidden=groups.length<2;
   if(review){review.hidden=index!==groups.length-1;const selectedVehicle=state.vehicles.find(v=>v.id===form.elements.vehicleId.value);review.innerHTML='<h2>Confira sua solicitação</h2><p><b>'+esc(selectedVehicle?.prefix||'Viatura')+'</b> · '+esc(form.elements.destination.value)+'</p><p>Odômetro: '+number(selectedVehicle?.odometer??Number(form.elements.initial?.value||0))+' km</p>';}
  }
  function validGroup(){if(form.reservationAvailable&&!form.reservationAvailable("step"))return false;for(const label of groups[index])for(const f of label.querySelectorAll('input,select,textarea'))if(!f.checkValidity()){f.reportValidity();return false;}return true;}
  next.onclick=()=>{if(validGroup()){index++;paint();animate(form);}};
  prior.onclick=()=>{index=Math.max(0,index-1);paint();animate(form,true);};
  form.mobilePrevious=()=>{if(index>0)prior.click();else back();};
  form.addEventListener('submit',e=>{
   if(index<groups.length-1){e.preventDefault();e.stopImmediatePropagation();if(validGroup()){index++;paint();animate(form);}return;}
   if(form.reservationAvailable&&!form.reservationAvailable()){e.preventDefault();e.stopImmediatePropagation();return;}const invalid=[...form.elements].find(f=>f.willValidate&&!f.checkValidity());
   if(invalid){e.preventDefault();e.stopImmediatePropagation();const position=labels.findIndex(l=>l.contains(invalid));if(position>=0)index=groups.findIndex(group=>group.includes(labels[position]));paint();invalid.reportValidity();}
  },true);
  form.addEventListener('change',e=>{if(['checkbox','radio'].includes(e.target.type)||['vehicleId','inspectionChoice'].includes(e.target.name))paint();});
  new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length))paint();}).observe(form,{childList:true,subtree:true});
  paint();
 }
 function animate(node,backward=false){node.classList.remove('ma-forward','ma-back');void node.offsetWidth;node.classList.add(backward?'ma-back':'ma-forward');}
 function paginate(table,predicate){
  const rows=[...table.querySelectorAll('tbody tr')];let index=0;
  const eligible=rows.filter(r=>!predicate||predicate(r));
  const toolbar=make('div','ma-pager');toolbar.innerHTML='<button type="button" class="secondary" data-prev>Anterior</button><span aria-live="polite"></span><button type="button" data-next>Próximo</button>';
  table.closest('.tablewrap').after(toolbar);
  function paint(){rows.forEach(r=>r.classList.toggle('ma-hidden',r!==eligible[index]));toolbar.querySelector('span').textContent=eligible.length?(index+1)+' de '+eligible.length:'Nenhum registro';toolbar.querySelector('[data-prev]').disabled=index===0;toolbar.querySelector('[data-next]').disabled=index>=eligible.length-1;}
  toolbar.querySelector('[data-prev]').onclick=()=>{index--;paint();animate(table,true);};toolbar.querySelector('[data-next]').onclick=()=>{index++;paint();animate(table);};paint();
 }
 function showOnly(node,main){
  let current=node;
  while(current&&current!==main){const parent=current.parentElement;if(!parent)break;for(const sibling of parent.children){if(sibling===current)continue;
   const retain=current.classList.contains('tablewrap')&&(sibling.matches('.tabs,.table-tools,.access-user-tabs')||sibling.querySelector?.('#filter,#print'));
   if(!retain)sibling.classList.add(hiddenClass);
  }current=parent;}
 }
 function taskList(main){
  const result=[];
  for(const form of main.querySelectorAll('#departure,#register,#access-form,#profile-form')){
   const title=form.id==='departure'?'Solicitar saída':form.id==='register'?(page==='Viaturas'?'Cadastrar viatura':'Cadastrar policial'):form.id==='access-form'?'Autorizar acesso':'Criar ou editar perfil';
   result.push({label:title,icon:'plus',node:form,form:true});
  }
  for(const table of main.querySelectorAll('table')){
   const node=table.closest('.tablewrap');if(!node)continue;
   const label=table.closest('.access-users')?'Usuários ativos e inativos':page==='Viaturas'?'Viaturas cadastradas':page==='Policiais'?'Policiais cadastrados':page==='Comandante da Guarda'?'Autorizações e entradas':page==='Relatórios'?'Consultar histórico':'Minhas movimentações';
   result.push({label:state.user.role==='Motorista'?label:label.replace('Minhas movimentações','Movimentações da frota'),icon:page==='Viaturas'?'car':'arrows',node,table});
   if(page==='Movimentações'&&(state.user.role==='Motorista'||state.user.role==='Administrador'||uiPermit('trips.return')))result.push({label:'Registrar retorno',icon:'car',node,table,predicate:r=>!!r.querySelector('[data-return]')});
   if(page==='Comandante da Guarda'){
    if(state.user.role==='Comandante da Guarda'||state.user.role==='Administrador'||uiPermit('trips.confirm'))result.push({label:'Autorizar saída',icon:'shield',node,table,predicate:r=>!!r.querySelector('[data-action="confirm-exit"]')});
    result.push({label:'Conferir entrada',icon:'check',node,table,predicate:r=>!!r.querySelector('[data-action="confirm-entry"],[data-correct]')});
   }
  }
  const profileSection=main.querySelector('#custom-profiles');if(profileSection){const items=[...profileSection.querySelectorAll('.profile-item')];if(items.length){const holder=make('div','ma-profile-list');items[0].before(holder);items.forEach(n=>holder.append(n));result.push({label:'Perfis cadastrados',icon:'shield',node:holder,items});}}
  for(const panel of main.querySelectorAll('.panel')){
   if(panel.closest('#custom-profiles')||result.some(t=>panel.contains(t.node))||panel.parentElement.closest('.panel'))continue;
   result.push({label:panel.querySelector('h2')?.textContent||'Consultar',icon:'report',node:panel});
  }
  return result;
 }
 function mount(){
  const main=document.querySelector('.layout main');if(!main)return;
  const nav=[...document.querySelectorAll('#sidebar nav button')].filter(b=>!b.hasAttribute('data-reservation-nav')).map(b=>({key:b.dataset.page,label:b.querySelector('span')?.textContent||b.textContent.trim(),button:b}));
  const role=state.user.role;const shell=make('section','ma-shell');shell.setAttribute('aria-label','Navegação por telas');
  shell.innerHTML='<header class="ma-brand">'+institutionalBrand()+'</header><div class="ma-top"><button type="button" class="secondary" data-ma-back>'+svg('arrow',18)+' Voltar</button><b data-ma-title></b><button type="button" class="icon-button" data-ma-refresh aria-label="Atualizar registros">'+svg('refresh',19)+'</button></div><div class="ma-stage"><div class="ma-body"></div></div><nav class="ma-bottom" aria-label="Navegação do celular"><button type="button" data-ma-home>'+svg('grid',21)+'<span>Início</span></button><button type="button" data-ma-account>'+svg('users',21)+'<span>Conta</span></button></nav>';
  app.append(shell);document.body.classList.add('ma-enabled');
  const body=shell.querySelector('.ma-body'),title=shell.querySelector('[data-ma-title]');shell.querySelector('[data-ma-back]').disabled=route.home===true;
  shell.querySelector('[data-ma-home]').onclick=()=>navigate({home:true},true);
  
  shell.querySelector('[data-ma-account]').onclick=()=>navigate({page:'Integrações',account:true});
  shell.querySelector('[data-ma-back]').onclick=()=>{const form=shell.querySelector('form[data-mobile-wizard]');if(form?.mobilePrevious)form.mobilePrevious();else back();};
  shell.querySelector('[data-ma-refresh]').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await refresh();notify('Registros atualizados.');}catch(error){notify(error.message);}finally{b.disabled=false;}};
  function tile(label,icon,handler,primary=false){const b=make('button','ma-tile'+(primary?' ma-primary':''),svg(icon,27)+'<span>'+esc(label)+'</span>');b.type='button';b.onclick=handler;return b;}
  if(route.home||route.menu){
   title.textContent=route.menu?'Funções':'Início';body.innerHTML='<span class="ma-role">'+(role==='Motorista'?'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M3 10h6m6 0h6m-9 4v7"/></svg>':'')+esc(role)+'</span><h1>'+(route.menu?'Escolha uma função':'O que deseja fazer?')+'</h1><div class="ma-tiles"></div>';
   const grid=body.querySelector('.ma-tiles'),internalRoot=appOnly()&&!route.checklist;
   if(internalRoot)grid.append(tile('Check-list','car',()=>navigate({menu:true,checklist:true}),true));
   if(!internalRoot&&(!route.menu||appOnly())&&(role==='Motorista'||uiPermit('trips.create')))grid.append(tile(role==='Motorista'?'SAÍDA':'Solicitar saída','plus',()=>navigate({page:'Movimentações',taskLabel:'Solicitar saída'}),true));
   const ordered=nav.filter(n=>!appOnly()&&n.key&&n.key!=='Painel'&&n.key!=='Integrações'&&(route.menu||role!=='Motorista'||n.key!=='Relatórios')&&(route.menu||role!=='Comandante da Guarda'||!['Viaturas','Policiais'].includes(n.key)));
   if(!route.menu&&role==='Comandante da Guarda')ordered.sort((a,b)=>(a.key==='Comandante da Guarda'?-1:b.key==='Comandante da Guarda'?1:0));
   if(!route.menu&&role==='Administrador'){const priority=['Acessos','Viaturas','Movimentações','Relatórios'];ordered.sort((a,b)=>(priority.includes(a.key)?priority.indexOf(a.key):99)-(priority.includes(b.key)?priority.indexOf(b.key):99));}
   for(const item of ordered){const label=item.key==='Movimentações'?(role==='Motorista'?'Minhas missões':'Missões'):item.key==='Comandante da Guarda'?'Autorizar saída':item.label;grid.append(tile(label,item.key==='Viaturas'?'car':item.key==='Acessos'?'users':item.key==='Relatórios'?'report':item.key==='Comandante da Guarda'?'shield':'arrows',()=>navigate({page:item.key,...(item.key==='Comandante da Guarda'?{taskLabel:'Autorizar saída'}:item.key==='Movimentações'?{taskLabel:role==='Motorista'?'Minhas movimentações':'Movimentações da frota'}:{})}),!grid.children.length));}
   if(role==='Motorista'&&!internalRoot){if(!route.menu||appOnly())grid.append(tile('RETORNO','car',openDriverReturn));if(!appOnly())grid.append(tile('Status das viaturas','car',()=>navigate({page:'Painel',fleet:true})));}
   if(!route.checklist&&typeof reservationUiCreate==='function'&&(reservationUiCreate()||reservationUiManager()))grid.append(tile(appOnly()?'Reserva de viatura':'Reservas','clock',()=>showAction('','reservations')));
   if(!route.menu&&role==='Comandante da Guarda')grid.append(tile('Conferir entrada','check',()=>navigate({page:'Comandante da Guarda',taskLabel:'Conferir entrada'})));
   for(const item of nav.filter(n=>!n.key)){grid.append(tile(item.label,'report',()=>{route={page:'Integrações',maintenance:true};stack.push({home:true});item.button.click();}));}
   const account=nav.find(n=>n.key==='Integrações');if(account&&!appOnly()&&(route.menu||!['Comandante da Guarda','Motorista'].includes(role)))grid.append(tile('Minha conta','link',()=>navigate({page:'Integrações',account:true})));
   paginateTiles(grid);
  }else if(route.fleet){title.textContent='Status das viaturas';body.innerHTML=driverFleetPanel();bindDriverFleet(body);
  }else if(route.missionId){title.textContent='Minha missão';body.innerHTML=missionPanel(route.missionId);body.querySelector('[data-mission-return]')?.addEventListener('click',e=>showAction(e.currentTarget.dataset.missionReturn,'return'));
  }else if(route.account){
   title.textContent='Minha conta';body.innerHTML='<span class="ma-role">'+(role==='Motorista'?'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M3 10h6m6 0h6m-9 4v7"/></svg>':'')+esc(role)+'</span><h1>'+esc(state.user.name)+'</h1><p>Seu perfil determina as funções disponíveis.</p>';
   const logout=make('button','secondary',svg('logout',20)+' Sair da conta');logout.type='button';logout.onclick=()=>window.cep4Logout();body.append(logout);
  }else{
   title.textContent=route.maintenance?'Dados e arquivo anual':(nav.find(n=>n.key===page)?.label||page);
   tasks=taskList(main);
   let selected=route.taskLabel?tasks.find(t=>t.label===route.taskLabel):null;
   if(!selected&&Number.isInteger(route.taskIndex))selected=tasks[route.taskIndex];
   if(!selected&&tasks.length===1)selected=tasks[0];
  if(selected){
    if(role==='Motorista'&&selected.label==='Minhas movimentações')selected.table?.querySelectorAll('thead tr > :last-child,tbody tr > :last-child').forEach(cell=>cell.remove());
    activeTask=selected;title.textContent=selected.label;body.append(main);main.className='ma-content';showOnly(selected.node,main);
    if(selected.form)wizard(selected.node);
    if(selected.table)paginate(selected.table,selected.predicate);
    selected.node.querySelectorAll('form').forEach(wizard);
    const fileRows=selected.items||[...selected.node.querySelectorAll(':scope > p')].filter(p=>p.querySelector('[data-file-download]'));
    if(fileRows.length>1)paginateItems(fileRows,selected.node);
    if(route.maintenance){const observer=new MutationObserver(()=>{if(document.querySelector('#maintenance-body:not([hidden])')){document.querySelectorAll('#maintenance-body form').forEach(wizard);observer.disconnect();}});observer.observe(main,{subtree:true,attributes:true,attributeFilter:['hidden']});}
   }else{
    body.innerHTML='<h1>'+esc(title.textContent)+'</h1><div class="ma-tiles"></div>';const grid=body.querySelector('.ma-tiles'),internalRoot=appOnly()&&!route.checklist;
   if(internalRoot)grid.append(tile('Check-list','car',()=>navigate({menu:true,checklist:true}),true));tasks.forEach((t,i)=>grid.append(tile(t.label,t.icon,()=>navigate({...route,taskIndex:i,taskLabel:undefined}))));paginateTiles(grid);
    if(!tasks.length){body.append(main);main.className='ma-content';main.querySelectorAll('.page-heading,.main-footer,.workspace-context').forEach(n=>n.classList.add(hiddenClass));}
   }
  }
  animate(body,direction==='back');body.querySelector('h1')?.setAttribute('tabindex','-1');
  const dialog=document.querySelector('#action-dialog');if(dialog)new MutationObserver(()=>{if(dialog.open)dialog.querySelectorAll('form').forEach(wizard);}).observe(dialog,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 }
 function paginateItems(items,container,size=1){let index=0;const controls=make('div','ma-pager');controls.innerHTML='<button type="button" class="secondary">Anterior</button><span aria-live="polite"></span><button type="button">Próximo</button>';container.append(controls);const buttons=controls.querySelectorAll('button');function paint(){items.forEach((n,i)=>n.classList.toggle('ma-hidden',i<index*size||i>=(index+1)*size));controls.querySelector('span').textContent=(index+1)+' de '+Math.ceil(items.length/size);buttons[0].disabled=index===0;buttons[1].disabled=(index+1)*size>=items.length;}buttons[0].onclick=()=>{index--;paint();animate(container,true);};buttons[1].onclick=()=>{index++;paint();animate(container);};paint();}
 function paginateTiles(grid){const items=[...grid.children];if(items.length>4)paginateItems(items,grid.parentElement,4);}
 render=function(){
  const uid=(state?.user?.googleUid||state?.user?.id||'')+'|'+(state?.user?.role||'');if(uid!==owner){owner=uid;route={home:true};stack=[];}
  document.body.classList.remove('ma-enabled');document.body.classList.toggle('ma-forced',appOnly());desktopRender();
  if(appLayout()&&state){if(state.needsDriverRegistration){const form=document.querySelector('#driver-registration');if(form)wizard(form);}else mount();}
 };
 const previousClear=window.cep4Clear;window.cep4Clear=()=>{route={home:true};stack=[];document.body.classList.remove('ma-enabled','ma-forced');previousClear();};
 media.addEventListener('change',()=>{if(state){document.querySelector('#action-dialog')?.close();render();}});
 const originalAction=showAction;showAction=function(...args){originalAction(...args);if(appLayout()){const form=document.querySelector('#action-dialog form');if(form){wizard(form);animate(form);}}};
 // Edição de um item abre seu formulário em vez de deixá-lo escondido na lista.
 document.addEventListener('click',e=>{
  if(!appLayout()||!document.querySelector('.ma-shell'))return;
  const edit=e.target.closest('[data-access],[data-profile-edit]');
  if(edit){setTimeout(()=>{if(!document.querySelector('.ma-shell'))return;const form=document.querySelector(edit.hasAttribute('data-access')?'#access-form':'#profile-form');if(!form)return;stack.push({...route});route={page,taskLabel:form.id==='access-form'?'Autorizar acesso':'Criar ou editar perfil'};const main=document.querySelector('.ma-content')||document.querySelector('.layout main');main?.querySelectorAll('.ma-hidden').forEach(n=>n.classList.remove('ma-hidden'));const shellBody=document.querySelector('.ma-body');shellBody.innerHTML='';shellBody.append(main);main.className='ma-content';showOnly(form,main);document.querySelector('.ma-shell [data-ma-title]').textContent='Editar cadastro';wizard(form);animate(main);},0);}
 });
})();




