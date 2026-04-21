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

        <!-- Modal para Agregar/Editar Cita -->
        <Modal v-if="isOpen" @close="closeModal">
          <template #body>
            <div
              class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8 shadow-2xl z-[9999]"
            >
              <div class="flex justify-between items-center mb-5">
                <h5 class="font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
                  {{ selectedEvent ? 'Editar Cita' : 'Agendar Cita' }}
                </h5>
                <button @click="closeModal" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  ✖
                </button>
              </div>
              
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Programa tus asesorías, firmas de escrituras o reuniones importantes.
              </p>

              <div class="mt-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Título de la Cita
                  </label>
                  <input
                    v-model="eventTitle"
                    type="text"
                    placeholder="Ej. Firma de Escrituras - Familia Pérez"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>

                <div class="mt-6">
                  <label class="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                    Tipo / Prioridad
                  </label>
                  <div class="flex flex-wrap items-center gap-4 sm:gap-5">
                    <div v-for="(value, key) in calendarsEvents" :key="key" class="n-chk">
                      <div :class="`form-check form-check-${value} form-check-inline`">
                        <label
                          class="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400 cursor-pointer"
                          :for="`modal${key}`"
                        >
                          <span class="relative">
                            <input
                              type="radio"
                              :name="'event-level'"
                              :value="key"
                              :id="`modal${key}`"
                              v-model="eventLevel"
                              class="sr-only form-check-input"
                            />
                            <span
                              class="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700"
                            >
                              <span :class="eventLevel === key ? 'w-2 h-2 rounded-full bg-brand-500' : 'w-2 h-2 rounded-full bg-transparent'"></span>
                            </span>
                          </span>
                          {{ key === 'Danger' ? 'Urgente' : key === 'Success' ? 'Completada' : key === 'Primary' ? 'Normal' : 'Aviso' }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Fecha de Inicio
                    </label>
                    <input
                      v-model="eventStartDate"
                      type="date"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Fecha Final
                    </label>
                    <input
                      v-model="eventEndDate"
                      type="date"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 mt-8 modal-footer sm:justify-end">
                <button
                  @click="closeModal"
                  class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto transition-colors"
                >
                  Cancelar
                </button>

                <button
                  @click="handleAddOrUpdateEvent"
                  class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto transition-colors"
                >
                  {{ selectedEvent ? 'Guardar Cambios' : 'Agendar' }}
                </button>

                <button
                  v-if="selectedEvent"
                  @click="handleDeleteEvent"
                  class="flex w-full justify-center rounded-lg border border-error-500 bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 sm:w-auto transition-colors ml-auto sm:ml-0"
                >
                  Eliminar
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
          <span class="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
        </div>
        
        <div class="space-y-4 max-h-screen overflow-y-auto no-scrollbar pb-10">
          
          <!-- Notificación 1 -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-theme-xs relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-warning-400"></div>
            <div class="mb-3">
              <span class="text-[11px] font-semibold tracking-wider uppercase text-warning-500 mb-1 block">Pendiente</span>
              <h4 class="font-bold text-gray-800 dark:text-white/90 text-sm">Firma de Escritura - Sra. Gómez</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                <CalendarIcon stroke-width="2" class="w-3.5 h-3.5" /> 25 Abr 2026 - 10:00 AM
              </p>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-4">
              <button class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 text-xs font-semibold transition-colors">
                <Check class="w-3.5 h-3.5" /> Confirmar
              </button>
              <button class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-xs font-semibold transition-colors">
                <X class="w-3.5 h-3.5" /> Rechazar
              </button>
              <button class="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs font-semibold transition-colors mt-1">
                <Clock class="w-3.5 h-3.5" /> Reagendar
              </button>
            </div>
          </div>

          <!-- Notificación 2 -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-theme-xs relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-warning-400"></div>
            <div class="mb-3">
              <span class="text-[11px] font-semibold tracking-wider uppercase text-warning-500 mb-1 block">Pendiente</span>
              <h4 class="font-bold text-gray-800 dark:text-white/90 text-sm">Asesoría Legal (Civil) - Héctor M.</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                <CalendarIcon stroke-width="2" class="w-3.5 h-3.5" /> 26 Abr 2026 - 13:30 PM
              </p>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-4">
              <button class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 text-xs font-semibold transition-colors">
                <Check class="w-3.5 h-3.5" /> Confirmar
              </button>
              <button class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-xs font-semibold transition-colors">
                <X class="w-3.5 h-3.5" /> Rechazar
              </button>
              <button class="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs font-semibold transition-colors mt-1">
                <Clock class="w-3.5 h-3.5" /> Reagendar
              </button>
            </div>
          </div>

          <!-- Notificación 3 -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-theme-xs relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-brand-400"></div>
            <div class="mb-3">
              <span class="text-[11px] font-semibold tracking-wider uppercase text-brand-500 mb-1 block">Revisión Solicitada</span>
              <h4 class="font-bold text-gray-800 dark:text-white/90 text-sm">Testamento - Familia Rosales</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                <CalendarIcon stroke-width="2" class="w-3.5 h-3.5" /> Para Agendarse Proximamente
              </p>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-4">
              <button class="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 text-xs font-semibold transition-colors">
                <Clock class="w-3.5 h-3.5" /> Asignar Horario
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
import { Bell, Check, X, Clock, Calendar as CalendarIcon } from 'lucide-vue-next'

const currentPageTitle = ref('Citas')

const calendarRef = ref(null)
const isOpen = ref(false)
const selectedEvent = ref(null)
const eventTitle = ref('')
const eventStartDate = ref('')
const eventEndDate = ref('')
const eventLevel = ref('Primary')
const events = ref([])

const calendarsEvents = reactive({
  Primary: 'primary',
  Danger: 'danger',
  Warning: 'warning',
  Success: 'success',
})

onMounted(async () => {
  await fetchCitas();
})

const fetchCitas = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/citas');
    if (response.ok) {
      events.value = await response.json();
    }
  } catch (err) {
    console.error('Error fetching citas:', err);
  }
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
  eventStartDate.value = ''
  eventEndDate.value = ''
  eventLevel.value = 'Primary'
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
  eventStartDate.value = event.start?.toISOString().split('T')[0] || ''
  eventEndDate.value = event.end?.toISOString().split('T')[0] || ''
  eventLevel.value = event.extendedProps.calendar || 'Primary'
  openModal()
}

