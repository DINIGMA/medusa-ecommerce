import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { myWorkflow } from "../../src/workflows/recommendation/contentRecommendation";
const natural = require("natural");
const desc = require("./descriptions.json");
var TfIdf = natural.TfIdf;
const similarity = require("compute-cosine-similarity");
const { removeStopwords, eng, fra } = require("stopword");

const tokenizer = new natural.WordTokenizer();

const removeStopWords = (description: any) =>
  removeStopwords(description.split(" "));

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Test hello-world workflow", () => {
      it("returns message", async () => {
        const computedTfidf = (texts: any) => {
          const tfidf = new TfIdf();
          const preprocessedTexts = texts.map((text: any) =>
            removeStopWords(text)
          );

          preprocessedTexts.forEach((text) =>
            tfidf.addDocument(text.join(" "))
          );

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
          //     const termData = tfidf
          //       .listTerms(index)
          //       .find((t) => t.term === term);
          //     return termData ? termData.tfidf : 0;
          //   });
          // });
        };

        const startTime = performance.now();

        const result = computedTfidf(desc);

        const endTime = performance.now();

        const executionTime = endTime - startTime;
        console.log(startTime);
        console.log(endTime);
        expect(executionTime).toBeLessThan(1000);
      });
    });
  },
});

jest.setTimeout(60 * 1000);
