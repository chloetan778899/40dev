<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';

const props = defineProps<{
  show: boolean;
  title?: string;
  message?: string;
  buttonText?: string;
  type?: 'success' | 'error';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) emit('close');
};

const iconColorClass = computed(() => 
  props.type === 'error' 
    ? 'text-[#d32f2f] dark:text-[#ef5350] bg-red-50 dark:bg-red-900/20' 
    : 'text-[#10b981] dark:text-[#34d399] bg-green-50 dark:bg-green-900/20'
);

const iconName = computed(() => 
  props.type === 'error' ? 'error_outline' : 'check_circle'
);

onMounted(() => document.addEventListener('keydown', handleKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-100 flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px]"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          enter-from-class="opacity-0 scale-90 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-90 translate-y-4"
        >
          <div
            v-if="show"
            class="relative w-full max-w-85 p-8 text-center rounded-3xl bg-bg-card border border-border shadow-2xl overflow-hidden flex flex-col items-center"
            role="dialog"
          >
            <div class="mb-5 w-12 h-12 flex items-center justify-center rounded-full" :class="iconColorClass">
              <span class="material-icons-round text-2xl leading-none">{{ iconName }}</span>
            </div>

            <h3 class="text-xl font-semibold text-text-main mb-3">
              {{ title }}
            </h3>
            
            <p class="text-[0.95rem] text-text-sub mb-8 leading-relaxed">
              {{ message }}
            </p>

            <button
                @click="emit('close')"
                class="w-full py-3 px-4 rounded-xl text-sm font-medium bg-[#0d0d0d] text-white hover:opacity-90 active:opacity-75 dark:bg-[#ededed] dark:text-[#0d0d0d] focus:outline-none"
            >
            {{ buttonText || 'OK' }}
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
