import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { Modules } from "@medusajs/framework/utils";
import { ProductDTO } from "@medusajs/types";

import { removeWords, tokenize } from "wink-nlp-utils";

const natural = require("natural");
var TfIdf = natural.TfIdf;
const similarity = require("compute-cosine-similarity");
const { removeStopwords, eng, fra } = require("stopword");

const tokenizer = new natural.WordTokenizer();

// const removeStopWords = (description: any) => removeStopwords(description);

const preprocessText = (text: string): string[] => {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return removeStopwords(tokens);
};

type SparseVector = Map<number, number>;

export const computedTfidf = (texts: string[]) => {
  const docs = texts.map(preprocessText);

  const termFreqs: Map<number, Map<string, number>> = new Map();
  const docFreqs: Map<string, number> = new Map();
  const termIndexMap: Map<string, number> = new Map();
  let termCounter = 0;

  docs.forEach((tokens, docIdx) => {
    const freqMap = new Map<string, number>();
    const seen = new Set<string>();

    tokens.forEach((token) => {
      freqMap.set(token, (freqMap.get(token) || 0) + 1);
      if (!seen.has(token)) {
        docFreqs.set(token, (docFreqs.get(token) || 0) + 1);
        seen.add(token);
      }
      if (!termIndexMap.has(token)) {
        termIndexMap.set(token, termCounter++);
      }
    });

    termFreqs.set(docIdx, freqMap);
  });

  const numDocs = docs.length;

  const matrix: SparseVector[] = [];

  termFreqs.forEach((freqMap) => {
    const sparseRow: SparseVector = new Map();

    freqMap.forEach((tf, term) => {
      const df = docFreqs.get(term) || 1;
      const idf = Math.log(numDocs / df);
      const i = termIndexMap.get(term)!;
      sparseRow.set(i, tf * idf);
    });

    matrix.push(sparseRow);
  });

  return {
    matrix,
    termIndexMap,
  };
};

export const cosineSimilaritySparse = (
  vecA: Map<number, number>,
  vecB: Map<number, number>
): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  vecA.forEach((valA, idx) => {
    const valB = vecB.get(idx) || 0;
    dot += valA * valB;
    normA += valA * valA;
  });

  vecB.forEach((valB) => {
    normB += valB * valB;
  });

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

type Recommendation = {
  id: string;
  product: ProductDTO;
  sim: number;
  categories: any[];
};

type WorkflowInput = {
  productIds: string[];
};

