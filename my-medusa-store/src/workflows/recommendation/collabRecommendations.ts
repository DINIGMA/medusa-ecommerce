import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

type WorkflowInput = {
  customerId: string;
};

type CustomerRating = {
  customer_id: string;
  product_id: string;
  rating: number;
};

type RatingMatrices = {
  userProductMatrix: Record<string, Record<string, number>>;
  productUserMatrix: Record<string, Record<string, number>>;
  userAverages: Record<string, number>;
};

async function calculateSimilarities(
  targetUserId: string,
  userProductMatrix: Record<string, Record<string, number>>
): Promise<Record<string, number>> {
  const similarities: Record<string, number> = {};
  const targetRatings = userProductMatrix[targetUserId] || {};
  const MIN_COMMON_PRODUCTS = 2;

  Object.keys(userProductMatrix).forEach((otherUserId) => {
    if (otherUserId === targetUserId) return;

    const otherRatings = userProductMatrix[otherUserId];
    const commonProducts = Object.keys(targetRatings).filter(
      (productId) => productId in otherRatings
    );

    if (commonProducts.length < MIN_COMMON_PRODUCTS) return;

    // Рассчитываем косинусное сходство по общим продуктам
    let dotProduct = 0,
      normA = 0,
      normB = 0;

    commonProducts.forEach((productId) => {
      const a = targetRatings[productId];
      const b = otherRatings[productId];
      dotProduct += a * b; // Скалярное произведение
      normA += a ** 2; // Норма вектора target
      normB += b ** 2; // Норма вектора other
    });
    console.log(`Вычисления ${otherUserId}`);
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    let similarity = 0;
    if (denominator !== 0) {
      console.log(denominator);
      console.log(dotProduct);
      similarity = dotProduct / denominator;
    }

    similarities[otherUserId] = similarity;
  });

  return similarities;
}

function calculateAverage(ratings: number[]): number {
  return ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;
}

