export const getChatList = async () => {
  return await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat-list`, {
    credentials: 'include',
  }).then((res) => res.json());
};
