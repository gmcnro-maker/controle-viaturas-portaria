/* Navegação de gestão: agrupa ações existentes sem ampliar permissões. */
(()=>{
 const previous=render;let view='home',owner='';
 const paths={home:'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',sections:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',services:'m3 7 9-4 9 4v10l-9 4-9-4Zm0 0 9 4 9-4m-9 4v10',people:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 8 0 0 1 16 0v3',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 3-1 4-5 2-3-2-4-1-3-5 2-3 1-4Z',exit:'M9 3H3v18h6m5-14 5 5-5 5m-7-5h14',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 8 0 0 1 16 0v3',arrow:'m9 5 7 7-7 7'};
 const icon=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[k]+'"/></svg>';
 const label=(b,name,key)=>{b.innerHTML=icon(key)+'<span>'+name+'</span>';b.title=name;};
 function decorate(){
  const shell=app.querySelector('.ce-sections'),menu=shell?.querySelector('header .button-row'),main=shell?.querySelector('main');if(!menu||!main)return;
  if(owner!==state.user.id){owner=state.user.id;view='home';}
  main.querySelector('nav[aria-label="Seções do Centro de Ensino"]')?.remove();
  main.addEventListener('click',e=>{if(e.target.closest('[data-ce-section]'))view='sections';},true);
  const store=document.createElement('div');store.className='ce-tool-store';store.hidden=true;shell.append(store);
  const people=[...menu.querySelectorAll('[data-ce-access],[data-review-externals],[data-internal-register]')];
  const settings=[...menu.querySelectorAll('button')].filter(b=>b.textContent==='Limpar dados de teste');
  const services=[...menu.querySelectorAll('[data-ce-consumer],[data-ce-offers]')];
  [...people,...settings,...services].forEach(b=>store.append(b));
  const sections=menu.querySelector('[data-ce-home]'),personal=menu.querySelector('[data-ce-personal]'),logout=menu.querySelector('[data-ce-logout]');
  const resetSection=sections?.onclick;
  if(sections){label(sections,'Início','home');const action=sections.onclick;sections.onclick=e=>{view='home';action(e);};}
  if(personal)label(personal,'Modo usuário','user');if(logout)label(logout,'Sair','exit');
  const nav=(name,key,next)=>{const b=document.createElement('button');b.type='button';b.dataset.ceNav=next;label(b,name,key);b.onclick=()=>{view=next;if(next==='home'&&resetSection)resetSection();else render();};return b;};
  if(services.length)menu.insertBefore(nav('Serviços','services','services'),personal||logout);
  if(people.length)menu.insertBefore(nav('Pessoas','people','people'),personal||logout);
  if(settings.length)menu.insertBefore(nav('Configurações','settings','settings'),logout);
  if(logout)menu.append(logout);
  menu.querySelectorAll('[data-ce-nav]').forEach(b=>{if(b.dataset.ceNav===view)b.setAttribute('aria-current','page');});
  if(view==='sections'||view==='home')sections?.setAttribute('aria-current','page');
  if(['people','services','settings'].includes(view)){
   const group={people,services,settings}[view];
   if(!group.length){view='home';}else{
    main.replaceChildren();const h=document.createElement('h2');h.textContent={people:'Pessoas',services:'Serviços',settings:'Configurações'}[view];main.append(h);
    const p=document.createElement('p');p.textContent={people:'Cadastros e permissões do seu acesso.',services:'Consulte o catálogo ou gerencie as ofertas autorizadas.',settings:'Ferramentas exclusivas do Gestor Técnico.'}[view];main.append(p);
    const actions=document.createElement('div');actions.className='ce-shortcuts';main.append(actions);
    group.forEach(b=>{const name=b.hasAttribute('data-ce-consumer')?'Abrir catálogo':b.hasAttribute('data-ce-offers')?'Gerenciar ofertas':b.textContent;label(b,name,view==='people'?'people':view==='services'?'services':'settings');actions.append(b);});
   }
  }
  if(view==='home'){
   const heading=main.querySelector('h2');if(heading)heading.textContent='Áreas de gestão';
   const intro=main.querySelector('p');if(intro)intro.remove();
   const names={guarda:'Guarda',p1:'Administração · P1',p4:'Patrimônio · P4',sjd:'Justiça e Disciplina · SJD',divens:'Ensino · DIVENS',dfae:'Formação · DFAE',comando:'Comando do CE'};
   main.querySelectorAll('.ce-section-card').forEach(b=>{const full=b.querySelector('b');b.title=full?.textContent||'';if(full&&names[b.dataset.ceSection])full.textContent=names[b.dataset.ceSection];b.querySelector('small')?.remove();});
   const trips=state.trips||[],pending=trips.filter(t=>t.status==='Aguardando saída').length,returns=trips.filter(t=>t.status==='Aguardando entrada').length;
   if(pending||returns){const note=document.createElement('p');note.className='ce-task-summary';note.textContent=pending+' saída(s) aguardando autorização · '+returns+' retorno(s) aguardando conferência';main.prepend(note);}
  }
 }
 render=function(){previous();decorate();};
})();
