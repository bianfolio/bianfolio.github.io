const dialog=document.querySelector('.lightbox');
const detail=document.querySelector('#detail-image');
let activeTrigger;
document.querySelectorAll('[data-full]').forEach(button=>button.addEventListener('click',()=>{
  activeTrigger=button;
  detail.src=button.dataset.full;
  detail.alt=button.querySelector('img').alt;
  document.querySelector('#detail-caption').textContent=button.dataset.caption;
  document.querySelector('#original-link').href=button.dataset.full;
  dialog.showModal();
  document.body.style.overflow='hidden';
}));
document.querySelector('#close-detail').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';activeTrigger?.focus();});
