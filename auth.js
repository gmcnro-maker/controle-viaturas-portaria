import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,setPersistence,inMemoryPersistence,updatePassword} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
const settings=window.CEP4_CONFIG,message=document.querySelector('#login-message'),button=document.querySelector('#google-login'),frame=document.querySelector('#cep4-bridge');
const pending=new Map(),retries=new Map();let peer=null,peerOrigin='',auth=null,current=null,channel='';
const trustedOrigin=origin=>{try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||/^[a-z0-9-]+-script\.googleusercontent\.com$/.test(u.hostname));}catch{return false;}};
function receive(event){
 const data=event.data;if(!data||data.channel!==channel||!trustedOrigin(event.origin))return;
 if(data.type==='CEP4_READY'){
  if(peer&&peer!==event.source)return;peer=event.source;peerOrigin=event.origin;button.disabled=false;message.textContent=window.cep4AppSurface?'Primeiro acesso externo: cadastre-se com Google. Depois da autorização, use login e senha.':'Entre com sua matrícula ou acesso de gestão cadastrado.';return;
 }
 if(data.type!=='CEP4_RESULT'||event.source!==peer||event.origin!==peerOrigin)return;
 const entry=pending.get(data.id);if(!entry)return;pending.delete(data.id);clearTimeout(entry.timer);
 if(data.error)entry.reject(Error(data.error));else entry.resolve(data.value);
}
window.addEventListener('message',receive);
window.cep4Installation=()=>{let id=localStorage.getItem('ce-installation');if(!id){id=crypto.randomUUID();localStorage.setItem('ce-installation',id);}return id;};
window.cep4Api=async(path,input)=>{
 if(!current||!peer)throw Error('Entre na sua conta para continuar.');
 if(window.cep4Consumer)input={...(input||{}),consumer:true};
 input={...(input||{}),_installation:window.cep4Installation(),_surface:window.cep4AppSurface?'app':'desktop'};
 const publicInput={...(input||{})};delete publicInput.adminPassword;
 const key=JSON.stringify({uid:current.uid,path,input:publicInput});let operationId=retries.get(key);
 if(input&&!operationId){operationId=crypto.randomUUID();retries.set(key,operationId);}
 const token=await current.getIdToken();
 return new Promise((resolve,reject)=>{
  const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('Não foi possível confirmar a resposta. Consulte os registros antes de repetir.'));},90000);
  pending.set(id,{timer,reject,resolve:value=>{retries.delete(key);if(value?.warning)message.textContent=value.warning;resolve(value);}});
  peer.postMessage({type:'CEP4_RPC',channel,id,path,input:input||{},operationId:operationId||null,token},peerOrigin);
 });
};
window.cep4Logout=async()=>{try{await window.cep4BeforeLogout?.();}catch(e){}document.querySelectorAll('.ce-access-dialog').forEach(d=>{d.close();d.remove();});window.cep4Consumer=false;current=null;retries.clear();for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Sessão encerrada.'));}pending.clear();await signOut(auth);window.cep4Clear();};
async function boot(){
 if(!settings?.firebase?.apiKey||!settings.firebase.projectId||!settings.firebase.authDomain||!settings.firebase.appId)throw Error('O responsável ainda precisa configurar o login Google. Nenhum dado pode ser enviado.');
 const endpoint=new URL(settings.webAppUrl);if(endpoint.origin!=='https://script.google.com'||!endpoint.pathname.endsWith('/exec'))throw Error('Endereço do serviço CEP4 inválido.');
 auth=getAuth(initializeApp(settings.firebase));auth.languageCode='pt-BR';await setPersistence(auth,inMemoryPersistence);
 window.cep4AppSurface=matchMedia('(max-width:700px)').matches;
 button.hidden=!window.cep4AppSurface;const intro=document.querySelector('.loginbox>p');if(intro)intro.textContent=window.cep4AppSurface?'Primeiro acesso? Cadastre-se com Google. Após autorização, entre com login e senha.':'Acesso exclusivo aos usuários internos cadastrados pelo Gestor Técnico.';
 const police=document.createElement('form');police.id='police-login';police.innerHTML='<label>Matrícula<input name="registration" inputmode="numeric" pattern="[0-9]{3,20}" minlength="3" maxlength="20" required autocomplete="username"></label><label>Senha<input name="password" type="password" required minlength="6" maxlength="128" autocomplete="current-password"></label><button type="submit">Entrar</button><p data-police-help>Use a matrícula e a senha cadastradas pelo Gestor Técnico.</p>';button.before(police);window.cep4EnhancePasswords(police);

 police.onsubmit=async event=>{event.preventDefault();const submit=police.querySelector('[type=submit]');submit.disabled=true;try{if(!peer)throw Error('Aguarde a conexão com o sistema.');const registration=police.elements.registration.value.trim();if(!/^\d{3,20}$/.test(registration))throw Error('Informe a matrícula usando somente números.');const email=registration+'@matricula.cep4.invalid',password=police.elements.password.value;const credential=await signInWithEmailAndPassword(auth,email,password);current=credential.user;await window.cep4Load();}catch(error){current=null;await signOut(auth);window.cep4Clear();message.textContent=error.code==='auth/invalid-credential'?'Matrícula ou senha não conferem.':error.code==='auth/email-already-in-use'?'Já existe uma conta para esta matrícula. Use Entrar ou procure P4/Admin.':error.code==='auth/too-many-requests'?'Muitas tentativas. Aguarde antes de tentar novamente.':error.message;}finally{police.elements.password.value='';submit.disabled=false;}};
 const externalLogin=document.createElement('form');externalLogin.id='ce-external-login';externalLogin.innerHTML='<h2>Usuário (Externo)</h2><label>Login<input name="login" required pattern="[A-Za-z0-9._-]{3,40}" maxlength="40" autocomplete="username"></label><label>Senha<input name="password" type="password" minlength="6" maxlength="128" required autocomplete="current-password"></label><button type="submit">Entrar</button>';button.before(externalLogin);externalLogin.hidden=!window.cep4AppSurface;window.cep4EnhancePasswords(externalLogin);externalLogin.onsubmit=async e=>{e.preventDefault();const submit=externalLogin.querySelector('[type=submit]');submit.disabled=true;try{if(!peer)throw Error('Aguarde a conexão com o sistema.');const credential=await signInWithEmailAndPassword(auth,externalLogin.elements.login.value.trim().toLowerCase()+'@externo.cep4.invalid',externalLogin.elements.password.value);current=credential.user;await window.cep4Load();}catch(e){current=null;if(auth)await signOut(auth);window.cep4Clear();message.textContent=localStorage.getItem('ce-blocked')?'':e.code==='auth/invalid-credential'?'Login ou senha não conferem.':e.message==='ACCESS_SILENT'?'':e.message;}finally{externalLogin.elements.password.value='';submit.disabled=false;}};
 const internalEntry=document.createElement('details');internalEntry.className='ce-internal-login';internalEntry.innerHTML='<summary>Acesso interno</summary>';button.after(internalEntry);internalEntry.open=!window.cep4AppSurface;internalEntry.append(police);
 const p4=document.createElement('form');p4.innerHTML='<details><summary>Gestor Técnico</summary><label>Usuário<input name="email" type="text" required autocomplete="username" pattern="[A-Za-z0-9._-]{3,40}" maxlength="40"></label><label>Senha<input name="password" type="password" required autocomplete="current-password"></label><button type="submit">Entrar</button></details>';internalEntry.append(p4);window.cep4EnhancePasswords(p4);
 p4.onsubmit=async event=>{event.preventDefault();const submit=p4.querySelector('button[type=submit]');submit.disabled=true;try{if(!peer)throw Error('Aguarde a conexão com o CEP4.');const credential=await signInWithEmailAndPassword(auth,p4.elements.email.value.trim().toLowerCase()+'@acesso.cep4.invalid',p4.elements.password.value);current=credential.user;await window.cep4Load();}catch(error){current=null;await signOut(auth);window.cep4Clear();message.textContent=error.message;}finally{p4.elements.password.value='';submit.disabled=false;}};
 const recover=document.createElement('button');recover.type='button';recover.className='secondary';recover.textContent='Esqueci a senha';recover.onclick=()=>{const d=document.createElement('dialog');d.innerHTML='<form><h2>Redefinir senha</h2><label>Matrícula ou login<input name="login" required maxlength="40" autocomplete="username"></label><p role="status"></p><button>Enviar instruções</button><button type="button" data-close>Fechar</button></form>';document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.querySelector('form').onsubmit=async e=>{e.preventDefault();try{const result=await window.cep4Recovery(d.querySelector('input').value);d.querySelector('[role=status]').textContent=result.message;}catch(e){d.querySelector('[role=status]').textContent='Não foi possível consultar o serviço agora. Tente mais tarde.';}};d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();};internalEntry.after(recover);
 channel=crypto.randomUUID();endpoint.searchParams.set('channel',channel);frame.src=endpoint.href;
 button.onclick=async()=>{button.disabled=true;try{
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  const credential=await signInWithPopup(auth,provider);current=credential.user;
  message.textContent='Verificando autorização no CEP4…';await window.cep4Load();
 }catch(error){current=null;if(auth)await signOut(auth);window.cep4Clear();message.textContent=localStorage.getItem('ce-blocked')?'':error.code==='auth/popup-blocked'?'Permita a janela de login do Google para entrar.':error.message||'Não foi possível entrar.';}finally{button.disabled=!peer;}};
 setTimeout(()=>{if(!peer)message.textContent='A conexão com o CEP4 não respondeu. Confira a implantação e a origem autorizada.';},30000);
}
boot().catch(error=>{message.textContent=error.message;button.disabled=true;});

let provisioningAuth=null;
window.cep4CreateInternalAccount=async(login,password)=>{
 if(!/^[a-z0-9._-]{3,40}$/.test(login)||typeof password!=='string'||password.length<6)throw Error('Use usuário de 3 a 40 caracteres e senha com pelo menos 6 caracteres.');
 if(!provisioningAuth){provisioningAuth=getAuth(initializeApp(settings.firebase,'cep4-provisioning'));await setPersistence(provisioningAuth,inMemoryPersistence);}
 try{const result=await createUserWithEmailAndPassword(provisioningAuth,login+'@acesso.cep4.invalid',password);return result.user.uid;}finally{await signOut(provisioningAuth);}
};

window.cep4ExternalCredential=async(password,login)=>{if(!current||!current.email.endsWith('@gmail.com'))throw Error('Entre com Google antes de criar a conta.');if(typeof password!=='string'||password.length<6)throw Error('A senha deve ter ao menos seis caracteres.');if(!/^[a-z0-9._-]{3,40}$/.test(login))throw Error('Confira o login escolhido.');if(!provisioningAuth){provisioningAuth=getAuth(initializeApp(settings.firebase,'cep4-provisioning'));await setPersistence(provisioningAuth,inMemoryPersistence);}try{let result;try{result=await createUserWithEmailAndPassword(provisioningAuth,login+'@externo.cep4.invalid',password);}catch(e){if(e.code!=='auth/email-already-in-use')throw e;result=await signInWithEmailAndPassword(provisioningAuth,login+'@externo.cep4.invalid',password);}return await result.user.getIdToken(true);}finally{await signOut(provisioningAuth);}};

window.cep4ChangeOwnPassword=async password=>{if(!current||typeof password!=='string'||password.length<6||password==='123456')throw Error('Escolha outra senha, com pelo menos seis caracteres.');await updatePassword(current,password);await current.getIdToken(true);await window.cep4Api('account/password-completed',{});};
window.cep4ProvisionMatricula=async registration=>{if(!/^\d{3,20}$/.test(registration))throw Error('Confira a matrícula.');if(!provisioningAuth){provisioningAuth=getAuth(initializeApp(settings.firebase,'cep4-provisioning'));await setPersistence(provisioningAuth,inMemoryPersistence);}try{const result=await createUserWithEmailAndPassword(provisioningAuth,registration+'@matricula.cep4.invalid','123456');return await result.user.getIdToken(true);}finally{await signOut(provisioningAuth);}};

window.cep4Recovery=login=>{if(!peer)return Promise.reject(Error('Aguarde a conexão.'));return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('Tempo esgotado.'));},90000);pending.set(id,{resolve,reject,timer});peer.postMessage({type:'CEP4_RPC',channel,id,path:'account/recover',input:{login},operationId:null,token:''},peerOrigin);});};
