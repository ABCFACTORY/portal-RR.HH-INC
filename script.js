document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES GLOBALES ---
    const trackingTargetId = 'empleado-modal-container';
    const STORAGE_KEY = 'submittedForms';
    const DELETE_KEY = '1234'; 
    let formIdToDelete = null;

    // --- AJUSTE AUTOMÁTICO DE MODALES CON FORMULARIOS ---
    function applyScrollableForms() {
        document.querySelectorAll('.modal-content form').forEach(form => {
            const modalContent = form.closest('.modal-content');
            if (modalContent) {
                modalContent.style.maxHeight = '90vh';
                modalContent.style.overflowY = 'auto';
                modalContent.style.overflowX = 'hidden';
                modalContent.style.scrollBehavior = 'smooth';
            }
        });
    }
    applyScrollableForms();

    // --- CIERRE GLOBAL DE MODALES ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-container') && e.target.id !== 'beneficios-menu-modal') {
            e.target.classList.add('modal-hidden');
            if (e.target.id === 'security-key-modal') formIdToDelete = null;
        }
    });

    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', () => {
            const modalContainer = button.closest('.modal-container');
            modalContainer.classList.add('modal-hidden');

            const targetModalId = button.getAttribute('data-close-target');
            if (targetModalId) {
                const targetModal = document.getElementById(targetModalId);
                if (targetModal) targetModal.classList.remove('modal-hidden');
            }

            if (modalContainer.id === 'security-key-modal') formIdToDelete = null;
        });
    });

    // --- ABRIR MODALES ---
    document.querySelectorAll('[data-modal-target]').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-modal-target');
            const targetModal = document.getElementById(targetId);
            
            if (targetModal) {
                const parentModal = button.closest('.modal-container');
                if (parentModal && targetModal.id !== 'empleado-modal-container') {
                    parentModal.classList.add('modal-hidden');
                }

                if (targetId === trackingTargetId) {
                    displaySubmittedForms();
                    populateFilterOptions();
                }

                targetModal.classList.remove('modal-hidden');
                applyScrollableForms(); // 👈 Asegura que cualquier modal nuevo tenga scroll
            }
        });
    });

    // --- LOCALSTORAGE DE FORMULARIOS ---
    function loadForms() {
        try {
            const forms = localStorage.getItem(STORAGE_KEY);
            return forms ? JSON.parse(forms) : [];
        } catch (error) {
            console.error("Error loading forms from localStorage:", error);
            return [];
        }
    }

    function saveForms(forms) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
        } catch (error) {
            console.error("Error saving forms to localStorage:", error);
        }
    }

    function getNextId() {
        const forms = loadForms();
        if (forms.length === 0) return 1;
        const maxId = Math.max(...forms.map(f => f.id));
        return maxId + 1;
    }

    function getFormTitle(formElement) {
        const modal = formElement.closest('.modal-content');
        if (modal) {
            const h2 = modal.querySelector('h2');
            return h2 ? h2.textContent.trim() : 'Solicitud Desconocida';
        }
        return 'Solicitud Desconocida';
    }

    // --- ENVÍO DE FORMULARIOS ---
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (form.id === 'security-key-form') return;

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => data[key] = value);
            const formTitle = getFormTitle(form);

            const newForm = {
                id: getNextId(),
                type: formTitle,
                timestamp: new Date().toISOString(),
                dateSent: new Date().toLocaleDateString('es-ES'),
                status: 'Pendiente de Revisión',
                details: data
            };

            const forms = loadForms();
            forms.push(newForm);
            saveForms(forms);
            alert(`Solicitud "${formTitle}" enviada con éxito! ID: #${newForm.id}`);

            form.reset();
            form.closest('.modal-container').classList.add('modal-hidden');
        });
    });

    // --- PANEL DE SEGUIMIENTO ---
    function displaySubmittedForms(filterType = 'all', searchTerm = '') {
        const tasksBody = document.getElementById('task-list-details');
        if (!tasksBody) return;
        
        let forms = loadForms();
        if (filterType !== 'all') forms = forms.filter(form => form.type === filterType);

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            forms = forms.filter(form => 
                String(form.id).includes(lowerCaseSearch) ||
                form.type.toLowerCase().includes(lowerCaseSearch) ||
                form.status.toLowerCase().includes(lowerCaseSearch)
            );
        }

        if (forms.length === 0) {
            tasksBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay solicitudes registradas o que coincidan con la búsqueda.</td></tr>';
            return;
        }

        tasksBody.innerHTML = '';
        forms.sort((a, b) => b.id - a.id).forEach(form => {
            const statusClass = 'status-' + form.status.toLowerCase().replace(/ /g, '-').replace('de-revisión', 'pendiente');
            const row = tasksBody.insertRow();
            row.innerHTML = `
                <td>#${form.id}</td>
                <td>${form.type}</td>
                <td>${form.dateSent}</td>
                <td class="${statusClass}">${form.status}</td>
                <td>
                    <button class="secondary-btn view-form-btn" data-id="${form.id}">Ver Detalle</button>
                    <button class="submit-btn danger-btn-submit delete-form-btn" data-id="${form.id}">Borrar</button>
                </td>
            `;
        });
        
        attachTableEventHandlers();
    }

    function populateFilterOptions() {
        const forms = loadForms();
        const select = document.getElementById('filter-type');
        if (!select) return;

        select.innerHTML = '<option value="all">Todos los Tipos</option>';
        const uniqueTypes = [...new Set(forms.map(form => form.type))].sort();
        uniqueTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });
    }

    document.getElementById('filter-type')?.addEventListener('change', () => {
        const filterType = document.getElementById('filter-type').value;
        const searchTerm = document.getElementById('table-search-input').value;
        displaySubmittedForms(filterType, searchTerm);
    });

    document.getElementById('table-search-input')?.addEventListener('input', () => {
        const filterType = document.getElementById('filter-type').value;
        const searchTerm = document.getElementById('table-search-input').value;
        displaySubmittedForms(filterType, searchTerm);
    });

    // --- DETALLES Y BORRADO ---
    function attachTableEventHandlers() {
        document.querySelectorAll('.view-form-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                showFormDetails(id);
            });
        });
        
        document.querySelectorAll('.delete-form-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                formIdToDelete = parseInt(e.target.getAttribute('data-id'));
                const securityModal = document.getElementById('security-key-modal');
                document.getElementById('security-key-id-placeholder').textContent = `#${formIdToDelete}`;
                securityModal.classList.remove('modal-hidden');
            });
        });
    }

    function showFormDetails(id) {
        const forms = loadForms();
        const form = forms.find(f => f.id === id);
        if (!form) {
            alert('Detalle de solicitud no encontrado.');
            return;
        }

        const modal = document.getElementById('detalle-formulario-modal');
        const title = document.getElementById('detalle-titulo');
        const date = document.getElementById('detalle-fecha');
        const content = document.getElementById('detalle-contenido');

        title.textContent = `Detalle de Solicitud #${form.id}: ${form.type}`;
        date.innerHTML = `Enviada: ${form.dateSent} | Estado: <strong class="status-${form.status.toLowerCase().replace(/ /g, '-').replace('de-revisión', 'pendiente')}">${form.status}</strong>`;
        
        let detailsHtml = '<ul style="list-style-type: none; padding: 0;">';
        for (const [key, value] of Object.entries(form.details)) {
            const displayKey = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            detailsHtml += `<li><strong>${displayKey}:</strong> ${value}</li>`;
        }
        detailsHtml += '</ul>';
        content.innerHTML = detailsHtml;

        modal.classList.remove('modal-hidden');
        applyScrollableForms();
    }

    document.getElementById('security-key-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const enteredKey = document.getElementById('delete-key-input').value;
        const securityModal = document.getElementById('security-key-modal');
        
        if (enteredKey === DELETE_KEY && formIdToDelete !== null) {
            let forms = loadForms();
            const initialLength = forms.length;
            forms = forms.filter(f => f.id !== formIdToDelete);
            
            if (forms.length < initialLength) {
                saveForms(forms);
                alert(`Solicitud #${formIdToDelete} borrada permanentemente.`);
                displaySubmittedForms();
            } else {
                alert('Error: No se encontró la solicitud para borrar.');
            }
            
            securityModal.classList.add('modal-hidden');
            document.getElementById('delete-key-input').value = '';
            formIdToDelete = null;
        } else {
            alert('Clave de seguridad incorrecta. Inténtalo de nuevo.');
            document.getElementById('delete-key-input').value = '';
        }
    });
    
    document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
        document.getElementById('security-key-modal').classList.add('modal-hidden');
        document.getElementById('delete-key-input').value = '';
        formIdToDelete = null;
    });

    // --- BÚSQUEDA DE TARJETAS ---
    const searchInput = document.getElementById('search-input');
    const topicCards = document.querySelectorAll('.topic-card');

    searchInput?.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();
        topicCards.forEach(card => {
            const content = card.getAttribute('data-search-content').toLowerCase();
            const title = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = (content.includes(filter) || title.includes(filter)) ? 'flex' : 'none';
        });
    });
});
