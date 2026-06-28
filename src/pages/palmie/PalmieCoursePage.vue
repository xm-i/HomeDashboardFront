<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CheckCircle2 } from 'lucide-vue-next'
import { palmieApi } from '@/services/palmie'
import { env } from '@/config/env'
import type { PalmieDailyLesson, PalmiePrimeLesson } from '@/models/palmie-course.model'

/**
 * パルミー（コース詳細）ページ。
 * コース ID からレッスンを取得し、動画再生・資料ダウンロード・チャプター選択を行う。
 * Angular 版 `palmie-course` を移植。
 */

const route = useRoute()
/** ルートパラメータのコース ID */
const courseId = Number(route.params.id)

/** デイリーレッスン（該当時） */
const dailyLesson = ref<PalmieDailyLesson | null>(null)
/** プライムレッスン（該当時） */
const primeLesson = ref<PalmiePrimeLesson | null>(null)
/** プライムレッスン一覧（同一コース ID のもの。動画切替に利用） */
const primeLessons = ref<PalmiePrimeLesson[]>([])
/** 再生中の動画 URL */
const videoUrl = ref<string>('')
/** 再生速度 */
const playbackRate = ref<number>(1)
/** video 要素参照（再生速度設定に利用） */
const videoEl = ref<HTMLVideoElement | null>(null)

/** 資料ダウンロードのベース URL */
const documentsUrl = env.palmieDocumentsUrl

/** タイトル表示用（デイリー／プライムのいずれか） */
const courseTitle = ref<string>('')

/** デイリーレッスンか判定する型ガード */
function isDaily(x: PalmieDailyLesson | PalmiePrimeLesson): x is PalmieDailyLesson {
  return (x as PalmieDailyLesson).dailyLessons !== undefined
}

/** プライムレッスンか判定する型ガード */
function isPrime(x: PalmieDailyLesson | PalmiePrimeLesson): x is PalmiePrimeLesson {
  return (x as PalmiePrimeLesson).primeLessons !== undefined
}

/** 動画 ID から再生 URL を設定する */
function setVideo(videoId: string | undefined): void {
  if (videoId === undefined) {
    return
  }
  videoUrl.value = `${env.palmieVideoUrl}${videoId}.mp4`
}

/** プライムレッスン ID（video.id）から動画を切り替える */
function setVideoFromPrimeLessonId(primeLessonId: number): void {
  const found = primeLessons.value.find((x) => x.video.id === primeLessonId)
  setVideo(found?.video.vimeoVideoId)
}

/** 再生速度を video 要素へ反映する */
function playbackRateChange(value: number | string): void {
  try {
    if (!videoEl.value) {
      return
    }
    videoEl.value.playbackRate = Number(value)
  } catch (e: unknown) {
    console.error(e)
  }
}

onMounted(async () => {
  let courses
  try {
    courses = await palmieApi.getSearchResult(`${courseId},`)
  } catch (err: unknown) {
    console.error('パルミーコースの取得に失敗しました', err)
    return
  }
  const lesson = courses.courses.find((x) => x.course.id === courseId)
  if (!lesson) {
    return
  }
  courseTitle.value = lesson.course.title
  if (isDaily(lesson)) {
    dailyLesson.value = lesson
    setVideo(lesson.chapter.videoId)
  }
  if (isPrime(lesson)) {
    primeLesson.value = lesson
    primeLessons.value = courses.courses.filter(
      (x): x is PalmiePrimeLesson => isPrime(x) && x.course.id === courseId,
    )
    setVideo(lesson.video.vimeoVideoId)
  }
})
</script>

<template>
  <div v-if="dailyLesson || primeLesson" class="flex flex-col gap-4">
    <h2 class="text-xl font-semibold">{{ courseTitle }}</h2>
    <div class="flex flex-col gap-4 lg:flex-row">
      <!-- 動画エリア -->
      <div class="flex-auto">
        <video ref="videoEl" :src="videoUrl" controls autoplay class="w-full rounded-md bg-black"></video>
        <div class="mt-2 flex items-center gap-2">
          <input
            v-model.number="playbackRate"
            type="text"
            inputmode="numeric"
            placeholder="再生速度"
            class="h-8 w-[100px] rounded-md border border-input bg-background px-2 text-right text-sm text-foreground"
            @input="playbackRateChange(playbackRate)"
          />
          <span class="text-sm text-muted-foreground">倍速</span>
        </div>
      </div>

      <!-- レッスン一覧 -->
      <div class="w-full lg:w-[250px] lg:shrink-0">
        <!-- デイリーレッスン -->
        <div v-if="dailyLesson" class="flex flex-col gap-3">
          <div
            v-if="dailyLesson.course.supplementUrl?.length || dailyLesson.course.supplementPdfUrl?.length"
            class="flex flex-col gap-1"
          >
            <a
              v-if="dailyLesson.course.supplementUrl?.length"
              :href="`${documentsUrl}${dailyLesson.course.supplementUrl}`"
              download
              class="text-sm text-primary underline-offset-4 hover:underline"
            >
              資料ダウンロード
            </a>
            <a
              v-if="dailyLesson.course.supplementPdfUrl?.length"
              :href="`${documentsUrl}${dailyLesson.course.supplementPdfUrl}`"
              download
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary underline-offset-4 hover:underline"
            >
              PDF資料ダウンロード
            </a>
          </div>

          <div
            v-for="dLesson in dailyLesson.dailyLessons"
            :key="dLesson.id"
            class="rounded-md border border-border bg-card text-card-foreground"
          >
            <div class="border-b border-border p-3">
              <h3 class="text-sm font-semibold">{{ dLesson.title }}</h3>
              <div class="text-xs text-muted-foreground">{{ dLesson.description }}</div>
            </div>
            <ul>
              <li
                v-for="chapter in dLesson.chapters"
                :key="chapter.id"
                class="border-b border-border last:border-b-0"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2 p-3 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  @click="setVideo(chapter.videoId)"
                >
                  <CheckCircle2 class="size-4 shrink-0" />
                  <span>{{ chapter.title }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- プライムレッスン -->
        <div v-if="primeLesson" class="rounded-md border border-border bg-card text-card-foreground">
          <ul>
            <li
              v-for="pLesson in primeLesson.primeLessons"
              :key="pLesson.id"
              class="border-b border-border p-3 last:border-b-0"
            >
              <button
                type="button"
                class="block w-full text-left hover:text-accent-foreground"
                @click="setVideoFromPrimeLessonId(pLesson.id)"
              >
                <h3 class="text-sm font-semibold">{{ pLesson.title }}</h3>
              </button>
              <div class="text-xs text-muted-foreground">{{ pLesson.description }}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
