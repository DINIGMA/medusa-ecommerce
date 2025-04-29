import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { baseHttp, storeHttp } from "@/http";
import axios from "axios";

export const useReviewStore = defineStore("review", () => {
  const reviews = ref();

  const createReview = async () => {
    try {
      const { data } = await storeHttp.post("/review", [
        {
          product_id: "prod_01JSC50QEXSXMGJ5A1778EAN1D",
          customer_id: "cus_01JKDQ5Z47BSMV9X6TJPQMCXRR",
          title: "Really good",
          content: "The material is nice",
          rating: 5,
          first_name: "John",
          last_name: "Smith",
        },
        {
          product_id: "prod_01JSC50QEYHZNF8QXSE7TXW6W7",
          customer_id: "cus_01JKDQ5Z47BSMV9X6TJPQMCXRR",
          title: "Really good",
          content: "The material is nice",
          rating: 5,
          first_name: "Pisi",
          last_name: "v Popi",
        },
        {
          product_id: "prod_01JSC50QEYHZNF8QXSE7TXW6W7",
          customer_id: "cus_01JKDQ5Z47BSMV9X6TJPQMCXRR",
          title: "Really good",
          content: "The material is nice",
          rating: 5,
          first_name: "Alex",
          last_name: "Gnedov",
        },
      ]);
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  return {
    reviews,
    createReview,
  };
});
