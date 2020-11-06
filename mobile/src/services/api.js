import axios from "axios";
import { AsyncStorage } from "react-native";
import server from './server'
baseURL = server

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
