import { Modules } from '@medusajs/framework/utils'

const getProducts = async() => {
    const productModuleService = req.scope.resolve(
        Modules.PRODUCT
    )

    const data = await productModuleService.listProducts()
    console.log(data);
}

getProducts()