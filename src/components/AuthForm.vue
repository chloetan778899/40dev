<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isValidPhoneNumber, AsYouType, type CountryCode } from 'libphonenumber-js'
import 'altcha'
import FormCard from './ui/FormCard.vue'
import SuccessModal from './ui/SuccessModal.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const WORKER_URL = 'https://altcha-backend.chloetan778899.workers.dev' 

const isLoginView = ref(true)
const isLoading = ref(false)
const showModal = ref(false)
const successType = ref<'signin' | 'signup' | null>(null)
const modalStatus = ref<'success' | 'error'>('success')
const serverErrorMessage = ref('') 
const formSubmitted = ref(false)
const preserveMessage = ref(false)
const showTooltip = ref(false)
const showYobTooltip = ref(false)
const widgetKey = ref(0)
const altchaPayload = ref('')
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
onUnmounted(() => {
  isMounted.value = false
})

const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    (el as any)._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', (el as any)._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any)._clickOutside)
  },
}

const modalTitle = computed(() => {
  if (modalStatus.value === 'error') {
    return t('auth.form.errors.title_failed') 
  }
  return successType.value === 'signin' 
    ? t('auth.form.success.signin_title') 
    : t('auth.form.success.signup_title')
})

const modalMessage = computed(() => {
  if (modalStatus.value === 'error') {
    return serverErrorMessage.value || t('auth.form.errors.verification_failed')
  }
  return successType.value === 'signin' ? t('auth.form.success.signin_msg') : t('auth.form.success.signup_msg')
})

const modalButtonText = computed(() => {
  if (modalStatus.value === 'error') return 'Try Again'
  return successType.value === 'signin' ? t('auth.form.btn_continue') : t('auth.form.btn_get_started')
})

const referrerTooltipTitle = computed(() => t('auth.form.label_referrer'))
const yobTooltipTitle = computed(() => t('auth.form.label_yob'))

const userEmailAddress = ref('')
const emailTouched = ref(false)
const validationControl = ref('') 
const password = ref('')
const displayName = ref('')
const refId = ref('')
const phone = ref('') 
const detectedFlag = ref('') 

const confirmPassword = ref('')
const yob = ref('')
const isPasswordVisible = ref(false)
const isConfirmVisible = ref(false)

watch(() => route.query.mode, (newMode) => {
  isLoginView.value = newMode !== 'signup'
}, { immediate: true })

watch(isLoginView, () => {
  formSubmitted.value = false
  
  if (!preserveMessage.value) {
      serverErrorMessage.value = ''
  }
  preserveMessage.value = false

  modalStatus.value = 'success'
  altchaPayload.value = ''
  widgetKey.value++
})

const emailError = computed(() => {
  if (isLoginView.value || !userEmailAddress.value) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmailAddress.value) ? '' : t('auth.form.errors.email')
})

const passwordError = computed(() => {
  if (!password.value) return ''
  if (password.value.length < 6) return t('auth.form.errors.pass_length')
  if (!isLoginView.value && !/[a-z]/.test(password.value) || (!/[A-Z]/.test(password.value) || !/\d/.test(password.value))) return t('auth.form.errors.pass_complex')
  return ''
})

const confirmError = computed(() => !confirmPassword.value ? '' : (confirmPassword.value === password.value ? '' : t('auth.form.errors.pass_match')))

const yobError = computed(() => {
    if (!yob.value) return ''
    const year = parseInt(yob.value)
    const current = new Date().getFullYear()
    return (year >= 1900 && year <= current) ? '' : t('auth.form.errors.year_invalid', { year: current })
})

const phoneError = computed(() => {
  if (isLoginView.value || !phone.value) return ''
  const fullNumber = '+' + phone.value.replace(/\s/g, '')
  return isValidPhoneNumber(fullNumber) ? '' : t('auth.form.errors.phone_invalid')
})

const refIdError = computed(() => {
  if (isLoginView.value) return ''
  return refId.value ? '' : t('auth.form.errors.referrer_required') 
})

