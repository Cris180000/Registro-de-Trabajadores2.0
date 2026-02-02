// Sistema de Modales Personalizados

class Modal {
    static mostrar(titulo, contenido, opciones = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${titulo}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${contenido}
                </div>
                <div class="modal-footer">
                    ${opciones.botones || ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cerrar al hacer click fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Cerrar con ESC
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
        
        return modal;
    }
    
    static confirm(mensaje, onConfirm, onCancel = null) {
        const contenido = `<p>${mensaje}</p>`;
        const modalId = 'modal-' + Date.now();
        const botones = `
            <button class="btn btn-primary" id="${modalId}-confirm">Confirmar</button>
            <button class="btn btn-secondary" id="${modalId}-cancel">Cancelar</button>
        `;
        
        const modal = this.mostrar('Confirmar', contenido, { botones });
        
        document.getElementById(modalId + '-confirm').addEventListener('click', () => {
            modal.remove();
            if (onConfirm) onConfirm();
        });
        
        document.getElementById(modalId + '-cancel').addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });
        
        return modal;
    }
    
    static alert(mensaje, tipo = 'info') {
        const iconos = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const contenido = `<p class="modal-message modal-${tipo}"><span class="modal-icon">${iconos[tipo] || iconos.info}</span> ${mensaje}</p>`;
        const botones = `<button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Aceptar</button>`;
        
        return this.mostrar(tipo === 'error' ? 'Error' : tipo === 'success' ? 'Éxito' : 'Información', contenido, { botones });
    }
    
    static prompt(mensaje, valorInicial = '', onConfirm) {
        const inputId = 'modal-prompt-input-' + Date.now();
        const modalId = 'modal-prompt-' + Date.now();
        const contenido = `
            <p>${mensaje}</p>
            <input type="text" id="${inputId}" class="form-control" value="${valorInicial}" style="width: 100%; margin-top: 10px;">
        `;
        const botones = `
            <button class="btn btn-primary" id="${modalId}-ok">Aceptar</button>
            <button class="btn btn-secondary" id="${modalId}-cancel">Cancelar</button>
        `;
        
        const modal = this.mostrar('Entrada', contenido, { botones });
        
        document.getElementById(modalId + '-ok').addEventListener('click', () => {
            const input = document.getElementById(inputId);
            const value = input.value;
            modal.remove();
            if (onConfirm) onConfirm(value);
        });
        
        document.getElementById(modalId + '-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        // Focus en el input
        setTimeout(() => {
            const input = document.getElementById(inputId);
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
        
        return modal;
    }
}
