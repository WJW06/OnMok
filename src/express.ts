import { RoomInfo } from "./pages/Room";

// [Local]
const URL_BASE = "http://localhost:5000";

// // [Online]
// const URL_BASE = "";

export const api = {
  get: async (url: string, token?: string) => {
    const headers: any = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    return await res.json();
  },  
  
  post: async (url: string, token?: string|null, body?: any): Promise<any> => {
    const headers: any = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return fetch(url, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }).then(res => res.json());
  }
};

export const LoginApi = async (u_id: string, u_password: string) => {
  return await api.post(`${URL_BASE}/Login`, undefined, { u_id, u_password });
};

export const Sign_UpApi = async (u_id: string, u_password: string, u_name: string) => {
  return await api.post(`${URL_BASE}/Sign_up`, undefined, { u_id, u_password, u_name });
};

export const GetUserInfoApi = async (token: string) => {
  return await api.get(`${URL_BASE}/GetUserInfo`, token);
};

export const GetRoomsInfoApi = async () => {
  return await api.get(`${URL_BASE}/GetRoomsInfo`);
};

export const GettRankingInfoApi = async () => {
  return await api.get(`${URL_BASE}/GettRankingInfo`);
};

export const JoinRoomApi = async (token: string|null, r_id: string) => {
  console.log("token is:", {token});
  return await api.post(`${URL_BASE}/JoinRoom`, token, {r_id});
};

export const CreateRoomApi = async (roomData: RoomInfo) => {
  return await api.post(`${URL_BASE}/CreateRoom`, undefined, {roomData});
};

export const RandomRoomApi = async () => {
  return await api.post(`${URL_BASE}/RandomRoom`, undefined, undefined);
};

export const SearchRoomApi = async (text: string) => {
  return await api.post(`${URL_BASE}/SearchRoom`, undefined, {text});
};

export const LeaveRoomApi = async (token: string|null) => {
  console.log("Leave token is:", {token});
  return await api.post(`${URL_BASE}/LeaveRoom`, token, undefined);
};