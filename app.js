// Gestión de Trabajadores Agrícolas - Aplicación Principal Refactorizada

const AppGestion = {
    // Estructura de datos
    trabajadores: [],
    registrosHoras: [],
    /** Pagos realizados al trabajador: restan del total devengado por horas. { id, trabajadorId, fecha, monto, metodo, nota?, fechaRegistro } */
    pagosTrabajadores: [],
    vistaActual: 'grid',
    trabajadoresFiltrados: [],
    ordenActual: 'nombre',
    direccionOrden: 'asc',
    paginaActual: 1,
    itemsPorPagina: 12,
    vistaCalendario: false,
    tiposTrabajo: ['Aceitunas', 'Espárragos', 'Tomates', 'Pimientos', 'Fresas', 'Lechuga', 'Cebolla', 'Ajo'],
    historialCambios: [],
    
    // Inicialización
    init() {
        this.cargarDatos();
        this.cargarConfiguracion();
        this.configurarEventListeners();
        this.configurarFechaMaxima();
        this.actualizarSelectTiposTrabajo();
        this.actualizarDashboard();
        if (typeof ChartsManager !== 'undefined') {
            ChartsManager.inicializar();
        }
        this.cargarTema();
        this.inicializarRecordatorios();
    },
    
    // Cargar datos del localStorage
    cargarDatos() {
        const trabajadoresGuardados = localStorage.getItem('trabajadores');
        const registrosGuardados = localStorage.getItem('registrosHoras');
        const tiposTrabajoGuardados = localStorage.getItem('tiposTrabajo');
        const historialGuardado = localStorage.getItem('historialCambios');
        const pagosGuardados = localStorage.getItem('pagosTrabajadores');
        
        if (trabajadoresGuardados) {
            try {
                this.trabajadores = JSON.parse(trabajadoresGuardados);
                // Migración: asegurar que todos los trabajadores tengan tarifaHora
                this.trabajadores = this.trabajadores.map(t => {
                    if (!t.tarifaHora) {
                        t.tarifaHora = 0;
                    }
                    return t;
                });
            } catch (e) {
                console.error('Error al cargar trabajadores:', e);
                this.trabajadores = [];
            }
        }
        
        if (registrosGuardados) {
            try {
                this.registrosHoras = JSON.parse(registrosGuardados);
                // Migración: convertir registros antiguos a la nueva estructura
                this.registrosHoras = this.registrosHoras.map(r => {
                    if (r.salarioHora && !r.tarifaHora) {
                        // Registro antiguo - migrar a nueva estructura
                        return {
                            id: r.id,
                            trabajadorId: r.trabajadorId,
                            fecha: r.fecha,
                            horas: r.horas || 0,
                            tarifaHora: r.salarioHora,
                            sueldoTotal: (r.horas || 0) * r.salarioHora,
                            fechaRegistro: r.fechaRegistro || new Date().toISOString()
                        };
                    }
                    return r;
                });
            } catch (e) {
                console.error('Error al cargar registros:', e);
                this.registrosHoras = [];
            }
        }

        if (tiposTrabajoGuardados) {
            try {
                this.tiposTrabajo = JSON.parse(tiposTrabajoGuardados);
            } catch (e) {
                console.error('Error al cargar tipos de trabajo:', e);
                this.tiposTrabajo = ['Aceitunas', 'Espárragos', 'Tomates', 'Pimientos', 'Fresas', 'Lechuga', 'Cebolla', 'Ajo'];
            }
        } else {
            // Si no hay tipos guardados, usar los por defecto
            this.tiposTrabajo = ['Aceitunas', 'Espárragos', 'Tomates', 'Pimientos', 'Fresas', 'Lechuga', 'Cebolla', 'Ajo'];
        }
        
        if (historialGuardado) {
            try {
                this.historialCambios = JSON.parse(historialGuardado);
            } catch (e) {
                console.error('Error al cargar historial:', e);
                this.historialCambios = [];
            }
        }

        if (pagosGuardados) {
            try {
                this.pagosTrabajadores = JSON.parse(pagosGuardados);
                if (!Array.isArray(this.pagosTrabajadores)) this.pagosTrabajadores = [];
            } catch (e) {
                console.error('Error al cargar pagos:', e);
                this.pagosTrabajadores = [];
            }
        } else {
            this.pagosTrabajadores = [];
        }
        
        this.trabajadoresFiltrados = [...this.trabajadores];
        this.actualizarInterfaz();
    },
    
    // Cargar configuración
    cargarConfiguracion() {
        const config = localStorage.getItem('configuracion');
        if (config) {
            const configObj = JSON.parse(config);
            if (configObj.recordatorioDiario !== undefined) {
                document.getElementById('recordatorioDiario').checked = configObj.recordatorioDiario;
            }
            if (configObj.alertasSinRegistro !== undefined) {
                document.getElementById('alertasSinRegistro').checked = configObj.alertasSinRegistro;
            }
            if (configObj.diasAlerta !== undefined) {
                document.getElementById('diasAlerta').value = configObj.diasAlerta;
            }
        }
    },
    
    // Guardar datos en localStorage
    guardarDatos() {
        localStorage.setItem('trabajadores', JSON.stringify(this.trabajadores));
        localStorage.setItem('registrosHoras', JSON.stringify(this.registrosHoras));
        localStorage.setItem('pagosTrabajadores', JSON.stringify(this.pagosTrabajadores));
        localStorage.setItem('tiposTrabajo', JSON.stringify(this.tiposTrabajo));
        localStorage.setItem('historialCambios', JSON.stringify(this.historialCambios));
        this.crearBackupAutomatico();
    },
    
    // Guardar configuración
    guardarConfiguracion() {
        const config = {
            recordatorioDiario: document.getElementById('recordatorioDiario').checked,
            alertasSinRegistro: document.getElementById('alertasSinRegistro').checked,
            diasAlerta: parseInt(document.getElementById('diasAlerta').value) || 7
        };
        localStorage.setItem('configuracion', JSON.stringify(config));
    },
    
    // Configurar event listeners
    configurarEventListeners() {
        // Formulario de trabajador
        const formTrabajador = document.getElementById('formTrabajador');
        if (formTrabajador) {
            formTrabajador.addEventListener('submit', (e) => {
                e.preventDefault();
                this.agregarTrabajador();
            });
        } else {
            console.error('Formulario de trabajador no encontrado');
        }
        
        // Formulario de registro de horas
        document.getElementById('formRegistroHoras').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarHoras();
        });
        
        // Búsqueda
        const buscarInput = document.getElementById('buscarTrabajador');
        if (buscarInput) {
            buscarInput.addEventListener('input', Utils.debounce(() => {
                this.buscarTrabajadores();
            }, 300));
        }
        
        // Búsqueda en registros
        const buscarRegistrosInput = document.getElementById('buscarRegistros');
        if (buscarRegistrosInput) {
            buscarRegistrosInput.addEventListener('input', Utils.debounce(() => {
                this.buscarRegistros();
            }, 300));
        }
        
        // Filtro por estado
        const filtroEstado = document.getElementById('filtroEstado');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', () => {
                this.buscarTrabajadores();
            });
        }
        
        // Filtros de fecha en resumen
        const fechaDesde = document.getElementById('fechaDesde');
        const fechaHasta = document.getElementById('fechaHasta');
        if (fechaDesde) {
            fechaDesde.addEventListener('change', () => {
                this.mostrarResumenSueldos();
            });
        }
        if (fechaHasta) {
            fechaHasta.addEventListener('change', () => {
                this.mostrarResumenSueldos();
            });
        }
        
        // Ordenamiento
        const ordenSelect = document.getElementById('ordenarTrabajadores');
        if (ordenSelect) {
            ordenSelect.addEventListener('change', (e) => {
                this.ordenarTrabajadores(e.target.value);
            });
        }
        
        // Filtro por tipo de trabajo
        const filtroTrabajo = document.getElementById('filtroTrabajo');
        if (filtroTrabajo) {
            filtroTrabajo.addEventListener('change', () => {
                this.filtrarPorTrabajo();
            });
        }
        
        // Filtros de resumen
        document.getElementById('mesSelect').addEventListener('change', () => {
            this.mostrarResumenSueldos();
            this.actualizarDashboard();
        });
        document.getElementById('anioSelect').addEventListener('change', () => {
            this.mostrarResumenSueldos();
            this.actualizarDashboard();
        });
        const trabajadorFiltro = document.getElementById('trabajadorFiltro');
        if (trabajadorFiltro) {
            trabajadorFiltro.addEventListener('change', () => {
                this.mostrarResumenSueldos();
            });
        }
        const trabajoFiltroResumen = document.getElementById('trabajoFiltroResumen');
        if (trabajoFiltroResumen) {
            trabajoFiltroResumen.addEventListener('change', () => {
                this.mostrarResumenSueldos();
            });
        }
        
        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'n') {
                    e.preventDefault();
                    document.getElementById('nombre').focus();
                } else if (e.key === 's') {
                    e.preventDefault();
                    const form = document.querySelector('form');
                    if (form && !form.querySelector(':invalid')) {
                        form.requestSubmit();
                    }
                } else if (e.key === 'f') {
                    e.preventDefault();
                    document.getElementById('buscarTrabajador')?.focus();
                } else if (e.key === 'e') {
                    e.preventDefault();
                    AppGestion.mostrarBackup();
                } else if (e.key === 'r') {
                    e.preventDefault();
                    const anio = new Date().getFullYear();
                    AppGestion.generarReporteAnual(anio);
                }
            } else if (e.key === 'Escape') {
                document.querySelector('.modal-overlay')?.remove();
            }
        });
    },
    
        // Configurar fecha máxima (hoy)
    configurarFechaMaxima() {
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) {
            fechaInput.max = Utils.obtenerFechaActual();
            fechaInput.valueAsDate = new Date();
        }
        
        const fechaContratacion = document.getElementById('fechaContratacion');
        if (fechaContratacion) {
            fechaContratacion.max = Utils.obtenerFechaActual();
            fechaContratacion.valueAsDate = new Date();
        }
        
        // Configurar mostrar/ocultar campo "Otro" para tipo de trabajo
        const tipoTrabajo = document.getElementById('tipoTrabajo');
        const tipoTrabajoOtro = document.getElementById('tipoTrabajoOtro');
        if (tipoTrabajo && tipoTrabajoOtro) {
            tipoTrabajo.addEventListener('change', (e) => {
                tipoTrabajoOtro.style.display = e.target.value === 'Otro' ? 'block' : 'none';
                if (e.target.value !== 'Otro') {
                    tipoTrabajoOtro.value = '';
                }
            });
        }
        
        const trabajoRegistro = document.getElementById('trabajoRegistro');
        const trabajoRegistroOtro = document.getElementById('trabajoRegistroOtro');
        if (trabajoRegistro && trabajoRegistroOtro) {
            trabajoRegistro.addEventListener('change', (e) => {
                trabajoRegistroOtro.style.display = e.target.value === 'Otro' ? 'block' : 'none';
                if (e.target.value !== 'Otro') {
                    trabajoRegistroOtro.value = '';
                }
            });
        }
    },
    
    // Agregar nuevo trabajador
    agregarTrabajador() {
        try {
            const nombre = document.getElementById('nombre')?.value.trim();
            const telefono = document.getElementById('telefono')?.value.trim() || '';
            const fechaContratacion = document.getElementById('fechaContratacion')?.value || '';
            const tipoTrabajo = document.getElementById('tipoTrabajo')?.value;
            const tipoTrabajoOtro = document.getElementById('tipoTrabajoOtro')?.value.trim() || '';
            const tarifaHora = document.getElementById('tarifaHora')?.value;
            const estado = document.getElementById('estado')?.value || 'activo';
            
            // Validaciones básicas
            if (!nombre) {
                Modal.alert('Por favor ingrese el nombre del trabajador', 'error');
                return;
            }

            if (!fechaContratacion) {
                Modal.alert('Por favor indique la fecha de contratación', 'error');
                return;
            }

            const valFechaContratacion = Validaciones.validarFecha(fechaContratacion);
            if (!valFechaContratacion.valido) {
                Modal.alert(valFechaContratacion.mensaje, 'error');
                return;
            }
            
            // Validaciones
            const valNombre = Validaciones.validarNombre(nombre);
            if (!valNombre.valido) {
                Modal.alert(valNombre.mensaje, 'error');
                return;
            }
            
            if (!tipoTrabajo) {
                Modal.alert('Por favor seleccione un tipo de trabajo', 'error');
                return;
            }

            const trabajoFinal = tipoTrabajo === 'Otro' ? tipoTrabajoOtro : tipoTrabajo;
            if (tipoTrabajo === 'Otro' && !tipoTrabajoOtro) {
                Modal.alert('Por favor especifique el tipo de trabajo', 'error');
                return;
            }

            if (!tarifaHora || parseFloat(tarifaHora) <= 0) {
                Modal.alert('Por favor ingrese una tarifa horaria válida mayor que 0', 'error');
                return;
            }

            const trabajador = {
                id: Utils.generarId(),
                nombre: nombre,
                cedula: '',
                numeroSeguridadSocial: '',
                telefono: telefono || '',
                email: '',
                direccion: '',
                fechaNacimiento: '',
                fechaContratacion: fechaContratacion,
                tipoTrabajo: trabajoFinal,
                tarifaHora: parseFloat(tarifaHora),
                estado: estado || 'activo',
                notas: '',
                fechaRegistro: new Date().toISOString()
            };
            
            this.trabajadores.push(trabajador);
            this.registrarCambio('trabajador', 'crear', trabajador.id, `Trabajador ${nombre} creado`);
            this.guardarDatos();
            this.trabajadoresFiltrados = [...this.trabajadores];
            this.actualizarInterfaz();
            
            const formTrabajador = document.getElementById('formTrabajador');
            if (formTrabajador) {
                formTrabajador.reset();
            }
            const tipoTrabajoOtroEl = document.getElementById('tipoTrabajoOtro');
            if (tipoTrabajoOtroEl) {
                tipoTrabajoOtroEl.style.display = 'none';
            }
            const fechaContratacionEl = document.getElementById('fechaContratacion');
            if (fechaContratacionEl) {
                fechaContratacionEl.max = Utils.obtenerFechaActual();
                fechaContratacionEl.valueAsDate = new Date();
            }
            Modal.alert('Trabajador agregado exitosamente', 'success');
        } catch (error) {
            console.error('Error al agregar trabajador:', error);
            Modal.alert('Error al agregar trabajador: ' + error.message, 'error');
        }
    },
    
    // Editar trabajador
    editarTrabajador(id) {
        const trabajador = this.trabajadores.find(t => t.id === id);
        if (!trabajador) return;
        
        const trabajoActual = trabajador.tipoTrabajo || '';
        const esOtro = !this.tiposTrabajo.includes(trabajoActual);
        
        const opcionesTrabajo = this.tiposTrabajo.map(t => 
            `<option value="${t}" ${trabajoActual === t ? 'selected' : ''}>${t}</option>`
        ).join('');
        
        const contenido = `
            <form id="formEditarTrabajador" style="max-height: 70vh; overflow-y: auto;">
                <div class="form-group">
                    <label>Nombre Completo:</label>
                    <input type="text" id="editNombre" value="${trabajador.nombre}" required class="form-control">
                </div>
                <div class="form-group">
                    <label>Teléfono:</label>
                    <input type="tel" id="editTelefono" value="${trabajador.telefono || ''}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Fecha de Contratación:</label>
                    <input type="date" id="editFechaContratacion" value="${trabajador.fechaContratacion || ''}" max="${Utils.obtenerFechaActual()}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Tipo de Trabajo:</label>
                    <select id="editTipoTrabajo" required class="form-control">
                        <option value="">Seleccione un tipo de trabajo</option>
                        ${opcionesTrabajo}
                        ${esOtro ? `<option value="Otro" selected>Otro</option>` : ''}
                    </select>
                    <input type="text" id="editTipoTrabajoOtro" value="${esOtro ? trabajoActual : ''}" placeholder="Especifique el tipo de trabajo" class="form-control" style="margin-top: 10px; display: ${esOtro ? 'block' : 'none'};">
                </div>
                <div class="form-group">
                    <label>Tarifa por Hora (€):</label>
                    <input type="number" id="editTarifaHora" value="${trabajador.tarifaHora != null ? trabajador.tarifaHora : ''}" step="0.01" min="0" max="1000" required class="form-control" placeholder="Ej: 12.50">
                    <small class="form-help">Necesaria para registrar horas y calcular sueldos.</small>
                </div>
                <div class="form-group">
                    <label>Estado:</label>
                    <select id="editEstado" required class="form-control">
                        <option value="activo" ${(trabajador.estado || 'activo') === 'activo' ? 'selected' : ''}>Activo</option>
                        <option value="inactivo" ${trabajador.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                        <option value="baja" ${trabajador.estado === 'baja' ? 'selected' : ''}>Baja</option>
                    </select>
                </div>
            </form>
        `;
        
        const botones = `
            <button class="btn btn-primary" onclick="AppGestion.guardarEdicionTrabajador('${id}')">Guardar</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        `;
        
        const modal = Modal.mostrar('Editar Trabajador', contenido, { botones });
        
        // Configurar mostrar/ocultar campo "Otro"
        const editTipoTrabajo = document.getElementById('editTipoTrabajo');
        const editTipoTrabajoOtro = document.getElementById('editTipoTrabajoOtro');
        if (editTipoTrabajo && editTipoTrabajoOtro) {
            editTipoTrabajo.addEventListener('change', (e) => {
                editTipoTrabajoOtro.style.display = e.target.value === 'Otro' ? 'block' : 'none';
                if (e.target.value !== 'Otro') {
                    editTipoTrabajoOtro.value = '';
                }
            });
        }
    },
    
    // Guardar edición de trabajador
    guardarEdicionTrabajador(id) {
        const nombre = document.getElementById('editNombre').value.trim();
        const telefono = document.getElementById('editTelefono').value.trim();
        const fechaContratacion = document.getElementById('editFechaContratacion').value;
        const tipoTrabajo = document.getElementById('editTipoTrabajo').value;
        const tipoTrabajoOtro = document.getElementById('editTipoTrabajoOtro').value.trim();
        const tarifaHora = document.getElementById('editTarifaHora').value;
        const estado = document.getElementById('editEstado').value;
        
        // Validaciones
        const valNombre = Validaciones.validarNombre(nombre);
        if (!valNombre.valido) {
            Modal.alert(valNombre.mensaje, 'error');
            return;
        }
        
        if (!tipoTrabajo) {
            Modal.alert('Por favor seleccione un tipo de trabajo', 'error');
            return;
        }

        if (!tarifaHora || parseFloat(tarifaHora) <= 0) {
            Modal.alert('Por favor ingrese una tarifa horaria válida', 'error');
            return;
        }

        const trabajoFinal = tipoTrabajo === 'Otro' ? tipoTrabajoOtro : tipoTrabajo;
        if (tipoTrabajo === 'Otro' && !tipoTrabajoOtro) {
            Modal.alert('Por favor especifique el tipo de trabajo', 'error');
            return;
        }

        const trabajador = this.trabajadores.find(t => t.id === id);
        if (trabajador) {
            trabajador.nombre = nombre;
            trabajador.telefono = telefono || '';
            trabajador.fechaContratacion = fechaContratacion || '';
            trabajador.tipoTrabajo = trabajoFinal;
            trabajador.tarifaHora = parseFloat(tarifaHora);
            trabajador.estado = estado || 'activo';
            
            this.guardarDatos();
            this.trabajadoresFiltrados = [...this.trabajadores];
            this.actualizarInterfaz();
            document.querySelector('.modal-overlay')?.remove();
            Modal.alert('Trabajador actualizado exitosamente', 'success');
        }
    },
    
    // Eliminar trabajador
    eliminarTrabajador(id) {
        const trabajador = this.trabajadores.find(t => t.id === id);
        if (!trabajador) return;
        
        Modal.confirm(
            `¿Está seguro de eliminar a ${trabajador.nombre}? También se eliminarán todos sus registros de horas y pagos registrados.`,
            () => {
                this.trabajadores = this.trabajadores.filter(t => t.id !== id);
                this.registrosHoras = this.registrosHoras.filter(r => r.trabajadorId !== id);
                this.pagosTrabajadores = this.pagosTrabajadores.filter(p => p.trabajadorId !== id);
                this.guardarDatos();
                this.trabajadoresFiltrados = [...this.trabajadores];
                this.actualizarInterfaz();
                Modal.alert('Trabajador eliminado', 'success');
            }
        );
    },
    
    // Registrar horas trabajadas para múltiples trabajadores
    registrarHoras() {
        // Obtener trabajadores seleccionados
        const checkboxes = document.querySelectorAll('.trabajador-checkbox:checked');
        const trabIds = Array.from(checkboxes).map(cb => cb.value);
        const fecha = document.getElementById('fecha').value;
        const horas = document.getElementById('horas').value;

        if (trabIds.length === 0) {
            Modal.alert('Por favor seleccione al menos un trabajador', 'warning');
            return;
        }

        const fecha_val = Validaciones.validarFecha(fecha);
        if (!fecha_val.valido) {
            Modal.alert(fecha_val.mensaje, 'error');
            return;
        }

        const fechaNoFutura = Validaciones.validarFechaNoFutura(fecha);
        if (!fechaNoFutura.valido) {
            Modal.alert(fechaNoFutura.mensaje, 'error');
            return;
        }

        const horasVal = Validaciones.validarHorasMaximas(horas);
        if (!horasVal.valido) {
            Modal.alert(horasVal.mensaje, 'error');
            return;
        }

        this.mostrarCarga('Registrando horas...');

        setTimeout(() => {
            const horasNum = parseFloat(horas) || 0;
            let registrosCreados = 0;
            let errores = [];

            trabIds.forEach(trabajadorId => {
                const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
                if (!trabajador) {
                    errores.push(`${trabajador?.nombre || 'Trabajador'} no encontrado`);
                    return;
                }

                if (!trabajador.tarifaHora || trabajador.tarifaHora <= 0) {
                    errores.push(`${trabajador.nombre} no tiene tarifa horaria configurada`);
                    return;
                }

                const valDuplicado = Validaciones.validarRegistroDuplicado(trabajadorId, fecha);
                if (!valDuplicado.valido) {
                    errores.push(`${trabajador.nombre}: ${valDuplicado.mensaje}`);
                    return;
                }

                const tarifaHora = parseFloat(trabajador.tarifaHora);
                const sueldoTotal = horasNum * tarifaHora;

                const registro = {
                    id: Utils.generarId(),
                    trabajadorId: trabajadorId,
                    fecha: fecha,
                    horas: horasNum,
                    tarifaHora: tarifaHora,
                    sueldoTotal: sueldoTotal,
                    fechaRegistro: new Date().toISOString()
                };

                this.registrosHoras.push(registro);
                this.registrarCambio('registro', 'crear', registro.id, `Registro de horas creado para ${trabajador.nombre}`);
                registrosCreados++;
            });

            this.guardarDatos();
            this.actualizarInterfaz();

            document.getElementById('formRegistroHoras').reset();
            document.getElementById('fecha').valueAsDate = new Date();
            document.querySelectorAll('.trabajador-checkbox').forEach(cb => cb.checked = false);
            this.ocultarCarga();

            if (registrosCreados > 0) {
                let mensaje = `${registrosCreados} registro${registrosCreados > 1 ? 's' : ''} de hora${registrosCreados > 1 ? 's' : ''} registrado${registrosCreados > 1 ? 's' : ''} exitosamente`;
                if (errores.length > 0) {
                    mensaje += `.\n\nErrores:\n- ${errores.join('\n- ')}`;
                }
                Modal.alert(mensaje, 'success');
            } else if (errores.length > 0) {
                Modal.alert(`No se pudieron registrar horas:\n- ${errores.join('\n- ')}`, 'error');
            }
        }, 300);
    },
    
    // Editar registro de horas
    editarRegistro(id) {
        const registro = this.registrosHoras.find(r => r.id === id);
        if (!registro) return;

        const trabajador = this.trabajadores.find(t => t.id === registro.trabajadorId);

        // Detectar si es nuevo modelo simplificado o antiguo modelo complejo
        const esNuevoModelo = registro.sueldoTotal !== undefined && !registro.trabajo;

        let contenido;
        if (esNuevoModelo) {
            // Formulario simplificado para nuevo modelo
            contenido = `
                <form id="formEditarRegistro">
                    <div class="form-group">
                        <label>Trabajador:</label>
                        <input type="text" value="${trabajador ? trabajador.nombre : 'N/A'}" disabled class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Tarifa Horaria (€/h):</label>
                        <input type="text" value="${Utils.formatearNumero(registro.tarifaHora)}" disabled class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="editFecha" value="${registro.fecha}" required class="form-control" max="${Utils.obtenerFechaActual()}">
                    </div>
                    <div class="form-group">
                        <label>Horas Trabajadas:</label>
                        <input type="number" id="editHoras" value="${registro.horas}" step="0.5" min="0" max="16" required class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Sueldo Total (calculado automáticamente):</label>
                        <input type="text" value="${Utils.formatearMoneda(registro.sueldoTotal)}" disabled class="form-control">
                    </div>
                </form>
            `;
        } else {
            // Formulario complejo para modelo antiguo (compatibilidad)
            const trabajoActual = registro.trabajo || '';
            const trabajosComunes = ['Aceitunas', 'Espárragos', 'Tomates', 'Pimientos', 'Fresas', 'Lechuga', 'Cebolla', 'Ajo', 'Otro'];
            const esOtro = !trabajosComunes.includes(trabajoActual);
            const opcionesTrabajo = trabajosComunes.map(t =>
                `<option value="${t}" ${trabajoActual === t ? 'selected' : ''}>${t}</option>`
            ).join('');
            const salarioHoraActual = registro.salarioHora || (trabajador ? trabajador.salarioHora : 0);
            const salarioHoraExtraActual = registro.salarioHoraExtra || (trabajador ? (trabajador.salarioHoraExtra || trabajador.salarioHora * 1.5) : 0);

            contenido = `
                <form id="formEditarRegistro">
                    <div class="form-group">
                        <label>Trabajador:</label>
                        <input type="text" value="${trabajador ? trabajador.nombre : 'N/A'}" disabled class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Tipo de Trabajo:</label>
                        <select id="editTrabajoRegistro" required class="form-control">
                            <option value="">Seleccione un tipo de trabajo</option>
                            ${opcionesTrabajo}
                            ${esOtro ? `<option value="Otro" selected>Otro</option>` : ''}
                        </select>
                        <input type="text" id="editTrabajoRegistroOtro" value="${esOtro ? trabajoActual : ''}" placeholder="Especifique el tipo de trabajo" class="form-control" style="margin-top: 10px; display: ${esOtro ? 'block' : 'none'};">
                    </div>
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="editFecha" value="${registro.fecha}" required class="form-control" max="${Utils.obtenerFechaActual()}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Salario por Hora (€):</label>
                            <input type="number" id="editSalarioHora" value="${salarioHoraActual}" step="0.01" min="0" max="1000" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Salario Hora Extra (€):</label>
                            <input type="number" id="editSalarioHoraExtra" value="${salarioHoraExtraActual}" step="0.01" min="0" max="1000" class="form-control">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Horas Normales:</label>
                            <input type="number" id="editHoras" value="${registro.horas}" step="0.5" min="0" max="16" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Horas Extras:</label>
                            <input type="number" id="editHorasExtras" value="${registro.horasExtras || 0}" step="0.5" min="0" max="8" class="form-control">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Bonificación (€):</label>
                            <input type="number" id="editBonificacion" value="${registro.bonificacion || 0}" step="0.01" min="0" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Descuento (€):</label>
                            <input type="number" id="editDescuento" value="${registro.descuento || 0}" step="0.01" min="0" class="form-control">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Notas:</label>
                        <textarea id="editNotas" rows="3" class="form-control">${registro.notas || ''}</textarea>
                    </div>
                </form>
            `;
        }

        const botones = `
            <button class="btn btn-primary" onclick="AppGestion.guardarEdicionRegistro('${id}')">Guardar</button>
            <button class="btn btn-danger" onclick="AppGestion.eliminarRegistro('${id}')">Eliminar</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        `;

        const modal = Modal.mostrar('Editar Registro de Horas', contenido, { botones });

        // Configurar mostrar/ocultar campo "Otro" solo para modelo antiguo
        if (!esNuevoModelo) {
            const editTrabajoRegistro = document.getElementById('editTrabajoRegistro');
            const editTrabajoRegistroOtro = document.getElementById('editTrabajoRegistroOtro');
            if (editTrabajoRegistro && editTrabajoRegistroOtro) {
                editTrabajoRegistro.addEventListener('change', (e) => {
                    editTrabajoRegistroOtro.style.display = e.target.value === 'Otro' ? 'block' : 'none';
                    if (e.target.value !== 'Otro') {
                        editTrabajoRegistroOtro.value = '';
                    }
                });
            }
        }
    },
    
    // Guardar edición de registro
    guardarEdicionRegistro(id) {
        const registro = this.registrosHoras.find(r => r.id === id);
        if (!registro) return;

        // Detectar si es nuevo modelo simplificado o antiguo modelo complejo
        const esNuevoModelo = registro.sueldoTotal !== undefined && !registro.trabajo;
        const fecha = document.getElementById('editFecha').value;
        const horas = document.getElementById('editHoras').value;

        // Validaciones comunes
        const valFecha = Validaciones.validarFecha(fecha);
        if (!valFecha.valido) {
            Modal.alert(valFecha.mensaje, 'error');
            return;
        }

        const valFechaNoFutura = Validaciones.validarFechaNoFutura(fecha);
        if (!valFechaNoFutura.valido) {
            Modal.alert(valFechaNoFutura.mensaje, 'error');
            return;
        }

        const valHoras = Validaciones.validarHorasMaximas(horas);
        if (!valHoras.valido) {
            Modal.alert(valHoras.mensaje, 'error');
            return;
        }

        const valDuplicado = Validaciones.validarRegistroDuplicado(registro.trabajadorId, fecha, id);
        if (!valDuplicado.valido) {
            Modal.alert(valDuplicado.mensaje, 'error');
            return;
        }

        if (esNuevoModelo) {
            // Actualizar nuevo modelo simplificado
            const horasNum = parseFloat(horas);
            registro.fecha = fecha;
            registro.horas = horasNum;
            registro.sueldoTotal = horasNum * registro.tarifaHora;
        } else {
            // Actualizar modelo antiguo complejo (compatibilidad)
            const trabajo = document.getElementById('editTrabajoRegistro').value;
            const trabajoOtro = document.getElementById('editTrabajoRegistroOtro').value.trim();
            const salarioHora = document.getElementById('editSalarioHora').value;
            const salarioHoraExtra = document.getElementById('editSalarioHoraExtra').value;
            const horasExtras = document.getElementById('editHorasExtras').value || '0';
            const bonificacion = document.getElementById('editBonificacion').value || '0';
            const descuento = document.getElementById('editDescuento').value || '0';
            const notas = document.getElementById('editNotas').value.trim();

            if (!trabajo) {
                Modal.alert('Por favor seleccione un tipo de trabajo', 'error');
                return;
            }

            const trabajoFinal = trabajo === 'Otro' ? trabajoOtro : trabajo;
            if (trabajo === 'Otro' && !trabajoOtro) {
                Modal.alert('Por favor especifique el tipo de trabajo', 'error');
                return;
            }

            const valSalario = Validaciones.validarSalario(salarioHora);
            if (!valSalario.valido) {
                Modal.alert(valSalario.mensaje, 'error');
                return;
            }

            const salarioHoraNum = parseFloat(salarioHora);
            const salarioHoraExtraNum = salarioHoraExtra ? parseFloat(salarioHoraExtra) : salarioHoraNum * 1.5;

            registro.fecha = fecha;
            registro.trabajo = trabajoFinal;
            registro.salarioHora = salarioHoraNum;
            registro.salarioHoraExtra = salarioHoraExtraNum;
            registro.horas = parseFloat(horas);
            registro.horasExtras = parseFloat(horasExtras) || 0;
            registro.bonificacion = parseFloat(bonificacion) || 0;
            registro.descuento = parseFloat(descuento) || 0;
            registro.notas = notas || '';

            // Recalcular sueldo total para modelo antiguo
            const sueldoNormal = registro.horas * registro.salarioHora;
            const sueldoExtras = registro.horasExtras * registro.salarioHoraExtra;
            registro.sueldoTotal = sueldoNormal + sueldoExtras + registro.bonificacion - registro.descuento;
        }

        this.guardarDatos();
        this.actualizarInterfaz();
        document.querySelector('.modal-overlay')?.remove();
        Modal.alert('Registro actualizado exitosamente', 'success');
    },
    
    // Eliminar registro (trabajadorIdParaReabrir: opcional, para reabrir la lista de registros tras eliminar)
    eliminarRegistro(id, trabajadorIdParaReabrir = null) {
        Modal.confirm(
            '¿Está seguro de eliminar este registro de horas?',
            () => {
                this.registrosHoras = this.registrosHoras.filter(r => r.id !== id);
                this.guardarDatos();
                this.actualizarInterfaz();
                document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
                if (trabajadorIdParaReabrir) {
                    setTimeout(() => {
                        this.verRegistrosTrabajador(trabajadorIdParaReabrir);
                        Modal.alert('Registro eliminado', 'success');
                    }, 100);
                } else {
                    Modal.alert('Registro eliminado', 'success');
                }
            }
        );
    },
    
    // Buscar trabajadores
    buscarTrabajadores() {
        const busqueda = document.getElementById('buscarTrabajador').value.toLowerCase().trim();
        const filtroTrabajo = document.getElementById('filtroTrabajo')?.value || '';
        const filtroEstado = document.getElementById('filtroEstado')?.value || '';
        
        let filtrados = [...this.trabajadores];
        
        // Aplicar filtro por tipo de trabajo
        if (filtroTrabajo) {
            filtrados = filtrados.filter(t => (t.tipoTrabajo || '') === filtroTrabajo);
        }
        
        // Aplicar filtro por estado
        if (filtroEstado) {
            filtrados = filtrados.filter(t => (t.estado || 'activo') === filtroEstado);
        }
        
        // Aplicar búsqueda
        if (busqueda) {
            filtrados = filtrados.filter(t =>
                t.nombre.toLowerCase().includes(busqueda) ||
                (t.cedula || '').toLowerCase().includes(busqueda) ||
                (t.numeroSeguridadSocial || '').toLowerCase().includes(busqueda) ||
                (t.tipoTrabajo || '').toLowerCase().includes(busqueda) ||
                (t.telefono || '').toLowerCase().includes(busqueda) ||
                (t.email || '').toLowerCase().includes(busqueda) ||
                (t.direccion || '').toLowerCase().includes(busqueda)
            );
        }
        
        this.trabajadoresFiltrados = filtrados;
        this.paginaActual = 1; // Reset a primera página
        this.ordenarTrabajadores(this.ordenActual);
    },
    
    // Buscar en registros
    buscarRegistros() {
        const busqueda = document.getElementById('buscarRegistros').value.toLowerCase().trim();
        
        if (!busqueda) {
            // Si no hay búsqueda, mostrar todos los trabajadores
            this.trabajadoresFiltrados = [...this.trabajadores];
            this.actualizarInterfaz();
            return;
        }
        
        // Filtrar trabajadores que tengan registros que coincidan con la búsqueda
        const trabajadoresConRegistros = this.trabajadores.filter(trabajador => {
            const registros = this.obtenerRegistrosTrabajador(trabajador.id);
            return registros.some(r => {
                const fecha = Utils.formatearFecha(r.fecha).toLowerCase();
                const trabajo = (r.trabajo || '').toLowerCase();
                const notas = (r.notas || '').toLowerCase();
                const horas = r.horas.toString();
                const horasExtras = (r.horasExtras || 0).toString();
                const bonificacion = (r.bonificacion || 0).toString();
                const descuento = (r.descuento || 0).toString();
                
                return fecha.includes(busqueda) ||
                       trabajo.includes(busqueda) ||
                       notas.includes(busqueda) ||
                       horas.includes(busqueda) ||
                       horasExtras.includes(busqueda) ||
                       bonificacion.includes(busqueda) ||
                       descuento.includes(busqueda);
            });
        });
        
        this.trabajadoresFiltrados = trabajadoresConRegistros;
        this.actualizarInterfaz();
    },
    
    // Filtrar por tipo de trabajo
    filtrarPorTrabajo() {
        this.buscarTrabajadores();
    },
    
    // Ordenar trabajadores
    ordenarTrabajadores(campo) {
        this.ordenActual = campo;
        
        this.trabajadoresFiltrados.sort((a, b) => {
            let valorA, valorB;
            
            switch(campo) {
                case 'nombre':
                    valorA = a.nombre.toLowerCase();
                    valorB = b.nombre.toLowerCase();
                    break;
                case 'sueldo':
                    valorA = this.calcularSueldoTrabajador(a.id);
                    valorB = this.calcularSueldoTrabajador(b.id);
                    break;
                case 'horas':
                    valorA = this.obtenerTotalHoras(a.id);
                    valorB = this.obtenerTotalHoras(b.id);
                    break;
                case 'trabajo':
                    valorA = (a.tipoTrabajo || '').toLowerCase();
                    valorB = (b.tipoTrabajo || '').toLowerCase();
                    break;
                case 'fechaContratacion':
                    valorA = a.fechaContratacion || '';
                    valorB = b.fechaContratacion || '';
                    break;
                case 'salario':
                case 'tarifa':
                    valorA = parseFloat(a.tarifaHora != null ? a.tarifaHora : a.salarioHora) || 0;
                    valorB = parseFloat(b.tarifaHora != null ? b.tarifaHora : b.salarioHora) || 0;
                    break;
                case 'cedula':
                    valorA = (a.cedula || '').toLowerCase();
                    valorB = (b.cedula || '').toLowerCase();
                    break;
                case 'estado':
                    valorA = (a.estado || 'activo').toLowerCase();
                    valorB = (b.estado || 'activo').toLowerCase();
                    break;
                case 'pendiente':
                    valorA = this.calcularSaldoPendienteTrabajador(a.id);
                    valorB = this.calcularSaldoPendienteTrabajador(b.id);
                    break;
                default:
                    return 0;
            }
            
            if (valorA < valorB) return this.direccionOrden === 'asc' ? -1 : 1;
            if (valorA > valorB) return this.direccionOrden === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.mostrarTrabajadores();
    },
    
    // Cambiar vista (grid/table)
    cambiarVista(vista) {
        this.vistaActual = vista;
        
        document.getElementById('btn-vista-grid').classList.toggle('active', vista === 'grid');
        document.getElementById('btn-vista-tabla').classList.toggle('active', vista === 'table');
        
        document.getElementById('listaTrabajadores').style.display = vista === 'grid' ? 'grid' : 'none';
        document.getElementById('tablaTrabajadores').style.display = vista === 'table' ? 'block' : 'none';
        
        if (vista === 'table') {
            this.mostrarTablaTrabajadores();
        }
    },
    
    // Calcular sueldo de trabajador
    calcularSueldoTrabajador(trabajadorId, mes = null, anio = null) {
        return this.calcularSueldoTrabajadorActualizado(trabajadorId, mes, anio);
    },
    
    // Obtener total de horas
    obtenerTotalHoras(trabajadorId, mes = null, anio = null) {
        let registros = this.registrosHoras.filter(r => r.trabajadorId === trabajadorId);
        
        if (mes !== null && anio !== null) {
            registros = registros.filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getMonth() === mes && fecha.getFullYear() === anio;
            });
        } else if (anio !== null) {
            registros = registros.filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getFullYear() === anio;
            });
        }
        
        return registros.reduce((sum, r) => sum + r.horas, 0);
    },
    
    // Obtener registros de trabajador
    obtenerRegistrosTrabajador(trabajadorId) {
        return this.registrosHoras.filter(r => r.trabajadorId === trabajadorId);
    },

    obtenerPagosTrabajador(trabajadorId) {
        return this.pagosTrabajadores.filter(p => p.trabajadorId === trabajadorId);
    },

    calcularTotalPagosTrabajador(trabajadorId) {
        return this.obtenerPagosTrabajador(trabajadorId).reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    },

    /**
     * Pendiente = devengado (suma sueldos por horas registradas) − total pagado.
     * Positivo: cantidad que aún debemos. Negativo: pagado de más (se compensa al registrar más horas).
     */
    calcularSaldoPendienteTrabajador(trabajadorId) {
        const devengado = this.calcularSueldoTrabajador(trabajadorId);
        const pagado = this.calcularTotalPagosTrabajador(trabajadorId);
        return devengado - pagado;
    },

    mostrarModalRegistrarPago(trabajadorId) {
        const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
        if (!trabajador) return;
        const escN = (s) => String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const saldo = this.calcularSaldoPendienteTrabajador(trabajadorId);
        const ayudaSaldo = saldo >= 0
            ? `Pendiente actual: <strong>${Utils.formatearMoneda(saldo)}</strong> (devengado por horas − ya pagado).`
            : `Saldo: <strong style="color:#c0392b;">${Utils.formatearMoneda(saldo)}</strong> (pagado de más; al registrar horas el pendiente subirá hacia cero y luego positivo).`;
        const hoy = Utils.obtenerFechaActual();
        const contenido = `
            <p style="margin-bottom:12px;">Registrar un pago a <strong>${escN(trabajador.nombre)}</strong>. Se restará del total adeudado.</p>
            <p style="font-size:0.95em;margin-bottom:12px;">${ayudaSaldo}</p>
            <form id="formRegistrarPago" onsubmit="return false;">
                <div class="form-group">
                    <label for="pagoMonto">Cantidad pagada (€)</label>
                    <input type="number" id="pagoMonto" class="form-control" step="0.01" min="0.01" required placeholder="Ej: 150">
                </div>
                <div class="form-group">
                    <label for="pagoMetodo">Forma de pago</label>
                    <select id="pagoMetodo" class="form-control">
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="pagoFecha">Fecha del pago</label>
                    <input type="date" id="pagoFecha" class="form-control" required value="${hoy}" max="${hoy}">
                </div>
                <div class="form-group">
                    <label for="pagoNota">Nota (opcional)</label>
                    <input type="text" id="pagoNota" class="form-control" maxlength="120" placeholder="Ej: quincena marzo">
                </div>
            </form>
        `;
        const botones = `
            <button type="button" class="btn btn-primary" onclick="AppGestion.guardarPagoTrabajador('${trabajadorId}')">
                <i class="fas fa-check"></i> Guardar pago
            </button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        `;
        Modal.mostrar('Registrar pago', contenido, { botones });
    },

    guardarPagoTrabajador(trabajadorId) {
        const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
        if (!trabajador) return;
        const montoRaw = document.getElementById('pagoMonto')?.value;
        const monto = parseFloat(String(montoRaw).replace(',', '.'));
        const metodo = document.getElementById('pagoMetodo')?.value || 'efectivo';
        const fecha = document.getElementById('pagoFecha')?.value || '';
        const nota = document.getElementById('pagoNota')?.value.trim() || '';

        const valM = Validaciones.validarMontoPago(monto);
        if (!valM.valido) {
            Modal.alert(valM.mensaje, 'error');
            return;
        }
        const valF = Validaciones.validarFecha(fecha);
        if (!valF.valido) {
            Modal.alert(valF.mensaje, 'error');
            return;
        }
        const valNoFutura = Validaciones.validarFechaNoFutura(fecha);
        if (!valNoFutura.valido) {
            Modal.alert(valNoFutura.mensaje, 'error');
            return;
        }

        const pago = {
            id: Utils.generarId(),
            trabajadorId,
            fecha,
            monto,
            metodo,
            nota,
            fechaRegistro: new Date().toISOString()
        };
        this.pagosTrabajadores.push(pago);
        this.registrarCambio('pago', 'crear', pago.id, `Pago ${Utils.formatearMoneda(monto)} a ${trabajador.nombre} (${metodo})`);
        this.guardarDatos();
        this.trabajadoresFiltrados = [...this.trabajadores];
        this.actualizarInterfaz();
        document.querySelector('.modal-overlay')?.remove();
        const nuevoSaldo = this.calcularSaldoPendienteTrabajador(trabajadorId);
        let msg = `Pago registrado correctamente.\n\nNuevo pendiente: ${Utils.formatearMoneda(nuevoSaldo)}`;
        if (nuevoSaldo < 0) {
            msg += '\n\n(Negativo = ha pagado de más; al añadir horas el pendiente aumentará hasta quedar en positivo cuando vuelva a haber cantidad por pagar.)';
        }
        Modal.alert(msg, 'success');
    },

    verHistorialPagosTrabajador(trabajadorId) {
        const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
        if (!trabajador) return;
        const esc = (s) => String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const pagos = this.obtenerPagosTrabajador(trabajadorId)
            .slice()
            .sort((a, b) => {
                const df = new Date(b.fecha) - new Date(a.fecha);
                if (df !== 0) return df;
                return String(b.fechaRegistro || '').localeCompare(String(a.fechaRegistro || ''));
            });
        let lista = '';
        if (pagos.length === 0) {
            lista = '<p style="color:var(--gris-medio);">No hay pagos registrados.</p>';
        } else {
            lista = pagos.map(p => {
                const lblMet = p.metodo === 'transferencia' ? 'Transferencia' : 'Efectivo';
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--gris-borde);padding:10px 0;gap:10px;">
                    <div>
                        <strong>${Utils.formatearFecha(p.fecha)}</strong> — ${Utils.formatearMoneda(p.monto)} · ${lblMet}
                        ${p.nota ? `<br><small>${esc(p.nota)}</small>` : ''}
                    </div>
                    <button type="button" class="btn btn-danger" style="padding:4px 8px;font-size:0.85em;" onclick="AppGestion.eliminarPagoTrabajador('${p.id}','${trabajadorId}')" title="Eliminar pago">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>`;
            }).join('');
        }
        const saldo = this.calcularSaldoPendienteTrabajador(trabajadorId);
        const botones = `
            <button type="button" class="btn btn-primary" onclick="document.querySelector('.modal-overlay')?.remove();AppGestion.mostrarModalRegistrarPago('${trabajadorId}')">
                <i class="fas fa-money-bill-wave"></i> Nuevo pago
            </button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        `;
        Modal.mostrar(
            `Pagos — ${esc(trabajador.nombre)}`,
            `<p style="margin-bottom:10px;">Pendiente actual: <strong>${Utils.formatearMoneda(saldo)}</strong></p><div style="max-height:360px;overflow-y:auto;">${lista}</div>`,
            { botones }
        );
    },

    eliminarPagoTrabajador(pagoId, trabajadorId) {
        if (!this.pagosTrabajadores.some(x => x.id === pagoId)) return;
        Modal.confirm('¿Eliminar este pago del historial?', () => {
            this.pagosTrabajadores = this.pagosTrabajadores.filter(x => x.id !== pagoId);
            this.registrarCambio('pago', 'eliminar', pagoId, 'Pago eliminado');
            this.guardarDatos();
            this.actualizarInterfaz();
            document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
            this.verHistorialPagosTrabajador(trabajadorId);
        });
    },
    
    // Actualizar interfaz completa
    actualizarInterfaz() {
        this.actualizarFiltroTrabajo();
        this.mostrarTrabajadores();
        this.actualizarSelectTrabajadores();
        this.actualizarFiltros();
        this.mostrarResumenSueldos();
        this.actualizarDashboard();
        
        if (this.vistaActual === 'table') {
            this.mostrarTablaTrabajadores();
        }
        
        if (typeof ChartsManager !== 'undefined') {
            ChartsManager.actualizar();
        }
        
        // Mostrar/ocultar sección de registro
        if (this.trabajadores.length > 0) {
            document.getElementById('seccionRegistroHoras').style.display = 'block';
        } else {
            document.getElementById('seccionRegistroHoras').style.display = 'none';
        }
    },
    
    // Actualizar filtro de tipo de trabajo
    actualizarFiltroTrabajo() {
        const filtroTrabajo = document.getElementById('filtroTrabajo');
        if (!filtroTrabajo) return;
        
        // Obtener todos los tipos de trabajo únicos
        const tiposTrabajo = [...new Set(this.trabajadores.map(t => t.tipoTrabajo).filter(t => t))].sort();
        
        filtroTrabajo.innerHTML = '<option value="">Todos los trabajos</option>' +
            tiposTrabajo.map(t => `<option value="${t}">${t}</option>`).join('');
    },
    
    // Mostrar trabajadores (vista grid)
    mostrarTrabajadores() {
        const container = document.getElementById('listaTrabajadores');
        
        if (this.trabajadoresFiltrados.length === 0) {
            container.innerHTML = '<div class="empty-state"><p><i class="fas fa-users"></i> No hay trabajadores que coincidan con la búsqueda</p></div>';
            document.getElementById('paginacion-trabajadores')?.remove();
            return;
        }
        
        // Paginación
        const totalPaginas = Math.ceil(this.trabajadoresFiltrados.length / this.itemsPorPagina);
        const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
        const fin = inicio + this.itemsPorPagina;
        const trabajadoresPagina = this.trabajadoresFiltrados.slice(inicio, fin);
        
        container.innerHTML = trabajadoresPagina.map(trabajador => {
            const estado = trabajador.estado || 'activo';
            const estadoClass = estado === 'activo' ? 'success' : estado === 'inactivo' ? 'warning' : 'danger';
            const estadoIcon = estado === 'activo' ? 'fa-check-circle' : estado === 'inactivo' ? 'fa-pause-circle' : 'fa-times-circle';
            
            const tarifaNum = parseFloat(trabajador.tarifaHora != null ? trabajador.tarifaHora : trabajador.salarioHora) || 0;
            const lineaTarifa = tarifaNum > 0
                ? `<div class="trabajador-info"><strong><i class="fas fa-euro-sign"></i> Tarifa/h:</strong> ${Utils.formatearMoneda(tarifaNum)}</div>`
                : `<div class="trabajador-info" style="color: var(--advertencia, #b8860b);"><i class="fas fa-info-circle"></i> Indique la tarifa por hora en <strong>Editar</strong> para registrar horas.</div>`;
            const fechaCont = trabajador.fechaContratacion
                ? `<div class="trabajador-info"><strong><i class="fas fa-calendar-check"></i> Contratación:</strong> ${Utils.formatearFecha(trabajador.fechaContratacion)}</div>`
                : '';
            const legacyDni = (trabajador.cedula || '').trim()
                ? `<div class="trabajador-info"><strong><i class="fas fa-id-card"></i> DNI (dato antiguo):</strong> ${trabajador.cedula}</div>`
                : '';

            const saldoPend = this.calcularSaldoPendienteTrabajador(trabajador.id);
            const saldoColor = saldoPend > 0 ? 'var(--verde-oscuro)' : saldoPend < 0 ? '#c0392b' : 'var(--gris-medio)';
            const saldoTexto = saldoPend > 0
                ? `Pendiente de pago: ${Utils.formatearMoneda(saldoPend)}`
                : saldoPend < 0
                    ? `Saldo: ${Utils.formatearMoneda(saldoPend)} (pagado de más)`
                    : `Pendiente: ${Utils.formatearMoneda(0)} (al día)`;

            return `
                <div class="trabajador-card">
                    <h3>${trabajador.nombre} <span class="badge badge-${estadoClass}" style="font-size: 0.7em; padding: 3px 8px;"><i class="fas ${estadoIcon}"></i> ${estado}</span></h3>
                    ${legacyDni}
                    ${fechaCont}
                    ${trabajador.telefono ? `<div class="trabajador-info"><strong><i class="fas fa-phone"></i> Teléfono:</strong> ${trabajador.telefono}</div>` : ''}
                    <div class="trabajador-info">
                        <strong><i class="fas fa-seedling"></i> Tipo de Trabajo:</strong> ${trabajador.tipoTrabajo || 'No especificado'}
                    </div>
                    ${lineaTarifa}
                    <div class="trabajador-info" style="font-weight:600;color:${saldoColor};">
                        <i class="fas fa-balance-scale"></i> ${saldoTexto}
                    </div>
                    <div class="acciones" style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-success" onclick="AppGestion.mostrarModalRegistrarPago('${trabajador.id}')" style="flex: 1; padding: 8px; min-width: 80px;">
                            <i class="fas fa-money-bill-wave"></i> Pagar
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="AppGestion.verHistorialPagosTrabajador('${trabajador.id}')" style="flex: 1; padding: 8px; min-width: 80px;">
                            <i class="fas fa-list-alt"></i> Pagos
                        </button>
                        <button class="btn btn-primary" onclick="AppGestion.editarTrabajador('${trabajador.id}')" style="flex: 1; padding: 8px; min-width: 80px;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-secondary" onclick="AppGestion.exportarTrabajadorIndividualPDF('${trabajador.id}')" style="flex: 1; padding: 8px; min-width: 80px;" data-tooltip="Exportar PDF individual">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                        <button class="btn btn-secondary" onclick="AppGestion.duplicarTrabajador('${trabajador.id}')" style="flex: 1; padding: 8px; min-width: 80px;">
                            <i class="fas fa-copy"></i> Duplicar
                        </button>
                        <button class="btn btn-danger" onclick="AppGestion.eliminarTrabajador('${trabajador.id}')" style="flex: 1; padding: 8px; min-width: 80px;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Mostrar paginación
        this.mostrarPaginacion('trabajadores', totalPaginas);
    },
    
    // Mostrar paginación
    mostrarPaginacion(tipo, totalPaginas) {
        let contenedorPaginacion = document.getElementById(`paginacion-${tipo}`);
        if (!contenedorPaginacion && totalPaginas > 1) {
            contenedorPaginacion = document.createElement('div');
            contenedorPaginacion.id = `paginacion-${tipo}`;
            contenedorPaginacion.className = 'paginacion';
            const container = tipo === 'trabajadores' ? 
                document.getElementById('listaTrabajadores').parentElement : 
                document.getElementById('tablaTrabajadores').parentElement;
            container.appendChild(contenedorPaginacion);
        }
        
        if (totalPaginas <= 1) {
            if (contenedorPaginacion) contenedorPaginacion.remove();
            return;
        }
        
        let html = '<div class="paginacion-controls">';
        html += `<button class="btn btn-secondary" onclick="AppGestion.cambiarPagina('${tipo}', 1)" ${this.paginaActual === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-double-left"></i>
        </button>`;
        html += `<button class="btn btn-secondary" onclick="AppGestion.cambiarPagina('${tipo}', ${this.paginaActual - 1})" ${this.paginaActual === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-left"></i>
        </button>`;
        html += `<span class="paginacion-info">Página ${this.paginaActual} de ${totalPaginas}</span>`;
        html += `<button class="btn btn-secondary" onclick="AppGestion.cambiarPagina('${tipo}', ${this.paginaActual + 1})" ${this.paginaActual === totalPaginas ? 'disabled' : ''}>
            <i class="fas fa-angle-right"></i>
        </button>`;
        html += `<button class="btn btn-secondary" onclick="AppGestion.cambiarPagina('${tipo}', ${totalPaginas})" ${this.paginaActual === totalPaginas ? 'disabled' : ''}>
            <i class="fas fa-angle-double-right"></i>
        </button>`;
        html += '</div>';
        
        if (contenedorPaginacion) {
            contenedorPaginacion.innerHTML = html;
        }
    },
    
    // Cambiar página
    cambiarPagina(tipo, pagina) {
        const totalItems = tipo === 'trabajadores' ? this.trabajadoresFiltrados.length : this.trabajadoresFiltrados.length;
        const totalPaginas = Math.ceil(totalItems / this.itemsPorPagina);
        
        if (pagina < 1 || pagina > totalPaginas) return;
        
        this.paginaActual = pagina;
        
        if (tipo === 'trabajadores') {
            if (this.vistaActual === 'grid') {
                this.mostrarTrabajadores();
            } else {
                this.mostrarTablaTrabajadores();
            }
        }
    },
    
    // Mostrar tabla de trabajadores
    mostrarTablaTrabajadores() {
        const container = document.getElementById('tablaTrabajadores');
        
        if (this.trabajadoresFiltrados.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay trabajadores que coincidan con la búsqueda</p></div>';
            document.getElementById('paginacion-trabajadores')?.remove();
            return;
        }
        
        // Paginación
        const totalPaginas = Math.ceil(this.trabajadoresFiltrados.length / this.itemsPorPagina);
        const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
        const fin = inicio + this.itemsPorPagina;
        const trabajadoresPagina = this.trabajadoresFiltrados.slice(inicio, fin);
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th onclick="AppGestion.ordenarPorColumna('nombre')">Nombre</th>
                        <th onclick="AppGestion.ordenarPorColumna('fechaContratacion')">Contratación</th>
                        <th>Teléfono</th>
                        <th onclick="AppGestion.ordenarPorColumna('trabajo')">Tipo de Trabajo</th>
                        <th onclick="AppGestion.ordenarPorColumna('tarifa')">Tarifa/h</th>
                        <th onclick="AppGestion.ordenarPorColumna('estado')">Estado</th>
                        <th onclick="AppGestion.ordenarPorColumna('pendiente')">Pendiente</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        trabajadoresPagina.forEach(trabajador => {
            const tarifaMostrar = trabajador.tarifaHora != null && trabajador.tarifaHora > 0
                ? Utils.formatearMoneda(trabajador.tarifaHora)
                : (trabajador.salarioHora != null && trabajador.salarioHora > 0 ? Utils.formatearMoneda(trabajador.salarioHora) : '—');
            const estadoTabla = trabajador.estado || 'activo';
            const pend = this.calcularSaldoPendienteTrabajador(trabajador.id);
            const pendStyle = pend < 0 ? 'color:#c0392b;font-weight:600;' : pend > 0 ? 'font-weight:600;' : '';
            html += `
                <tr>
                    <td>${trabajador.nombre}</td>
                    <td>${trabajador.fechaContratacion ? Utils.formatearFecha(trabajador.fechaContratacion) : '—'}</td>
                    <td>${trabajador.telefono || '—'}</td>
                    <td>${trabajador.tipoTrabajo || 'No especificado'}</td>
                    <td>${tarifaMostrar}</td>
                    <td>${estadoTabla}</td>
                    <td style="${pendStyle}">${Utils.formatearMoneda(pend)}</td>
                    <td class="acciones">
                        <button type="button" class="btn btn-success" onclick="AppGestion.mostrarModalRegistrarPago('${trabajador.id}')" style="padding: 5px 10px; font-size: 0.9em;" title="Registrar pago">
                            <i class="fas fa-money-bill-wave"></i>
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="AppGestion.verHistorialPagosTrabajador('${trabajador.id}')" style="padding: 5px 10px; font-size: 0.9em;" title="Historial de pagos">
                            <i class="fas fa-list-alt"></i>
                        </button>
                        <button class="btn btn-primary" onclick="AppGestion.editarTrabajador('${trabajador.id}')" style="padding: 5px 10px; font-size: 0.9em;" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="AppGestion.exportarTrabajadorIndividualPDF('${trabajador.id}')" style="padding: 5px 10px; font-size: 0.9em;" title="Exportar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-danger" onclick="AppGestion.eliminarTrabajador('${trabajador.id}')" style="padding: 5px 10px; font-size: 0.9em;" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        // Mostrar paginación
        this.mostrarPaginacion('trabajadores', totalPaginas);
    },
    
    // Ordenar por columna (tabla)
    ordenarPorColumna(campo) {
        if (this.ordenActual === campo) {
            this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
        } else {
            this.ordenActual = campo;
            this.direccionOrden = 'asc';
        }
        
        if (campo === 'trabajo') {
            campo = 'trabajo';
        }
        
        this.ordenarTrabajadores(campo);
        this.mostrarTablaTrabajadores();
    },
    
    // Actualizar checklist de trabajadores y select de filtro
    actualizarSelectTrabajadores() {
        const listaChecklistTrabajadores = document.getElementById('listaChecklistTrabajadores');
        const selectFiltro = document.getElementById('trabajadorFiltro');

        // Generar checklist de trabajadores para registro
        if (listaChecklistTrabajadores) {
            listaChecklistTrabajadores.innerHTML = this.trabajadores
                .filter(t => t.estado === 'activo')
                .map(t => {
                    const tarifa = t.tarifaHora ? ` - €${Utils.formatearNumero(t.tarifaHora)}/h` : '';
                    return `
                        <div style="padding: 8px; display: flex; align-items: center; border-bottom: 1px solid var(--gris-borde);">
                            <input type="checkbox" class="trabajador-checkbox" value="${t.id}" id="trabajador-${t.id}" style="margin-right: 10px; cursor: pointer;">
                            <label for="trabajador-${t.id}" style="flex: 1; cursor: pointer; margin: 0;">${t.nombre}${tarifa}</label>
                        </div>
                    `;
                }).join('');
        }

        // Actualizar select de filtro
        if (selectFiltro) {
            selectFiltro.innerHTML = '<option value="">Todos los trabajadores</option>' +
                this.trabajadores.map(t => `<option value="${t.id}">${t.nombre}${t.tipoTrabajo ? ' - ' + t.tipoTrabajo : ''}</option>`).join('');
        }

        // Agregar manejadores de eventos para los botones
        this.configurarBotonesSeleccion();
    },

    // Configurar botones de seleccionar/deseleccionar todos
    configurarBotonesSeleccion() {
        const btnSeleccionar = document.getElementById('btnSeleccionarTodos');
        const btnDeseleccionar = document.getElementById('btnDeseleccionarTodos');

        if (btnSeleccionar) {
            btnSeleccionar.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll('.trabajador-checkbox').forEach(checkbox => {
                    checkbox.checked = true;
                });
            };
        }

        if (btnDeseleccionar) {
            btnDeseleccionar.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll('.trabajador-checkbox').forEach(checkbox => {
                    checkbox.checked = false;
                });
            };
        }
    },
    
    // Actualizar filtros
    actualizarFiltros() {
        const selectMes = document.getElementById('mesSelect');
        const selectAnio = document.getElementById('anioSelect');
        const trabajoFiltroResumen = document.getElementById('trabajoFiltroResumen');
        
        const anios = [...new Set(this.registrosHoras.map(r => new Date(r.fecha).getFullYear()))].sort((a, b) => b - a);
        
        if (selectAnio) {
            selectAnio.innerHTML = '<option value="">Todos los años</option>' +
                anios.map(a => `<option value="${a}">${a}</option>`).join('');
        }
        
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        if (selectMes) {
            selectMes.innerHTML = '<option value="">Todos los meses</option>' +
                meses.map((m, i) => `<option value="${i}">${m}</option>`).join('');
        }
        
        // Actualizar filtro de tipo de trabajo en resumen
        if (trabajoFiltroResumen) {
            const tiposTrabajo = [...new Set(this.registrosHoras.map(r => r.trabajo).filter(t => t))].sort();
            trabajoFiltroResumen.innerHTML = '<option value="">Todos los trabajos</option>' +
                tiposTrabajo.map(t => `<option value="${t}">${t}</option>`).join('');
        }
    },
    
    // Mostrar resumen de sueldos
    mostrarResumenSueldos() {
        const container = document.getElementById('resumenSueldos');
        const mesSelect = document.getElementById('mesSelect');
        const anioSelect = document.getElementById('anioSelect');
        const trabajadorFiltro = document.getElementById('trabajadorFiltro');
        const trabajoFiltroResumen = document.getElementById('trabajoFiltroResumen');
        
        const mes = mesSelect.value === '' ? null : parseInt(mesSelect.value);
        const anio = anioSelect.value === '' ? null : parseInt(anioSelect.value);
        const trabajadorId = trabajadorFiltro ? trabajadorFiltro.value : '';
        const trabajoFiltro = trabajoFiltroResumen ? trabajoFiltroResumen.value : '';
        
        let trabajadoresFiltrados = trabajadorId ? 
            this.trabajadores.filter(t => t.id === trabajadorId) : 
            this.trabajadores;
        
        if (trabajadoresFiltrados.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay trabajadores para mostrar resumen</p></div>';
            return;
        }
        
        // Primero calcular resumen por tipo de trabajo (antes de filtrar por trabajador)
        const resumenPorTrabajo = {};
        let totalGeneral = 0;
        
        trabajadoresFiltrados.forEach(trabajador => {
            const registros = this.obtenerRegistrosTrabajador(trabajador.id);
            let registrosFiltrados = registros;
            if (mes !== null && anio !== null) {
                registrosFiltrados = registros.filter(r => {
                    const fecha = new Date(r.fecha);
                    return fecha.getMonth() === mes && fecha.getFullYear() === anio;
                });
            } else if (anio !== null) {
                registrosFiltrados = registros.filter(r => {
                    const fecha = new Date(r.fecha);
                    return fecha.getFullYear() === anio;
                });
            }
            
            // Filtrar por tipo de trabajo si está seleccionado
            if (trabajoFiltro) {
                registrosFiltrados = registrosFiltrados.filter(r => (r.trabajo || 'No especificado') === trabajoFiltro);
            }
            
            registrosFiltrados.forEach(r => {
                const trabajo = r.trabajo || 'No especificado';
                if (!resumenPorTrabajo[trabajo]) {
                    resumenPorTrabajo[trabajo] = {
                        horas: 0,
                        sueldo: 0,
                        dias: 0,
                        trabajadores: new Set()
                    };
                }
                resumenPorTrabajo[trabajo].horas += r.horas;
                // Usar sueldoTotal si existe (nuevo sistema), sino calcular (compatibilidad)
                const sueldoTotal = r.sueldoTotal !== undefined ? r.sueldoTotal : (r.horas * (r.tarifaHora || r.salarioHora || trabajador.tarifaHora || trabajador.salarioHora || 0));
                resumenPorTrabajo[trabajo].sueldo += sueldoTotal;
                resumenPorTrabajo[trabajo].dias += 1;
                resumenPorTrabajo[trabajo].trabajadores.add(trabajador.id);
            });
        });
        
        // Mostrar resumen por tipo de trabajo PRIMERO (más destacado)
        let html = '';
        if (Object.keys(resumenPorTrabajo).length > 0) {
            html += '<div style="margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, var(--verde-fondo-claro) 0%, var(--verde-fondo-muy-claro) 100%); border-radius: 10px; border: 2px solid var(--verde-medio);">';
            html += '<h2 style="color: var(--verde-oscuro); margin-bottom: 20px; text-align: center;"><i class="fas fa-seedling"></i> Resumen por Tipo de Trabajo</h2>';
            html += '<div class="resumen-trabajo-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px;">';
            
            Object.entries(resumenPorTrabajo).sort((a, b) => b[1].sueldo - a[1].sueldo).forEach(([trabajo, datos]) => {
                totalGeneral += datos.sueldo;
                html += `
                    <div class="resumen-trabajo-item" style="background: var(--blanco); padding: 20px; border-radius: 10px; border: 2px solid var(--verde-medio); box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3 style="color: var(--verde-oscuro); margin-bottom: 15px; font-size: 1.2em; text-align: center;">
                            <i class="fas fa-seedling"></i> ${trabajo}
                        </h3>
                        <div style="font-size: 1em; text-align: center;">
                            <div style="margin-bottom: 8px;">
                                <strong style="color: var(--gris-medio);">${datos.horas.toFixed(1)}</strong>
                                <span style="color: var(--gris-claro); font-size: 0.9em;"> horas</span>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <strong style="color: var(--gris-medio);">${datos.dias}</strong>
                                <span style="color: var(--gris-claro); font-size: 0.9em;"> días</span>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <strong style="color: var(--gris-medio);">${datos.trabajadores.size}</strong>
                                <span style="color: var(--gris-claro); font-size: 0.9em;"> trabajadores</span>
                            </div>
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid var(--verde-medio);">
                                <div style="font-size: 1.3em; font-weight: bold; color: var(--verde-oscuro);">
                                    ${Utils.formatearMoneda(datos.sueldo)}
                                </div>
                                <div style="font-size: 0.85em; color: var(--gris-claro); margin-top: 5px;">Total</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            if (totalGeneral > 0) {
                html += `<div style="text-align: center; padding-top: 15px; border-top: 2px solid var(--verde-medio); margin-top: 15px;">
                    <div style="font-size: 1.5em; font-weight: bold; color: var(--verde-oscuro);">
                        Total General: ${Utils.formatearMoneda(totalGeneral)}
                    </div>
                </div>`;
            }
            html += '</div>';
        }
        
        // Ahora mostrar resumen por trabajador
        totalGeneral = 0;
        
        trabajadoresFiltrados.forEach(trabajador => {
            const registros = this.obtenerRegistrosTrabajador(trabajador.id);
            let registrosFiltrados = registros;
            if (mes !== null && anio !== null) {
                registrosFiltrados = registros.filter(r => {
                    const fecha = new Date(r.fecha);
                    return fecha.getMonth() === mes && fecha.getFullYear() === anio;
                });
            } else if (anio !== null) {
                registrosFiltrados = registros.filter(r => {
                    const fecha = new Date(r.fecha);
                    return fecha.getFullYear() === anio;
                });
            }
            
            // Filtrar por tipo de trabajo si está seleccionado
            if (trabajoFiltro) {
                registrosFiltrados = registrosFiltrados.filter(r => (r.trabajo || 'No especificado') === trabajoFiltro);
            }
            
            let sueldo = 0;
            const horas = registrosFiltrados.reduce((sum, r) => sum + r.horas, 0);
            registrosFiltrados.forEach(r => {
                const sueldoTotal = r.sueldoTotal !== undefined ? r.sueldoTotal : (r.horas * (r.tarifaHora || r.salarioHora || trabajador.tarifaHora || trabajador.salarioHora || 0));
                sueldo += sueldoTotal;
            });

            totalGeneral += sueldo;

            const devengadoTotal = this.calcularSueldoTrabajador(trabajador.id);
            const totalPagadoHist = this.calcularTotalPagosTrabajador(trabajador.id);
            const pendienteGlobal = this.calcularSaldoPendienteTrabajador(trabajador.id);
            
            html += `
                <div class="resumen-item">
                    <h3>${trabajador.nombre}</h3>
                    <div class="resumen-detalle">
                        <div class="resumen-detalle-item">
                            <strong>${horas.toFixed(1)}</strong>
                            <span>Horas Trabajadas</span>
                        </div>
                        <div class="resumen-detalle-item">
                            <strong>${Utils.formatearNumero(trabajador.tarifaHora || 0)}€/h</strong>
                            <span>Tarifa Horaria</span>
                        </div>
                        <div class="resumen-detalle-item">
                            <strong>${registrosFiltrados.length}</strong>
                            <span>Días Registrados</span>
                        </div>
                        <div class="resumen-detalle-item">
                            <strong>${Utils.formatearMoneda(sueldo)}</strong>
                            <span>Sueldo Total (período filtrado)</span>
                        </div>
                        <div class="resumen-detalle-item">
                            <strong>${Utils.formatearMoneda(devengadoTotal)}</strong>
                            <span>Devengado total (todas las horas)</span>
                        </div>
                        <div class="resumen-detalle-item">
                            <strong>${Utils.formatearMoneda(totalPagadoHist)}</strong>
                            <span>Total pagado</span>
                        </div>
                        <div class="resumen-detalle-item">
                            <strong style="color:${pendienteGlobal < 0 ? '#c0392b' : 'inherit'}">${Utils.formatearMoneda(pendienteGlobal)}</strong>
                            <span>Pendiente (devengado − pagos)</span>
                        </div>
                    </div>
                    <div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;">
                        <button type="button" class="btn btn-success" onclick="AppGestion.mostrarModalRegistrarPago('${trabajador.id}')" style="padding: 8px 15px; font-size: 0.9em;">
                            <i class="fas fa-money-bill-wave"></i> Pagar
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="AppGestion.verHistorialPagosTrabajador('${trabajador.id}')" style="padding: 8px 15px; font-size: 0.9em;">
                            <i class="fas fa-list-alt"></i> Historial pagos
                        </button>
                        <button class="btn btn-secondary" onclick="AppGestion.verRegistrosTrabajador('${trabajador.id}')" style="padding: 8px 15px; font-size: 0.9em;">
                            <i class="fas fa-list"></i> Ver Registros
                        </button>
                    </div>
                </div>
            `;
        });
        
        if (html && totalGeneral > 0) {
            html += '<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--verde-medio);">';
            html += '<h3 style="color: var(--verde-oscuro); margin-bottom: 15px;"><i class="fas fa-users"></i> Resumen por Trabajador</h3>';
        }
        
        container.innerHTML = html || '<div class="empty-state"><p>No hay registros para el período seleccionado</p></div>';
    },
    
    // Ver registros de un trabajador
    verRegistrosTrabajador(trabajadorId, vistaCalendario = false) {
        const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
        const registros = this.obtenerRegistrosTrabajador(trabajadorId).sort((a, b) => 
            new Date(b.fecha) - new Date(a.fecha)
        );
        
        if (registros.length === 0) {
            Modal.alert('Este trabajador no tiene registros de horas', 'info');
            return;
        }
        
        let contenido = `
            <div style="margin-bottom: 15px;">
                <button class="btn btn-secondary" onclick="AppGestion.verRegistrosTrabajador('${trabajadorId}', false)" style="margin-right: 5px;">
                    <i class="fas fa-list"></i> Lista
                </button>
                <button class="btn btn-secondary" onclick="AppGestion.verRegistrosTrabajador('${trabajadorId}', true)">
                    <i class="fas fa-calendar"></i> Calendario
                </button>
            </div>
        `;
        
        if (vistaCalendario) {
            contenido += this.generarVistaCalendario(registros, trabajador);
        } else {
            // Aplicar filtro de búsqueda si existe
            const busquedaRegistros = document.getElementById('buscarRegistros')?.value.toLowerCase().trim() || '';
            let registrosFiltrados = registros;
            
            if (busquedaRegistros) {
                registrosFiltrados = registros.filter(r => {
                    const fecha = Utils.formatearFecha(r.fecha).toLowerCase();
                    const trabajo = (r.trabajo || '').toLowerCase();
                    const notas = (r.notas || '').toLowerCase();
                    const horas = r.horas.toString();
                    const horasExtras = (r.horasExtras || 0).toString();
                    const bonificacion = (r.bonificacion || 0).toString();
                    const descuento = (r.descuento || 0).toString();
                    
                    return fecha.includes(busquedaRegistros) ||
                           trabajo.includes(busquedaRegistros) ||
                           notas.includes(busquedaRegistros) ||
                           horas.includes(busquedaRegistros) ||
                           horasExtras.includes(busquedaRegistros) ||
                           bonificacion.includes(busquedaRegistros) ||
                           descuento.includes(busquedaRegistros);
                });
            }
            
            contenido += `<h4>Registros de ${trabajador.nombre}${busquedaRegistros ? ` (${registrosFiltrados.length} encontrados)` : ''}</h4><div style="max-height: 400px; overflow-y: auto;">`;
            
            if (registrosFiltrados.length === 0) {
                contenido += '<p style="text-align: center; color: var(--gris-medio); padding: 20px;">No se encontraron registros que coincidan con la búsqueda.</p>';
            } else {
                registrosFiltrados.forEach(r => {
                    const fecha = Utils.formatearFecha(r.fecha);
                    const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                    const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                    const sueldoNormal = r.horas * salarioHora;
                    const horasExtras = r.horasExtras || 0;
                    const sueldoExtras = horasExtras * salarioHoraExtra;
                    const bonificacion = r.bonificacion || 0;
                    const descuento = r.descuento || 0;
                    const sueldoTotal = sueldoNormal + sueldoExtras + bonificacion - descuento;
                    
                    contenido += `
                        <div class="registro-horas-item">
                            <div>
                                <strong>${fecha}</strong> - ${r.horas} horas
                                ${horasExtras > 0 ? ` + ${horasExtras} extras` : ''}
                                - ${Utils.formatearMoneda(sueldoTotal)}
                                ${r.trabajo ? `<br><small><i class="fas fa-seedling"></i> Trabajo: ${r.trabajo}</small>` : ''}
                                ${bonificacion > 0 ? `<br><small style="color: #28a745;"><i class="fas fa-gift"></i> Bonificación: ${Utils.formatearMoneda(bonificacion)}</small>` : ''}
                                ${descuento > 0 ? `<br><small style="color: #dc3545;"><i class="fas fa-minus-circle"></i> Descuento: ${Utils.formatearMoneda(descuento)}</small>` : ''}
                                ${r.notas ? `<br><small>${r.notas}</small>` : ''}
                            </div>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-primary" onclick="AppGestion.editarRegistro('${r.id}')" style="padding: 5px 10px; font-size: 0.9em;" data-tooltip="Editar registro">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger" onclick="AppGestion.eliminarRegistro('${r.id}', '${trabajadorId}')" style="padding: 5px 10px; font-size: 0.9em;" data-tooltip="Eliminar registro">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
            contenido += '</div>';
        }
        
        const botones = `
            <button class="btn btn-primary" onclick="AppGestion.generarReporteTrabajador('${trabajadorId}')">
                <i class="fas fa-file-pdf"></i> Generar Reporte
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        `;
        Modal.mostrar('Registros de Horas', contenido, { botones });
    },
    
    // Generar vista de calendario
    generarVistaCalendario(registros, trabajador) {
        const hoy = new Date();
        const mes = hoy.getMonth();
        const anio = hoy.getFullYear();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        const diasEnMes = ultimoDia.getDate();
        const diaInicio = primerDia.getDay();
        
        // Crear mapa de registros por fecha
        const registrosPorFecha = {};
        registros.forEach(r => {
            const fecha = new Date(r.fecha);
            if (fecha.getMonth() === mes && fecha.getFullYear() === anio) {
                const dia = fecha.getDate();
                if (!registrosPorFecha[dia]) registrosPorFecha[dia] = [];
                registrosPorFecha[dia].push(r);
            }
        });
        
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        let html = `
            <div class="calendario-container">
                <h4>${meses[mes]} ${anio} - ${trabajador.nombre}</h4>
                <div class="calendario-grid">
                    ${diasSemana.map(dia => `<div class="calendario-dia-semana">${dia}</div>`).join('')}
        `;
        
        // Espacios vacíos al inicio
        for (let i = 0; i < diaInicio; i++) {
            html += '<div class="calendario-dia-vacio"></div>';
        }
        
        // Días del mes
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const tieneRegistro = registrosPorFecha[dia];
            const totalHoras = tieneRegistro ? tieneRegistro.reduce((sum, r) => sum + r.horas, 0) : 0;
            // Calcular sueldo usando el salario de cada registro
            let sueldo = 0;
            if (tieneRegistro) {
                tieneRegistro.forEach(r => {
                    const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                    const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                    const sueldoNormal = r.horas * salarioHora;
                    const horasExtras = r.horasExtras || 0;
                    const sueldoExtras = horasExtras * salarioHoraExtra;
                    const bonificacion = r.bonificacion || 0;
                    const descuento = r.descuento || 0;
                    sueldo += sueldoNormal + sueldoExtras + bonificacion - descuento;
                });
            }
            
            html += `
                <div class="calendario-dia ${tieneRegistro ? 'con-registro' : ''}" 
                     onclick="${tieneRegistro ? `AppGestion.verDetalleDia('${trabajador.id}', ${dia}, ${mes}, ${anio})` : ''}">
                    <div class="calendario-dia-numero">${dia}</div>
                    ${tieneRegistro ? `
                        <div class="calendario-dia-info">
                            <small>${totalHoras}h</small>
                            <small>${Utils.formatearMoneda(sueldo)}</small>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        html += '</div></div>';
        return html;
    },
    
    // Ver detalle de un día
    verDetalleDia(trabajadorId, dia, mes, anio) {
        const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
        const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const registros = this.registrosHoras.filter(r => 
            r.trabajadorId === trabajadorId && r.fecha === fechaStr
        );
        
        if (registros.length === 0) return;
        
        let contenido = `<h4>${Utils.formatearFecha(fechaStr)} - ${trabajador.nombre}</h4>`;
            registros.forEach(r => {
                const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                const sueldoNormal = r.horas * salarioHora;
                const horasExtras = r.horasExtras || 0;
                const sueldoExtras = horasExtras * salarioHoraExtra;
                const bonificacion = r.bonificacion || 0;
                const descuento = r.descuento || 0;
                const sueldo = sueldoNormal + sueldoExtras + bonificacion - descuento;
                contenido += `
                    <div class="registro-horas-item">
                        <div>
                            <strong>${r.horas} horas</strong> - ${Utils.formatearMoneda(sueldo)}
                            ${r.trabajo ? `<br><small><i class="fas fa-seedling"></i> Trabajo: ${r.trabajo}</small>` : ''}
                            ${r.notas ? `<br><small>${r.notas}</small>` : ''}
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-primary" onclick="AppGestion.editarRegistro('${r.id}')" style="padding: 5px 10px; font-size: 0.9em;" data-tooltip="Editar registro">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger" onclick="AppGestion.eliminarRegistro('${r.id}')" style="padding: 5px 10px; font-size: 0.9em;" data-tooltip="Eliminar registro">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        
        const botones = `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>`;
        Modal.mostrar('Detalle del Día', contenido, { botones });
    },
    
    // Exportar trabajadores a PDF
    async exportarTrabajadoresPDF() {
        try {
            this.mostrarCarga('Generando PDF de trabajadores...');
            
            // Cargar jsPDF dinámicamente
            if (typeof window.jspdf === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let y = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 14;
            const lineHeight = 7;
            
            // Encabezado
            doc.setFontSize(20);
            doc.setTextColor(45, 80, 22);
            doc.text('Lista de Trabajadores Registrados', margin, y);
            y += 10;
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Fecha de Generación: ${Utils.formatearFecha(new Date().toISOString())}`, margin, y);
            y += 8;
            doc.text(`Total de Trabajadores: ${this.trabajadores.length}`, margin, y);
            y += 10;
            
            // Línea separadora
            doc.setDrawColor(74, 124, 42);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;
            
            // Trabajadores activos primero
            const trabajadoresActivos = this.trabajadores.filter(t => (t.estado || 'activo') === 'activo');
            const trabajadoresInactivos = this.trabajadores.filter(t => (t.estado || 'activo') !== 'activo');
            
            if (trabajadoresActivos.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(45, 80, 22);
                doc.text('TRABAJADORES ACTIVOS', margin, y);
                y += 10;
                
                trabajadoresActivos.forEach((trabajador, index) => {
                    // Verificar si necesitamos nueva página
                    if (y > pageHeight - 80) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    // Información del trabajador
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(45, 80, 22);
                    doc.text(`${index + 1}. ${trabajador.nombre}`, margin, y);
                    y += 8;
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(0, 0, 0);
                    
                    let x = margin;
                    const col1Width = 48;
                    const col2Width = 62;
                    const tarifaPdf = parseFloat(trabajador.tarifaHora != null ? trabajador.tarifaHora : trabajador.salarioHora) || 0;

                    doc.text('Teléfono:', x, y);
                    doc.text(trabajador.telefono || '-', x + col1Width, y);
                    doc.text('Contratación:', x + col1Width + col2Width, y);
                    doc.text(trabajador.fechaContratacion ? Utils.formatearFecha(trabajador.fechaContratacion) : '-', x + col1Width + col2Width + col1Width, y);
                    y += lineHeight;

                    doc.text('Tipo de trabajo:', x, y);
                    doc.text((trabajador.tipoTrabajo || '-').substring(0, 36), x + col1Width, y);
                    doc.text('Estado:', x + col1Width + col2Width, y);
                    const estadoAct = (trabajador.estado || 'activo').charAt(0).toUpperCase() + (trabajador.estado || 'activo').slice(1);
                    doc.text(estadoAct, x + col1Width + col2Width + col1Width, y);
                    y += lineHeight;

                    doc.text('Tarifa/h:', x, y);
                    doc.text(tarifaPdf > 0 ? `${Utils.formatearMoneda(tarifaPdf)}` : '— (configurar en Editar)', x + col1Width, y);
                    y += lineHeight;

                    if ((trabajador.cedula || '').trim()) {
                        doc.text('DNI (hist.):', x, y);
                        doc.text(String(trabajador.cedula).substring(0, 28), x + col1Width, y);
                        y += lineHeight;
                    }
                    
                    // Línea separadora entre trabajadores
                    y += 3;
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, y, doc.internal.pageSize.width - margin, y);
                    y += 8;
                });
            }
            
            // Trabajadores inactivos
            if (trabajadoresInactivos.length > 0) {
                // Verificar si necesitamos nueva página
                if (y > pageHeight - 60) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(100, 100, 100);
                doc.text('TRABAJADORES INACTIVOS/BAJA', margin, y);
                y += 10;
                
                trabajadoresInactivos.forEach((trabajador, index) => {
                    // Verificar si necesitamos nueva página
                    if (y > pageHeight - 80) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    // Información del trabajador (mismo formato pero con texto más claro)
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(100, 100, 100);
                    doc.text(`${index + 1}. ${trabajador.nombre}`, margin, y);
                    y += 8;
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(0, 0, 0);
                    
                    let x = margin;
                    const col1Width = 48;
                    const col2Width = 62;
                    const tarifaIna = parseFloat(trabajador.tarifaHora != null ? trabajador.tarifaHora : trabajador.salarioHora) || 0;

                    doc.text('Teléfono:', x, y);
                    doc.text(trabajador.telefono || '-', x + col1Width, y);
                    doc.text('Contratación:', x + col1Width + col2Width, y);
                    doc.text(trabajador.fechaContratacion ? Utils.formatearFecha(trabajador.fechaContratacion) : '-', x + col1Width + col2Width + col1Width, y);
                    y += lineHeight;

                    doc.text('Tipo de trabajo:', x, y);
                    doc.text((trabajador.tipoTrabajo || '-').substring(0, 36), x + col1Width, y);
                    doc.text('Estado:', x + col1Width + col2Width, y);
                    const estadoIna = (trabajador.estado || 'activo').charAt(0).toUpperCase() + (trabajador.estado || 'activo').slice(1);
                    doc.text(estadoIna, x + col1Width + col2Width + col1Width, y);
                    y += lineHeight;

                    doc.text('Tarifa/h:', x, y);
                    doc.text(tarifaIna > 0 ? `${Utils.formatearMoneda(tarifaIna)}` : '—', x + col1Width, y);
                    y += lineHeight;
                    
                    // Línea separadora
                    y += 3;
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, y, doc.internal.pageSize.width - margin, y);
                    y += 8;
                });
            }
            
            // Guardar PDF
            const nombreArchivo = `trabajadores_registrados_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nombreArchivo);
            
            this.ocultarCarga();
            Modal.alert('PDF de trabajadores generado exitosamente', 'success');
        } catch (error) {
            this.ocultarCarga();
            Modal.alert('Error al generar PDF: ' + error.message, 'error');
            console.error(error);
        }
    },
    
    // Exportar PDF individual de un trabajador
    async exportarTrabajadorIndividualPDF(trabajadorId) {
        try {
            this.mostrarCarga('Generando PDF del trabajador...');
            
            const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
            if (!trabajador) {
                this.ocultarCarga();
                Modal.alert('Trabajador no encontrado', 'error');
                return;
            }
            
            // Cargar jsPDF dinámicamente
            if (typeof window.jspdf === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let y = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 14;
            const lineHeight = 7;
            
            // Encabezado
            doc.setFontSize(20);
            doc.setTextColor(45, 80, 22);
            doc.text('Datos del Trabajador', margin, y);
            y += 10;
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Fecha de Generación: ${Utils.formatearFecha(new Date().toISOString())}`, margin, y);
            y += 10;
            
            // Línea separadora
            doc.setDrawColor(74, 124, 42);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;
            
            // Información personal
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(45, 80, 22);
            doc.text('INFORMACIÓN PERSONAL', margin, y);
            y += 10;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            
            let x = margin;
            const labelWidth = 55;
            const maxLineWidth = doc.internal.pageSize.width - margin - x - labelWidth;
            
            // Nombre (una sola columna, con salto de línea si es largo)
            doc.setFont(undefined, 'bold');
            doc.text('Nombre Completo:', x, y);
            doc.setFont(undefined, 'normal');
            const nombreLines = doc.splitTextToSize(trabajador.nombre || '-', maxLineWidth);
            doc.text(nombreLines, x + labelWidth, y);
            y += (nombreLines.length * lineHeight) + 2;
            
            // Teléfono
            doc.setFont(undefined, 'bold');
            doc.text('Teléfono:', x, y);
            doc.setFont(undefined, 'normal');
            const telLines = doc.splitTextToSize(trabajador.telefono || '-', maxLineWidth);
            doc.text(telLines, x + labelWidth, y);
            y += (telLines.length * lineHeight) + 2;

            doc.setFont(undefined, 'bold');
            doc.text('Fecha de Contratación:', x, y);
            doc.setFont(undefined, 'normal');
            const fcLines = doc.splitTextToSize(
                trabajador.fechaContratacion ? Utils.formatearFecha(trabajador.fechaContratacion) : '-',
                maxLineWidth
            );
            doc.text(fcLines, x + labelWidth, y);
            y += (fcLines.length * lineHeight) + 2;

            if ((trabajador.cedula || '').trim()) {
                doc.setFont(undefined, 'bold');
                doc.text('DNI (hist.):', x, y);
                doc.setFont(undefined, 'normal');
                const cedulaLines = doc.splitTextToSize(String(trabajador.cedula), maxLineWidth);
                doc.text(cedulaLines, x + labelWidth, y);
                y += (cedulaLines.length * lineHeight) + 2;
            }

            y += 3;
            
            // Información laboral
            if (y > pageHeight - 50) {
                doc.addPage();
                y = 20;
            }
            
            doc.setDrawColor(74, 124, 42);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;
            
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(45, 80, 22);
            doc.text('INFORMACIÓN LABORAL', margin, y);
            y += 10;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            
            // Tipo de trabajo
            doc.setFont(undefined, 'bold');
            doc.text('Tipo de Trabajo:', x, y);
            doc.setFont(undefined, 'normal');
            const tipoTrabajoLines = doc.splitTextToSize(trabajador.tipoTrabajo || '-', maxLineWidth);
            doc.text(tipoTrabajoLines, x + labelWidth, y);
            y += (tipoTrabajoLines.length * lineHeight) + 2;
            
            // Estado
            doc.setFont(undefined, 'bold');
            doc.text('Estado:', x, y);
            doc.setFont(undefined, 'normal');
            const estado = (trabajador.estado || 'activo').charAt(0).toUpperCase() + (trabajador.estado || 'activo').slice(1);
            const estadoLines = doc.splitTextToSize(estado, maxLineWidth);
            doc.text(estadoLines, x + labelWidth, y);
            y += (estadoLines.length * lineHeight) + 2;

            const tarifaInd = parseFloat(trabajador.tarifaHora != null ? trabajador.tarifaHora : trabajador.salarioHora) || 0;
            doc.setFont(undefined, 'bold');
            doc.text('Tarifa por hora (€):', x, y);
            doc.setFont(undefined, 'normal');
            const tarifaTxt = tarifaInd > 0 ? Utils.formatearMoneda(tarifaInd) : '—';
            doc.text(tarifaTxt, x + labelWidth, y);
            y += lineHeight + 5;
            
            // Guardar PDF
            const nombreArchivo = `trabajador_${trabajador.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nombreArchivo);
            
            this.ocultarCarga();
            Modal.alert('PDF del trabajador generado exitosamente', 'success');
        } catch (error) {
            this.ocultarCarga();
            Modal.alert('Error al generar PDF: ' + error.message, 'error');
            console.error(error);
        }
    },
    
    // Generar reporte detallado de trabajador
    generarReporteTrabajador(trabajadorId) {
        const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
        const registros = this.obtenerRegistrosTrabajador(trabajadorId).sort((a, b) => 
            new Date(a.fecha) - new Date(b.fecha)
        );
        
        if (registros.length === 0) {
            Modal.alert('Este trabajador no tiene registros', 'info');
            return;
        }
        
        // Agrupar por mes
        const porMes = {};
        registros.forEach(r => {
            const fecha = new Date(r.fecha);
            const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            if (!porMes[clave]) {
                porMes[clave] = {
                    mes: fecha.getMonth(),
                    anio: fecha.getFullYear(),
                    registros: [],
                    totalHoras: 0,
                    totalSueldo: 0
                };
            }
            porMes[clave].registros.push(r);
            porMes[clave].totalHoras += r.horas;
            // Usar sueldoTotal si existe, sino calcular
            if (r.sueldoTotal !== undefined) {
                porMes[clave].totalSueldo += r.sueldoTotal;
            } else {
                const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                const sueldoNormal = r.horas * salarioHora;
                const horasExtras = r.horasExtras || 0;
                const sueldoExtras = horasExtras * salarioHoraExtra;
                const bonificacion = r.bonificacion || 0;
                const descuento = r.descuento || 0;
                porMes[clave].totalSueldo += sueldoNormal + sueldoExtras + bonificacion - descuento;
            }
        });
        
        let contenido = `
            <div style="max-height: 500px; overflow-y: auto;">
                <h4>Reporte Detallado - ${trabajador.nombre}</h4>
                <p><strong>Teléfono:</strong> ${trabajador.telefono || '—'}</p>
                <hr>
        `;
        
        Object.values(porMes).sort((a, b) => {
            if (a.anio !== b.anio) return b.anio - a.anio;
            return b.mes - a.mes;
        }).forEach(mesData => {
            contenido += `
                <div class="reporte-mes">
                    <h5>${Utils.obtenerNombreMes(mesData.mes)} ${mesData.anio}</h5>
                    <table style="width: 100%; margin: 10px 0;">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Trabajo</th>
                                <th>Horas</th>
                                <th>Sueldo</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            mesData.registros.forEach(r => {
                const sueldo = r.sueldoTotal !== undefined
                    ? r.sueldoTotal
                    : r.horas * (r.tarifaHora || r.salarioHora || trabajador.tarifaHora || trabajador.salarioHora || 0);
                contenido += `
                    <tr>
                        <td>${Utils.formatearFecha(r.fecha)}</td>
                        <td>${r.trabajo || '-'}</td>
                        <td>${r.horas}</td>
                        <td>${Utils.formatearMoneda(sueldo)}</td>
                        <td>${r.notas || '-'}</td>
                    </tr>
                `;
            });
            
            contenido += `
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold;">
                                <td>Total</td>
                                <td></td>
                                <td>${mesData.totalHoras.toFixed(1)}</td>
                                <td>${Utils.formatearMoneda(mesData.totalSueldo)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        });
        
        contenido += '</div>';
        
        const botones = `
            <button class="btn btn-primary" onclick="AppGestion.exportarReporteTrabajador('${trabajadorId}')">
                <i class="fas fa-download"></i> Exportar PDF
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        `;
        Modal.mostrar('Reporte Detallado', contenido, { botones });
    },
    
    // Exportar reporte de trabajador a PDF
    async exportarReporteTrabajador(trabajadorId) {
        try {
            this.mostrarCarga('Generando reporte PDF...');
            
            // Cargar jsPDF dinámicamente
            if (typeof window.jspdf === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
            if (!trabajador) {
                this.ocultarCarga();
                Modal.alert('Trabajador no encontrado', 'error');
                return;
            }
            
            const registros = this.obtenerRegistrosTrabajador(trabajadorId).sort((a, b) => 
                new Date(a.fecha) - new Date(b.fecha)
            );
            
            if (registros.length === 0) {
                this.ocultarCarga();
                Modal.alert('Este trabajador no tiene registros', 'info');
                return;
            }
            
            // Agrupar por mes
            const porMes = {};
            registros.forEach(r => {
                const fecha = new Date(r.fecha);
                const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
                if (!porMes[clave]) {
                    porMes[clave] = {
                        mes: fecha.getMonth(),
                        anio: fecha.getFullYear(),
                        registros: [],
                        totalHoras: 0,
                        totalSueldo: 0
                    };
                }
                porMes[clave].registros.push(r);
                porMes[clave].totalHoras += r.horas;
                if (r.sueldoTotal !== undefined) {
                    porMes[clave].totalSueldo += r.sueldoTotal;
                } else {
                    const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                    const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                    const sueldoNormal = r.horas * salarioHora;
                    const horasExtras = r.horasExtras || 0;
                    const sueldoExtras = horasExtras * salarioHoraExtra;
                    const bonificacion = r.bonificacion || 0;
                    const descuento = r.descuento || 0;
                    porMes[clave].totalSueldo += sueldoNormal + sueldoExtras + bonificacion - descuento;
                }
            });
            
            let y = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 14;
            const lineHeight = 7;
            
            // Encabezado
            doc.setFontSize(18);
            doc.setTextColor(45, 80, 22);
            doc.text('Reporte Detallado de Trabajador', margin, y);
            y += 10;
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Trabajador: ${trabajador.nombre}`, margin, y);
            y += lineHeight;
            doc.text(`Teléfono: ${trabajador.telefono || '—'}`, margin, y);
            y += lineHeight;
            doc.text(`Fecha de Generación: ${Utils.formatearFecha(new Date().toISOString())}`, margin, y);
            y += 10;
            
            // Línea separadora
            doc.setDrawColor(74, 124, 42);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;
            
            // Ordenar meses
            const mesesOrdenados = Object.values(porMes).sort((a, b) => {
                if (a.anio !== b.anio) return b.anio - a.anio;
                return b.mes - a.mes;
            });
            
            mesesOrdenados.forEach((mesData, indexMes) => {
                // Verificar si necesitamos nueva página
                if (y > pageHeight - 60) {
                    doc.addPage();
                    y = 20;
                }
                
                // Título del mes
                doc.setFontSize(14);
                doc.setTextColor(45, 80, 22);
                doc.text(`${Utils.obtenerNombreMes(mesData.mes)} ${mesData.anio}`, margin, y);
                y += 8;
                
                // Encabezados de tabla
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                const colWidths = [40, 35, 30, 40, 45];
                const headers = ['Fecha', 'Trabajo', 'Horas', 'Sueldo', 'Notas'];
                
                // Fondo para encabezados
                doc.setFillColor(240, 247, 237);
                doc.rect(margin, y - 5, doc.internal.pageSize.width - (margin * 2), 8, 'F');
                
                let x = margin;
                headers.forEach((header, i) => {
                    doc.setFont(undefined, 'bold');
                    doc.text(header, x, y);
                    x += colWidths[i];
                });
                y += 10;
                
                // Datos del mes
                doc.setFont(undefined, 'normal');
                mesData.registros.forEach(r => {
                    // Verificar si necesitamos nueva página
                    if (y > pageHeight - 20) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    const fecha = Utils.formatearFecha(r.fecha);
                    const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                    const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                    const sueldoNormal = r.horas * salarioHora;
                    const horasExtras = r.horasExtras || 0;
                    const sueldoExtras = horasExtras * salarioHoraExtra;
                    const bonificacion = r.bonificacion || 0;
                    const descuento = r.descuento || 0;
                    const sueldo = sueldoNormal + sueldoExtras + bonificacion - descuento;
                    const trabajo = (r.trabajo || '-').substring(0, 15);
                    const notas = (r.notas || '').substring(0, 25); // Limitar longitud
                    
                    x = margin;
                    doc.text(fecha.substring(0, 12), x, y);
                    x += colWidths[0];
                    doc.text(trabajo, x, y);
                    x += 35;
                    doc.text(r.horas.toString(), x, y);
                    x += colWidths[1];
                    doc.text(Utils.formatearMoneda(sueldo), x, y);
                    x += colWidths[2];
                    doc.text(notas || '-', x, y);
                    
                    y += lineHeight;
                });
                
                // Total del mes
                if (y > pageHeight - 15) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFont(undefined, 'bold');
                doc.setFillColor(232, 245, 224);
                doc.rect(margin, y - 5, doc.internal.pageSize.width - (margin * 2), 8, 'F');
                
                x = margin;
                doc.text('Total', x, y);
                x += colWidths[0] + 35;
                doc.text(mesData.totalHoras.toFixed(1), x, y);
                x += colWidths[1];
                doc.text(Utils.formatearMoneda(mesData.totalSueldo), x, y);
                y += 15;
            });
            
            // Resumen general
            if (y > pageHeight - 40) {
                doc.addPage();
                y = 20;
            }
            
            const totalHoras = registros.reduce((sum, r) => sum + r.horas, 0);
            const totalSueldo = totalHoras * trabajador.salarioHora;
            
            doc.setDrawColor(74, 124, 42);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(45, 80, 22);
            doc.text('RESUMEN GENERAL', margin, y);
            y += 10;
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`Total de Registros: ${registros.length} días`, margin, y);
            y += lineHeight;
            doc.text(`Total de Horas: ${totalHoras.toFixed(1)} horas`, margin, y);
            y += lineHeight;
            doc.text(`Total de Sueldo: ${Utils.formatearMoneda(totalSueldo)}`, margin, y);
            
            // Guardar PDF
            const nombreArchivo = `reporte_${trabajador.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nombreArchivo);
            
            this.ocultarCarga();
            Modal.alert('Reporte PDF generado exitosamente', 'success');
        } catch (error) {
            this.ocultarCarga();
            Modal.alert('Error al generar el reporte: ' + error.message, 'error');
            console.error(error);
        }
    },
    
    // Mostrar indicador de carga
    mostrarCarga(mensaje = 'Procesando...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 20px;">${mensaje}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },
    
    // Ocultar indicador de carga
    ocultarCarga() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.remove();
    },
    
    // Actualizar dashboard
    actualizarDashboard() {
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        
        // Calcular mes anterior
        const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
        const anioAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
        
        // Total trabajadores
        document.getElementById('stat-trabajadores').textContent = this.trabajadores.length;
        
        // Horas del mes actual
        const horasMes = this.registrosHoras
            .filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
            })
            .reduce((sum, r) => sum + r.horas, 0);
        document.getElementById('stat-horas-mes').textContent = horasMes.toFixed(1);
        
        // Sueldo del mes actual
        let sueldoMes = 0;
        this.trabajadores.forEach(t => {
            sueldoMes += this.calcularSueldoTrabajador(t.id, mesActual, anioActual);
        });
        document.getElementById('stat-sueldo-mes').textContent = Utils.formatearMoneda(sueldoMes);
        
        // Días registrados del mes actual
        const diasMes = new Set(this.registrosHoras
            .filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
            })
            .map(r => r.fecha)
        ).size;
        document.getElementById('stat-dias-registrados').textContent = diasMes;
        
        // COMPARATIVA CON MES ANTERIOR
        // Horas del mes anterior
        const horasMesAnterior = this.registrosHoras
            .filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getMonth() === mesAnterior && fecha.getFullYear() === anioAnterior;
            })
            .reduce((sum, r) => sum + r.horas, 0);
        
        // Sueldo del mes anterior
        let sueldoMesAnterior = 0;
        this.trabajadores.forEach(t => {
            sueldoMesAnterior += this.calcularSueldoTrabajador(t.id, mesAnterior, anioAnterior);
        });
        
        // Días registrados del mes anterior
        const diasMesAnterior = new Set(this.registrosHoras
            .filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getMonth() === mesAnterior && fecha.getFullYear() === anioAnterior;
            })
            .map(r => r.fecha)
        ).size;
        
        // Mostrar comparativa de horas
        const cambioHoras = horasMesAnterior > 0 ? ((horasMes - horasMesAnterior) / horasMesAnterior * 100) : 0;
        document.getElementById('stat-horas-comparativa').textContent = horasMes.toFixed(1);
        const horasCambioEl = document.getElementById('stat-horas-cambio');
        if (horasMesAnterior > 0) {
            const cambioAbs = horasMes - horasMesAnterior;
            const cambioPorcentaje = Math.abs(cambioHoras).toFixed(1);
            horasCambioEl.textContent = `${cambioAbs >= 0 ? '+' : ''}${cambioAbs.toFixed(1)}h (${cambioPorcentaje}%)`;
            horasCambioEl.className = 'stat-change ' + (cambioHoras >= 0 ? 'stat-change-positive' : 'stat-change-negative');
        } else {
            horasCambioEl.textContent = 'Sin datos previos';
            horasCambioEl.className = 'stat-change';
        }
        
        // Mostrar comparativa de sueldo
        const cambioSueldo = sueldoMesAnterior > 0 ? ((sueldoMes - sueldoMesAnterior) / sueldoMesAnterior * 100) : 0;
        document.getElementById('stat-sueldo-comparativa').textContent = Utils.formatearMoneda(sueldoMes);
        const sueldoCambioEl = document.getElementById('stat-sueldo-cambio');
        if (sueldoMesAnterior > 0) {
            const cambioAbs = sueldoMes - sueldoMesAnterior;
            const cambioPorcentaje = Math.abs(cambioSueldo).toFixed(1);
            sueldoCambioEl.textContent = `${cambioAbs >= 0 ? '+' : ''}${Utils.formatearMoneda(cambioAbs)} (${cambioPorcentaje}%)`;
            sueldoCambioEl.className = 'stat-change ' + (cambioSueldo >= 0 ? 'stat-change-positive' : 'stat-change-negative');
        } else {
            sueldoCambioEl.textContent = 'Sin datos previos';
            sueldoCambioEl.className = 'stat-change';
        }
        
        // Mostrar comparativa de días
        const cambioDias = diasMesAnterior > 0 ? ((diasMes - diasMesAnterior) / diasMesAnterior * 100) : 0;
        document.getElementById('stat-dias-comparativa').textContent = diasMes;
        const diasCambioEl = document.getElementById('stat-dias-cambio');
        if (diasMesAnterior > 0) {
            const cambioAbs = diasMes - diasMesAnterior;
            const cambioPorcentaje = Math.abs(cambioDias).toFixed(1);
            diasCambioEl.textContent = `${cambioAbs >= 0 ? '+' : ''}${cambioAbs} días (${cambioPorcentaje}%)`;
            diasCambioEl.className = 'stat-change ' + (cambioDias >= 0 ? 'stat-change-positive' : 'stat-change-negative');
        } else {
            diasCambioEl.textContent = 'Sin datos previos';
            diasCambioEl.className = 'stat-change';
        }
    },
    
    // Generar reporte anual
    generarReporteAnual(anio = null) {
        if (!anio) {
            anio = new Date().getFullYear();
        }
        
        const trabajadores = this.trabajadores;
        const registros = this.registrosHoras.filter(r => {
            const fecha = new Date(r.fecha);
            return fecha.getFullYear() === anio;
        });
        
        if (registros.length === 0) {
            Modal.alert(`No hay registros para el año ${anio}`, 'info');
            return;
        }
        
        let contenido = `
            <div style="max-height: 600px; overflow-y: auto;">
                <h4>Reporte Anual ${anio}</h4>
                <hr>
        `;
        
        // Resumen general
        let totalHorasAnual = 0;
        let totalSueldoAnual = 0;
        
        trabajadores.forEach(trabajador => {
            const registrosTrabajador = registros.filter(r => r.trabajadorId === trabajador.id);
            const horas = registrosTrabajador.reduce((sum, r) => sum + r.horas, 0);
            const sueldo = horas * trabajador.salarioHora;
            totalHorasAnual += horas;
            totalSueldoAnual += sueldo;
        });
        
        contenido += `
            <div class="reporte-mes">
                <h5>Resumen General</h5>
                <p><strong>Total Trabajadores:</strong> ${trabajadores.length}</p>
                <p><strong>Total Horas:</strong> ${totalHorasAnual.toFixed(1)}</p>
                <p><strong>Total Sueldo:</strong> ${Utils.formatearMoneda(totalSueldoAnual)}</p>
            </div>
        `;
        
        // Por trabajador
        trabajadores.forEach(trabajador => {
            const registrosTrabajador = registros.filter(r => r.trabajadorId === trabajador.id);
            if (registrosTrabajador.length === 0) return;
            
            const horas = registrosTrabajador.reduce((sum, r) => sum + r.horas, 0);
            const sueldo = horas * trabajador.salarioHora;
            
            // Agrupar por mes
            const porMes = {};
            registrosTrabajador.forEach(r => {
                const fecha = new Date(r.fecha);
                const mes = fecha.getMonth();
                if (!porMes[mes]) {
                    porMes[mes] = { horas: 0, sueldo: 0 };
                }
                porMes[mes].horas += r.horas;
                if (r.sueldoTotal !== undefined) {
                    porMes[mes].sueldo += r.sueldoTotal;
                } else {
                    const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                    const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                    const sueldoNormal = r.horas * salarioHora;
                    const horasExtras = r.horasExtras || 0;
                    const sueldoExtras = horasExtras * salarioHoraExtra;
                    const bonificacion = r.bonificacion || 0;
                    const descuento = r.descuento || 0;
                    porMes[mes].sueldo += sueldoNormal + sueldoExtras + bonificacion - descuento;
                }
            });
            
            contenido += `
                <div class="reporte-mes">
                    <h5>${trabajador.nombre}</h5>
                    <p><strong>Total Anual:</strong> ${horas.toFixed(1)} horas - ${Utils.formatearMoneda(sueldo)}</p>
                    <table style="width: 100%; margin: 10px 0;">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Horas</th>
                                <th>Sueldo</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (let mes = 0; mes < 12; mes++) {
                if (porMes[mes]) {
                    contenido += `
                        <tr>
                            <td>${Utils.obtenerNombreMes(mes)}</td>
                            <td>${porMes[mes].horas.toFixed(1)}</td>
                            <td>${Utils.formatearMoneda(porMes[mes].sueldo)}</td>
                        </tr>
                    `;
                }
            }
            
            contenido += `
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        contenido += '</div>';
        
        const botones = `
            <button class="btn btn-primary" onclick="AppGestion.exportarReporteAnual(${anio})">
                <i class="fas fa-download"></i> Exportar PDF
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        `;
        Modal.mostrar(`Reporte Anual ${anio}`, contenido, { botones });
    },
    
    // Exportar reporte anual
    async exportarReporteAnual(anio) {
        try {
            this.mostrarCarga('Generando reporte anual PDF...');
            
            // Cargar jsPDF dinámicamente
            if (typeof window.jspdf === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const trabajadores = this.trabajadores;
            const registros = this.registrosHoras.filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getFullYear() === anio;
            });
            
            if (registros.length === 0) {
                this.ocultarCarga();
                Modal.alert(`No hay registros para el año ${anio}`, 'info');
                return;
            }
            
            let y = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 14;
            const lineHeight = 7;
            
            // Encabezado
            doc.setFontSize(20);
            doc.setTextColor(45, 80, 22);
            doc.text(`Reporte Anual ${anio}`, margin, y);
            y += 10;
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Fecha de Generación: ${Utils.formatearFecha(new Date().toISOString())}`, margin, y);
            y += 10;
            
            // Resumen general
            let totalHorasAnual = 0;
            let totalSueldoAnual = 0;
            
            trabajadores.forEach(trabajador => {
                const registrosTrabajador = registros.filter(r => r.trabajadorId === trabajador.id);
                const horas = registrosTrabajador.reduce((sum, r) => sum + r.horas, 0);
                const sueldo = horas * trabajador.salarioHora;
                totalHorasAnual += horas;
                totalSueldoAnual += sueldo;
            });
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(45, 80, 22);
            doc.text('RESUMEN GENERAL', margin, y);
            y += 8;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`Total de Trabajadores: ${trabajadores.length}`, margin, y);
            y += lineHeight;
            doc.text(`Total de Horas: ${totalHorasAnual.toFixed(1)} horas`, margin, y);
            y += lineHeight;
            doc.text(`Total de Sueldo: ${Utils.formatearMoneda(totalSueldoAnual)}`, margin, y);
            y += 10;
            
            // Línea separadora
            doc.setDrawColor(74, 124, 42);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;
            
            // Por trabajador
            trabajadores.forEach((trabajador, indexTrab) => {
                const registrosTrabajador = registros.filter(r => r.trabajadorId === trabajador.id);
                if (registrosTrabajador.length === 0) return;

                const tarifaTrab = parseFloat(trabajador.tarifaHora != null ? trabajador.tarifaHora : trabajador.salarioHora) || 0;
                const horas = registrosTrabajador.reduce((sum, r) => sum + r.horas, 0);
                const sueldo = registrosTrabajador.reduce((sum, r) => {
                    if (r.sueldoTotal !== undefined) return sum + r.sueldoTotal;
                    const t = r.tarifaHora || r.salarioHora || tarifaTrab;
                    return sum + r.horas * t;
                }, 0);
                
                // Verificar si necesitamos nueva página
                if (y > pageHeight - 80) {
                    doc.addPage();
                    y = 20;
                }
                
                // Título del trabajador
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(45, 80, 22);
                doc.text(`${indexTrab + 1}. ${trabajador.nombre}`, margin, y);
                y += 8;
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(`Teléfono: ${trabajador.telefono || '—'}`, margin, y);
                y += lineHeight;
                doc.text(`Tarifa/h: ${tarifaTrab > 0 ? Utils.formatearMoneda(tarifaTrab) : '—'}`, margin, y);
                y += lineHeight;
                doc.text(`Total Anual: ${horas.toFixed(1)} horas - ${Utils.formatearMoneda(sueldo)}`, margin, y);
                y += 8;
                
                // Agrupar por mes
                const porMes = {};
                registrosTrabajador.forEach(r => {
                    const fecha = new Date(r.fecha);
                    const mes = fecha.getMonth();
                    if (!porMes[mes]) {
                        porMes[mes] = { horas: 0, sueldo: 0 };
                    }
                    porMes[mes].horas += r.horas;
                    const tReg = r.tarifaHora || r.salarioHora || tarifaTrab;
                    if (r.sueldoTotal !== undefined) {
                        porMes[mes].sueldo += r.sueldoTotal;
                    } else {
                        porMes[mes].sueldo += r.horas * tReg;
                    }
                });
                
                // Tabla de meses
                const colWidths = [50, 40, 50];
                const headers = ['Mes', 'Horas', 'Sueldo'];
                
                // Encabezados
                doc.setFillColor(240, 247, 237);
                doc.rect(margin, y - 5, doc.internal.pageSize.width - (margin * 2), 8, 'F');
                
                let x = margin;
                headers.forEach((header, i) => {
                    doc.setFont(undefined, 'bold');
                    doc.text(header, x, y);
                    x += colWidths[i];
                });
                y += 10;
                
                // Datos por mes
                doc.setFont(undefined, 'normal');
                for (let mes = 0; mes < 12; mes++) {
                    if (porMes[mes]) {
                        if (y > pageHeight - 20) {
                            doc.addPage();
                            y = 20;
                        }
                        
                        x = margin;
                        doc.text(Utils.obtenerNombreMes(mes), x, y);
                        x += colWidths[0];
                        doc.text(porMes[mes].horas.toFixed(1), x, y);
                        x += colWidths[1];
                        doc.text(Utils.formatearMoneda(porMes[mes].sueldo), x, y);
                        y += lineHeight;
                    }
                }
                
                y += 10;
            });
            
            // Guardar PDF
            const nombreArchivo = `reporte_anual_${anio}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nombreArchivo);
            
            this.ocultarCarga();
            Modal.alert('Reporte anual PDF generado exitosamente', 'success');
        } catch (error) {
            this.ocultarCarga();
            Modal.alert('Error al generar el reporte anual: ' + error.message, 'error');
            console.error(error);
        }
    },
    
    // Backup automático
    crearBackupAutomatico() {
        const backup = {
            trabajadores: this.trabajadores,
            registrosHoras: this.registrosHoras,
            pagosTrabajadores: this.pagosTrabajadores,
            fecha: new Date().toISOString()
        };
        localStorage.setItem('backup_automatico', JSON.stringify(backup));
    },
    
    // Mostrar opciones de backup
    mostrarBackup() {
        const contenido = `
            <p>Gestión de respaldos de datos:</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                <button class="btn btn-primary" onclick="AppGestion.exportarBackup()">
                    <i class="fas fa-download"></i> Exportar Backup
                </button>
                <button class="btn btn-secondary" onclick="AppGestion.importarBackup()">
                    <i class="fas fa-upload"></i> Restaurar desde Backup
                </button>
                <button class="btn btn-danger" onclick="AppGestion.limpiarDatos()">
                    <i class="fas fa-trash"></i> Limpiar Todos los Datos
                </button>
            </div>
        `;
        const botones = `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>`;
        Modal.mostrar('Gestión de Backup', contenido, { botones });
    },
    
    // Exportar backup
    exportarBackup() {
        const backup = {
            trabajadores: this.trabajadores,
            registrosHoras: this.registrosHoras,
            pagosTrabajadores: this.pagosTrabajadores,
            fecha: new Date().toISOString(),
            version: '1.1'
        };
        Utils.exportarJSON(backup, `backup_trabajadores_${new Date().toISOString().split('T')[0]}.json`);
        document.querySelector('.modal-overlay')?.remove();
        Modal.alert('Backup exportado exitosamente', 'success');
    },
    
    // Importar backup
    importarBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const archivo = e.target.files[0];
            if (!archivo) return;
            
            Utils.importarJSON(archivo, (error, datos) => {
                if (error) {
                    Modal.alert('Error al importar backup: ' + error.message, 'error');
                    return;
                }
                
                if (datos.trabajadores && datos.registrosHoras) {
                    Modal.confirm(
                        '¿Está seguro de restaurar este backup? Se reemplazarán todos los datos actuales.',
                        () => {
                            this.trabajadores = datos.trabajadores;
                            this.registrosHoras = datos.registrosHoras;
                            this.pagosTrabajadores = Array.isArray(datos.pagosTrabajadores) ? datos.pagosTrabajadores : [];
                            this.guardarDatos();
                            this.trabajadoresFiltrados = [...this.trabajadores];
                            this.actualizarInterfaz();
                            document.querySelector('.modal-overlay')?.remove();
                            Modal.alert('Backup restaurado exitosamente', 'success');
                        }
                    );
                } else {
                    Modal.alert('Formato de backup inválido', 'error');
                }
            });
        };
        input.click();
    },
    
    // Limpiar todos los datos
    limpiarDatos() {
        Modal.confirm(
            '¿Está SEGURO de eliminar TODOS los datos? Esta acción no se puede deshacer.',
            () => {
                this.trabajadores = [];
                this.registrosHoras = [];
                this.pagosTrabajadores = [];
                this.trabajadoresFiltrados = [];
                this.guardarDatos();
                this.actualizarInterfaz();
                document.querySelector('.modal-overlay')?.remove();
                Modal.alert('Todos los datos han sido eliminados', 'success');
            }
        );
    },
    
    // Toggle tema oscuro
    toggleTema() {
        document.body.classList.toggle('tema-oscuro');
        const icono = document.getElementById('icono-tema');
        if (icono) {
            icono.classList.toggle('fa-moon');
            icono.classList.toggle('fa-sun');
        }
        localStorage.setItem('temaOscuro', document.body.classList.contains('tema-oscuro'));
    },
    
    // Cargar tema guardado
    cargarTema() {
        const temaOscuro = localStorage.getItem('temaOscuro') === 'true';
        if (temaOscuro) {
            document.body.classList.add('tema-oscuro');
            const icono = document.getElementById('icono-tema');
            if (icono) {
                icono.classList.remove('fa-moon');
                icono.classList.add('fa-sun');
            }
        }
    },
    
    // Actualizar select de tipos de trabajo
    actualizarSelectTiposTrabajo() {
        const selects = ['tipoTrabajo', 'trabajoRegistro'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const valorActual = select.value;
                // Asegurarse de que tiposTrabajo tenga valores
                if (!this.tiposTrabajo || this.tiposTrabajo.length === 0) {
                    this.tiposTrabajo = ['Aceitunas', 'Espárragos', 'Tomates', 'Pimientos', 'Fresas', 'Lechuga', 'Cebolla', 'Ajo'];
                }
                select.innerHTML = '<option value="">Seleccione un tipo de trabajo</option>' +
                    this.tiposTrabajo.map(t => `<option value="${t}">${t}</option>`).join('') +
                    '<option value="Otro">Otro</option>';
                if (valorActual) {
                    select.value = valorActual;
                }
            } else {
                console.warn(`Select con ID "${selectId}" no encontrado`);
            }
        });
    },
    
    // Registrar cambio en historial
    registrarCambio(tipo, accion, id, descripcion) {
        const cambio = {
            id: Utils.generarId(),
            tipo: tipo, // 'trabajador' o 'registro'
            accion: accion, // 'crear', 'editar', 'eliminar'
            idObjeto: id,
            descripcion: descripcion,
            fecha: new Date().toISOString(),
            usuario: 'Sistema' // En una app real, aquí iría el usuario actual
        };
        this.historialCambios.push(cambio);
        // Mantener solo los últimos 1000 cambios
        if (this.historialCambios.length > 1000) {
            this.historialCambios = this.historialCambios.slice(-1000);
        }
    },
    
    // Duplicar trabajador
    duplicarTrabajador(id) {
        const trabajador = this.trabajadores.find(t => t.id === id);
        if (!trabajador) return;
        
        const cedulaBase = (trabajador.cedula != null ? String(trabajador.cedula) : '').trim();
        const nuevoTrabajador = {
            ...trabajador,
            id: Utils.generarId(),
            nombre: trabajador.nombre + ' (Copia)',
            cedula: cedulaBase ? `${cedulaBase}_${Date.now()}` : '',
            fechaRegistro: new Date().toISOString()
        };
        
        this.trabajadores.push(nuevoTrabajador);
        this.registrarCambio('trabajador', 'crear', nuevoTrabajador.id, `Trabajador ${nuevoTrabajador.nombre} duplicado desde ${trabajador.nombre}`);
        this.guardarDatos();
        this.trabajadoresFiltrados = [...this.trabajadores];
        this.actualizarInterfaz();
        Modal.alert('Trabajador duplicado exitosamente', 'success');
    },
    
    // Mostrar configuración
    mostrarConfiguracion() {
        const seccion = document.getElementById('seccionConfiguracion');
        if (seccion.style.display === 'none') {
            seccion.style.display = 'block';
            this.actualizarVistaTiposTrabajo();
        } else {
            seccion.style.display = 'none';
        }
    },
    
    // Actualizar vista de tipos de trabajo
    actualizarVistaTiposTrabajo() {
        const container = document.getElementById('tiposTrabajoConfig');
        if (!container) return;
        
        container.innerHTML = this.tiposTrabajo.map((tipo, index) => `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: var(--verde-fondo-claro); border-radius: 5px;">
                <span style="flex: 1;">${tipo}</span>
                <button class="btn btn-danger" onclick="AppGestion.eliminarTipoTrabajo(${index})" style="padding: 5px 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },
    
    // Agregar tipo de trabajo
    agregarTipoTrabajo() {
        Modal.prompt('Ingrese el nombre del nuevo tipo de trabajo:', '', (nombre) => {
            if (nombre && nombre.trim()) {
                const nombreTrim = nombre.trim();
                if (this.tiposTrabajo.includes(nombreTrim)) {
                    Modal.alert('Este tipo de trabajo ya existe', 'warning');
                    return;
                }
                this.tiposTrabajo.push(nombreTrim);
                this.guardarDatos();
                this.actualizarSelectTiposTrabajo();
                this.actualizarVistaTiposTrabajo();
                Modal.alert('Tipo de trabajo agregado', 'success');
            }
        });
    },
    
    // Eliminar tipo de trabajo
    eliminarTipoTrabajo(index) {
        const tipo = this.tiposTrabajo[index];
        Modal.confirm(
            `¿Está seguro de eliminar el tipo de trabajo "${tipo}"?`,
            () => {
                this.tiposTrabajo.splice(index, 1);
                this.guardarDatos();
                this.actualizarSelectTiposTrabajo();
                this.actualizarVistaTiposTrabajo();
                Modal.alert('Tipo de trabajo eliminado', 'success');
            }
        );
    },
    
    // Inicializar recordatorios
    inicializarRecordatorios() {
        // Guardar configuración cuando cambie
        const recordatorioDiario = document.getElementById('recordatorioDiario');
        const alertasSinRegistro = document.getElementById('alertasSinRegistro');
        const diasAlerta = document.getElementById('diasAlerta');
        
        if (recordatorioDiario) {
            recordatorioDiario.addEventListener('change', () => this.guardarConfiguracion());
        }
        if (alertasSinRegistro) {
            alertasSinRegistro.addEventListener('change', () => {
                this.guardarConfiguracion();
                if (alertasSinRegistro.checked) {
                    this.verificarTrabajadoresSinRegistro();
                }
            });
        }
        if (diasAlerta) {
            diasAlerta.addEventListener('change', () => this.guardarConfiguracion());
        }
        
        // Verificar recordatorios al cargar
        this.verificarRecordatorios();
    },
    
    // Verificar recordatorios
    verificarRecordatorios() {
        const config = JSON.parse(localStorage.getItem('configuracion') || '{}');
        
        if (config.recordatorioDiario) {
            const ultimoRecordatorio = localStorage.getItem('ultimoRecordatorio');
            const hoy = new Date().toISOString().split('T')[0];
            if (ultimoRecordatorio !== hoy) {
                const trabajadoresActivos = this.trabajadores.filter(t => (t.estado || 'activo') === 'activo');
                if (trabajadoresActivos.length > 0) {
                    const registrosHoy = this.registrosHoras.filter(r => r.fecha === hoy).length;
                    if (registrosHoy === 0) {
                        Modal.alert('Recordatorio: No se han registrado horas hoy. ¿Desea registrar horas ahora?', 'info');
                        localStorage.setItem('ultimoRecordatorio', hoy);
                    }
                }
            }
        }
        
        if (config.alertasSinRegistro) {
            this.verificarTrabajadoresSinRegistro();
        }
    },
    
    // Verificar trabajadores sin registros recientes
    verificarTrabajadoresSinRegistro() {
        const config = JSON.parse(localStorage.getItem('configuracion') || '{}');
        const diasAlerta = config.diasAlerta || 7;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasAlerta);
        
        const trabajadoresActivos = this.trabajadores.filter(t => (t.estado || 'activo') === 'activo');
        const trabajadoresSinRegistro = trabajadoresActivos.filter(t => {
            const ultimoRegistro = this.registrosHoras
                .filter(r => r.trabajadorId === t.id)
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
            
            if (!ultimoRegistro) return true;
            return new Date(ultimoRegistro.fecha) < fechaLimite;
        });
        
        if (trabajadoresSinRegistro.length > 0) {
            const nombres = trabajadoresSinRegistro.map(t => t.nombre).join(', ');
            Modal.alert(
                `Alerta: ${trabajadoresSinRegistro.length} trabajador(es) sin registros en los últimos ${diasAlerta} días:\n${nombres}`,
                'warning'
            );
        }
    },
    
    // Actualizar calcularSueldoTrabajador para incluir horas extras, bonificaciones, descuentos
    calcularSueldoTrabajadorActualizado(trabajadorId, mes = null, anio = null) {
        const trabajador = this.trabajadores.find(t => t.id === trabajadorId);
        if (!trabajador) return 0;
        
        let registros = this.registrosHoras.filter(r => r.trabajadorId === trabajadorId);
        
        if (mes !== null && anio !== null) {
            registros = registros.filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getMonth() === mes && fecha.getFullYear() === anio;
            });
        } else if (anio !== null) {
            registros = registros.filter(r => {
                const fecha = new Date(r.fecha);
                return fecha.getFullYear() === anio;
            });
        }
        
        let total = 0;
        registros.forEach(r => {
            if (r.sueldoTotal !== undefined) {
                total += r.sueldoTotal;
            } else {
                // Usar salario del registro si existe, sino del trabajador (compatibilidad)
                const salarioHora = r.salarioHora || trabajador.salarioHora || 0;
                const salarioHoraExtra = r.salarioHoraExtra || (trabajador.salarioHoraExtra || salarioHora * 1.5);
                const sueldoNormal = r.horas * salarioHora;
                const horasExtras = r.horasExtras || 0;
                const sueldoExtras = horasExtras * salarioHoraExtra;
                const bonificacion = r.bonificacion || 0;
                const descuento = r.descuento || 0;
                total += sueldoNormal + sueldoExtras + bonificacion - descuento;
            }
        });
        
        return total;
    }
};

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppGestion.init());
} else {
    AppGestion.init();
}
