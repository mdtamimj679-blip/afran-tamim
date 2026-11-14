(() => {
'use strict';
const cfg=window.AFRAN_CMS_CONFIG||{},$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const status=(m,t='')=>{const e=$('#status');if(e){e.textContent=m;e.className='status'+(t?' '+t:'');e.classList.remove('hidden')}};
const loginStatus=(m,t='')=>{const e=$('#loginStatus');if(e){e.textContent=m;e.className='status'+(t?' '+t:'');e.classList.remove('hidden')}};
if(!window.supabase||!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes('YOUR-PROJECT')||!cfg.SUPABASE_ANON_KEY||cfg.SUPABASE_ANON_KEY.includes('YOUR_')){loginStatus('Setup required: add your Supabase Project URL and anon/publishable key to config.js.');$('#loginForm').addEventListener('submit',e=>{e.preventDefault();loginStatus('Supabase is not configured. Follow SETUP.md first.','error')});return}
// Normalize exceptional Unicode header metadata before native fetch validates ByteString headers.
 const safeFetch=(input,init={})=>{
  if(init.headers){const h=init.headers;const pairs=h instanceof Headers?[...h.entries()]:Array.isArray(h)?h:Object.entries(h);init={...init,headers:pairs.map(([k,v])=>[String(k),String(v).replace(/[\\u0100-\\u{10FFFF}]/gu,ch=>encodeURIComponent(ch))])}}
  return window.fetch(input,init);
 };
 const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},global:{fetch:safeFetch}});
