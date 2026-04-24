<template>
  <AdminLayout>
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      
      <!-- CONTENEDOR DEL CALENDARIO (Lado Izquierdo) -->
      <div
        class="flex-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
      >
        <div class="custom-calendar w-full">
          <FullCalendar ref="calendarRef" class="min-h-screen" :options="calendarOptions" />
        </div>

        <!-- Modal para Ver/Eliminar Cita -->
        <Modal v-if="isOpen" @close="closeModal">
          <template #body>
            <div
              class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8 shadow-2xl z-[9999]"
            >
              <div class="flex justify-between items-center mb-5">
                <h5 class="font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
                  {{ selectedEvent ? 'Detalles de la Cita' : 'Agendar Cita' }}
                </h5>
                <button @click="closeModal" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  ✖
                </button>
              </div>
              
              <div class="mt-4 space-y-6">
                <!-- TRAMITE -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Trámite / Título
                  </label>
                  <input
                    v-model="eventTitle"
                    type="text"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>

                <!-- INFO CLIENTE -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Nombre del Cliente
                    </label>
                    <input
                      v-model="eventNombre"
                      type="text"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Celular
                    </label>
                    <input
                      v-model="eventCelular"
                      type="text"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>

                <!-- FECHAS -->
                <div class="grid grid-cols-1 gap-6">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Fecha y Hora de Cita
                    </label>
                    <input
                      v-model="eventStartDate"
                      type="datetime-local"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 mt-8 modal-footer sm:justify-end">
                <button
                  @click="closeModal"
                  class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto transition-colors"
                >
                  Cerrar
                </button>

                <button
                  v-if="selectedEvent"
                  @click="handleDeleteEvent"
                  class="flex w-full justify-center rounded-lg border border-error-500 bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 sm:w-auto transition-colors"
                >
                  Eliminar Cita
                </button>

                <button
                  @click="handleAddOrUpdateEvent"
                  class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto transition-colors"
                >
                  {{ selectedEvent ? 'Actualizar' : 'Agendar' }}
                </button>
              </div>
            </div>
          </template>
        </Modal>
      </div>

      <!-- PANEL LATERAL DE NOTIFICACIONES (Lado Derecho) -->
      <div class="w-full xl:w-80 2xl:w-96 flex-shrink-0 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
            <Bell class="w-5 h-5 text-brand-500" /> Solicitudes
          </h3>
          <span class="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ solicitudes.length }}</span>
        </div>
        
        <div class="space-y-4 max-h-screen overflow-y-auto no-scrollbar pb-10">
          
          <div v-if="solicitudes.length === 0" class="text-center py-10 text-gray-500 dark:text-gray-400 text-sm italic">
            No hay solicitudes pendientes.
          </div>

          <!-- Notificación Dinámica -->
          <div v-for="solicitud in solicitudes" :key="solicitud.id" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-theme-xs relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
            <div class="mb-3">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-bold tracking-wider uppercase text-warning-600 bg-warning-50 px-2 py-0.5 rounded-md dark:bg-warning-500/10 dark:text-warning-400">Pendiente</span>
                <span class="text-[10px] text-gray-400 font-medium">{{ formatDate(solicitud.created_at) }}</span>
              </div>
              
              <h4 class="font-bold text-gray-800 dark:text-white/90 text-base leading-tight mb-1">{{ solicitud.title }}</h4>
              <p class="text-sm font-medium text-brand-600 dark:text-brand-400 mb-2">{{ solicitud.nombre || 'Sin nombre' }}</p>
              
              <div class="space-y-1.5">
                <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <CalendarIcon stroke-width="2" class="w-3.5 h-3.5 text-gray-400" /> 
                  <span class="font-semibold">{{ formatEventDate(solicitud.start_date) }}</span>
                </p>
                <p v-if="solicitud.celular" class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Phone stroke-width="2" class="w-3.5 h-3.5 text-gray-400" /> 
                  {{ solicitud.celular }}
                </p>
              </div>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-4">
              <button @click="handleConfirmSolicitud(solicitud.id)" class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 text-xs font-semibold transition-colors">
                <Check class="w-3.5 h-3.5" /> Confirmar
              </button>
              <button @click="handleRejectSolicitud(solicitud.id)" class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-xs font-semibold transition-colors">
                <X class="w-3.5 h-3.5" /> Rechazar
              </button>
              <button @click="handleReagendar(solicitud)" class="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs font-semibold transition-colors mt-1">
                <Clock class="w-3.5 h-3.5" /> Reagendar
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from '@/components/ui/Modal.vue'
import { Bell, Check, X, Clock, Calendar as CalendarIcon, Phone } from 'lucide-vue-next'
import API_BASE_URL from '@/config/api'

