<template>
  <AdminLayout>
    <div class="space-y-6">
      
      <!-- Encabezado y Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div class="relative z-10">
            <h2 class="text-3xl font-bold mb-2">Archivero Digital</h2>
            <p class="text-brand-100 max-w-lg text-sm sm:text-base mb-6">
              Sube, organiza y administra de forma segura tus documentos, expedientes y archivos pesados. Accede a ellos desde cualquier lugar sin saturar tu dispositivo móvil.
            </p>
            <button class="bg-white text-brand-700 px-6 py-2.5 rounded-full font-semibold hover:bg-brand-50 transition-all shadow-md flex items-center gap-2">
              <UploadCloud class="w-5 h-5" /> Subir Archivos
            </button>
          </div>
          <!-- Decoración Fondo -->
          <div class="absolute -right-10 -bottom-10 opacity-20">
            <HardDrive class="w-64 h-64" stroke-width="0.5" />
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-theme-xs border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold text-gray-800 dark:text-white/90 text-lg">Almacenamiento</h3>
            <span class="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-lg"><HardDrive class="w-5 h-5" /></span>
          </div>
          <div class="mb-2 flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Espacio Usado</span>
            <span class="font-medium text-gray-800 dark:text-white/90">45 GB / 100 GB</span>
          </div>
          <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
            <div class="bg-brand-500 h-3 rounded-full relative" style="width: 45%;">
               <div class="absolute top-0 right-0 bottom-0 left-0 bg-white/20 overflow-hidden loader-stripes"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <p class="text-xs text-gray-500 mb-1">Documentos</p>
              <p class="font-bold text-gray-800 dark:text-white/90">1.2k</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <p class="text-xs text-gray-500 mb-1">Imágenes</p>
              <p class="font-bold text-gray-800 dark:text-white/90">340</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Buscador y Categorías -->
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="relative w-full sm:w-96">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Buscar por nombre, cliente, o folio..." class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-theme-xs transition-shadow" />
        </div>
        
        <div class="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-2 sm:pb-0">
          <button class="px-4 py-2 bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 rounded-full text-sm font-medium whitespace-nowrap">Todos</button>
          <button class="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 rounded-full text-sm font-medium whitespace-nowrap transition-colors">PDFs</button>
          <button class="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Word / Excel</button>
          <button class="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Imágenes</button>
        </div>
      </div>

      <!-- Drag & Drop Zone -->
      <div class="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer group">
        <div class="w-16 h-16 bg-brand-100 dark:bg-brand-500/20 text-brand-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud class="w-8 h-8" />
        </div>
        <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">Arrastra tus archivos aquí</h4>
        <p class="text-sm text-gray-500 text-center max-w-sm">
          Soporta todo tipo de archivos como PDF, DOCX, XLSX, y medios visuales de hasta 500MB por archivo.
        </p>
      </div>

      <!-- Recientes -->
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Agregados Recientemente</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="(file, i) in recentFiles" :key="i" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-theme-xs hover:shadow-theme-md transition-shadow group relative flex flex-col">
            <div class="flex justify-between items-start mb-4">
              <div :class="['p-3 rounded-lg', file.colorClass]">
                <component :is="file.icon" class="w-6 h-6" />
              </div>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical class="w-5 h-5" />
              </button>
            </div>
            
            <h4 class="font-medium text-gray-800 dark:text-white/90 text-sm mb-1 truncate" :title="file.name">{{ file.name }}</h4>
            <div class="flex justify-between items-center mt-auto pt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ file.size }}</span>
              <div class="flex gap-1">
                <button class="text-gray-400 hover:text-brand-500 transition-colors p-1" title="Descargar">
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
import { ref } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { UploadCloud, HardDrive, Search, FileText, Image as ImageIcon, FileSpreadsheet, MoreVertical, Download } from "lucide-vue-next";

// Lógica simulada de archivos recientes
const recentFiles = ref([
  {
    name: "Expediente_Cliente_A_2023.pdf",
    size: "14.2 MB",
    icon: FileText,
    colorClass: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
  },
  {
    name: "Contrato_Compraventa_Firma.docx",
    size: "2.1 MB",
    icon: FileText,
    colorClass: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
  },
  {
    name: "Identificacion_INE_Frontal.jpg",
    size: "4.8 MB",
    icon: ImageIcon,
    colorClass: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400"
  },
  {
    name: "Tabla_Amortizacion_Hipotecario.xlsx",
    size: "1.1 MB",
    icon: FileSpreadsheet,
    colorClass: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500"
  }
]);
</script>

<style scoped>
.loader-stripes {
  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
}
</style>
