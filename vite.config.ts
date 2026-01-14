import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import glsl from 'vite-plugin-glsl'
import tailwindcss from '@tailwindcss/vite'
import { templateCompilerOptions } from '@tresjs/core'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  base: './', 

  build: {
    target: ['chrome90', 'safari14'],
  },

  plugins: [
    vue({ 
      ...templateCompilerOptions,
      template: {
        ...templateCompilerOptions.template,
        compilerOptions: {
          ...templateCompilerOptions.template?.compilerOptions,
          isCustomElement: (tag) => {
            if (tag === 'altcha-widget') return true
            if (templateCompilerOptions.template?.compilerOptions?.isCustomElement?.(tag)) return true
            return false
          }
        }
      } 
    }),
    glsl(),
    tailwindcss(),
  ],
})