import client from "./client";

export interface FollowCountResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    followerCount: number;
    followingCount: number;
  };
}

export interface FollowActionResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export const getMyFollowCounts = async () => {
  const response = await client.get<FollowCountResponse>("/follow/count");
  return response.data;
};

export const followMember = async (memberId: number) => {
  const response = await client.post<FollowActionResponse>(
    `/follow/${memberId}`
  );
  return response.data;
};

export const unfollowMember = async (memberId: number) => {
  const response = await client.delete<FollowActionResponse>(
    `/follow/${memberId}`
  );
  return response.data;
};