const handleNoSpace = (e: Event, updateFn: (v: string) => void) => {
    const target = e.target as HTMLInputElement
    let val = target.value.replace(/[^\x00-\x7F]/g, '')
    val = val.replace(/\s/g, '')
    
    if (target.value !== val) {
        target.value = val
    }
    updateFn(val)
}

const handleDisplayName = (e: Event, updateFn: (v: string) => void) => {
    const target = e.target as HTMLInputElement
    let val = target.value.replace(/[\x00-\x1F\x7F]/g, '') 
    
    if (target.value !== val) {
        target.value = val
    }
    updateFn(val)
}

const getFlagEmoji = (countryCode: CountryCode) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const handlePhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value

  let rawDigits = val.replace(/\D/g, '')

  if (rawDigits.startsWith('0')) {
      rawDigits = rawDigits.substring(1)
  }

  const asYouType = new AsYouType()
  const formattedWithPlus = asYouType.input('+' + rawDigits) 
  
  const country = asYouType.getCountry()
  detectedFlag.value = country ? getFlagEmoji(country) : ''

  const finalDisplay = formattedWithPlus.startsWith('+') 
      ? formattedWithPlus.substring(1).trim() 
      : rawDigits

  phone.value = finalDisplay
  target.value = finalDisplay
}

const onAltchaStateChange = (ev: Event) => {
  const detail = (ev as CustomEvent).detail
  if (detail.state === 'verified') {
    altchaPayload.value = detail.payload
  } else if (detail.state === 'unverified' || detail.state === 'expired') {
    altchaPayload.value = ''
  }
}

const altchaStrings = computed(() => JSON.stringify({
  label: t('auth.captcha.label'),
  error: t('auth.captcha.error'),
  wait: t('auth.captcha.wait'),
  verified: t('auth.captcha.verified')
}))

const mapBackendError = (msg: string) => {
  if (!msg) return t('auth.form.errors.general_error')

  const lowerMsg = msg.toLowerCase()
  
  if (lowerMsg.includes('credential') || lowerMsg.includes('password') || lowerMsg.includes('not found')) {
    return t('auth.form.errors.credentials_invalid')
  }
  if (lowerMsg.includes('email already exists')) return t('auth.form.errors.user_exists')
  if (lowerMsg.includes('display name')) return t('auth.form.errors.display_name_taken')
  if (lowerMsg.includes('phone')) return t('auth.form.errors.phone_taken')
  if (lowerMsg.includes('referrer') || lowerMsg.includes('refid')) return t('auth.form.errors.referrer_invalid')

  if (lowerMsg.includes('load') || lowerMsg.includes('fetch') || lowerMsg.includes('network') || lowerMsg.includes('connect')) {
     return t('auth.form.errors.network_issue')
  }

  return t('auth.form.errors.general_error')
}

const handleModalAction = () => {
  showModal.value = false
  
  if (modalStatus.value === 'success') {
    router.push('/dashboard') 
  }
}

