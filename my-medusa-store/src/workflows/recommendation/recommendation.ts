import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { any } from "prop-types";

const natural = require("natural");
var TfIdf = natural.TfIdf;
const similarity = require("compute-cosine-similarity");
const { removeStopwords, eng, fra } = require("stopword");

const tokenizer = new natural.WordTokenizer();

const removeStopWords = (description: any) =>
  removeStopwords(description.split(" "));

export const computedTfidf = (texts: any) => {
  const tfidf = new TfIdf();
  const preprocessedTexts = texts.map((text: any) => removeStopWords(text));

  preprocessedTexts.forEach((text) => tfidf.addDocument(text.join(" ")));

  const allTerms = new Set();

  // Предварительно создаем множества всех уникальных терминов
  preprocessedTexts.forEach((text, index) => {
    tfidf.listTerms(index).forEach((term) => {
      allTerms.add(term.term);
    });
  });

  const termsArray = Array.from(allTerms);

  console.log("Начало создания матрицы тфидф");

  return preprocessedTexts.map((_, index) => {
    const termMap = new Map(
      tfidf.listTerms(index).map((t) => [t.term, t.tfidf])
    );
    return termsArray.map((term) => termMap.get(term) || 0);
  });
  // return preprocessedTexts.map((_, index) => {
  //   return termsArray.map((term) => {
  //     const termData = tfidf.listTerms(index).find((t) => t.term === term);
  //     return termData ? termData.tfidf : 0;
  //   });
  // });
};

type WorkflowInput = {
  productId: string;
};

type Product = {
  id: number;
  title: string;
  description: string;
};

type Recommendation = {
  id: string;
  product: object;
  sim: number;
};

const getRecommendation = createStep(
  "get-product-list",
  async ({ productId }: WorkflowInput, { container }) => {
    const productModuleService = container.resolve("product");
    const products = await productModuleService.listProducts();

    console.log(productId);
    // const baseProduct = await productModuleService.retrieveProduct(productId);

    const texts = products.map((product) => {
      if (productId == product.id) console.log(product);
      return `${product.description}`;
    });

    const tfidfVectors = computedTfidf(texts);

    let rec: Array<object> = [];

    console.log(products);

    const baseIndex = products.findIndex((product) => product.id === productId);
    if (baseIndex === -1) {
      throw new Error("Base product not found in product list");
    }

    const baseVector = tfidfVectors[baseIndex];
    console.log(baseVector);
    products.forEach((product, index) => {
      if (index !== 0) {
        const computedSim = similarity(baseVector, tfidfVectors[index]);
        if (computedSim > 0.3) {
          rec.push({
            sim: computedSim,
            product: product,
          });
        }
      }
    });
    console.log(rec);
    rec.sort((a: Recommendation, b: Recommendation) => {
      return b.sim - a.sim;
    });
    console.log(rec);

    return new StepResponse(rec);
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
