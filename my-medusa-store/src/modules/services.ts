const { ProductService } = require("@medusajs/medusa");

async function getProducts() {
  // Создаем экземпляр ProductService
  const productService = new ProductService();

  try {
    // Получаем список продуктов
    const products = await productService.list();

    // Выводим список продуктов в консоль
    console.log(products);
  } catch (error) {
    // Обработка ошибок
    console.error("Ошибка при получении продуктов:", error);
  }
}

// Вызываем функцию для получения продуктов
getProducts();
