<template>
  <AdminLayout>
    <div class="space-y-6">
      
      <!-- Buscador y Categorías -->
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="relative w-full sm:w-96">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input v-model="searchQuery" type="text" placeholder="Buscar por nombre, cliente, o folio..." class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-theme-xs transition-shadow" />
        </div>
        
        <div class="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-2 sm:pb-0">
          <button @click="activeFilter = 'todos'" :class="activeFilter === 'todos' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Todos</button>
          <button @click="activeFilter = 'pdf'" :class="activeFilter === 'pdf' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">PDFs</button>
          <button @click="activeFilter = 'doc'" :class="activeFilter === 'doc' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Word / Excel</button>
          <button @click="activeFilter = 'img'" :class="activeFilter === 'img' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Imágenes</button>
        </div>
      </div>

      <!-- Input oculto de archivos -->
      <input ref="fileInputRef" type="file" class="hidden" @change="uploadToS3" />

      <!-- Drag & Drop Zone -->
      <div
        class="w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group"
        :class="uploading
          ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/10'
          : 'border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/20'"
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform"
          :class="uploading ? 'bg-brand-500 text-white scale-110' : 'bg-brand-100 dark:bg-brand-500/20 text-brand-500 group-hover:scale-110'"
        >
          <UploadCloud v-if="!uploading" class="w-8 h-8" />
          <svg v-else class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
          {{ uploading ? 'Subiendo archivo...' : 'Arrastra tus archivos aquí' }}
        </h4>
        <p class="text-sm text-gray-500 text-center max-w-sm">
          {{ uploading ? uploadStatus : 'Soporta PDF, DOCX, XLSX, imágenes y más. Haz clic o arrastra para subir.' }}
        </p>
        <!-- Barra de progreso -->
        <div v-if="uploading" class="w-full max-w-xs mt-5 bg-brand-100 dark:bg-brand-500/20 rounded-full h-1.5 overflow-hidden">
          <div class="h-1.5 bg-brand-500 rounded-full animate-progress"></div>
        </div>
      </div>

      <!-- Toast de notificación -->
      <Transition name="toast">
        <div
          v-if="toast.show"
          class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium"
          :class="toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'"
        >
          <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5 shrink-0" />
          <XCircle v-else class="w-5 h-5 shrink-0" />
          {{ toast.message }}
        </div>
      </Transition>

      <!-- Recientes -->
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Agregados Recientemente</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="(file, i) in filteredFiles" :key="i" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-theme-xs hover:shadow-theme-md transition-shadow group relative flex flex-col">
            <div class="flex justify-between items-start mb-4">
              <div :class="['p-3 rounded-lg', file.colorClass]">
                <component :is="file.icon" class="w-6 h-6" />
              </div>
              <span v-if="file.isNew" class="text-[10px] font-bold bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 px-2 py-0.5 rounded-full">Nuevo</span>
            </div>
            
            <h4 class="font-medium text-gray-800 dark:text-white/90 text-sm mb-1 truncate" :title="file.name">{{ file.name }}</h4>
            <div class="flex justify-between items-center mt-auto pt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ file.size }}</span>
              <div class="flex gap-1">
                <a
                  v-if="file.url"
                  :href="file.url"
                  target="_blank"
                  class="text-gray-400 hover:text-brand-500 transition-colors p-1"
                  title="Ver / Descargar"
                >
                  <Download class="w-4 h-4" />
                </a>
                <button v-else class="text-gray-400 hover:text-brand-500 transition-colors p-1" title="Descargar">
                  <Download class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { UploadCloud, HardDrive, Search, FileText, Image as ImageIcon, FileSpreadsheet, Download, CheckCircle, XCircle } from "lucide-vue-next";
import API_BASE_URL from '@/config/api';

// ============================================================
// --- LÓGICA DE SUBIDA A S3 ---
// ============================================================
const fileInputRef = ref(null);
const uploading = ref(false);
const uploadStatus = ref('');
const toast = ref({ show: false, type: 'success', message: '' });
const recentFiles = ref([]);
const loadingFiles = ref(true);
const searchQuery = ref('');
const activeFilter = ref('todos');

const filteredFiles = computed(() => {
  return recentFiles.value.filter(file => {
    // Search filter
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // Category filter
    let matchesCategory = true;
    const ext = getExtension(file.name);
    
    if (activeFilter.value === 'pdf') {
      matchesCategory = ext === 'pdf';
    } else if (activeFilter.value === 'doc') {
      matchesCategory = ['doc', 'docx', 'xls', 'xlsx', 'csv'].includes(ext);
    } else if (activeFilter.value === 'img') {
      matchesCategory = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
    }
    
    return matchesSearch && matchesCategory;
  });
});

const showToast = (type, message) => {
  toast.value = { show: true, type, message };
  setTimeout(() => { toast.value.show = false; }, 4000);
};

const triggerFileInput = () => {
  if (!uploading.value) fileInputRef.value?.click();
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (file) uploadFile(file);
};

const uploadToS3 = (event) => {
  const file = event.target.files[0];
  if (file) uploadFile(file);
  event.target.value = '';
};

const uploadFile = async (file) => {
  uploading.value = true;
  uploadStatus.value = `Preparando ${file.name}...`;

  try {
    uploadStatus.value = 'Obteniendo permiso de subida...';
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });

    if (!response.ok) throw new Error('Error al obtener URL de subida');
    const { uploadUrl, key } = await response.json();

    uploadStatus.value = `Subiendo ${file.name}...`;
    const result = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!result.ok) throw new Error('Error al subir a S3');

    // Recargar la lista completa desde S3
    await fetchFiles();

    uploadStatus.value = '¡Subida completa!';
    showToast('success', `"${file.name}" subido exitosamente.`);
    console.log('Ruta en S3:', key);
  } catch (error) {
    console.error('Error al subir:', error);
    uploadStatus.value = `Error: ${error.message}`;
    showToast('error', `Error al subir: ${error.message}`);
  } finally {
    uploading.value = false;
    setTimeout(() => { uploadStatus.value = ''; }, 3000);
  }
};

// ============================================================
// --- CARGAR ARCHIVOS DESDE S3 ---
// ============================================================
const fetchFiles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/files`);
    if (!response.ok) throw new Error('Error al cargar archivos');
    const files = await response.json();

    recentFiles.value = files.map(f => ({
      name: f.name,
      size: formatFileSize(f.size),
      icon: getFileIconByName(f.name),
      colorClass: getFileColorByName(f.name),
      url: f.url,
      isNew: false,
    }));
  } catch (error) {
    console.error('Error cargando archivos:', error);
  } finally {
    loadingFiles.value = false;
  }
};

onMounted(() => {
  fetchFiles();
});

// ============================================================
// --- HELPERS ---
// ============================================================
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (name) => (name.split('.').pop() || '').toLowerCase();

const getFileIconByName = (name) => {
  const ext = getExtension(name);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return ImageIcon;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  return FileText;
};

const getFileColorByName = (name) => {
  const ext = getExtension(name);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500';
  if (ext === 'pdf') return 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400';
  return 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400';
};

// Mantener compatibilidad con uploads (usan MIME type)
const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return FileText;
};

const getFileColorClass = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500';
  if (mimeType.includes('pdf')) return 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400';
  return 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400';
};
</script>

<style scoped>
.loader-stripes {
  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
}

/* Barra de progreso indeterminada */
.animate-progress {
  width: 40%;
  animation: progress-slide 1.4s ease-in-out infinite;
}
@keyframes progress-slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

/* Toast slide-up */
.toast-enter-active, .toast-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.95);
}
</style>