const currentPageTitle = ref('Citas')

const calendarRef = ref(null)
const isOpen = ref(false)
const selectedEvent = ref(null)
const eventTitle = ref('')
const eventNombre = ref('')
const eventCelular = ref('')
const eventStartDate = ref('')
const events = ref([])
const solicitudes = ref([])


onMounted(async () => {
  await fetchCitas();
  await fetchSolicitudes();
})

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return isNaN(date) ? '' : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

const formatEventDate = (dateStr) => {
  if (!dateStr) return 'Fecha no definida';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

const fetchCitas = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/citas`);
    if (response.ok) {
      events.value = await response.json();
    }
  } catch (err) {
    console.error('Error fetching citas:', err);
  }
}

const fetchSolicitudes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/solicitudes`);
    if (response.ok) {
      solicitudes.value = await response.json();
    }
  } catch (err) {
    console.error('Error fetching solicitudes:', err);
  }
}

const handleConfirmSolicitud = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/solicitudes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' })
    });
    if (response.ok) {
      await fetchCitas();
      await fetchSolicitudes();
    }
  } catch (err) {
    console.error('Error confirming solicitud:', err);
  }
}

const handleRejectSolicitud = async (id) => {
  if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/solicitudes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });
    if (response.ok) {
      await fetchSolicitudes();
    }
  } catch (err) {
    console.error('Error rejecting solicitud:', err);
  }
}

const handleReagendar = (solicitud) => {
  resetModalFields()
  selectedEvent.value = { id: solicitud.id }
  eventTitle.value = solicitud.title
  eventNombre.value = solicitud.nombre || ''
  eventCelular.value = solicitud.celular || ''
  eventStartDate.value = solicitud.start_date?.split(' ')[0] || ''
  openModal()
}

const openModal = () => {
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  resetModalFields()
}

const resetModalFields = () => {
  eventTitle.value = ''
  eventNombre.value = ''
  eventCelular.value = ''
  eventStartDate.value = ''
  selectedEvent.value = null
}

const handleDateSelect = (selectInfo) => {
  resetModalFields()
  eventStartDate.value = selectInfo.startStr
  eventEndDate.value = selectInfo.endStr.includes('T') 
    ? selectInfo.endStr.split('T')[0] 
    : selectInfo.endStr || selectInfo.startStr
  openModal()
}

const handleEventClick = (clickInfo) => {
  const event = clickInfo.event
  selectedEvent.value = event
  eventTitle.value = event.title
  eventNombre.value = event.extendedProps.nombre || ''
  eventCelular.value = event.extendedProps.celular || ''
  
  if (event.start) {
    const tzOffset = event.start.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(event.start - tzOffset)).toISOString().slice(0, 16);
    eventStartDate.value = localISOTime;
  } else {
    eventStartDate.value = ''
  }
  openModal()
}

const handleAddOrUpdateEvent = async () => {
  if (!eventTitle.value || !eventStartDate.value) return;

  const eventData = {
    title: eventTitle.value,
    nombre: eventNombre.value,
    celular: eventCelular.value,
    start: eventStartDate.value,
    status: 'confirmado'
  }

  try {
    const isUpdate = selectedEvent.value && selectedEvent.value.id;
    const url = isUpdate 
      ? `${API_BASE_URL}/api/citas/${selectedEvent.value.id}` 
      : `${API_BASE_URL}/api/citas`;
    const method = isUpdate ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (response.ok) {
      await fetchCitas();
      await fetchSolicitudes(); // Refrescar por si era una reagenda
      closeModal();
    }
  } catch (err) {
    console.error('Error saving/updating cita:', err);
  }
}

const handleDeleteEvent = async () => {
  if (selectedEvent.value) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/citas/${selectedEvent.value.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchCitas();
        closeModal();
      }
    } catch (err) {
      console.error('Error deleting cita:', err);
    }
  }
}

const renderEventContent = (eventInfo) => {
  const colorClass = 'fc-bg-primary'
  const timeStr = eventInfo.event.start ? eventInfo.event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
  const nombre = eventInfo.event.extendedProps.nombre || '';
  
  return {
    html: `
      <div class="event-fc-color flex flex-col ${colorClass} p-2 rounded-lg w-full relative z-10 cursor-pointer overflow-hidden border-l-4 border-current">
        <div class="flex items-center justify-between mb-0.5">
          <span class="text-[10px] font-bold uppercase opacity-80">${timeStr}</span>
        </div>
        <div class="fc-event-title font-bold text-xs truncate">${eventInfo.event.title}</div>
        <div class="text-[10px] opacity-90 truncate">${nombre}</div>
      </div>
    `,
  }
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  locale: 'es', // Set calendar language to Spanish
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    list: 'Agenda'
  },
  events: events,
  selectable: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventContent: renderEventContent,
})
</script>