const defaults={profile:{name:'AFRAN TAMIM',title:'Professional Video Editor',bio:'I create engaging videos through thoughtful editing, motion graphics and visual storytelling.',portrait:'assets/portrait.jpg',idPortrait:'',featuredVideo:''},contact:{email:'mdtamimj679@gmail.com',facebook:'https://www.facebook.com/hm.tamim.223742/',youtube:'https://www.youtube.com/results?search_query=4x+zero',youtubeName:'4X ZERO'},projects:[],gaming:[],anime:[],apps:[],friends:[{name:'Khalid Bin Oalid Sam',facebook:'https://www.facebook.com/khalid.bin.oalid.sam',image:'assets/friends/khalid-bin-oalid-sam.jpg',visible:true},{name:'Iftekhar Khalid',facebook:'https://www.facebook.com/profile.php?id=61587381485095',image:'assets/friends/iftekhar-khalid.jpeg',visible:true},{name:'MD Tamim 2.0',facebook:'https://www.facebook.com/md.tamim.hossain.837852',image:'assets/friends/md-tamim-2.jpeg',visible:true}],skills:[{name:'Video Editing'},{name:'Motion Graphics'},{name:'Creative Video Production'}],tools:[],appearance:{accent:'#4d9dff',glow:'#68e5ff',animations:true,doomEnabled:true,doomAsset:'',particles:true,glitch:true},sections:[{id:'home',label:'Home',visible:true},{id:'about',label:'About',visible:true},{id:'video-portfolio',label:'Video Portfolio',visible:true},{id:'portfolio',label:'Portfolio',visible:true},{id:'gaming',label:'Gaming & Free Fire',visible:true},{id:'anime',label:'Anime & Story',visible:true},{id:'apps',label:'Apps',visible:true},{id:'ai',label:'AI Assistant',visible:true},{id:'friends',label:'Friend Circle',visible:true},{id:'skills',label:'Skills',visible:true},{id:'toolkit',label:'Creative Toolkit',visible:true},{id:'interests',label:'Gaming & Anime',visible:true},{id:'contact',label:'Contact',visible:true}]};
let draft=structuredClone(defaults),session=null,dirty=false,activeUploads=0,revision=0;
 const uid=()=>globalThis.crypto?.randomUUID?.()||(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
 const setBusy=busy=>['#saveBtn','#publishBtn'].forEach(sel=>{const b=$(sel);if(b)b.disabled=busy||activeUploads>0;});
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o),setPath=(o,p,v)=>{const a=p.split('.');let x=o;for(let i=0;i<a.length-1;i++)x=x[a[i]]??(x[a[i]]={});x[a.at(-1)]=v};
function mergeDefaults(a,b){if(!b||typeof b!=='object'||Array.isArray(b))return a;for(const[k,v]of Object.entries(b)){if(v&&typeof v==='object'&&!Array.isArray(v))a[k]=mergeDefaults(a[k]||{},v);else a[k]=v}return a}
function markDirty(){revision++;dirty=true;status('Unsaved changes — save your draft before publishing.')}
function bindFields(){
 const seen=new Set();
 $$('[data-path]').forEach(el=>{
  const p=el.dataset.path;
  if(!p||seen.has(p)){console.warn('Duplicate or empty CMS data-path:',p);return;}
  seen.add(p);const v=getPath(draft,p);
  if(el.type==='checkbox')el.checked=!!v;else if(el.type==='color')el.value=/^#[0-9a-f]{6}$/i.test(String(v||''))?v:'#4d9dff';else el.value=v??'';
  const eventName=el.type==='checkbox'?'change':'input';
  el.addEventListener(eventName,()=>{setPath(draft,p,el.type==='checkbox'?el.checked:el.value);markDirty()});
 });
} 
function safeName(n){return String(n||'upload').normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-110)}
async function uploadFile(file,path){if(!file)throw new Error('Choose a file first.');if(file.size>500*1024*1024)throw new Error('File exceeds the configured 500 MB bucket limit.');const safe=path.replace(/[^a-zA-Z0-9._/-]/g,'_');
 if(file.size>6*1024*1024&&window.tus?.Upload){const {data:{session:s}}=await sb.auth.getSession();if(!s?.access_token)throw new Error('Please sign in again before uploading.');const project=cfg.SUPABASE_URL.replace(/\/$/,'');return await new Promise((resolve,reject)=>{const upload=new tus.Upload(file,{endpoint:project+'/storage/v1/upload/resumable',retryDelays:[0,1000,3000,5000,10000,20000],headers:{authorization:'Bearer '+s.access_token,apikey:cfg.SUPABASE_ANON_KEY,'x-upsert':'true'},metadata:{bucketName:'portfolio-assets',objectName:safe,contentType:file.type||'application/octet-stream',cacheControl:'3600'},chunkSize:6*1024*1024,onError:reject,onProgress:(sent,total)=>status('Uploading '+Math.round(sent/total*100)+'% — keep this tab open.'),onSuccess:()=>resolve(project+'/storage/v1/object/public/portfolio-assets/'+safe)});upload.findPreviousUploads().then(prev=>{if(prev.length)upload.resumeFromPreviousUpload(prev[0]);upload.start()}).catch(reject)})}
 const{error}=await sb.storage.from('portfolio-assets').upload(safe,file,{upsert:true,contentType:file.type});if(error)throw error;return sb.storage.from('portfolio-assets').getPublicUrl(safe).data.publicUrl}
