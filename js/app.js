const WHATSAPP_NUMERO = "5491112345678";
const STORAGE_KEY = "ln_distribuidora_pedido";

const state = {
  filtroCategoria: null,
  busqueda: "",
  filtroMarca: "",
  orden: "relevancia",
  pedido: cargarPedido(),
  productoActivo: null,
};

/* ---------------------------- Utilidades ---------------------------- */

function formatoPrecio(valor){
  return valor.toLocaleString("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 });
}

function cargarPedido(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}

function guardarPedido(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pedido)); }catch(e){}
}

function marcasDisponibles(){
  return [...new Set(PRODUCTOS.map(p => p.marca))].sort();
}

/* ---------------------------- Render: categorías ---------------------------- */

function renderCategorias(){
  const grid = document.getElementById("cat-grid");
  grid.innerHTML = CATEGORIAS.map(c => `
    <button class="cat-card ${state.filtroCategoria === c.id ? "active" : ""}" data-cat="${c.id}">
      <span class="ic">${c.icono}</span>
      <span>${c.nombre}</span>
    </button>
  `).join("");
  grid.querySelectorAll(".cat-card").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const cat = btn.dataset.cat;
      state.filtroCategoria = state.filtroCategoria === cat ? null : cat;
      sincronizarFiltroCategoriaUI();
      renderCategorias();
      renderCatalogo();
      document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
    });
  });
}

function sincronizarFiltroCategoriaUI(){
  const select = document.getElementById("filtro-categoria");
  if(select) select.value = state.filtroCategoria || "";
}

/* ---------------------------- Render: filtros ---------------------------- */

function renderFiltros(){
  const catSelect = document.getElementById("filtro-categoria");
  catSelect.innerHTML = `<option value="">Todas</option>` + CATEGORIAS.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join("");
  catSelect.addEventListener("change", ()=>{
    state.filtroCategoria = catSelect.value || null;
    renderCategorias();
    renderCatalogo();
  });

  const marcaSelect = document.getElementById("filtro-marca");
  marcaSelect.innerHTML = `<option value="">Todas</option>` + marcasDisponibles().map(m=>`<option value="${m}">${m}</option>`).join("");
  marcaSelect.addEventListener("change", ()=>{
    state.filtroMarca = marcaSelect.value;
    renderCatalogo();
  });

  document.getElementById("orden-select").addEventListener("change", (e)=>{
    state.orden = e.target.value;
    renderCatalogo();
  });

  document.getElementById("clear-filters").addEventListener("click", ()=>{
    state.filtroCategoria = null; state.filtroMarca = ""; state.busqueda = "";
    catSelect.value = ""; marcaSelect.value = "";
    document.getElementById("search-input").value = "";
    renderCategorias();
    renderCatalogo();
  });

  document.getElementById("search-input").addEventListener("input", (e)=>{
    state.busqueda = e.target.value.trim().toLowerCase();
    renderCatalogo();
    document.getElementById("catalogo").scrollIntoView({behavior:"smooth", block:"start"});
  });
}

/* ---------------------------- Render: catálogo ---------------------------- */

function productosFiltrados(){
  let lista = PRODUCTOS.slice();
  if(state.filtroCategoria) lista = lista.filter(p=>p.categoriaId === state.filtroCategoria);
  if(state.filtroMarca) lista = lista.filter(p=>p.marca === state.filtroMarca);
  if(state.busqueda) lista = lista.filter(p=>p.nombre.toLowerCase().includes(state.busqueda));

  if(state.orden === "precio-asc") lista.sort((a,b)=>a.precio-b.precio);
  else if(state.orden === "precio-desc") lista.sort((a,b)=>b.precio-a.precio);
  else if(state.orden === "nombre") lista.sort((a,b)=>a.nombre.localeCompare(b.nombre));

  else lista.sort((a,b)=> (b.disponible - a.disponible));

  return lista;
}

function nombreCategoria(id){
  return CATEGORIAS.find(c=>c.id === id)?.nombre || id;
}

