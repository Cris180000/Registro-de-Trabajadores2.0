// Configuración de Gráficos con Chart.js

const ChartsManager = {
    chartHoras: null,
    chartSueldos: null,
    
    chartPie: null,
    
    inicializar() {
        this.crearGraficoHoras();
        this.crearGraficoSueldos();
        this.crearGraficoCircular();
    },
    
    crearGraficoHoras() {
        const ctx = document.getElementById('chartHoras');
        if (!ctx) return;
        
        const registros = JSON.parse(localStorage.getItem('registrosHoras') || '[]');
        const trabajadores = JSON.parse(localStorage.getItem('trabajadores') || '[]');
        
        // Agrupar por mes
        const datosPorMes = {};
        const hoy = new Date();
        const ultimos6Meses = [];
        
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            ultimos6Meses.push({
                clave,
                label: Utils.obtenerNombreMes(fecha.getMonth()) + ' ' + fecha.getFullYear()
            });
            datosPorMes[clave] = 0;
        }
        
        registros.forEach(r => {
            const fecha = new Date(r.fecha);
            const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            if (datosPorMes[clave] !== undefined) {
                datosPorMes[clave] += r.horas;
            }
        });
        
        const labels = ultimos6Meses.map(m => m.label);
        const datos = ultimos6Meses.map(m => datosPorMes[m.clave] || 0);
        
        if (this.chartHoras) {
            this.chartHoras.destroy();
        }
        
        this.chartHoras = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Horas Trabajadas',
                    data: datos,
                    backgroundColor: 'rgba(74, 124, 42, 0.7)',
                    borderColor: 'rgba(74, 124, 42, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Horas Trabajadas por Mes (Últimos 6 meses)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },
    
    crearGraficoSueldos() {
        const ctx = document.getElementById('chartSueldos');
        if (!ctx) return;
        
        const registros = JSON.parse(localStorage.getItem('registrosHoras') || '[]');
        const trabajadores = JSON.parse(localStorage.getItem('trabajadores') || '[]');
        
        // Agrupar por mes
        const datosPorMes = {};
        const hoy = new Date();
        const ultimos6Meses = [];
        
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            ultimos6Meses.push({
                clave,
                label: Utils.obtenerNombreMes(fecha.getMonth()) + ' ' + fecha.getFullYear()
            });
            datosPorMes[clave] = 0;
        }
        
        registros.forEach(r => {
            const trabajador = trabajadores.find(t => t.id === r.trabajadorId);
            if (trabajador) {
                const fecha = new Date(r.fecha);
                const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
                if (datosPorMes[clave] !== undefined) {
                    datosPorMes[clave] += r.horas * trabajador.salarioHora;
                }
            }
        });
        
        const labels = ultimos6Meses.map(m => m.label);
        const datos = ultimos6Meses.map(m => datosPorMes[m.clave] || 0);
        
        if (this.chartSueldos) {
            this.chartSueldos.destroy();
        }
        
        this.chartSueldos = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sueldos ($)',
                    data: datos,
                    backgroundColor: 'rgba(107, 159, 61, 0.2)',
                    borderColor: 'rgba(107, 159, 61, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Evolución de Sueldos (Últimos 6 meses)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    },
    
    crearGraficoCircular() {
        // Buscar contenedor para el gráfico circular
        const container = document.querySelector('.charts-container');
        if (!container) return;
        
        // Crear wrapper si no existe
        let wrapper = document.getElementById('chartPieWrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'chartPieWrapper';
            wrapper.className = 'chart-wrapper';
            container.appendChild(wrapper);
            
            const canvas = document.createElement('canvas');
            canvas.id = 'chartPie';
            wrapper.appendChild(canvas);
        }
        
        const ctx = document.getElementById('chartPie');
        if (!ctx) return;
        
        const trabajadores = JSON.parse(localStorage.getItem('trabajadores') || '[]');
        const registros = JSON.parse(localStorage.getItem('registrosHoras') || '[]');
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        
        // Calcular sueldos por trabajador del mes actual
        const sueldosPorTrabajador = trabajadores.map(t => {
            const registrosMes = registros.filter(r => {
                const fecha = new Date(r.fecha);
                return r.trabajadorId === t.id && 
                       fecha.getMonth() === mesActual && 
                       fecha.getFullYear() === anioActual;
            });
            const horas = registrosMes.reduce((sum, r) => sum + r.horas, 0);
            return {
                nombre: t.nombre,
                sueldo: horas * t.salarioHora
            };
        }).filter(t => t.sueldo > 0);
        
        if (sueldosPorTrabajador.length === 0) {
            if (this.chartPie) {
                this.chartPie.destroy();
                this.chartPie = null;
            }
            wrapper.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">No hay datos para mostrar</p>';
            return;
        }
        
        const labels = sueldosPorTrabajador.map(t => t.nombre);
        const datos = sueldosPorTrabajador.map(t => t.sueldo);
        
        // Colores para el gráfico
        const colores = [
            'rgba(45, 80, 22, 0.8)',
            'rgba(74, 124, 42, 0.8)',
            'rgba(107, 159, 61, 0.8)',
            'rgba(139, 195, 74, 0.8)',
            'rgba(165, 214, 167, 0.8)',
            'rgba(192, 233, 194, 0.8)'
        ];
        
        if (this.chartPie) {
            this.chartPie.destroy();
        }
        
        this.chartPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: datos,
                    backgroundColor: colores.slice(0, labels.length),
                    borderColor: colores.map(c => c.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Sueldos (Mes Actual)',
                        font: {
                            size: 14
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    actualizar() {
        this.crearGraficoHoras();
        this.crearGraficoSueldos();
        this.crearGraficoCircular();
    }
};