function field(box,item,key,label,type='text',onInput){const wrap=document.createElement('div');wrap.className='field';const lab=document.createElement('label');lab.textContent=label;const input=document.createElement(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=item[key]||'';input.addEventListener('input',()=>{item[key]=input.value;if(onInput)onInput(input.value);markDirty()});wrap.append(lab,input);box.append(wrap)}
function filePicker(box,item,key,label,accept,kindFolder='media'){
 const wrap=document.createElement('div');wrap.className='field';const lab=document.createElement('label');lab.textContent=label;
 const input=document.createElement('input');input.type='file';input.accept=accept;
 const preview=document.createElement('div');preview.className='preview';
 const draw=url=>{preview.replaceChildren();if(url){const img=document.createElement('img');img.src=url;img.alt='Image preview';img.loading='lazy';preview.append(img)}};
 draw(item[key]);
 input.addEventListener('change',async()=>{
  const f=input.files?.[0];if(!f)return;let local='';
  if(f.type.startsWith('image/')){local=URL.createObjectURL(f);draw(local)}
  input.disabled=true;activeUploads++;setBusy(true);
  try{status('Uploading '+f.name+'…');const url=await uploadFile(f,`${kindFolder}/${uid()}-${safeName(f.name)}`);item[key]=url;draw(url);if(local)URL.revokeObjectURL(local);local='';markDirty();status('Upload complete. Save draft and publish to show it publicly.','ok')}
  catch(e){if(local)URL.revokeObjectURL(local);draw(item[key]);status(e.message||'Upload failed','error')}
  finally{input.disabled=false;activeUploads--;setBusy(false)}
 });
 wrap.append(lab,input,preview);box.append(wrap)
}
function renderList(id,arr,kind){const root=$('#'+id);if(!root)return;root.innerHTML='';arr.forEach((item,i)=>{const box=document.createElement('div');box.className='item';const head=document.createElement('div');head.className='item-head';const strong=document.createElement('strong');strong.textContent=`${kind} ${i+1}`;const del=document.createElement('button');del.type='button';del.className='danger';del.textContent='Delete';del.onclick=()=>{arr.splice(i,1);markDirty();renderList(id,arr,kind)};head.append(strong,del);box.append(head);
 if(kind==='projects'){field(box,item,'title','Project title');field(box,item,'description','Description','textarea');field(box,item,'category','Category (video-edit / motion / creative)');field(box,item,'type','Media type (video/image)');field(box,item,'media','Media URL');field(box,item,'thumbnail','Thumbnail URL');filePicker(box,item,'media','Choose video or image','video/mp4,video/webm,image/*','projects')}
 else if(kind==='friends'){field(box,item,'name','Exact name');field(box,item,'facebook','Facebook profile URL');field(box,item,'image','Profile image URL','text',value=>{const preview=box.querySelector('.preview');if(!preview)return;preview.replaceChildren();if(value){const img=document.createElement('img');img.src=value;img.alt='Profile image preview';img.loading='lazy';preview.append(img)}});filePicker(box,item,'image','Choose profile photo','image/*','friends');const l=document.createElement('label');l.className='check';const c=document.createElement('input');c.type='checkbox';c.checked=item.visible!==false;c.onchange=()=>{item.visible=c.checked;markDirty()};l.append(c,document.createTextNode('Visible on website'));box.append(l)}
 else if(kind==='gaming'){field(box,item,'title','Title');field(box,item,'description','Description','textarea');field(box,item,'url','External game/video link');field(box,item,'media','Uploaded video/image URL');filePicker(box,item,'media','Choose video or screenshot','video/mp4,video/webm,image/*','gaming')}
 else if(kind==='anime'){field(box,item,'title','Title');field(box,item,'description','Description / notes','textarea');field(box,item,'url','Related link');field(box,item,'media','Image URL');filePicker(box,item,'media','Choose image','image/*','anime')}
 else if(kind==='apps'){field(box,item,'name','App / service name');field(box,item,'description','Description');field(box,item,'url','Website URL');field(box,item,'logo','Logo image URL (optional)');filePicker(box,item,'logo','Choose app logo','image/*','apps')}
 else {field(box,item,'name',kind==='skills'?'Skill or service':'Tool / software');field(box,item,'description','Short description')}
 root.append(box)})}
function renderSections(){const root=$('#sectionsList');if(!root)return;root.innerHTML='';draft.sections.forEach((s,i)=>{const row=document.createElement('div');row.className='item item-head';const label=document.createElement('strong');label.textContent=s.label;const controls=document.createElement('div');controls.style.display='flex';controls.style.gap='6px';const check=document.createElement('input');check.type='checkbox';check.checked=s.visible!==false;check.title='Visible';check.onchange=()=>{s.visible=check.checked;markDirty()};const up=document.createElement('button');up.textContent='↑';up.disabled=i===0;up.onclick=()=>{[draft.sections[i-1],draft.sections[i]]=[draft.sections[i],draft.sections[i-1]];renderSections();markDirty()};const down=document.createElement('button');down.textContent='↓';down.disabled=i===draft.sections.length-1;down.onclick=()=>{[draft.sections[i+1],draft.sections[i]]=[draft.sections[i],draft.sections[i+1]];renderSections();markDirty()};controls.append(check,up,down);row.append(label,controls);root.append(row)})}
function renderAllLists(){for(const k of ['projects','friends','skills','tools','gaming','anime','apps'])renderList(k+'List',draft[k],k);renderSections()}
async function loadState(){const{data,error}=await sb.from('site_state').select('draft').eq('id',1).single();if(error)throw error;draft=mergeDefaults(structuredClone(defaults),data?.draft||{});
 if(!Array.isArray(draft.friends))draft.friends=[];
 if(!draft.friends.some(f=>f?.name==='Khalid Bin Oalid Sam'))draft.friends.unshift(structuredClone(defaults.friends[0]));
 for(const seed of defaults.friends){const existing=draft.friends.find(f=>f?.name===seed.name);if(existing&&!existing.image)existing.image=seed.image;}
 bindFields();renderAllLists();const img=$('#portraitPreview');img.innerHTML='';if(draft.profile.portrait){const el=document.createElement('img');el.src=draft.profile.portrait;img.append(el)} }
async function saveDraft(){if(activeUploads)throw new Error('Wait for all uploads to finish before saving.');const snapshot=structuredClone(draft),savedRevision=revision;const{data,error}=await sb.from('site_state').update({draft:snapshot,updated_at:new Date().toISOString(),updated_by:session.user.id}).eq('id',1).select('id').maybeSingle();if(error)throw error;if(!data)throw new Error('No site_state row (id=1) was updated. Run the Supabase schema setup SQL.');dirty=revision!==savedRevision;status(dirty?'Draft snapshot saved; newer edits are still unsaved.':'Draft saved to cloud database.','ok')}
async function publish(){if(activeUploads)throw new Error('Wait for all uploads to finish before publishing.');if(dirty)await saveDraft();const publishedSnapshot=structuredClone(draft),publishedRevision=revision;const{data,error}=await sb.from('site_state').update({published:publishedSnapshot,published_at:new Date().toISOString(),updated_at:new Date().toISOString(),updated_by:session.user.id}).eq('id',1).select('id').maybeSingle();if(error)throw error;if(!data)throw new Error('Publish failed: site_state row (id=1) was not updated. Check owner permissions and SQL policies.');status(revision!==publishedRevision?'Published the saved snapshot; newer edits remain unsaved.':'Published. Public website will load the new content.','ok')}
function showApp(user){$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#topActions').classList.remove('hidden');$('#ownerEmail').textContent=user.email||'Owner'}
async function boot(){const{data:{session:s}}=await sb.auth.getSession();session=s;if(!session)return;const{data:allowed,error}=await sb.rpc('is_site_admin');if(error||!allowed){await sb.auth.signOut();loginStatus('This account is not authorized as the website owner.','error');return}showApp(session.user);await loadState()}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('#email').value.trim();if(/[^\\x00-\\xff]/.test(email)){loginStatus('Use an email address supported by Supabase Auth (ASCII characters only).','error');return}const{data,error}=await sb.auth.signInWithPassword({email,password:$('#password').value});if(error){loginStatus(error.message,'error');return}session=data.session;try{const{data:allowed,error:err}=await sb.rpc('is_site_admin');if(err||!allowed)throw new Error('This account is not authorized as the website owner.');showApp(session.user);await loadState()}catch(ex){await sb.auth.signOut();loginStatus(ex.message,'error')}});
$('#logoutBtn').onclick=async()=>{await sb.auth.signOut();location.reload()};$('#saveBtn').onclick=()=>saveDraft().catch(e=>status(e.message,'error'));$('#publishBtn').onclick=()=>{if(confirm('Publish these changes to the public website?'))publish().catch(e=>status(e.message,'error'))};$('#previewBtn').onclick=()=>window.open('index.html?preview=1','_blank','noopener');
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;$$('.side button').forEach(x=>x.classList.toggle('active',x===b));$$('.tab').forEach(x=>x.classList.toggle('hidden',x.id!=='tab-'+b.dataset.tab))});
$('#addFriend').onclick=()=>{draft.friends.push({name:'New friend',facebook:'',image:'',visible:true});renderList('friendsList',draft.friends,'friends');markDirty()};
$('#addProject').onclick=()=>{draft.projects.push({title:'New project',description:'',category:'video-edit',media:'',thumbnail:'',type:'video'});renderList('projectsList',draft.projects,'projects');markDirty()};$('#addGaming').onclick=()=>{draft.gaming.push({title:'New gaming post',description:'',url:'',media:''});renderList('gamingList',draft.gaming,'gaming');markDirty()};$('#addAnime').onclick=()=>{draft.anime.push({title:'New anime/story post',description:'',url:'',media:''});renderList('animeList',draft.anime,'anime');markDirty()};$('#addApp').onclick=()=>{draft.apps.push({name:'New app',description:'',url:'',logo:''});renderList('appsList',draft.apps,'apps');markDirty()};$('#addSkill').onclick=()=>{draft.skills.push({name:'New skill',description:''});renderList('skillsList',draft.skills,'skills');markDirty()};$('#addTool').onclick=()=>{draft.tools.push({name:'New tool',description:''});renderList('toolsList',draft.tools,'tools');markDirty()};
$$('[data-upload]').forEach(el=>el.addEventListener('change',async()=>{
  const f=el.files?.[0];if(!f)return;el.disabled=true;activeUploads++;setBusy(true);
  try{status('Uploading '+f.name+'…');const path=el.dataset.upload.replace(/\\./g,'-')+'/'+uid()+'-'+safeName(f.name);const url=await uploadFile(f,path);setPath(draft,el.dataset.upload,url);markDirty();status('Upload complete. Save draft and publish.','ok');if(el.dataset.upload==='profile.portrait'){const im=$('#portraitPreview');im.replaceChildren();const x=document.createElement('img');x.src=url;x.alt='Portrait preview';im.append(x)}}
  catch(e){status(e.message||'Upload failed','error')}finally{el.disabled=false;activeUploads--;setBusy(false)}
 }));