const handleAddOrUpdateEvent = async () => {
  if (!eventTitle.value || !eventStartDate.value) return;

  const eventData = {
    id: selectedEvent.value ? selectedEvent.value.id : null,
    title: eventTitle.value,
    start: eventStartDate.value,
    end: eventEndDate.value,
    extendedProps: { calendar: eventLevel.value }
  }

  try {
    const response = await fetch('http://localhost:3000/api/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (response.ok) {
      await fetchCitas();
      closeModal();
    }
  } catch (err) {
    console.error('Error saving cita:', err);
  }
}

const handleDeleteEvent = async () => {
  if (selectedEvent.value) {
    try {
      const response = await fetch(`http://localhost:3000/api/citas/${selectedEvent.value.id}`, {
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
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar?.toLowerCase() || 'primary'}`
  return {
    html: `
      <div class="event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm w-full relative z-10 cursor-pointer overflow-hidden">
        <div class="fc-daygrid-event-dot hidden"></div>
        <div class="fc-event-time font-semibold mr-1"></div>
        <div class="fc-event-title font-medium truncate">${eventInfo.event.title}</div>
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
    right: 'dayGridMonth,timeGridWeek,timeGridDay addEventButton',
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
  customButtons: {
    addEventButton: {
      text: 'Nueva Cita +',
      click: openModal,
    },
  },
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
.fc .fc-button-primary {
  background-color: var(--color-brand-500) !important;
  border-color: var(--color-brand-500) !important;
  text-transform: capitalize;
  font-weight: 500;
  box-shadow: none !important;
}
.fc .fc-button-primary:hover {
  background-color: var(--color-brand-600) !important;
  border-color: var(--color-brand-600) !important;
}
.fc .fc-button-primary:disabled {
  opacity: 0.6;
}
/* Event Colors Based on Tailadmin Default Configuration */
.fc-bg-primary { background-color: rgba(66, 133, 244, 0.15); color: #4285F4; }
.fc-bg-success { background-color: rgba(52, 168, 83, 0.15); color: #34A853; }
.fc-bg-warning { background-color: rgba(251, 188, 5, 0.15); color: #FBBC05; }
.fc-bg-danger { background-color: rgba(234, 67, 53, 0.15); color: #EA4335; }

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
