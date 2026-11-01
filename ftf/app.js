const $ = id => document.getElementById(id);
let photos = [...window.galleryImages], day = 'All', category = 'All categories', filtered = [], current = 0, lastFocus;
const dialog = $('lightbox');
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 filtered=photos.filter(p=>(day==='All'||p.day===day)&&(category==='All categories'||p.category===category));
 $('totalCount').textContent=String(photos.length).padStart(2,'0');
 $('resultCount').textContent=`${filtered.length} ${filtered.length===1?'moment':'moments'}`;
 $('empty').hidden=filtered.length>0;
 $('grid').innerHTML=filtered.map((p,i)=>`<button class="photo-card" data-index="${i}" style="animation-delay:${Math.min(i*45,360)}ms" aria-label="View ${escapeHTML(p.caption)} — ${p.day}, ${p.category}"><img src="${escapeHTML(p.src)}" alt="${escapeHTML(p.caption)}" loading="${i<3?'eager':'lazy'}" style="object-position:${p.position||'center'}"><span class="card-shade"></span><span class="card-day">${p.day}</span><span class="card-copy"><span class="card-category">${p.category}</span><h3>${escapeHTML(p.caption)}</h3></span><span class="expand" aria-hidden="true">↗</span></button>`).join('');
 document.querySelectorAll('.photo-card').forEach(card=>{
  card.addEventListener('click',()=>openPhoto(Number(card.dataset.index)));
  card.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=card.getBoundingClientRect();card.style.transform=`rotateX(${-(e.clientY-r.top-r.height/2)/r.height*5}deg) rotateY(${(e.clientX-r.left-r.width/2)/r.width*5}deg) scale(1.015)`;});
  card.addEventListener('pointerleave',()=>card.style.transform='');
  card.querySelector('img').addEventListener('error',e=>{e.target.style.opacity='.2';card.querySelector('.card-category').textContent='Photo unavailable';});
 });
}
document.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{day=b.dataset.day;document.querySelectorAll('[data-day]').forEach(t=>{t.classList.toggle('selected',t===b);t.setAttribute('aria-pressed',String(t===b));});render();}));
$('category').addEventListener('change',e=>{category=e.target.value;render();});
$('viewToggle').addEventListener('click',()=>{const uniform=$('grid').classList.toggle('uniform');$('viewToggle').setAttribute('aria-label',uniform?'Switch to editorial grid':'Switch to uniform grid');});
function showPhoto(){const p=filtered[current];const img=$('fullPhoto');img.style.animation='none';img.src=p.full||p.src;img.alt=p.caption;requestAnimationFrame(()=>{img.style.animation='';});$('photoCaption').textContent=p.caption;$('photoTags').textContent=`${p.day} / ${p.category}`;$('photoCounter').textContent=`${String(current+1).padStart(2,'0')} / ${String(filtered.length).padStart(2,'0')}`;}
function openPhoto(index){current=index;lastFocus=document.activeElement;showPhoto();dialog.showModal();document.body.style.overflow='hidden';$('close').focus();history.replaceState(null,'',`#photo-${filtered[current].id}`);}
function step(n){current=(current+n+filtered.length)%filtered.length;showPhoto();history.replaceState(null,'',`#photo-${filtered[current].id}`);}
function closePhoto(){dialog.close();}
$('close').onclick=closePhoto;$('previous').onclick=()=>step(-1);$('next').onclick=()=>step(1);
dialog.addEventListener('close',()=>{document.body.style.overflow='';history.replaceState(null,'','#gallery');lastFocus?.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog)closePhoto();});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});
let touchStart=0;$('fullPhoto').addEventListener('touchstart',e=>touchStart=e.changedTouches[0].screenX,{passive:true});$('fullPhoto').addEventListener('touchend',e=>{const delta=e.changedTouches[0].screenX-touchStart;if(Math.abs(delta)>55)step(delta<0?1:-1);},{passive:true});
let toastTimer;function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
$('download').onclick=async()=>{const p=filtered[current];try{const response=await fetch(p.full||p.src);if(!response.ok)throw Error();const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`FTF-${p.day}-${p.id}.${blob.type.split('/')[1]?.replace('jpeg','jpg')||'jpg'}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Photo downloaded.');}catch{toast('Download unavailable for this sample. Try your own local photos.');}};
$('share').onclick=async()=>{const p=filtered[current];if(p.local){toast('Local previews are only visible on this device. Add the file to the site before sharing.');return;}const url=new URL(location.href);url.hash=`photo-${p.id}`;try{if(navigator.share)await navigator.share({title:'FTF Fall Showcase',text:p.caption,url:url.href});else{await navigator.clipboard.writeText(url.href);toast('Photo link copied.');}}catch(e){if(e.name!=='AbortError')toast('Sharing is unavailable. Copy the photo link from your address bar.');}};
const fileInput=$('files');$('uploadButton').onclick=()=>fileInput.click();$('uploadTop').onclick=()=>{$('uploadZone').scrollIntoView({behavior:'smooth',block:'center'});fileInput.click();};
function addFiles(files){const valid=[...files].filter(f=>['image/jpeg','image/png','image/webp','image/avif'].includes(f.type));if(!valid.length){toast('Choose JPG, PNG, WEBP or AVIF images.');return;}const added=valid.map((f,i)=>({id:`local-${Date.now()}-${i}`,day:$('uploadDay').value,category:$('uploadCategory').value,caption:f.name.replace(/\.[^.]+$/,'').replace(/[_-]/g,' '),src:URL.createObjectURL(f),local:true}));photos=[...added,...photos];day='All';category='All categories';$('category').value=category;document.querySelectorAll('[data-day]').forEach(b=>{const active=b.dataset.day==='All';b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});render();toast(`${valid.length} ${valid.length===1?'photo added':'photos added'} to this session.`);$('gallery').scrollIntoView({behavior:'smooth'});}
fileInput.onchange=()=>{addFiles(fileInput.files);fileInput.value='';};
const zone=$('uploadZone');['dragenter','dragover'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();zone.classList.add('dragging');}));zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragging');addFiles(e.dataTransfer.files);});
render();const match=location.hash.match(/^#photo-(.+)$/);if(match){const index=filtered.findIndex(p=>p.id===match[1]);if(index>=0)openPhoto(index);}
