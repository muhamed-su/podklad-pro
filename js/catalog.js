(() => {
 'use strict';
 const search=document.getElementById('color-search'),status=document.getElementById('favorites-status');
 const tabs={main:document.getElementById('all-colors'),unselected:document.getElementById('unselected-colors'),pattern:document.getElementById('pattern-colors'),favorites:document.getElementById('favorite-colors')};
 const key='podklad-pro:favorites:v1';let favorites=new Set(),mode='main';
 try { const v=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(v)) favorites=new Set(v.map(String)); } catch {status.textContent='Не удалось загрузить избранное.';}
 const norm=v=>v.toLowerCase().replaceAll('ё','е').replaceAll('#','').trim();
 function render(){
  const cards=[...document.querySelectorAll('.product')],words=norm(search.value).split(/\s+/).filter(Boolean),counts={main:0,unselected:0,pattern:0,favorites:0};let total=0,count=0;
  cards.forEach(c=>{const selected=favorites.has(c.dataset.colorCode),collection=c.dataset.collection||'main';counts[collection]++;if(selected)counts.favorites++;
   const b=c.querySelector('.favorite-button');b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',(selected?'Убрать из избранного: ':'В избранное: ')+c.querySelector('h3').textContent);
   const inSection=mode==='favorites'?selected:collection===mode;if(inSection)total++;c.hidden=!inSection||!words.every(w=>norm(c.dataset.search).includes(w));if(!c.hidden)count++;
  });
  Object.entries(tabs).forEach(([k,t])=>{t.setAttribute('aria-pressed',String(mode===k));t.classList.toggle('is-active',mode===k);t.querySelector('span').textContent=counts[k];});
  document.querySelector('.collection-number').textContent=cards.length;document.getElementById('collection-note').hidden=mode!=='unselected';document.getElementById('result-count').textContent=`Показано ${count} из ${total}`;document.getElementById('empty-state').hidden=count!==0;
 }
 document.getElementById('product-list').addEventListener('click',e=>{const b=e.target.closest('.favorite-button');if(!b)return;const c=b.closest('.product'),id=c.dataset.colorCode,next=new Set(favorites);if(next.has(id))next.delete(id);else next.add(id);try{localStorage.setItem(key,JSON.stringify([...next]));favorites=next;status.textContent='Избранное сохранено на этом устройстве.';render();}catch{status.textContent='Не удалось сохранить избранное.';}});
 Object.entries(tabs).forEach(([k,t])=>t.addEventListener('click',()=>{mode=k;render();}));search.addEventListener('input',render);document.addEventListener('catalogchanged',render);
 window.catalogView={getMode:()=>mode,show:k=>{mode=k;search.value='';render();}};render();
})();
