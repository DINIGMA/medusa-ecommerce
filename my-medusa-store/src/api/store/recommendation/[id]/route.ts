import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { myWorkflow as recommendation } from "../../../../workflows/recommendation/recommendation";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  const { result } = await recommendation(req.scope).run({
    input: {
      productId: id,
    },
  });

  res.json(result);
}
