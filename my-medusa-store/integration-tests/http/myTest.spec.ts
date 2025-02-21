import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ApiKeyDTO } from "@medusajs/framework/types";
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows";

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("Custom endpoints", () => {
      let pak: ApiKeyDTO;
      beforeAll(async () => {
        pak = (
          await createApiKeysWorkflow(getContainer()).run({
            input: {
              api_keys: [
                {
                  type: "publishable",
                  title: "Test Key",
                  created_by: "",
                },
              ],
            },
          })
        ).result[0];
      });
      describe("GET /custom", () => {
        it("returns correct message", async () => {
          const response = await api.get(
            `/store/recommendation/prod_01JMH2CW6RREZE3HMFXBVR6N8G`,
            {
              headers: {
                "x-publishable-api-key": pak.token,
              },
            }
          );
          console.log(response);
        });
      });
    });
  },
});

jest.setTimeout(60 * 1000);
