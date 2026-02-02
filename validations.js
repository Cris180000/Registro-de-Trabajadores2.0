// Validaciones Centralizadas

const Validaciones = {
    // Validar que no haya trabajador duplicado por DNI
    validarCedulaUnica(cedula, trabajadorIdExcluir = null) {
        const trabajadores = JSON.parse(localStorage.getItem('trabajadores') || '[]');
        const existe = trabajadores.some(t => 
            t.cedula.trim().toLowerCase() === cedula.trim().toLowerCase() && 
            t.id !== trabajadorIdExcluir
        );
        return {
            valido: !existe,
            mensaje: existe ? 'Ya existe un trabajador con este DNI' : ''
        };
    },
    
    // Validar que no se registren horas duplicadas para el mismo trabajador y fecha
    validarRegistroDuplicado(trabajadorId, fecha, registroIdExcluir = null) {
        const registros = JSON.parse(localStorage.getItem('registrosHoras') || '[]');
        const existe = registros.some(r => 
            r.trabajadorId === trabajadorId && 
            r.fecha === fecha && 
            r.id !== registroIdExcluir
        );
        return {
            valido: !existe,
            mensaje: existe ? 'Ya existe un registro de horas para este trabajador en esta fecha' : ''
        };
    },
    
    // Validar que la fecha no sea futura
    validarFechaNoFutura(fecha) {
        const fechaRegistro = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999); // Fin del día de hoy
        
        return {
            valido: fechaRegistro <= hoy,
            mensaje: fechaRegistro > hoy ? 'No se pueden registrar horas para fechas futuras' : ''
        };
    },
    
    // Validar límite de horas por día
    validarHorasMaximas(horas, maximo = 16) {
        const horasNum = parseFloat(horas);
        return {
            valido: horasNum > 0 && horasNum <= maximo,
            mensaje: horasNum <= 0 ? 'Las horas deben ser mayores a 0' : 
                     horasNum > maximo ? `No se pueden registrar más de ${maximo} horas por día` : ''
        };
    },
    
    // Validar nombre
    validarNombre(nombre) {
        const nombreTrim = nombre.trim();
        return {
            valido: nombreTrim.length >= 2 && nombreTrim.length <= 100,
            mensaje: nombreTrim.length < 2 ? 'El nombre debe tener al menos 2 caracteres' :
                     nombreTrim.length > 100 ? 'El nombre no puede exceder 100 caracteres' : ''
        };
    },
    
    // Validar DNI
    validarCedula(cedula) {
        const cedulaTrim = cedula.trim();
        return {
            valido: cedulaTrim.length >= 1,
            mensaje: cedulaTrim.length < 1 ? 'El DNI no puede estar vacío' : ''
        };
    },
    
    // Validar salario
    validarSalario(salario) {
        const salarioNum = parseFloat(salario);
        return {
            valido: !isNaN(salarioNum) && salarioNum > 0 && salarioNum <= 1000,
            mensaje: isNaN(salarioNum) ? 'El salario debe ser un número válido' :
                     salarioNum <= 0 ? 'El salario debe ser mayor a 0' :
                     salarioNum > 1000 ? 'El salario no puede exceder $1000 por hora' : ''
        };
    },
    
    // Validar fecha
    validarFecha(fecha) {
        const fechaObj = new Date(fecha);
        return {
            valido: !isNaN(fechaObj.getTime()),
            mensaje: isNaN(fechaObj.getTime()) ? 'La fecha no es válida' : ''
        };
    },
    
    // Validar email
    validarEmail(email) {
        if (!email || email.trim() === '') {
            return {
                valido: true, // Email es opcional
                mensaje: ''
            };
        }
        const emailTrim = email.trim();
        // Expresión regular básica para validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valido: emailRegex.test(emailTrim),
            mensaje: emailRegex.test(emailTrim) ? '' : 'El formato del email no es válido'
        };
    }
};
