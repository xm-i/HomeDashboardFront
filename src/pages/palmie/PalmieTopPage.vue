<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { palmieApi } from '@/services/palmie'
import type {
  PalmieDailyLesson,
  PalmiePrimeLesson,
  PalmieCourses,
} from '@/models/palmie-course.model'

/**
 * パルミー（Top）ページ。
 * 検索ワードでコースを絞り込み、デイリーレッスン／プライムレッスンをカード表示する。
 * Angular 版 `palmie-top` を移植。
 */

/** デイリーレッスン一覧 */
const dailyLessons = ref<PalmieDailyLesson[]>([])
/** プライムレッスン一覧（コース ID で重複排除） */
const primeLessons = ref<PalmiePrimeLesson[]>([])
/** 検索ワード */
const searchWord = ref<string>('')

/** デイリーレッスンか判定する型ガード */
function isDaily(x: PalmieDailyLesson | PalmiePrimeLesson): x is PalmieDailyLesson {
  return (x as PalmieDailyLesson).dailyLessons !== undefined
}

/** プライムレッスンか判定する型ガード */
function isPrime(x: PalmieDailyLesson | PalmiePrimeLesson): x is PalmiePrimeLesson {
  return (x as PalmiePrimeLesson).primeLessons !== undefined
}

/** 検索ワードでコースを取得して一覧を構築する（空文字なら全件取得） */
async function search(word: string): Promise<void> {
  let courses: PalmieCourses
  try {
    courses = word.length === 0 ? await palmieApi.getCourses() : await palmieApi.getSearchResult(word)
  } catch (err: unknown) {
    console.error('パルミーコースの取得に失敗しました', err)
    return
  }
  dailyLessons.value = courses.courses.filter(isDaily)

  // プライムレッスンはコース ID で重複排除する（Angular 版 distinct(x => x.course.id) 相当）
  const seen = new Set<number>()
  const primes: PalmiePrimeLesson[] = []
  for (const course of courses.courses) {
    if (isPrime(course) && !seen.has(course.course.id)) {
      seen.add(course.course.id)
      primes.push(course)
    }
  }
  primeLessons.value = primes
}

// 検索ワードの変更に追従して再検索する
watch(searchWord, (word) => {
  void search(word)
})

onMounted(() => {
  void search('')
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 検索ボックス -->
    <div class="relative max-w-md">
      <input
        v-model="searchWord"
        type="text"
        placeholder="input search text"
        class="h-10 w-full rounded-md border border-input bg-background pl-3 pr-9 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <Search class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>

    <!-- コースカード一覧 -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <RouterLink
        v-for="dailyLesson in dailyLessons"
        :key="`daily-${dailyLesson.course.id}`"
        :to="`/palmie/${dailyLesson.course.id}`"
        class="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="relative w-full pt-[65%]">
          <img
            :src="dailyLesson.chapter.slide.url"
            :alt="dailyLesson.course.title"
            class="absolute inset-0 size-full object-cover"
          />
        </div>
        <div class="flex flex-col gap-1 p-3">
          <h4 class="line-clamp-2 text-sm font-semibold">{{ dailyLesson.course.title }}</h4>
          <div class="text-xs text-muted-foreground">Level: [{{ dailyLesson.level }}]</div>
        </div>
      </RouterLink>

      <RouterLink
        v-for="primeLesson in primeLessons"
        :key="`prime-${primeLesson.course.id}`"
        :to="`/palmie/${primeLesson.course.id}`"
        class="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="relative w-full pt-[65%]">
          <img
            :src="primeLesson.slide.url"
            :alt="primeLesson.course.title"
            class="absolute inset-0 size-full object-cover"
          />
        </div>
        <div class="flex flex-col gap-1 p-3">
          <h4 class="line-clamp-2 text-sm font-semibold">{{ primeLesson.course.title }}</h4>
          <div class="text-xs text-muted-foreground">Level: [{{ primeLesson.level }}]</div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
