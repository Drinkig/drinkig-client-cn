import client from "./client";

// 유저 차단 — 차단하면 팔로우가 양방향 해제되고 서로의 피드/프로필/노트가 숨겨진다.
// (App Store UGC 가이드라인 대응: 신고 + 차단)

export interface BlockActionResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export interface BlockedMemberItem {
  memberId: number;
  name: string;
  imageUrl?: string | null;
}

export interface BlockedMembersResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: BlockedMemberItem[];
}

export const blockMember = async (memberId: number) => {
  const response = await client.post<BlockActionResponse>(`/block/${memberId}`);
  return response.data;
};

export const unblockMember = async (memberId: number) => {
  const response = await client.delete<BlockActionResponse>(
    `/block/${memberId}`
  );
  return response.data;
};

export const getBlockedMembers = async () => {
  const response = await client.get<BlockedMembersResponse>("/block");
  return response.data;
};
