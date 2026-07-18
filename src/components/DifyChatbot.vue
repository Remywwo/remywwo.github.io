<script setup lang="ts">
const DIFY_CHATBOT_ID = 'b0cSUN0o0wjmAaf8'
const DIFY_BASE_URL = 'http://localhost'

type DifyChatbotWindow = Window & typeof globalThis & {
  difyChatbotConfig?: {
    token: string
    baseUrl: string
    inputs: Record<string, unknown>
    systemVariables: Record<string, unknown>
    userVariables: Record<string, unknown>
    containerProps: {
      style: Record<string, string>
      className: string
    }
  }
}

onMounted(() => {
  const currentWindow = window as DifyChatbotWindow

  currentWindow.difyChatbotConfig = {
    token: DIFY_CHATBOT_ID,
    baseUrl: DIFY_BASE_URL,
    inputs: {},
    systemVariables: {},
    userVariables: {},
    containerProps: {
      style: {
        right: '20px',
        bottom: '20px',
      },
      className: 'custom-chat-button',
    },
  }

  if (document.getElementById(DIFY_CHATBOT_ID))
    return

  const script = document.createElement('script')
  script.id = DIFY_CHATBOT_ID
  script.src = `${DIFY_BASE_URL}/embed.min.js`
  script.defer = true
  document.body.appendChild(script)
})
</script>

<template>
  <div aria-hidden="true" />
</template>

<style>
#dify-chatbot-bubble-button {
  background-color: #1c64f2 !important;
}

#dify-chatbot-bubble-window {
  width: 24rem !important;
  height: 40rem !important;
}
</style>
