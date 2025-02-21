import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { authHttp, storeHttp } from "@/http";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || null);
  const userData = ref<any>();
  const error = ref();
  const userInfo = ref();

  const registerClient = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    try {
      let { data } = await authHttp.post("/customer/emailpass/register", {
        email,
        password,
      });

      token.value = data.token;

      // Если токена нет, проверяем, существует ли уже учетная запись
      if (!data.token) {
        if (
          data.type === "unauthorized" &&
          data.message === "Identity with email already exists"
        ) {
          // Пробуем авторизоваться
          const { data } = await authHttp.post("/customer/emailpass", {
            email,
            password,
          });

          token.value = data.token;

          if (!token) {
            alert("Ошибка: " + data.message);
            return;
          }
        } else {
          alert("Ошибка: " + data.message);
          return;
        }
      }

      // Создание пользователя
      const customerResponse = await storeHttp.post(
        "/customers",
        {
          first_name: firstName,
          last_name: lastName,
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        }
      );

      if (!customerResponse.data.customer) {
        alert("Ошибка: " + customerResponse.data.message);
        return;
      }

      console.log(customerResponse.data.customer);
      // TODO: добавить редирект на страницу входа
    } catch (error) {
      console.error("Ошибка регистрации:");
    }
  };

  const AuthClient = async (email: string, password: string) => {
    try {
      const { data } = await authHttp.post("/customer/emailpass", {
        email: email,
        password: password,
      });
      token.value = data.token;

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      const { data: customerInfo } = await storeHttp.get("/customers/me", {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });
      userInfo.value = customerInfo.customer;
      if (customerInfo.customer) {
        localStorage.setItem("userInfo", JSON.stringify(customerInfo.customer));
      }
    } catch (err) {
      console.log(err);
      error.value = err;
    }
  };

  return { token, registerClient, AuthClient, error, userInfo };
});
