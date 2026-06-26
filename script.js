/* TempMailPro - vanilla JS client for mail.tm */
(function(){
  const API='https://api.mail.tm';
  const STORE='tmp_mail_session_v1';
  const $=(s)=>document.querySelector(s);
  const emailEl=$('#email'), statusEl=$('#status'), inboxEl=$('#inbox');
  let session=null, pollTimer=null, seen=new Set();

  document.getElementById('year').textContent=new Date().getFullYear();

  function setStatus(t){statusEl.textContent=t;}
  function rand(n){const c='abcdefghijklmnopqrstuvwxyz0123456789';let o='';for(let i=0;i<n;i++)o+=c[Math.floor(Math.random()*c.length)];return o;}
  function esc(s){return (s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

  async function api(path,opts={}){
    const r=await fetch(API+path,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});
    if(!r.ok) throw new Error('API '+r.status);
    return r.status===204?null:r.json();
  }

  async function getDomain(){
    const d=await api('/domains?page=1');
    const list=d['hydra:member']||d;
    return list[0].domain;
  }

  async function createAccount(){
    setStatus('Creating your private inbox…');
    const domain=await getDomain();
    const address=`${rand(10)}@${domain}`;
    const password=rand(16);
    await api('/accounts',{method:'POST',body:JSON.stringify({address,password})});
    const tok=await api('/token',{method:'POST',body:JSON.stringify({address,password})});
    session={address,password,token:tok.token,id:tok.id};
    localStorage.setItem(STORE,JSON.stringify(session));
    seen=new Set();
    render();
  }

  async function loadSession(){
    const raw=localStorage.getItem(STORE);
    if(!raw) return false;
    try{
      session=JSON.parse(raw);
      // verify token still works
      await api('/me',{headers:{Authorization:'Bearer '+session.token}});
      return true;
    }catch{localStorage.removeItem(STORE);return false;}
  }

  function render(){
    emailEl.value=session.address;
    setStatus('Inbox active — waiting for messages…');
    fetchMessages();
    if(pollTimer) clearInterval(pollTimer);
    pollTimer=setInterval(fetchMessages,5000);
  }

  async function fetchMessages(){
    if(!session) return;
    try{
      const d=await api('/messages?page=1',{headers:{Authorization:'Bearer '+session.token}});
      const list=d['hydra:member']||d;
      if(!list.length){inboxEl.innerHTML='<div class="empty">No messages yet. Emails will appear here automatically.</div>';return;}
      inboxEl.innerHTML='';
      list.forEach(m=>{
        const el=document.createElement('div');
        el.className='msg';el.setAttribute('role','listitem');
        el.innerHTML=`<div><span class="from">${esc(m.from?.address||'Unknown')}</span><span class="time">${new Date(m.createdAt).toLocaleTimeString()}</span></div><div class="subj">${esc(m.subject||'(no subject)')}</div>`;
        el.addEventListener('click',()=>openMessage(m.id,el));
        inboxEl.appendChild(el);
        if(!seen.has(m.id)){seen.add(m.id);}
      });
    }catch(e){setStatus('Connection issue — retrying…');}
  }

  async function openMessage(id,el){
    if(el.querySelector('.msg-body')){el.querySelector('.msg-body').remove();return;}
    try{
      const m=await api('/messages/'+id,{headers:{Authorization:'Bearer '+session.token}});
      const body=document.createElement('div');body.className='msg-body';
      const html=m.html&&m.html.length?m.html.join(''):'<pre style="white-space:pre-wrap">'+esc(m.text||'')+'</pre>';
      // basic sanitization: strip script tags
      body.innerHTML=html.replace(/<script[\s\S]*?<\/script>/gi,'');
      el.appendChild(body);
    }catch{setStatus('Could not load message.');}
  }

  async function newInbox(){
    localStorage.removeItem(STORE);
    if(pollTimer) clearInterval(pollTimer);
    emailEl.value='Generating…';inboxEl.innerHTML='<div class="empty">No messages yet.</div>';
    try{await createAccount();}catch{setStatus('Could not create inbox. Please retry.');}
  }

  $('#copyBtn').addEventListener('click',async()=>{
    if(!session) return;
    try{await navigator.clipboard.writeText(session.address);setStatus('Copied to clipboard ✔');}catch{setStatus('Press Ctrl+C to copy.');}
  });
  $('#refreshBtn').addEventListener('click',fetchMessages);
  $('#newBtn').addEventListener('click',newInbox);

  (async()=>{
    try{
      if(await loadSession()){render();}
      else{await createAccount();}
    }catch(e){setStatus('Service temporarily unavailable. Please retry.');}
  })();
})();
