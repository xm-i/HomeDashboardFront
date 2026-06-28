import { http } from '@/lib/http'
import type { Recipe } from '@/models/recipe.model'

/**
 * キッチン（レシピ管理）の REST API。
 * Angular 版 `kitchen-api.service.ts` のエンドポイントを移植。
 */
export const kitchenApi = {
  /** レシピ一覧を取得する */
  getRecipeList: () => http.get<Recipe[]>('api/kitchen-api/get-recipe-list'),

  /** レシピを登録する */
  registerRecipe: (recipe: Recipe) =>
    http.post<boolean>('api/kitchen-api/post-register-recipe', recipe),

  /** レシピを削除する */
  deleteRecipe: (recipe: Recipe) =>
    http.post<boolean>('api/kitchen-api/post-delete-recipe', recipe),
}
