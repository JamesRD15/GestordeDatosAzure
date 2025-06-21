let datosOriginales = [];
let encabezadoGlobal = [];

function leerArchivo() {
  const input = document.getElementById('fileInput');
  const archivo = input.files[0];
  if (!archivo) return alert("Selecciona un archivo CSV.");

  const lector = new FileReader();
  lector.onload = function (e) {
    const contenido = e.target.result;
    procesarCSV(contenido);
  };
  lector.readAsText(archivo);
}

function procesarCSV(texto) {
  // Limpiar todo
  document.getElementById('tablaDatos').innerHTML = "";
  document.getElementById('filtros').innerHTML = "";
  if (window.miGrafico) window.miGrafico.destroy();

  const filas = texto.trim().split('\n').map(f => f.split(','));
  encabezadoGlobal = filas[0];
  datosOriginales = filas.slice(1);
  mostrarTabla(filtrarDatos(datosOriginales));
  generarGrafico(datosOriginales);
  crearFiltros();
}

function crearFiltros() {
  const contenedor = document.getElementById('filtros');

  encabezadoGlobal.forEach((columna, i) => {
    const input = document.createElement("input");
    input.placeholder = `Filtrar ${columna}`;
    input.dataset.columna = i;
    input.oninput = () => {
      const datosFiltrados = filtrarDatos(datosOriginales);
      mostrarTabla(datosFiltrados);
      generarGrafico(datosFiltrados);
    };
    contenedor.appendChild(input);
  });
}

function filtrarDatos(datos) {
  const inputs = document.querySelectorAll("#filtros input");
  return datos.filter(fila => {
    return Array.from(inputs).every(input => {
      const valor = input.value.toLowerCase();
      const index = parseInt(input.dataset.columna);
      return fila[index].toLowerCase().includes(valor);
    });
  });
}

function mostrarTabla(datos) {
  const tabla = document.getElementById('tablaDatos');
  tabla.innerHTML = "";

  const thead = document.createElement('thead');
  const filaEncabezado = document.createElement('tr');

  encabezadoGlobal.forEach((columna, index) => {
    const th = document.createElement('th');
    th.textContent = columna;
    th.style.cursor = "pointer";
    th.onclick = () => ordenarTablaPor(index);
    filaEncabezado.appendChild(th);
  });
  thead.appendChild(filaEncabezado);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  datos.forEach(fila => {
    const tr = document.createElement('tr');
    fila.forEach(d => {
      const td = document.createElement('td');
      td.textContent = d;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);

  mostrarTotales(datos);
}

function ordenarTablaPor(index) {
  const datosOrdenados = [...datosOriginales];
  const esNumerico = !isNaN(parseFloat(datosOriginales[0][index]));
  datosOrdenados.sort((a, b) => {
    if (esNumerico) {
      return parseFloat(a[index]) - parseFloat(b[index]);
    } else {
      return a[index].localeCompare(b[index]);
    }
  });
  datosOriginales = datosOrdenados;
  const filtrados = filtrarDatos(datosOrdenados);
  mostrarTabla(filtrados);
  generarGrafico(filtrados);
}

function mostrarTotales(datos) {
  const pie = document.createElement("tfoot");
  const filaTotales = document.createElement("tr");

  encabezadoGlobal.forEach((col, i) => {
    const valores = datos.map(fila => fila[i]);
    const esNumerico = valores.every(v => !isNaN(v));
    const td = document.createElement("td");
    if (esNumerico) {
      const suma = valores.reduce((acc, val) => acc + parseFloat(val), 0);
      td.textContent = `Σ ${suma.toFixed(2)}`;
    } else {
      td.textContent = "";
    }
    filaTotales.appendChild(td);
  });

  pie.appendChild(filaTotales);
  document.getElementById("tablaDatos").appendChild(pie);
}

function generarGrafico(datos) {
  const totalIndex = encabezadoGlobal.findIndex(col => col.toLowerCase().includes("total"));
  const categoriaIndex = encabezadoGlobal.findIndex(col => col.toLowerCase().includes("producto") || col.toLowerCase().includes("nombre"));

  if (categoriaIndex === -1 || totalIndex === -1) return;

  const etiquetas = datos.map(f => f[categoriaIndex]);
  const valores = datos.map(f => parseFloat(f[totalIndex]));

  const ctx = document.getElementById("grafico").getContext("2d");
  if (window.miGrafico) window.miGrafico.destroy();
  window.miGrafico = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Totales',
        data: valores,
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }]
    }
  });
}

function descargarCSV() {
  const tabla = document.querySelector("#tablaDatos tbody");
  if (!tabla) return alert("No hay datos para descargar.");

  const filas = Array.from(tabla.querySelectorAll("tr")).map(tr =>
    Array.from(tr.children).map(td => td.textContent)
  );

  const csv = [encabezadoGlobal, ...filas].map(f => f.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "datos_filtrados.csv";
  a.click();
  URL.revokeObjectURL(url);
}
