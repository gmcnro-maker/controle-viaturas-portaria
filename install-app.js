// A instalação é confirmada no próprio navegador do motorista.
(()=>{
 let promptEvent=null,installedHere=false;const display=matchMedia('(display-mode:standalone)'),mobile=matchMedia('(max-width:700px)');
 const installed=()=>installedHere||display.matches||navigator.standalone===true;
 function sync(){
  document.querySelectorAll('[data-install-app]').forEach(b=>b.remove());if(installed())return;
  const login=document.querySelector('#login-panel .loginbox');
  if(login&&mobile.matches){const b=button();b.style.marginTop='16px';login.append(b);}
  if(state?.user?.role==='Motorista'){const home=document.querySelector('.ma-body .ma-tiles');if(home){const b=button();b.style.cssText='width:100%;margin-top:16px';home.parentElement.append(b);}}
 }
 function button(){const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.installApp='true';b.textContent='Instalar no celular';b.onclick=install;return b;}
 async function install(){
  if(promptEvent){const event=promptEvent;promptEvent=null;try{await event.prompt();await event.userChoice;}catch{}sync();return;}
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Instalar CE-P4');dialog.innerHTML='<h2>Instalar no celular</h2><p>O aplicativo ficará na sua tela inicial com o nome <b>CE-P4</b>.</p><p><b>Android:</b> abra no Chrome, toque no menu ⋮ e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</p><p><b>iPhone:</b> abra no Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</p><p>Depois, abra pelo ícone e entre com seu Gmail. É necessário internet para utilizar o sistema.</p><button type="button">Entendi</button>';document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
 }

 function installationLanding(){
  if(new URL(location.href).searchParams.get('instalar')!=='1')return;
  const dialog=document.createElement('dialog');dialog.id='installation-landing';dialog.setAttribute('aria-label','Instalar CE-P4');dialog.style.cssText='max-width:460px;width:calc(100% - 32px);padding:28px;text-align:center';
  dialog.innerHTML='<img src="ce-p4-viatura-192.png" width="104" height="104" alt="Ícone CE-P4" style="border-radius:24px;margin-bottom:14px"><h1>CE-P4</h1><p style="margin:12px 0 24px">Controle de Viaturas</p><button type="button" data-install-confirm style="width:100%;margin-bottom:16px">Instalar CE-P4</button><p style="font-size:.9rem;margin-bottom:20px">Confirme a instalação no seu navegador. No iPhone, use Compartilhar e Adicionar à Tela de Início.</p><button type="button" class="secondary" data-open-system style="width:100%">Abrir sistema</button>';
  document.body.append(dialog);dialog.querySelector('[data-install-confirm]').onclick=install;dialog.querySelector('[data-open-system]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();const url=new URL(location.href);url.searchParams.delete('instalar');history.replaceState(null,'',url);},{once:true});dialog.showModal();
 }
 installationLanding();
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;sync();});window.addEventListener('appinstalled',()=>{installedHere=true;promptEvent=null;sync();});display.addEventListener('change',sync);
 const previous=render;render=function(){previous();sync();};mobile.addEventListener('change',sync);sync();
 if('serviceWorker' in navigator&&window.isSecureContext)navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
})();
