import type { UserConfig } from 'vite'

export default {
  build: {
    // エラーが起こったときに、どのファイルの行で発生したかわかる
    sourcemap: true
  }
} satisfies UserConfig