const geminiStatus=(message,type='')=>{const el=$('#geminiStatus');if(!el)return;el.textContent=message;el.className='status'+(type?' '+type:'');el.classList.remove('hidden')};
$('#geminiAskBtn')?.addEventListener('click',async()=>{
  const prompt=$('#geminiPrompt')?.value.trim()||'';
  if(!prompt){geminiStatus('Write a message before asking Gemini.','error');return}
  if(prompt.length>6000){geminiStatus('Please keep your message under 6,000 characters.','error');return}
  const button=$('#geminiAskBtn'),reply=$('#geminiReply');
  button.disabled=true;button.textContent='Thinking…';reply.textContent='Gemini is preparing a response…';geminiStatus('Connecting securely to Gemini…');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),50000);
  try{
    const{data:{session:currentSession},error:sessionError}=await sb.auth.getSession();
    if(sessionError||!currentSession?.access_token)throw new Error('Your login session has expired. Please sign in again.');
    const endpoint=cfg.SUPABASE_URL.replace(/\/$/,'')+'/functions/v1/gemini-ai';
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.SUPABASE_ANON_KEY,'Authorization':'Bearer '+currentSession.access_token},body:JSON.stringify({message:prompt,model:$('#geminiModel')?.value||'gemini-3.8-flash'}),signal:controller.signal});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||'Gemini request failed. Check the Edge Function deployment and secrets.');
    reply.textContent=payload.reply||'Gemini returned an empty response.';
    geminiStatus('Response received from '+(payload.model||'Gemini')+'.','ok');
  }catch(error){
    reply.textContent='No response received.';
    geminiStatus(error.name==='AbortError'?'The request timed out. Please try again.':(error.message||'Could not connect to Gemini.'),'error');
  }finally{clearTimeout(timeout);button.disabled=false;button.textContent='Ask Gemini ↗'}
});
$('#geminiClearBtn')?.addEventListener('click',()=>{$('#geminiPrompt').value='';$('#geminiReply').textContent='Your response will appear here.';geminiStatus('Cleared.','ok')});

boot().catch(e=>loginStatus(e.message,'error'));
})();