const getRecommendation = createStep(
  "get-product-list",
  async ({ productIds }: WorkflowInput, { container }) => {
    const productModuleService = container.resolve("product");
    const cacheModuleService = container.resolve(Modules.CACHE);

    let tfidfVectors: { matrix: Map<number, number>[] } =
      await cacheModuleService.get("tfidfVector");

    let products: ProductDTO[];

    if (!tfidfVectors) {
      const [fetchedProducts] = await productModuleService.listAndCountProducts(
        {},
        { relations: ["categories"] }
      );

      const texts = fetchedProducts.map((product) => {
        const title = product.title.toLowerCase();
        const description = product.description?.toLowerCase();
        const categoriesText =
          product.categories?.map((item: any) => item.name)?.join(" ") || "";

        const weightedTitle = title
          .split(" ")
          .map((word) => `${word}^2`)
          .join(" ");
        const weightedDescription = description?.split(" ").join(" ");
        const weightedCategories = categoriesText
          .split(" ")
          .map((word) => `${word}^0.5`)
          .join(" ");

        return `${weightedTitle}, ${weightedDescription}, ${weightedCategories}`;
      });

      tfidfVectors = computedTfidf(texts);

      // Преобразуем Map в объект, чтобы сохранить в кэш Redis не поддерживает Map
      const serializableMatrix = tfidfVectors.matrix.map((map) =>
        Object.fromEntries(map)
      );

      await cacheModuleService.set(
        "tfidfVector",
        { matrix: serializableMatrix },
        86400
      );

      products = fetchedProducts;
    }
    // TODO доделать кеш
    else {
      let cacheProducts = await cacheModuleService.get("cachedProducts");

      products = JSON.parse(cacheProducts);

      if (!products || products.length === 0) {
        console.log("Кэш пуст, выполняем запрос к БД");
        const fetchedProducts = await productModuleService.listProducts(
          {},
          {
            relations: ["categories", "categories.parent_category"],
          }
        );

        products = fetchedProducts;
        await cacheModuleService.set(
          "cachedProducts",
          JSON.stringify(fetchedProducts),
          86400
        );
      }

      tfidfVectors.matrix = tfidfVectors.matrix.map(
        (obj) => new Map(Object.entries(obj).map(([k, v]) => [parseInt(k), v]))
      );
    }

    const getAllCategories = (category: any, acc: any[] = []) => {
      acc.push(category);
      if (category.parent_category)
        getAllCategories(category.parent_category, acc);
      return acc;
    };

    const getDepth = (c: any): number =>
      c.parent_category ? 1 + getDepth(c.parent_category) : 1;

    // Находим все базовые продукты и их индексы
    const baseProducts = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
    const baseIndices = baseProducts.map((p) => products.indexOf(p!));

    // Собираем рекомендации для всех базовых продуктов
    const recMap = new Map<string, Recommendation>();

    baseIndices.forEach((baseIndex) => {
      const baseVector = tfidfVectors.matrix[baseIndex];

      products.forEach((product, index) => {
        if (baseIndices.includes(index)) return; // Пропускаем все базовые продукты

        const sim = cosineSimilaritySparse(
          baseVector,
          tfidfVectors.matrix[index]
        );
        if (sim >= 1) return; // Пропускаем идентичные

        const existing = recMap.get(product.id);
        if (existing) {
          existing.sim += sim; // Суммируем схожести от разных базовых продуктов
        } else {
          recMap.set(product.id, {
            id: product.id,
            sim,
            product,
            categories:
              product.categories?.flatMap((c) => getAllCategories(c)) || [],
          });
        }
      });
    });

    // Преобразуем Map в массив и сортируем по убыванию схожести
    const rec = Array.from(recMap.values()).sort((a, b) => b.sim - a.sim);

    console.log(rec);

    // console.log(rec.slice(0, 10));

    // console.log(rec.slice(0, 20));

    // Собираем все категории всех базовых продуктов
    const allCategories = baseProducts.flatMap(
      (p) => p!.categories?.flatMap((c) => getAllCategories(c)) || []
    );

    // Уникализируем и сортируем по глубине категории
    const uniqueCategories = Array.from(
      new Map(allCategories.map((c) => [c.id, c])).values()
    ).sort((a, b) => getDepth(b) - getDepth(a));

    const topCandidates = rec.slice(0, 50);

    const baseCategoryIds = new Set(uniqueCategories.map((c) => c.id));

    const [categoryMatches, others] = topCandidates.reduce(
      (
        [matches, others]: [Recommendation[], Recommendation[]],
        item: Recommendation
      ) => {
        item.categories.some((c) => baseCategoryIds.has(c.id))
          ? matches.push(item)
          : others.push(item);
        return [matches, others];
      },
      [[], []] as [Recommendation[], Recommendation[]]
    );

    // 4. Формируем финальный список, сохраняя порядок схожести
    const recommended = [
      ...categoryMatches, // Сначала товары из нужных категорий
      ...others, // Затем остальные
    ].slice(0, 10);

    return new StepResponse(recommended);
  }
);

export const myWorkflow = createWorkflow(
  "recommendation",
  function (input: WorkflowInput) {
    // to pass input
    const str1 = getRecommendation(input);
    console.log(str1);
    return new WorkflowResponse({
      recommendation: str1,
    });
  }
);

// // const computedTfidf = (texts: any) => {
// //   const tfidf = new TfIdf();

// //   const preprocessedTexts = texts.map((text: any) => removeStopWords(text));

// //   preprocessedTexts.forEach((text: any) => tfidf.addDocument(text.join(" ")));

// //   const allTerms = new Set();

// //   console.log("Начало добавления всех уникальных термов");
// //   preprocessedTexts.forEach((text, index) => {
// //     tfidf.listTerms(index).forEach((term) => {
// //       allTerms.add(term.term);
// //     });
// //   });