<style>
/* Refinamientos extra para FullCalendar en este template */
.fc-theme-standard .fc-scrollgrid {
  border-color: transparent !important;
}
.fc-theme-standard th, .fc-theme-standard td {
  border-color: #f3f4f6 !important;
}
.dark .fc-theme-standard th, .dark .fc-theme-standard td {
  border-color: #1f2937 !important;
}
.fullcalendar-right-sidebar .fc-toolbar.fc-header-toolbar {
  flex-wrap: wrap;
  gap: 0.5rem;
}
.fullcalendar-right-sidebar .fc-toolbar-chunk:first-child,
.fullcalendar-right-sidebar .fc-toolbar-chunk:last-child {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* --- SCROLLBAR CUSTOMIZATION --- */
/* Esto oculta las flechas nativas del scrollbar en Windows y estiliza la barra */
.fc-scroller::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.fc-scroller::-webkit-scrollbar-track {
  background: transparent;
}
.fc-scroller::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
.dark .fc-scroller::-webkit-scrollbar-thumb {
  background-color: #475569;
}
.fc-scroller::-webkit-scrollbar-button {
  display: none !important; /* Oculta las flechas arriba/abajo */
}

/* --- BOTONES DEL CALENDARIO --- */
.fc .fc-button-primary {
  background-color: #3b82f6 !important; /* Azul (blue-500) */
  border-color: #3b82f6 !important;
  text-transform: capitalize;
  font-weight: 500;
  box-shadow: none !important;
  color: #ffffff !important;
}
.fc .fc-button-primary:hover {
  background-color: #2563eb !important; /* Azul más oscuro (blue-600) al hacer hover */
  border-color: #2563eb !important;
}
.fc .fc-button-primary:disabled {
  opacity: 0.6;
}

/* Botones selectores de vista cuando no están activos */
.fc-header-toolbar.fc-toolbar .fc-toolbar-chunk:last-child .fc-button:not(.fc-button-active) {
  background-color: #e2e8f0 !important; /* Gris claro (slate-200) */
  border-color: #e2e8f0 !important;
  color: #475569 !important; /* Texto gris */
}
.fc-header-toolbar.fc-toolbar .fc-toolbar-chunk:last-child .fc-button:not(.fc-button-active):hover {
  background-color: #cbd5e1 !important; /* slate-300 al hacer hover */
}

/* Botón "Hoy" cuando no está activo */
.fc-header-toolbar.fc-toolbar .fc-toolbar-chunk:first-child .fc-button-primary:not(.fc-button-icon) {
   /* Dejar que mantenga el color azul por defecto, o se puede ajustar si es necesario */
}

/* --- TEXTO DEL CALENDARIO --- */
.fc-toolbar-title {
  color: #1e293b !important; /* Título del Mes/Año */
  font-weight: 700 !important;
}

/* Encabezados de los días (DOM, LUN, etc) */
.fc .fc-col-header-cell-cushion {
  color: #334155 !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
}

/* Números de los días */
.fc .fc-daygrid-day-number {
  color: #475569 !important;
  font-weight: 500 !important;
  padding: 10px !important;
}

/* Días de otros meses */
.fc .fc-day-other .fc-daygrid-day-number {
  color: #cbd5e1 !important;
}

/* Event Colors Based on Tailadmin Default Configuration */
.fc-v-event, .fc-daygrid-event {
  background: none !important;
  border: none !important;
  padding: 0 !important;
}

.fc-bg-primary { background-color: rgba(66, 133, 244, 0.1); color: #4285F4; border-color: #4285F4; }
.fc-bg-success { background-color: rgba(52, 168, 83, 0.1); color: #34A853; border-color: #34A853; }
.fc-bg-warning { background-color: rgba(251, 188, 5, 0.1); color: #FBBC05; border-color: #FBBC05; }
.fc-bg-danger { background-color: rgba(234, 67, 53, 0.1); color: #EA4335; border-color: #EA4335; }

.dark .fc-bg-primary { background-color: rgba(66, 133, 244, 0.2); }
.dark .fc-bg-success { background-color: rgba(52, 168, 83, 0.2); }
.dark .fc-bg-warning { background-color: rgba(251, 188, 5, 0.2); }
.dark .fc-bg-danger { background-color: rgba(234, 67, 53, 0.2); }

@media (min-width: 1280px) {
  .custom-calendar {
    min-width: 0; 
  }
}
</style>
