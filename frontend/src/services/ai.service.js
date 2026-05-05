import axiosInstance from "../lib/axiosIntance";

export const requestPostDraft = async (payload) => {
  const { data } = await axiosInstance.post("/ai/posts/draft", payload);
  return data?.data || data;
};

export const requestMessageDraft = async (payload) => {
  const { data } = await axiosInstance.post("/ai/messages/draft", payload);
  return data?.data || data;
};
