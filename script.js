let datosOriginales = []; // Guarda todas las filas del CSV (sin el encabezado)
let encabezadoGlobal = []; // Guarda la fila de encabezados (nombres de columnas)

// Función principal para leer el archivo seleccionado
function leerArchivo() {
  const input = document.getElementById('fileInput'); // Obtiene el input de archivo
  const archivo = input.files[0]; // Toma el archivo seleccionado

  if (!archivo) return alert("Selecciona un archivo CSV."); // Si no hay archivo, alerta

  const lector = new FileReader(); // Crea un lector para leer el archivo
  lector.onload = function (e) { // Cuando termine de leer el archivo
    const contenido = e.target.result; // Guarda el texto del archivo
    procesarCSV(contenido); // Llama a la función para procesar el CSV
  };
  lector.readAsText(archivo); // Lee el archivo como texto plano
}

// Procesa el contenido CSV y muestra tabla, filtros y gráfico
function procesarCSV(texto) {
  // Limpia cualquier contenido previo en la tabla, filtros y gráfico
  document.getElementById('tablaDatos').innerHTML = "";
  document.getElementById('filtros').innerHTML = "";
  if (window.miGrafico) window.miGrafico.destroy(); // Destruye gráfico anterior si existe

  const filas = texto.trim().split('\n').map(f => f.split(',')); // Separa por filas y columnas
  encabezadoGlobal = filas[0]; // Guarda encabezados (primera fila)
  datosOriginales = filas.slice(1); // Guarda datos (todas las filas excepto la primera)

  mostrarTabla(filtrarDatos(datosOriginales)); // Muestra tabla con datos filtrados
  generarGrafico(datosOriginales); // Genera gráfico de barras
  crearFiltros(); // Crea los inputs de filtros por columna
}

// Crea los inputs para filtrar cada columna
function crearFiltros() {
  const contenedor = document.getElementById('filtros'); // Contenedor de los filtros

  encabezadoGlobal.forEach((columna, i) => {
    const input = document.createElement("input"); // Crea input de texto
    input.placeholder = `Filtrar ${columna}`; // Texto de ayuda en el input
    input.dataset.columna = i; // Guarda el índice de la columna
    input.oninput = () => { // Evento al escribir en el input
      const datosFiltrados = filtrarDatos(datosOriginales); // Aplica filtros
      mostrarTabla(datosFiltrados); // Muestra datos filtrados
      generarGrafico(datosFiltrados); // Actualiza gráfico con datos filtrados
    };
    contenedor.appendChild(input); // Agrega el input al HTML
  });
}

// Aplica los filtros de los inputs a los datos
function filtrarDatos(datos) {
  const inputs = document.querySelectorAll("#filtros input"); // Todos los inputs de filtros
  return datos.filter(fila => { // Devuelve solo las filas que cumplen todos los filtros
    return Array.from(inputs).every(input => {
      const valor = input.value.toLowerCase(); // Texto a buscar (minúsculas)
      const index = parseInt(input.dataset.columna); // Índice de la columna
      return fila[index].toLowerCase().includes(valor); // Compara con la celda
    });
  });
}

// Muestra la tabla HTML con los datos
function mostrarTabla(datos) {
  const tabla = document.getElementById('tablaDatos');
  tabla.innerHTML = "";

  const thead = document.createElement('thead'); // Crea cabecera de la tabla
  const filaEncabezado = document.createElement('tr');

  encabezadoGlobal.forEach((columna, index) => {
    const th = document.createElement('th');
    th.textContent = columna; // Muestra nombre de la columna
    th.style.cursor = "pointer"; // Cursor de clic
    th.onclick = () => ordenarTablaPor(index); // Ordenar al hacer clic
    filaEncabezado.appendChild(th); // Agrega la celda de cabecera
  });
  thead.appendChild(filaEncabezado);
  tabla.appendChild(thead); // Agrega cabecera a la tabla

  const tbody = document.createElement('tbody');
  datos.forEach(fila => {
    const tr = document.createElement('tr');
    fila.forEach(d => {
      const td = document.createElement('td');
      td.textContent = d; // Llena la celda con el dato
      tr.appendChild(td);
    });
    tbody.appendChild(tr); // Agrega fila a la tabla
  });
  tabla.appendChild(tbody);

  mostrarTotales(datos); // Agrega una fila con totales al final
}

