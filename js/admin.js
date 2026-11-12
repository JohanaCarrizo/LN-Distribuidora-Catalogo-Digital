let adminProductos = JSON.parse(JSON.stringify(PRODUCTOS));
let productoEnEdicion = null;

function nombreCategoriaAdmin(id){
  return CATEGORIAS.find(c=>c.id === id)?.nombre || id;
}

/* ---------------------------- Login (demo) ---------------------------- */

function initLogin(){
  document.getElementById("login-form").addEventListener("submit", (e)=>{
    e.preventDefault();
    // Demo: cualquier usuario/clave ingresa. En producción esto sería una
    // autenticación real
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-shell").classList.add("active");
    renderDashboard();
    renderTablaProductos();
    renderCategoriasAdmin();
  });

  document.querySelectorAll(".logout").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.getElementById("admin-shell").classList.remove("active");
      document.getElementById("login-screen").style.display = "flex";
      document.getElementById("login-form").reset();
    });
  });
}

/* ---------------------------- Navegación entre vistas ---------------------------- */

function initSidebarNav(){
  document.querySelectorAll("[data-view]").forEach(link=>{
    link.addEventListener("click", (e)=>{
      e.preventDefault();
      document.querySelectorAll("[data-view]").forEach(l=>l.classList.remove("active"));
      link.classList.add("active");
      document.querySelectorAll(".admin-view").forEach(v=>v.classList.remove("active"));
      document.getElementById(`view-${link.dataset.view}`).classList.add("active");
    });
  });
}

/* ---------------------------- Dashboard ---------------------------- */

function renderDashboard(){
  document.getElementById("metric-total").textContent = adminProductos.length;
  document.getElementById("metric-activos").textContent = adminProductos.filter(p=>p.disponible).length;
  document.getElementById("metric-sinstock").textContent = adminProductos.filter(p=>!p.disponible).length;
  document.getElementById("metric-categorias").textContent = CATEGORIAS.length;
}

/* ---------------------------- Tabla de productos ---------------------------- */

function renderTablaProductos(){
  const tbody = document.getElementById("productos-tbody");
  tbody.innerHTML = adminProductos.map(p=>`
    <tr>
      <td><img src="${p.img}" alt=""></td>
      <td>${p.nombre}</td>
      <td>${nombreCategoriaAdmin(p.categoriaId)}</td>
      <td>${p.marca}</td>
      <td>$${p.precio.toLocaleString("es-AR")}</td>
      <td><span class="status-pill ${p.disponible ? "on":"off"}">${p.disponible ? "Activo":"Desactivado"}</span></td>
      <td>
        <div class="row-actions">
          <button data-edit="${p.id}">Editar</button>
          <button data-toggle="${p.id}">${p.disponible ? "Desactivar":"Activar"}</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click", ()=>abrirFormularioProducto(Number(b.dataset.edit))));
  tbody.querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click", ()=>{
    const p = adminProductos.find(x=>x.id === Number(b.dataset.toggle));
    p.disponible = !p.disponible;
    renderTablaProductos();
    renderDashboard();
  }));
}

/* ---------------------------- Categorías (admin) ---------------------------- */

function renderCategoriasAdmin(){
  const cont = document.getElementById("categorias-admin-list");
  cont.innerHTML = CATEGORIAS.map(c=>`
    <div class="category-admin-row">
      <span>${c.icono} ${c.nombre}</span>
      <span style="color:var(--text-muted); font-size:.82rem;">${adminProductos.filter(p=>p.categoriaId===c.id).length} productos</span>
    </div>
  `).join("");
}

/* ---------------------------- Formulario alta / edición ---------------------------- */

function poblarSelectCategorias(select){
  select.innerHTML = CATEGORIAS.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join("");
}

function abrirFormularioProducto(id){
  productoEnEdicion = id ? adminProductos.find(p=>p.id === id) : null;
  const form = document.getElementById("producto-form");
  form.reset();
  poblarSelectCategorias(form.categoria);

  document.getElementById("form-titulo").textContent = productoEnEdicion ? "Editar producto" : "Agregar producto";

  if(productoEnEdicion){
    form.nombre.value = productoEnEdicion.nombre;
    form.categoria.value = productoEnEdicion.categoriaId;
    form.marca.value = productoEnEdicion.marca;
    form.presentacion.value = productoEnEdicion.presentacion;
    form.precio.value = productoEnEdicion.precio;
    form.disponible.checked = productoEnEdicion.disponible;
    form.descripcion.value = productoEnEdicion.descripcion;
  }

  document.getElementById("producto-modal-overlay").classList.add("open");
}

function cerrarFormularioProducto(){
  document.getElementById("producto-modal-overlay").classList.remove("open");
  productoEnEdicion = null;
}

function initFormularioProducto(){
  document.getElementById("btn-nuevo-producto").addEventListener("click", ()=>abrirFormularioProducto(null));
  document.getElementById("form-cerrar").addEventListener("click", cerrarFormularioProducto);
  document.getElementById("producto-modal-overlay").addEventListener("click", (e)=>{
    if(e.target.id === "producto-modal-overlay") cerrarFormularioProducto();
  });

  document.getElementById("producto-form").addEventListener("submit", (e)=>{
    e.preventDefault();
    const form = e.target;
    const datos = {
      nombre: form.nombre.value.trim(),
      categoriaId: form.categoria.value,
      marca: form.marca.value.trim(),
      presentacion: form.presentacion.value.trim(),
      precio: Number(form.precio.value),
      disponible: form.disponible.checked,
      descripcion: form.descripcion.value.trim(),
    };

    if(productoEnEdicion){
      Object.assign(productoEnEdicion, datos);
    }else{
      const nuevoId = Math.max(...adminProductos.map(p=>p.id)) + 1;
      adminProductos.push({ id: nuevoId, img:"https://placehold.co/500x500/1a1a1a/ff7a1e?text=Nuevo", ...datos });
    }

    renderTablaProductos();
    renderDashboard();
    renderCategoriasAdmin();
    cerrarFormularioProducto();
  });
}

/* ---------------------------- Init ---------------------------- */

document.addEventListener("DOMContentLoaded", ()=>{
  initLogin();
  initSidebarNav();
  initFormularioProducto();
});
