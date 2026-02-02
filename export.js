// Sistema de Exportación e Importación

const ExportManager = {
    // Exportar a PDF usando jsPDF
    async exportarPDF() {
        try {
            // Cargar jsPDF dinámicamente
            if (typeof window.jspdf === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const trabajadores = JSON.parse(localStorage.getItem('trabajadores') || '[]');
            const registros = JSON.parse(localStorage.getItem('registrosHoras') || '[]');
            const mesSelect = document.getElementById('mesSelect');
            const anioSelect = document.getElementById('anioSelect');
            const mes = mesSelect.value === '' ? null : parseInt(mesSelect.value);
            const anio = anioSelect.value === '' ? null : parseInt(anioSelect.value);
            
            // Título
            doc.setFontSize(18);
            doc.text('Reporte de Trabajadores Agrícolas', 14, 20);
            
            let y = 30;
            doc.setFontSize(12);
            
            // Resumen
            let totalHoras = 0;
            let totalSueldo = 0;
            
            trabajadores.forEach((trabajador, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                const registrosTrabajador = registros.filter(r => {
                    if (r.trabajadorId !== trabajador.id) return false;
                    if (mes !== null && anio !== null) {
                        const fecha = new Date(r.fecha);
                        return fecha.getMonth() === mes && fecha.getFullYear() === anio;
                    }
                    if (anio !== null) {
                        const fecha = new Date(r.fecha);
                        return fecha.getFullYear() === anio;
                    }
                    return true;
                });
                
                const horas = registrosTrabajador.reduce((sum, r) => sum + r.horas, 0);
                const sueldo = horas * trabajador.salarioHora;
                totalHoras += horas;
                totalSueldo += sueldo;
                
                doc.setFontSize(14);
                doc.text(`${index + 1}. ${trabajador.nombre}`, 14, y);
                y += 8;
                doc.setFontSize(10);
                doc.text(`Cédula: ${trabajador.cedula}`, 20, y);
                y += 6;
                doc.text(`Horas: ${horas.toFixed(1)} | Sueldo: $${sueldo.toFixed(2)}`, 20, y);
                y += 10;
            });
            
            // Total
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(12);
            doc.text('─'.repeat(50), 14, y);
            y += 8;
            doc.setFontSize(14);
            doc.text(`Total Horas: ${totalHoras.toFixed(1)}`, 14, y);
            y += 8;
            doc.text(`Total Sueldo: $${totalSueldo.toFixed(2)}`, 14, y);
            
            // Guardar
            doc.save(`reporte_trabajadores_${new Date().toISOString().split('T')[0]}.pdf`);
            Modal.alert('Reporte PDF generado exitosamente', 'success');
        } catch (error) {
            Modal.alert('Error al exportar a PDF: ' + error.message, 'error');
        }
    },
    
    // Mostrar modal de importación
    mostrarImportar() {
        const contenido = `
            <p>Seleccione un archivo JSON para importar:</p>
            <input type="file" id="archivoImportar" accept=".json" class="form-control" style="margin-top: 10px;">
            <small class="form-help">Los datos importados reemplazarán los datos actuales. Se recomienda hacer un backup primero.</small>
            <div id="vistaPreviaImport" style="margin-top: 15px; display: none;">
                <h5>Vista Previa:</h5>
                <div id="contenidoVistaPrevia" style="max-height: 300px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 5px;"></div>
            </div>
        `;
        const botones = `
            <button class="btn btn-primary" id="btnImportarConfirm" onclick="ExportManager.importarDatos()" disabled>Importar</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        `;
        
        const modal = Modal.mostrar('Importar Datos', contenido, { botones });
        
        // Vista previa cuando se seleccione archivo
        document.getElementById('archivoImportar').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                ExportManager.mostrarVistaPrevia(e.target.files[0]);
            }
        });
    },
    
    // Mostrar vista previa de importación
    mostrarVistaPrevia(archivo) {
        const extension = archivo.name.split('.').pop().toLowerCase();
        const vistaPrevia = document.getElementById('vistaPreviaImport');
        const contenido = document.getElementById('contenidoVistaPrevia');
        const btnImportar = document.getElementById('btnImportarConfirm');
        
        vistaPrevia.style.display = 'block';
        contenido.innerHTML = '<div class="loading"></div> Cargando vista previa...';
        
        if (extension === 'json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const datos = JSON.parse(e.target.result);
                    let html = '<strong>Archivo JSON detectado</strong><br>';
                    if (datos.trabajadores) {
                        html += `Trabajadores: ${datos.trabajadores.length}<br>`;
                    }
                    if (datos.registrosHoras) {
                        html += `Registros: ${datos.registrosHoras.length}<br>`;
                    }
                    if (datos.fecha) {
                        html += `Fecha backup: ${Utils.formatearFecha(datos.fecha)}<br>`;
                    }
                    contenido.innerHTML = html;
                    btnImportar.disabled = false;
                } catch (error) {
                    contenido.innerHTML = `<span style="color: red;">Error al leer archivo: ${error.message}</span>`;
                    btnImportar.disabled = true;
                }
            };
            reader.readAsText(archivo);
        } else {
            contenido.innerHTML = '<span style="color: red;">Solo se admiten archivos JSON para importar.</span>';
            btnImportar.disabled = true;
        }
    },
    
    // Importar datos
    importarDatos() {
        const input = document.getElementById('archivoImportar');
        if (!input || !input.files.length) {
            Modal.alert('Por favor seleccione un archivo', 'warning');
            return;
        }
        
        const archivo = input.files[0];
        const extension = archivo.name.split('.').pop().toLowerCase();
        
        if (extension === 'json') {
            Utils.importarJSON(archivo, (error, datos) => {
                if (error) {
                    Modal.alert('Error al importar: ' + error.message, 'error');
                    return;
                }
                
                if (datos.trabajadores && datos.registrosHoras) {
                    localStorage.setItem('trabajadores', JSON.stringify(datos.trabajadores));
                    localStorage.setItem('registrosHoras', JSON.stringify(datos.registrosHoras));
                    Modal.alert('Datos importados exitosamente', 'success');
                    if (typeof AppGestion !== 'undefined') {
                        AppGestion.cargarDatos();
                    }
                } else {
                    Modal.alert('Formato de archivo inválido', 'error');
                }
            });
        } else {
            Modal.alert('Formato no soportado. Use archivos JSON.', 'warning');
        }
    }
};