const handleSubmit = async (event: Event) => {
  if (!event.isTrusted || validationControl.value) return

  formSubmitted.value = true

  const hasErrors = isLoginView.value 
    ? false 
    : (emailError.value || passwordError.value || confirmError.value || yobError.value || phoneError.value || !refId.value)

  if (hasErrors) return

  if (!isLoginView.value && !altchaPayload.value) {
    modalStatus.value = 'error'
    serverErrorMessage.value = t('auth.form.alert_captcha')
    showModal.value = true
    return
  }

  isLoading.value = true
  modalStatus.value = 'success'
  serverErrorMessage.value = ''

  const finalPhoneForBackend = !isLoginView.value 
      ? phone.value.replace(/\s/g, '')
      : undefined

  try {
    if (!isLoginView.value) {
      const cfResponse = await fetch(`${WORKER_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altcha: altchaPayload.value,
          payload: {
              email: userEmailAddress.value,
              phone: finalPhoneForBackend,
              password: password.value,
              displayName: displayName.value,
              refId: refId.value,
              yob: parseInt(yob.value)
          }
        })
      })

      if (!cfResponse.ok) {
           const cfData = await cfResponse.json()
           throw new Error(cfData.msg || t('auth.form.errors.verification_failed'))
      }

      if (!isMounted.value) return 

      await new Promise(resolve => setTimeout(resolve, 800))

      if (!isMounted.value) return

      const autoLoginResponse = await fetch(`${WORKER_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              account: userEmailAddress.value, 
              password: password.value
          })
      })

      if (autoLoginResponse.ok) {
          const loginData = await autoLoginResponse.json();
          
          if (isMounted.value) {
            if (loginData.token) {
               localStorage.setItem('auth_token', loginData.token);
               successType.value = 'signup'
               modalStatus.value = 'success'
               showModal.value = true
            } else {
               throw new Error('No token received');
            }
          }
      } else {
          console.warn('Signup success, but Auto-login failed')
          
          if (isMounted.value) {
            preserveMessage.value = true 
            isLoginView.value = true 
            serverErrorMessage.value = t('auth.form.success.signup_msg') 
          }
      }

    } else {
      const loginResponse = await fetch(`${WORKER_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              account: userEmailAddress.value, 
              password: password.value
          })
      })

      if (!loginResponse.ok) {
          const errData = await loginResponse.json();
          throw new Error(errData.msg || t('auth.form.errors.credentials_invalid'));
      } else {
          const data = await loginResponse.json();
          
          if (isMounted.value && data.token) {
             localStorage.setItem('auth_token', data.token);
             successType.value = 'signin'
             modalStatus.value = 'success'
             showModal.value = true
          }
      }
    }

    if (isMounted.value) {
        password.value = ''
        confirmPassword.value = ''
        altchaPayload.value = ''
        widgetKey.value++ 
        formSubmitted.value = false
    }
    
  } catch (e) {
    console.error(e)
    if (isMounted.value) {
        modalStatus.value = 'error'
        serverErrorMessage.value = mapBackendError((e as Error).message)
        showModal.value = true
        altchaPayload.value = '' 
        widgetKey.value++        
    }
    
  } finally {
    if (isMounted.value) {
        isLoading.value = false
    }
  }
}
</script>

<template>
  <FormCard :title="isLoginView ? $t('auth.form.title_signin') : $t('auth.form.title_signup')">
    <form @submit.prevent="handleSubmit" class="auth-form flex flex-col gap-0 w-full relative">
        
        <div class="absolute opacity-0 -z-50 -left-2499.75 pointer-events-none" aria-hidden="true">
           <input v-model="validationControl" type="text" name="email" tabindex="-1" autocomplete="off">
        </div>

        <Transition name="slide-fade" mode="out-in">
        <div :key="isLoginView ? 'login' : 'signup'" class="w-full pt-2">
            
            <div v-if="serverErrorMessage && isLoginView" 
                class="mb-4 p-3 rounded text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                {{ serverErrorMessage }}
            </div>

            <div v-if="!isLoginView" class="form-group mb-4">
                <div class="relative w-full">
                    <input 
                        :value="displayName" 
                        @input="(e) => handleDisplayName(e, v => displayName = v)"
                        type="text" 
                        id="display-name"
                        enterkeyhint="next"
                        autocomplete="name"
                        required 
                        placeholder=" "
                        spellcheck="false"
                        :disabled="isLoading"
                        class="peer w-full p-[14px_16px] text-base rounded bg-transparent border outline-none transition-colors duration-300 z-1 focus:border-2 focus:p-[13px_15px] dark:hover:bg-white/2 dark:focus:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="[
                            (!isLoginView && formSubmitted && !displayName)
                            ? 'border-[#d32f2f] text-[#d32f2f] focus:border-[#d32f2f] placeholder-shown:border-[#d32f2f]'
                            : 'border-black/20 dark:border-white/20 text-text-main focus:border-[#635bff] placeholder-shown:border-black/20 dark:placeholder-shown:border-white/20'
                        ]"
                    >
                    <label 
                        class="absolute left-3 top-0 -translate-y-1/2 scale-75 bg-bg-body px-1 text-base font-normal leading-none transition-[top,transform,scale,color] duration-200 ease-standard will-change-[top,transform] pointer-events-none z-2 origin-left peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                        :class="[
                            (!isLoginView && formSubmitted && !displayName)
                            ? 'text-[#d32f2f] peer-focus:text-[#d32f2f] peer-placeholder-shown:text-[#d32f2f]'
                            : 'text-text-sub dark:text-[#ededed] peer-focus:text-[#635bff] dark:peer-focus:text-[#ededed] peer-placeholder-shown:text-text-sub dark:peer-placeholder-shown:text-[#ededed]'
                        ]"
                    >
                        {{ $t('auth.form.label_display_name') }}
                    </label>
                </div>
            </div>

            <div class="form-group mb-4">
                <div class="relative w-full">
                    <input 
                        :value="userEmailAddress"
                        @blur="emailTouched = true"
                        @input="(e) => {
                            emailTouched = false;
                            isLoginView ? handleDisplayName(e, v => userEmailAddress = v) : handleNoSpace(e, v => userEmailAddress = v)
                        }"
                        :type="isLoginView ? 'text' : 'email'"
                        id="email" 
                        autocapitalize="none" 
                        enterkeyhint="next" 
                        autocomplete="username"
                        required 
                        placeholder=" "
                        spellcheck="false"
                        :disabled="isLoading"
                        class="peer w-full p-[14px_16px] text-base rounded bg-transparent border outline-none transition-colors duration-300 z-1 focus:border-2 focus:p-[13px_15px] dark:hover:bg-white/2 dark:focus:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="[
                            (userEmailAddress && emailError)
                            ? 'border-[#d32f2f] text-[#d32f2f] focus:border-[#d32f2f] placeholder-shown:border-[#d32f2f]' 
                            : 'border-black/20 dark:border-white/20 text-text-main focus:border-[#635bff] placeholder-shown:border-black/20 dark:placeholder-shown:border-white/20'
                        ]"
                    >
                    <label 
                        class="absolute left-3 top-0 -translate-y-1/2 scale-75 bg-bg-body px-1 text-base font-normal leading-none duration-200 ease-standard will-change-[top,transform] pointer-events-none z-2 origin-left peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                        :class="[
                            (userEmailAddress && emailError)
                            ? 'text-[#d32f2f] peer-focus:text-[#d32f2f] peer-placeholder-shown:text-[#d32f2f]'
                            : 'text-text-sub dark:text-[#ededed] peer-focus:text-[#635bff] dark:peer-focus:text-[#ededed] peer-placeholder-shown:text-text-sub dark:peer-placeholder-shown:text-[#ededed]'
                        ]"
                    >
                        {{ isLoginView ? $t('auth.form.label_email_signin') : $t('auth.form.label_email_signup') }}
                    </label>
                </div>
                <div v-if="emailTouched && userEmailAddress && emailError" class="text-[#d32f2f] text-xs font-medium mt-1 ml-1 block">{{ emailError }}</div>
            </div>

            <template v-if="!isLoginView">
                <div class="form-group mb-4">
                    <div class="relative w-full">
                        <input 
                            :value="refId" 
                            @input="(e) => handleNoSpace(e, v => refId = v)" 
                            type="text" 
                            id="refId"
                            enterkeyhint="next"
                            autocomplete="off"
                            autocapitalize="none"
                            required 
                            placeholder=" "
                            spellcheck="false"
                            :disabled="isLoading"
                            class="peer w-full p-[14px_16px] text-base pr-12 rounded bg-transparent border outline-none transition-colors duration-300 z-1 focus:border-2 focus:p-[13px_15px] dark:hover:bg-white/2 dark:focus:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed"
                            :class="[
                                (!isLoginView && formSubmitted && !refId)
                                ? 'border-[#d32f2f] text-[#d32f2f] focus:border-[#d32f2f] placeholder-shown:border-[#d32f2f]'
                                : 'border-black/20 dark:border-white/20 text-text-main focus:border-[#635bff] placeholder-shown:border-black/20 dark:placeholder-shown:border-white/20'
                            ]"
                        >
                        <label 
                            class="absolute left-3 top-0 -translate-y-1/2 scale-75 bg-bg-body px-1 text-base font-normal leading-none duration-200 ease-standard will-change-[top,transform] pointer-events-none z-2 origin-left peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                            :class="[
                                (!isLoginView && formSubmitted && !refId)
                                ? 'text-[#d32f2f] peer-focus:text-[#d32f2f] peer-placeholder-shown:text-[#d32f2f]'
                                : 'text-text-sub dark:text-[#ededed] peer-focus:text-[#635bff] dark:peer-focus:text-[#ededed] peer-placeholder-shown:text-text-sub dark:peer-placeholder-shown:text-[#ededed]'
                            ]"
                        >
                            {{ $t('auth.form.label_referrer') }}
                        </label>

                        <div class="absolute right-0 top-0 h-full w-12 z-10 flex items-center justify-center cursor-help group"
                            @click="showTooltip = !showTooltip"
                            v-click-outside="() => showTooltip = false"
                            :title="referrerTooltipTitle">
        
                            <span class="material-icons-round text-[18px] text-[#9ca3af] dark:text-[#6b7280] group-hover:text-[#0d0d0d] dark:group-hover:text-white transition-colors duration-200">
                                info
                            </span>

                            <div class="absolute bottom-full right-2 mb-2 w-max max-w-50 p-2 bg-[#1a1a1a] dark:bg-[#333333] text-white text-[11px] font-medium text-center rounded shadow-xl opacity-0 invisible transition-all duration-200 z-50 pointer-events-none
                                        group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                                        peer-focus:opacity-100 transform origin-bottom translate-y-1 group-hover:translate-y-0"
                                    :class="{'opacity-100 visible translate-y-0': showTooltip}">
                                {{ $t('auth.form.hint_referrer') }}
                                <div class="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-[#1a1a1a] dark:border-t-[#333333]"></div>
                            </div>
                        </div>
                    </div>
                    <div v-if="!isLoginView && formSubmitted && !refId" class="text-[#d32f2f] text-xs font-medium mt-1 ml-1 block">
                        {{ $t('auth.form.errors.referrer_required') }}
                    </div>
                </div>

                <div class="form-group mb-4">
                    <div class="relative w-full group/phone">
                        
                        <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20 pointer-events-none">
                            <span v-if="detectedFlag" class="text-xl grayscale-0 leading-none animate-in fade-in slide-in-from-right-1 duration-200">
                                {{ detectedFlag }}
                            </span>
                            <span class="text-text-sub text-base font-medium select-none">+</span>
                            <div class="w-px h-5 bg-black/20 dark:bg-white/20"></div>
                        </div>

                        <input 
                            :value="phone" 
                            @input="handlePhoneInput" 
                            type="tel"
                            enterkeyhint="next"
                            inputmode="numeric" 
                            required 
                            placeholder=" "
                            :disabled="isLoading"
                            class="peer w-full p-[14px_16px] text-base rounded bg-transparent border outline-none transition-all duration-300 z-1 focus:border-2 focus:p-[13px_15px] dark:hover:bg-white/2 dark:focus:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed"
                            :class="[
                                detectedFlag ? 'pl-19 focus:pl-18.75' : 'pl-10 focus:pl-9.75',
                                (phone && phoneError) 
                                ? 'border-[#d32f2f] text-[#d32f2f] focus:border-[#d32f2f] placeholder-shown:border-[#d32f2f]'
                                : 'border-black/20 dark:border-white/20 text-text-main focus:border-[#635bff] placeholder-shown:border-black/20 dark:placeholder-shown:border-white/20'
                            ]"
                        >
                        
                        <label 
                            class="absolute top-0 -translate-y-1/2 scale-75 bg-bg-body px-1 text-base font-normal leading-none duration-200 ease-standard will-change-[top,transform] pointer-events-none z-2 origin-left peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                            :class="[
                            detectedFlag ? 'left-19' : 'left-10',
                            (phone && phoneError)
                            ? 'text-[#d32f2f] peer-focus:text-[#d32f2f] peer-placeholder-shown:text-[#d32f2f]'
                            : 'text-text-sub dark:text-[#ededed] peer-focus:text-[#635bff] dark:peer-focus:text-[#ededed] peer-placeholder-shown:text-text-sub dark:peer-placeholder-shown:text-[#ededed]'
                            ]"
                        >
                            {{ $t('auth.form.label_phone') }}
                        </label>

                    </div>
                    <div v-if="phone && phoneError" class="text-[#d32f2f] text-xs font-medium mt-1 ml-1 block">{{ phoneError }}</div>
                </div>
            </template>

            <div class="form-group mb-4">
                <div class="relative w-full">
                    <input 
                        :value="password" 
                        @input="(e) => handleNoSpace(e, v => password = v)" 
                        :type="isPasswordVisible ? 'text' : 'password'" 
                        id="password" 
                        :autocomplete="isLoginView ? 'current-password' : 'new-password'" 
                        :enterkeyhint="isLoginView ? 'done' : 'next'"
                        required 
                        placeholder=" "
                        :disabled="isLoading"
                        class="peer w-full p-[14px_16px] text-base pr-12 rounded bg-transparent border outline-none transition-colors duration-300 z-1 focus:border-2 focus:p-[13px_15px] dark:hover:bg-white/2 dark:focus:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="[
                            (password && passwordError && !isLoginView)
                            ? 'border-[#d32f2f] text-[#d32f2f] focus:border-[#d32f2f] placeholder-shown:border-[#d32f2f]'
                            : 'border-black/20 dark:border-white/20 text-text-main focus:border-[#635bff] placeholder-shown:border-black/20 dark:placeholder-shown:border-white/20'
                        ]"
                    >
                    <label 
                        class="absolute left-3 top-0 -translate-y-1/2 scale-75 bg-bg-body px-1 text-base font-normal leading-none duration-200 ease-standard will-change-[top,transform] pointer-events-none z-2 origin-left peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                        :class="[
                            (password && passwordError && !isLoginView)
                            ? 'text-[#d32f2f] peer-focus:text-[#d32f2f] peer-placeholder-shown:text-[#d32f2f]'
                            : 'text-text-sub dark:text-[#ededed] peer-focus:text-[#635bff] dark:peer-focus:text-[#ededed] peer-placeholder-shown:text-text-sub dark:peer-placeholder-shown:text-[#ededed]'
                        ]"
                    >
                        {{ $t('auth.form.label_password') }}
                    </label>
                    <button type="button" 
                        @click="isPasswordVisible = !isPasswordVisible" 
                        class="absolute right-0 top-0 h-full w-12 text-[#9ca3af] dark:text-[#6b7280] z-10 flex items-center justify-center bg-transparent border-none p-0 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors duration-200">
                        <span class="material-icons-round text-[18px]">{{ isPasswordVisible ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>
                <div v-if="!isLoginView && password && passwordError" class="text-[#d32f2f] text-xs font-medium mt-1 ml-1 block">{{ passwordError }}</div>
                
                <div v-if="isLoginView" class="flex justify-end mt-1 mr-1 relative z-5">
                    <span class="forgot-pass-text text-[0.75rem] text-text-sub font-normal inline-block py-0 opacity-80 cursor-default">{{ $t('auth.form.forgot_password') }}</span>
                </div>
            </div>

            <template v-if="!isLoginView">
                <div class="form-group mb-4">
                    <div class="relative w-full">
                        <input 
                            :value="confirmPassword" 
                            @input="(e) => handleNoSpace(e, v => confirmPassword = v)" 
                            :type="isConfirmVisible ? 'text' : 'password'" 
                            id="confirm-password" 
                            autocomplete="new-password" 
                            enterkeyhint="next"
                            required 
                            placeholder=" "
                            :disabled="isLoading"
                            class="peer w-full p-[14px_16px] text-base pr-12 rounded bg-transparent border outline-none transition-colors duration-300 z-1 focus:border-2 focus:p-[13px_15px] dark:hover:bg-white/2 dark:focus:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed"
                            :class="[
                                (confirmPassword && confirmError)
                                ? 'border-[#d32f2f] text-[#d32f2f] focus:border-[#d32f2f] placeholder-shown:border-[#d32f2f]'
                                : 'border-black/20 dark:border-white/20 text-text-main focus:border-[#635bff] placeholder-shown:border-black/20 dark:placeholder-shown:border-white/20'
                            ]"
                        >
                        <label 
                            class="absolute left-3 top-0 -translate-y-1/2 scale-75 bg-bg-body px-1 text-base font-normal leading-none duration-200 ease-standard will-change-[top,transform] pointer-events-none z-2 origin-left peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                            :class="[
                                (confirmPassword && confirmError)
                                ? 'text-[#d32f2f] peer-focus:text-[#d32f2f] peer-placeholder-shown:text-[#d32f2f]'
                                : 'text-text-sub dark:text-[#ededed] peer-focus:text-[#635bff] dark:peer-focus:text-[#ededed] peer-placeholder-shown:text-text-sub dark:peer-placeholder-shown:text-[#ededed]'
                            ]"
                        >
                            {{ $t('auth.form.label_confirm_password') }}
                        </label>
                        <button type="button" 
                            @click="isConfirmVisible = !isConfirmVisible" 
                            class="absolute right-0 top-0 h-full w-12 text-[#9ca3af] dark:text-[#6b7280] z-10 flex items-center justify-center bg-transparent border-none p-0 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors duration-200">
                            <span class="material-icons-round text-[18px]">{{ isConfirmVisible ? 'visibility_off' : 'visibility' }}</span>
                        </button>
                    </div>
                    <div v-if="confirmPassword && confirmError" class="text-[#d32f2f] text-xs font-medium mt-1 ml-1 block">{{ confirmError }}</div>
                </div>

                <div class="form-group mb-4">
                    <div class="relative w-full">
                        <input 
                            v-model="yob" 
                            type="number" 
                            enterkeyhint="done"
                            autocomplete="bday-year"
                            placeholder=" " 
                            min="1900" 
                            max="2100" 
                            required
                            :disabled="isLoading"
                            class="peer w-full p-[14px_16px] text-base pr-12 rounded bg-transparent border outline-none transition-colors duration-300 z-1 focus:border-2 focus:p-[13px_15px] dark:hover:bg-white/2 dark:focus:bg-white/3 disabled:opacity-50 disabled:cursor-not-allowed"
                            :class="[
                                (yob && yobError)
                                ? 'border-[#d32f2f] text-[#d32f2f] focus:border-[#d32f2f] placeholder-shown:border-[#d32f2f]'
                                : 'border-black/20 dark:border-white/20 text-text-main focus:border-[#635bff] placeholder-shown:border-black/20 dark:placeholder-shown:border-white/20'
                            ]"
                        >
                        <label 
                            class="absolute left-3 top-0 -translate-y-1/2 scale-75 bg-bg-body px-1 text-base font-normal leading-none duration-200 ease-standard will-change-[top,transform] pointer-events-none z-2 origin-left peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                            :class="[
                                (yob && yobError)
                                ? 'text-[#d32f2f] peer-focus:text-[#d32f2f] peer-placeholder-shown:text-[#d32f2f]'
                                : 'text-text-sub dark:text-[#ededed] peer-focus:text-[#635bff] dark:peer-focus:text-[#ededed] peer-placeholder-shown:text-text-sub dark:peer-placeholder-shown:text-[#ededed]'
                            ]"
                        >
                            {{ $t('auth.form.label_yob') }}
                        </label>
                        
                        <div class="absolute right-0 top-0 h-full w-12 z-10 flex items-center justify-center cursor-help group"
                            @click="showYobTooltip = !showYobTooltip"
                            v-click-outside="() => showYobTooltip = false"
                            :title="yobTooltipTitle">
        
                            <span class="material-icons-round text-[18px] text-[#9ca3af] dark:text-[#6b7280] group-hover:text-[#0d0d0d] dark:group-hover:text-white transition-colors duration-200">
                                info
                            </span>

                            <div class="absolute bottom-full right-2 mb-2 w-max max-w-45 p-2 bg-[#1a1a1a] dark:bg-[#333333] text-white text-[11px] font-medium text-center rounded shadow-xl opacity-0 invisible transition-all duration-200 z-50 pointer-events-none
                                        group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                                        peer-focus:opacity-100 transform origin-bottom translate-y-1 group-hover:translate-y-0"
                                :class="{'opacity-100 visible translate-y-0': showYobTooltip}">
                                {{ $t('auth.form.hint_yob') }}
                                <div class="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-[#1a1a1a] dark:border-t-[#333333]"></div>
                            </div>
                        </div>
                    </div>
                    <div v-if="yob && yobError" class="text-[#d32f2f] text-xs font-medium mt-1 ml-1 block">{{ yobError }}</div>
                </div>
            </template>

            <div v-if="!isLoginView" class="mb-4 flex justify-center w-full">
                <altcha-widget 
                    :key="widgetKey"
                    :challengeurl="`${WORKER_URL}/challenge`"
                    @statechange="onAltchaStateChange"
                    :strings="altchaStrings"
                    class="w-full"
                ></altcha-widget>
            </div>
            
            <p v-if="!isLoginView" class="text-[0.75rem] text-text-sub mt-3 mb-1 text-center leading-normal opacity-80 max-w-[90%] mx-auto">
                {{ $t('auth.form.agreement') }}
            </p>

        </div>
        </Transition>

        <button type="submit" :disabled="isLoading" class="btn-primary full-width w-full p-3.5 text-base border-none rounded-md cursor-pointer font-semibold bg-[#0d0d0d] text-white hover:opacity-90 active:opacity-75 transition-opacity duration-300 dark:bg-[#ededed] dark:text-[#0d0d0d] flex justify-center items-center">
            <span v-if="isLoading" class="spinner border-2 border-transparent border-t-current rounded-full w-4 h-4 animate-spin"></span>
            <span v-else>{{ isLoginView ? $t('auth.form.btn_signin') : $t('auth.form.btn_signup') }}</span>
        </button>

    </form>
    
    <template #footer>
        <div class="border-t border-black/10 dark:border-white/10 pt-5 mt-5">
            <p v-if="isLoginView" class="text-center">{{ $t('auth.form.toggle.no_account') }} <a href="#" @click.prevent="isLoginView = false" class="text-[#635bff] no-underline font-semibold hover:underline">{{ $t('auth.form.toggle.create') }}</a></p>
            <p v-else class="text-center">{{ $t('auth.form.toggle.has_account') }} <a href="#" @click.prevent="isLoginView = true" class="text-[#635bff] no-underline font-semibold hover:underline">{{ $t('auth.form.toggle.signin') }}</a></p>
        </div>
    </template>
    
    <SuccessModal 
      :show="showModal" 
      :title="modalTitle" 
      :message="modalMessage" 
      :buttonText="modalButtonText" 
      :type="modalStatus"
      @close="handleModalAction" 
    />
  </FormCard>
 </template>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active {
    -webkit-background-clip: text;
    -webkit-text-fill-color: inherit;
    transition: background-color 600000s 0s;
    box-shadow: inset 0 0 20px 20px transparent;
}

:deep(.dark) input:-webkit-autofill {
    -webkit-text-fill-color: #ededed;
}
:deep(.light) input:-webkit-autofill {
    -webkit-text-fill-color: #0d0d0d;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>