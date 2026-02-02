// Utilidades y Helpers

const Utils = {
    // Formatear fecha a formato legible
    formatearFecha(fecha, incluirHora = false) {
        const fechaObj = new Date(fecha);
        const opciones = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        if (incluirHora) {
            opciones.hour = '2-digit';
            opciones.minute = '2-digit';
        }
        
        return fechaObj.toLocaleDateString('es-ES', opciones);
    },
    
    // Formatear moneda
    formatearMoneda(cantidad) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(cantidad);
    },
    
    // Formatear número con decimales
    formatearNumero(numero, decimales = 2) {
        return parseFloat(numero).toFixed(decimales);
    },
    
    // Obtener nombre del mes
    obtenerNombreMes(mes) {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[mes] || '';
    },
    
    // Obtener primer y último día del mes
    obtenerRangoMes(mes, anio) {
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        return { primerDia, ultimoDia };
    },
    
    // Debounce para optimizar búsquedas
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Exportar datos a JSON
    exportarJSON(datos, nombreArchivo) {
        const json = JSON.stringify(datos, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Importar datos desde JSON
    importarJSON(archivo, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const datos = JSON.parse(e.target.result);
                callback(null, datos);
            } catch (error) {
                callback(error, null);
            }
        };
        reader.readAsText(archivo);
    },
    
    // Generar ID único
    generarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Copiar al portapapeles
    copiarAlPortapapeles(texto) {
        navigator.clipboard.writeText(texto).then(() => {
            return true;
        }).catch(() => {
            // Fallback para navegadores antiguos
            const textarea = document.createElement('textarea');
            textarea.value = texto;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        });
    },
    
    // Obtener fecha actual en formato YYYY-MM-DD
    obtenerFechaActual() {
        const hoy = new Date();
        return hoy.toISOString().split('T')[0];
    },
    
    // Calcular días entre dos fechas
    calcularDiasEntre(fecha1, fecha2) {
        const unDia = 24 * 60 * 60 * 1000;
        return Math.round((new Date(fecha2) - new Date(fecha1)) / unDia);
    }
};
