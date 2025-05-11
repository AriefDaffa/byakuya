export const getMessages = async (receiver: string, page: number) => {
  return await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/private-chat?receiver=${receiver}&page=${page}`,
    { credentials: 'include' }
  ).then((res) => res.json());
};
