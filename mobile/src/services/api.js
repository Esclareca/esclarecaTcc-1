import axios from "axios";
import { AsyncStorage } from "react-native";

 baseURL = 'http://192.168.29.64:3333', //reid
// baseURL = 'http://192.168.0.114:3333'//gj
//baseURL = "http://192.168.42.217:3333" //gj2
// baseURL = 'https://esclarecabeta.herokuapp.com/'
// baseURL = 'http://54.162.88.146:3333'

axios.defaults.baseURL = baseURL
axios.defaults.timeout = 150000
const api = axios.create()
api.interceptors.request.use(
    async config => {
        await AsyncStorage.getItem('token').then(t => {
            if (t) {
                config.headers.Authorization = `Bearer ${t}`
            }
        })
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// Response interceptor for API calls(valida a response, para tratar o bearer)
// axiosApiInstance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   async function (error) {
//     const originalRequest = error.config;
//     if (error.response.status === 403 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       const access_token = await refreshAccessToken();
//       axios.defaults.headers.common["Authorization"] = "Bearer " + access_token;
//       return axiosApiInstance(originalRequest);
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