const getCollaborativeFiltering = createStep(
  "get-collab-filtering",
  async (input: WorkflowInput, { container }) => {
    const customerModuleService = container.resolve("customer");
    const reviewModuleService = container.resolve("productReview");
    const cacheModuleService = container.resolve(Modules.CACHE);
    const productModuleService = container.resolve("product");

    console.log("fkdsdkskdklskldsdkl");

    let cachedData: RatingMatrices = await cacheModuleService.get(
      "collabRatings"
    );

    if (!cachedData) {
      const reviews = (await reviewModuleService.listReviews(
        {},
        {}
      )) as CustomerRating[];

      const matrices: RatingMatrices = {
        userProductMatrix: {},
        productUserMatrix: {},
        userAverages: {},
      };

      // Построение матриц
      reviews.forEach(({ customer_id, product_id, rating }) => {
        // User-Product матрица
        if (!matrices.userProductMatrix[customer_id]) {
          matrices.userProductMatrix[customer_id] = {};
        }
        matrices.userProductMatrix[customer_id][product_id] = rating;

        if (!matrices.productUserMatrix[product_id]) {
          matrices.productUserMatrix[product_id] = {};
        }
        matrices.productUserMatrix[product_id][customer_id] = rating;
      });

      Object.entries(matrices.userProductMatrix).forEach(
        ([customer_id, ratings]) => {
          const ratingsList = Object.values(ratings);
          matrices.userAverages[customer_id] =
            ratingsList.reduce((a, b) => a + b, 0) / ratingsList.length;
        }
      );

      await cacheModuleService.set("collabRatings", matrices, 86400);

      cachedData = matrices;
    }

    //Проверка сколько у кого отзывов
    // Object.entries(cachedData.userProductMatrix).forEach(
    //   ([customer_id, ratings]) => {
    //     const ratingsList = Object.values(ratings);
    //     console.log(ratingsList);
    //   }
    // );

    const { userProductMatrix, productUserMatrix, userAverages } = cachedData;

    // 1. Получить схожих пользователей
    const similarities = await calculateSimilarities(
      input.customerId,
      userProductMatrix
    );

    // console.log(similarities);

    //Собрать товары схожих пользователей
    const candidateProducts = new Set<string>();
    Object.keys(similarities).forEach((otherUserId) => {
      const ratedProducts = Object.keys(userProductMatrix[otherUserId]);
      ratedProducts.forEach((productId) => candidateProducts.add(productId));
    });

    //Исключить уже оцененные товары
    const ratedByTarget = new Set(
      Object.keys(userProductMatrix[input.customerId] || {})
    );

    const unratedCandidates = Array.from(candidateProducts).filter(
      (productId) => !ratedByTarget.has(productId)
    );

    console.log(unratedCandidates.length);

    // console.log(unratedCandidates);

    // Предсказать оценки
    const predictions: Record<string, number> = {};
    const targetAvg = userAverages[input.customerId] || 2.5;

    unratedCandidates.forEach((productId) => {
      let numerator = 0;
      let denominator = 0;

      Object.entries(similarities).forEach(([otherUserId, similarity]) => {
        const rating = productUserMatrix[productId]?.[otherUserId];
        if (rating) {
          const otherAvg = userAverages[otherUserId];
          const deviation = rating - otherAvg;

          if (Math.abs(deviation) > 2.5) return;

          numerator += deviation * similarity;
          denominator += Math.abs(similarity);
        }
      });

      const rawRating =
        denominator > 0 ? targetAvg + numerator / denominator : targetAvg;

      const finalRating = Math.min(5, Math.max(1, rawRating));
      predictions[productId] = Number(finalRating.toFixed(2));
    });

    const filteredPredictions = Object.entries(predictions)
      .filter(([_, rating]) => rating > 3.0) // Порог рекомендации
      .sort((a, b) => b[1] - a[1]);

    const recommendation = filteredPredictions.slice(0, 50);

    const recommendationIds = recommendation.map(([id, number]) => id);

    const recommendationProducts = await productModuleService.listProducts({
      id: recommendationIds,
    });

    const reviewsUser = await reviewModuleService.listReviews({
      customer_id: [
        "cus_01JSPEM47YQT6K0F8H1PSW1NB3",
        "cus_01JSPEJDNXQ5EZKDQKS07PF2Z5",
      ],
    });

    // console.log(reviewsUser);

    return new StepResponse({
      recommendations: recommendationProducts,
      rec: similarities,
    });

    // const targetUserRatings = userProductMatrix[input.customerId];

    // const similarities: Record<string, number> = {};

    // console.log(Object.keys(userProductMatrix).length);

    // Object.keys(userProductMatrix).forEach((otherCustomerId, i) => {
    //   if (otherCustomerId === input.customerId) return;

    //   const commonProducts = Object.keys(targetUserRatings).filter(
    //     (productId) => productId in userProductMatrix[otherCustomerId]
    //   );

    //   if (commonProducts.length === 0) return;

    //   let dotProduct = 0;
    //   let normA = 0;
    //   let normB = 0;

    //   commonProducts.forEach((productId) => {
    //     const a = targetUserRatings[productId];
    //     const b = userProductMatrix[otherCustomerId][productId];
    //     dotProduct += a * b;
    //     normA += a ** 2;
    //     normB += b ** 2;
    //   });

    //   if (i === 1132180) {
    //     console.log("cfdfdfdfdf");
    //     console.log(Math.sqrt(normA));
    //     console.log(Math.sqrt(normB));
    //     console.log(dotProduct);
    //   }

    //   const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    //   similarities[otherCustomerId] = similarity;
    // });

    // const targetAvg = userAverages[input.customerId] || 2.5;
    // let numerator = 0;
    // let denominator = 0;

    // Object.entries(similarities).forEach(([otherUserId, similarity]) => {
    //   const otherUserRating = productUserMatrix[input.productId]?.[otherUserId];
    //   console.log(otherUserRating);
    //   if (otherUserRating) {
    //     const otherAvg = userAverages[otherUserId];
    //     numerator += (otherUserRating - otherAvg) * similarity;
    //     denominator += Math.abs(similarity);
    //   }
    // });

    // const predictedRating =
    //   denominator !== 0 ? targetAvg + numerator / denominator : targetAvg;

    // const reviewsUser = await reviewModuleService.listReviews({
    //   customer_id: ["cus_01JSP7M3WGWP5VBJSF80D1MRHS", ""],
    // });

    // const reviewsProduct = await reviewModuleService.listReviews({
    //   product_id: ["prod_01JSC50QEZSPXPSKMQ4ARM7Y13"],
    // });

    // console.log(reviewsUser);
    // console.log(reviewsProduct);

    // return new StepResponse({
    //   collabRec: similarities,
    // });
  }
);

export const collaborativeFiltering = createWorkflow(
  "collabRec",
  function (input: WorkflowInput) {
    const collabRec = getCollaborativeFiltering(input);
    return new WorkflowResponse({
      collabRec: collabRec,
    });
  }
);