function renderCatalogo(){
  const lista = productosFiltrados();
  const grid = document.getElementById("product-grid");
  document.getElementById("result-count").textContent = `${lista.length} producto${lista.length===1?"":"s"}`;

  if(lista.length === 0){
    grid.innerHTML = `<div class="empty-state">No encontramos productos con esos filtros. Probá modificar la búsqueda o limpiar los filtros.</div>`;
    return;
  }

  grid.innerHTML = lista.map(p => `
    <article class="product-card">
      <div class="product-thumb" data-open="${p.id}">
        <span class="stock-tag ${p.disponible ? "in":"out"}">${p.disponible ? "Disponible":"Sin stock"}</span>
        <img src="${p.img}" alt="${p.nombre}" loading="lazy">
        <button class="quick-add" data-quickadd="${p.id}" title="Agregar 1 unidad a Mi pedido" ${p.disponible?"":"disabled"}>🛒</button>
      </div>
      <div class="product-info">
        <span class="product-cat">${nombreCategoria(p.categoriaId)}</span>
        <h3 class="product-name">${p.nombre}</h3>
        <span class="product-price">${formatoPrecio(p.precio)}</span>
        <div class="product-actions">
          <button class="btn btn-outline btn-block btn-sm" data-open="${p.id}">Ver</button>
        </div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-open]").forEach(el=>{
    el.addEventListener("click", ()=> abrirModal(Number(el.dataset.open)));
  });
  grid.querySelectorAll("[data-quickadd]").forEach(el=>{
    el.addEventListener("click", (e)=>{
      e.stopPropagation();
      agregarAlPedido(Number(el.dataset.quickadd), 1);
      mostrarToast("Producto agregado a Mi pedido");
    });
  });
}

/* ---------------------------- Modal de producto ---------------------------- */

function abrirModal(id){
  const p = PRODUCTOS.find(x=>x.id === id);
  if(!p) return;
  state.productoActivo = { ...p, cantidad: 1 };
  document.getElementById("modal-img").src = p.img;
  document.getElementById("modal-img").alt = p.nombre;
  document.getElementById("modal-cat").textContent = nombreCategoria(p.categoriaId);
  document.getElementById("modal-nombre").textContent = p.nombre;
  document.getElementById("modal-precio").textContent = formatoPrecio(p.precio);
  document.getElementById("modal-marca").textContent = p.marca;
  document.getElementById("modal-presentacion").textContent = p.presentacion;
  document.getElementById("modal-disponibilidad").textContent = p.disponible ? "Disponible" : "Sin stock";
  document.getElementById("modal-desc").textContent = p.descripcion;
  document.getElementById("modal-qty").textContent = "1";
  const addBtn = document.getElementById("modal-add");
  addBtn.disabled = !p.disponible;
  document.getElementById("overlay-producto").classList.add("open");
}

function cerrarModal(){
  document.getElementById("overlay-producto").classList.remove("open");
  state.productoActivo = null;
}

function initModal(){
  document.getElementById("modal-close").addEventListener("click", cerrarModal);
  document.getElementById("overlay-producto").addEventListener("click", (e)=>{
    if(e.target.id === "overlay-producto") cerrarModal();
  });
  document.getElementById("qty-minus").addEventListener("click", ()=>{
    if(!state.productoActivo) return;
    state.productoActivo.cantidad = Math.max(1, state.productoActivo.cantidad - 1);
    document.getElementById("modal-qty").textContent = state.productoActivo.cantidad;
  });
  document.getElementById("qty-plus").addEventListener("click", ()=>{
    if(!state.productoActivo) return;
    state.productoActivo.cantidad += 1;
    document.getElementById("modal-qty").textContent = state.productoActivo.cantidad;
  });
  document.getElementById("modal-add").addEventListener("click", ()=>{
    if(!state.productoActivo) return;
    agregarAlPedido(state.productoActivo.id, state.productoActivo.cantidad);
    mostrarToast("Producto agregado a Mi pedido");
    cerrarModal();
  });
  document.getElementById("modal-whatsapp").addEventListener("click", ()=>{
    if(!state.productoActivo) return;
    const { nombre, cantidad } = state.productoActivo;
    const mensaje = `Hola, quisiera consultar por ${nombre}. Cantidad: ${cantidad} unidad${cantidad===1?"":"es"}. ¿Me podrían informar disponibilidad y precio?`;
    abrirWhatsapp(mensaje);
  });

  // Lightbox
  document.getElementById("modal-img-wrap").addEventListener("click", ()=>{
    const src = document.getElementById("modal-img").src;
    document.getElementById("lightbox-img").src = src;
    document.getElementById("lightbox").classList.add("open");
  });
  document.getElementById("lightbox-close").addEventListener("click", ()=>{
    document.getElementById("lightbox").classList.remove("open");
  });
  document.getElementById("lightbox").addEventListener("click", (e)=>{
    if(e.target.id === "lightbox") document.getElementById("lightbox").classList.remove("open");
  });
}

/* ---------------------------- WhatsApp ---------------------------- */

function abrirWhatsapp(mensaje){
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

/* ---------------------------- Mi pedido ---------------------------- */

function agregarAlPedido(id, cantidad){
  const existente = state.pedido.find(i=>i.id === id);
  if(existente) existente.cantidad += cantidad;
  else state.pedido.push({ id, cantidad });
  guardarPedido();
  renderPedido();
}

function quitarDelPedido(id){
  state.pedido = state.pedido.filter(i=>i.id !== id);
  guardarPedido();
  renderPedido();
}

function cambiarCantidadPedido(id, delta){
  const item = state.pedido.find(i=>i.id === id);
  if(!item) return;
  item.cantidad += delta;
  if(item.cantidad <= 0) return quitarDelPedido(id);
  guardarPedido();
  renderPedido();
}

function totalUnidadesPedido(){
  return state.pedido.reduce((acc,i)=>acc + i.cantidad, 0);
}

function renderPedido(){
  document.getElementById("order-badge").textContent = totalUnidadesPedido();
  document.getElementById("order-count-title").textContent = `Mi pedido (${state.pedido.length} producto${state.pedido.length===1?"":"s"})`;

  const cont = document.getElementById("order-items");
  const footer = document.getElementById("order-footer");

  if(state.pedido.length === 0){
    cont.innerHTML = `<div class="order-empty">Todavía no agregaste productos.<br>Explorá el catálogo y armá tu consulta.</div>`;
    footer.style.display = "none";
    return;
  }
  footer.style.display = "flex";

  cont.innerHTML = state.pedido.map(item=>{
    const p = PRODUCTOS.find(x=>x.id === item.id);
    if(!p) return "";
    return `
      <div class="order-item">
        <img src="${p.img}" alt="${p.nombre}">
        <div class="order-item-info">
          <div class="name">${p.nombre}</div>
          <div class="price">${formatoPrecio(p.precio)} c/u</div>
          <button class="order-remove" data-remove="${p.id}">Eliminar</button>
        </div>
        <div class="order-item-qty">
          <button data-dec="${p.id}">−</button>
          <span>${item.cantidad}</span>
          <button data-inc="${p.id}">+</button>
        </div>
      </div>
    `;
  }).join("");

  cont.querySelectorAll("[data-inc]").forEach(b=>b.addEventListener("click", ()=>cambiarCantidadPedido(Number(b.dataset.inc), 1)));
  cont.querySelectorAll("[data-dec]").forEach(b=>b.addEventListener("click", ()=>cambiarCantidadPedido(Number(b.dataset.dec), -1)));
  cont.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click", ()=>quitarDelPedido(Number(b.dataset.remove))));

  const totalUnidades = totalUnidadesPedido();
  document.getElementById("order-total-unidades").textContent = totalUnidades;
}

function initPanelPedido(){
  document.getElementById("open-order").addEventListener("click", ()=>{
    document.getElementById("order-panel").classList.add("open");
    document.getElementById("order-overlay").classList.add("open");
  });
  const cerrar = ()=>{
    document.getElementById("order-panel").classList.remove("open");
    document.getElementById("order-overlay").classList.remove("open");
  };
  document.getElementById("close-order").addEventListener("click", cerrar);
  document.getElementById("order-overlay").addEventListener("click", cerrar);

  document.getElementById("order-whatsapp").addEventListener("click", ()=>{
    if(state.pedido.length === 0) return;
    const lineas = state.pedido.map(item=>{
      const p = PRODUCTOS.find(x=>x.id === item.id);
      return `• ${p.nombre} × ${item.cantidad}`;
    });
    const mensaje = `Hola, quisiera consultar por los siguientes productos:\n${lineas.join("\n")}\n¿Me podrían informar disponibilidad y precios?`;
    abrirWhatsapp(mensaje);
  });
}

/* ---------------------------- Toast ---------------------------- */

let toastTimer = null;
function mostrarToast(texto){
  const toast = document.getElementById("toast");
  toast.querySelector(".msg").textContent = texto;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove("show"), 2200);
}

/* ---------------------------- Navegación mobile ---------------------------- */

function initNav(){
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  toggle.addEventListener("click", ()=> nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click", ()=> nav.classList.remove("open")));
}

/* ---------------------------- Contacto ---------------------------- */

function initContacto(){
  document.getElementById("contacto-whatsapp").addEventListener("click", ()=>{
    abrirWhatsapp("Hola, me gustaría hacer una consulta a LN Distribuidora.");
  });
}

/* ---------------------------- Init ---------------------------- */

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("whatsapp-numero-visible").textContent = "+54 9 11 1234 5678";
  renderCategorias();
  renderFiltros();
  renderCatalogo();
  renderPedido();
  initModal();
  initPanelPedido();
  initNav();
  initContacto();
});
