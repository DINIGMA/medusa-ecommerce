<template>
  <div>
    <div v-if="loading" class="loading">Loading...</div>

    <template v-else>
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-group"
      >
        <h1 class="category-title">{{ category?.name }}</h1>
        <p v-if="category?.description" class="category-description">
          {{ category?.description }}
        </p>

        <template v-if="category.category_children?.length">
          <div class="child-categories">
            <span class="child-title">Child Categories</span>
            <ul class="child-list">
              <li
                v-for="childCategory in category.category_children"
                :key="childCategory.id"
                class="child-item"
              >
                {{ childCategory.name }}
              </li>
            </ul>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<!-- <script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  categories: {
    type: Array as () => any[],
    required: true,
  },
});

const rootCategories = computed(() =>
  props.categories.filter((c) => !c.parent_category_id)
);
</script> -->

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeHttp } from "@/http";

type Categories = {
  id: string;
  name: string;
  handle: string;
  description: string;
  category_children: { id: string; name: string }[];
}[];

const loading = ref(true);
const categories = ref<Categories>();

const fetchCategories = async () => {
  try {
    const { data } = await storeHttp.get(
      "/product-categories?fields=*category_children"
    );
    categories.value = data.product_categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>
