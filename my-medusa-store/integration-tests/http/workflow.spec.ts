import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { myWorkflow } from "../../src/workflows/recommendation/recommendation";

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Test hello-world workflow", () => {
      it("returns message", async () => {
        const startTime = performance.now();
        const { result } = await myWorkflow(getContainer()).run({
          input: {
            productId: "prod_01JKB6MR51NAPGMNMCSJSZ72V7",
          },
        });
        const endTime = performance.now();

        const executionTime = endTime - startTime;
        console.log(startTime);
        console.log(endTime);
        expect(executionTime).toBeLessThan(20);
      });
    });
  },
});

jest.setTimeout(60 * 1000);
