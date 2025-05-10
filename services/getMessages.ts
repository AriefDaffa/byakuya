export const getMessages = async (roomId: string, page: number) => {
  return await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/private-chat?room_id=${roomId}&page=${page}`,
    { credentials: 'include' }
  ).then((res) => res.json());
};