// Ordena los datos por una columna específica (clic en el encabezado)
function ordenarTablaPor(index) {
  const datosOrdenados = [...datosOriginales]; // Copia de los datos originales
  const esNumerico = !isNaN(parseFloat(datosOriginales[0][index])); // Verifica si la columna es numérica

  datosOrdenados.sort((a, b) => {
    if (esNumerico) {
      return parseFloat(a[index]) - parseFloat(b[index]); // Orden numérico
    } else {
      return a[index].localeCompare(b[index]); // Orden alfabético
    }
  });

  datosOriginales = datosOrdenados; // Guarda la nueva versión ordenada
  const filtrados = filtrarDatos(datosOrdenados); // Aplica filtros
  mostrarTabla(filtrados); // Muestra tabla ordenada y filtrada
  generarGrafico(filtrados); // Actualiza gráfico
}

// Muestra los totales por columna numérica
function mostrarTotales(datos) {
  const pie = document.createElement("tfoot");
  const filaTotales = document.createElement("tr");

  encabezadoGlobal.forEach((col, i) => {
    const valores = datos.map(fila => fila[i]); // Toma todos los valores de la columna
    const esNumerico = valores.every(v => !isNaN(v)); // Verifica si todos son números
    const td = document.createElement("td");

    if (esNumerico) {
      const suma = valores.reduce((acc, val) => acc + parseFloat(val), 0); // Suma total
      td.textContent = `Σ ${suma.toFixed(2)}`; // Muestra total con 2 decimales
    } else {
      td.textContent = ""; // Vacío si no es numérico
    }

    filaTotales.appendChild(td); // Agrega celda de total
  });

  pie.appendChild(filaTotales); // Agrega fila al pie de la tabla
  document.getElementById("tablaDatos").appendChild(pie); // Muestra pie
}

// Genera un gráfico de barras con los datos
function generarGrafico(datos) {
  const totalIndex = encabezadoGlobal.findIndex(col => col.toLowerCase().includes("total")); // Busca columna "total"
  const categoriaIndex = encabezadoGlobal.findIndex(col => col.toLowerCase().includes("producto") || col.toLowerCase().includes("nombre")); // Busca columna "producto" o "nombre"

  if (categoriaIndex === -1 || totalIndex === -1) return; // Si no encuentra las columnas, sale

  const etiquetas = datos.map(f => f[categoriaIndex]); // Etiquetas del gráfico (productos o nombres)
  const valores = datos.map(f => parseFloat(f[totalIndex])); // Valores del gráfico

  const ctx = document.getElementById("grafico").getContext("2d");
  if (window.miGrafico) window.miGrafico.destroy(); // Elimina gráfico anterior

  // Crea nuevo gráfico de barras con Chart.js
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

// Descarga los datos actuales de la tabla como CSV
function descargarCSV() {
  const tabla = document.querySelector("#tablaDatos tbody");
  if (!tabla) return alert("No hay datos para descargar."); // Si no hay datos, alerta

  // Convierte las filas HTML en arrays de texto
  const filas = Array.from(tabla.querySelectorAll("tr")).map(tr =>
    Array.from(tr.children).map(td => td.textContent)
  );

  // Arma el archivo CSV
  const csv = [encabezadoGlobal, ...filas].map(f => f.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  // Crea un enlace invisible para descargar el archivo
  const a = document.createElement("a");
  a.href = url;
  a.download = "datos_filtrados.csv";
  a.click();
  URL.revokeObjectURL(url); // Limpia la URL temporal
}
