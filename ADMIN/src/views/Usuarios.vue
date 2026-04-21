<template>
  <AdminLayout>
    <div class="mb-5 flex justify-end mt-4">
      <button 
        @click="openModal" 
        class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-center font-medium text-white hover:bg-brand-600 lg:px-8 xl:px-10"
      >
        Agregar Nuevo
      </button>
    </div>

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Nombre</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Correo</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Usuario</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Rol</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <!-- Sample Empty or Default Row just to show layout -->
            <tr v-if="users.length === 0" class="border-t border-gray-100 dark:border-gray-800">
              <td colspan="5" class="px-5 py-4 text-center sm:px-6 text-gray-500">
                No hay usuarios registrados.
              </td>
            </tr>
            <tr
              v-for="(user, index) in users"
              :key="index"
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="px-5 py-4 sm:px-6">
                <p class="text-gray-800 text-theme-sm dark:text-white/90">{{ user.nombre }}</p>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ user.correo }}</p>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ user.usuario }}</p>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-white/90">
                  {{ user.rol }}
                </span>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <div class="flex items-center gap-3">
                  <button class="p-1.5 rounded-lg bg-brand-50 text-brand-500 hover:bg-brand-100 hover:text-brand-600 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 transition-colors" title="Ver">
                    <Eye class="w-4 h-4" />
                  </button>
                  <button class="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors" title="Editar">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button class="p-1.5 rounded-lg bg-error-50 text-error-500 hover:bg-error-100 hover:text-error-600 dark:bg-error-500/10 dark:hover:bg-error-500/20 transition-colors" title="Borrar">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal v-if="isModalOpen" @close="closeModal" :fullScreenBackdrop="true">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-xl shadow-lg dark:bg-gray-900 z-50">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-white/90">Nuevo Usuario</h3>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ✖
            </button>
          </div>
          
          <form @submit.prevent="saveUser" class="space-y-4">
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input v-model="formData.nombre" type="text" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white" />
            </div>
            
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
              <input v-model="formData.correo" type="email" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white" />
            </div>
            
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Usuario</label>
              <input v-model="formData.usuario" type="text" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                <input v-model="formData.password" type="password" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
                <input v-model="formData.confirmPassword" type="password" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white" />
              </div>
            </div>
            <p v-if="passwordMismatch" class="text-sm text-error-500">Las contraseñas no coinciden.</p>
            
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
              <select v-model="formData.rol" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white">
                <option value="Sistemas">Sistemas</option>
                <option value="Administrador">Administrador</option>
                <option value="Operativo">Operativo</option>
              </select>
            </div>
            
            <div class="flex justify-end pt-4 gap-3">
              <button type="button" @click="closeModal" class="px-5 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" :disabled="passwordMismatch" class="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import { Eye, Pencil, Trash2 } from "lucide-vue-next";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import Modal from "@/components/ui/Modal.vue";

const currentPageTitle = ref("Usuarios");

// Logic Mockup
const users = ref([
  { nombre: "Elmer Mendoza", correo: "elmer@example.com", usuario: "elmerm", rol: "Sistemas" },
  { nombre: "Elena Rojas", correo: "elena@example.com", usuario: "elenar", rol: "Administrador" }
]);

const isModalOpen = ref(false);

const formData = ref({
  nombre: "",
  correo: "",
  usuario: "",
  password: "",
  confirmPassword: "",
  rol: "Operativo"
});

const passwordMismatch = computed(() => {
  if (!formData.value.password && !formData.value.confirmPassword) return false;
  return formData.value.password !== formData.value.confirmPassword;
});

const openModal = () => {
  formData.value = {
    nombre: "",
    correo: "",
    usuario: "",
    password: "",
    confirmPassword: "",
    rol: "Operativo"
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const saveUser = () => {
  if (passwordMismatch.value) {
    return;
  }
  // Simulando guardado local
  users.value.push({
    nombre: formData.value.nombre,
    correo: formData.value.correo,
    usuario: formData.value.usuario,
    rol: formData.value.rol
  });
  closeModal();
};
</script>
