import {  computedTfidf as myFunc} from '../workflows/recommendation/recommendation';


const generateProducts = (count) => {
    const descriptions = [];

    for (let i = 0; i < count; i++) {
        descriptions.push(`Описание товара ${i + 1}: ${Math.random().toString(36).substring(7)}`);
    }

    console.log(process.env.DATABASE_URL);

    return descriptions;
  };
  

  test("Функция должна обработать массив из 1000 описаний", () => {
    const descriptions = generateProducts(850);

    
    const startTime = performance.now();
    const result = myFunc(descriptions);
    const endTime = performance.now();

    const executionTime = endTime - startTime;
  
    expect(executionTime).toBeLessThan(1000); // Проверяем, что функция отработала корректно
  });
