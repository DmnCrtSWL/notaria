<template>
  <AdminLayout>
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white/90 flex items-center gap-3">
          <Bell class="w-6 h-6 text-brand-500" /> Solicitudes Pendientes
        </h2>
        <span class="bg-brand-500 text-white text-sm font-bold px-3 py-1 rounded-full">{{ solicitudes.length }}</span>
      </div>
      
      <div v-if="solicitudes.length === 0" class="text-center py-20 text-gray-500 dark:text-gray-400 text-lg italic bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        No hay solicitudes pendientes en este momento.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <!-- Notificación Dinámica -->
        <div v-for="solicitud in solicitudes" :key="solicitud.id" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-theme-xs relative overflow-hidden flex flex-col justify-between h-full">
          <div class="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
          <div class="mb-4">
            <div class="flex justify-between items-start mb-3">
              <span class="text-xs font-bold tracking-wider uppercase text-warning-600 bg-warning-50 px-2 py-1 rounded-md dark:bg-warning-500/10 dark:text-warning-400">Pendiente</span>
              <span class="text-xs text-gray-400 font-medium">{{ formatDate(solicitud.created_at) }}</span>
            </div>
            
            <h4 class="font-bold text-gray-800 dark:text-white/90 text-lg leading-tight mb-1">{{ solicitud.title }}</h4>
            <p class="text-base font-medium text-brand-600 dark:text-brand-400 mb-4">{{ solicitud.nombre || 'Sin nombre' }}</p>
            
            <div class="space-y-2">
              <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CalendarIcon stroke-width="2" class="w-4 h-4 text-gray-400" /> 
                <span class="font-semibold">{{ formatEventDate(solicitud.start_date) }}</span>
              </p>
              <p v-if="solicitud.celular" class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Phone stroke-width="2" class="w-4 h-4 text-gray-400" /> 
                {{ solicitud.celular }}
              </p>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="handleConfirmSolicitud(solicitud.id)" class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 text-sm font-semibold transition-colors">
              <Check class="w-4 h-4" /> Confirmar
            </button>
            <button @click="handleRejectSolicitud(solicitud.id)" class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-sm font-semibold transition-colors">
              <X class="w-4 h-4" /> Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { Bell, Check, X, Calendar as CalendarIcon, Phone } from 'lucide-vue-next'
import API_BASE_URL from '@/config/api'

const solicitudes = ref([])

onMounted(async () => {
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
</script>