// //   console.log("Начало превращения в массив из сета");
// //   const termsArray = Array.from(allTerms);

// //   console.log("Начало создания матрицы тфидф");

// //   const matrix = preprocessedTexts.map((_, index) => {
// //     const termMap = new Map(
// //       tfidf.listTerms(index).map((t) => [t.term, t.tfidf])
// //     );
// //     return termsArray.map((term) => termMap.get(term) || 0);
// //   });

// //   return matrix;
// // };

// export const computedTfidf = (texts: string[]) => {
//   const docs = texts.map(preprocessText);

//   const termFreqs: Map<number, Map<string, number>> = new Map();
//   const docFreqs: Map<string, number> = new Map();

//   const termIndexMap: Map<string, number> = new Map();
//   let termCounter = 0;

//   docs.forEach((tokens, docIdx) => {
//     const freqMap = new Map<string, number>();
//     const seen = new Set<string>();

//     tokens.forEach((token) => {
//       freqMap.set(token, (freqMap.get(token) || 0) + 1);

//       if (!seen.has(token)) {
//         docFreqs.set(token, (docFreqs.get(token) || 0) + 1);
//         seen.add(token);
//       }

//       if (!termIndexMap.has(token)) {
//         termIndexMap.set(token, termCounter++);
//       }
//     });

//     termFreqs.set(docIdx, freqMap);
//   });

//   const numDocs = docs.length;

//   // Step 2: Build TF-IDF matrix
//   const matrix: Float32Array[] = [];

//   termFreqs.forEach((freqMap, docIdx) => {
//     const row = new Float32Array(termIndexMap.size);

//     freqMap.forEach((tf, term) => {
//       const df = docFreqs.get(term) || 1;
//       const idf = Math.log(numDocs / df);
//       const i = termIndexMap.get(term)!;

//       row[i] = tf * idf;
//     });

//     matrix.push(row);
//   });

//   return {
//     matrix,
//     termIndexMap,
//   };
// };

// type WorkflowInput = {
//   productId: string;
// };

// type Recommendation = {
//   id: string;
//   product: object;
//   sim: number;
// };

// const getRecommendation = createStep(
//   "get-product-list",
//   async ({ productId }: WorkflowInput, { container }) => {
//     const productModuleService = container.resolve("product");

//     const cacheModuleService = container.resolve(Modules.CACHE);

//     let tfidfVectors = await cacheModuleService.get("tfidfVector");

//     if (!tfidfVectors) {
//       const [products, count] = await productModuleService.listAndCountProducts(
//         {},
//         { relations: ["categories"] }
//       );

//       const texts = products.map((product, index) => {
//         const categoriesText =
//           product.categories?.map((item) => item.name)?.join(" ") || "";

//         // const optionsText =
//         //   product.options
//         //     ?.map(
//         //       (option) =>
//         //         `${option.title} ${option.values?.map((v) => v.value).join(" ")}`
//         //     )
//         //     ?.join(" ") || "";

//         if (index == 1) console.log("swasasa");

//         return `${product.title}, ${product.description}, ${categoriesText}`;
//       });

//       tfidfVectors = computedTfidf(texts);

//       await cacheModuleService.set("tfidfVector", tfidfVectors, 86400);
//     }

//     let rec: Array<object> = [];
//     const products = await productModuleService.listProducts({});
//     const baseIndex = products.findIndex((product) => product.id === productId);

//     if (baseIndex === -1) {
//       throw new Error("Base product not found in product list");
//     }

//     const baseVector = tfidfVectors.matrix[baseIndex];

//     products.forEach((product, index) => {
//       if (index !== 0) {
//         const computedSim = similarity(baseVector, tfidfVectors.matrix[index]);
//         if (computedSim > 0.1 && computedSim < 1 && rec.length <= 10) {
//           rec.push({
//             sim: computedSim,
//             product: product,
//           });
//         }
//       }
//     });
//     rec.sort((a: Recommendation, b: Recommendation) => {
//       return b.sim - a.sim;
//     });

//     return new StepResponse(rec);
//   }
// );
