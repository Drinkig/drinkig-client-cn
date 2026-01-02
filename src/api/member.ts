import client from './client';


export interface KakaoFirebaseResponse {
  customToken: string;
}

export interface AppleLoginResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface LogoutResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}



export interface CheckNicknameResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: boolean;
}

export interface ProfileImageResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export interface MemberInitRequest {
  name: string;
  isNewbie: boolean;
  monthPrice: number;
  wineSort: string[];
  // Expert only
  wineArea?: string[] | null;
  wineVariety?: string[] | null;
  // Newbie only
  preferredAlcohols?: string[] | null;
  preferredFoods?: string[] | null;
  acidity?: number | null;
  sweetness?: number | null;
  tannin?: number | null;
  body?: number | null;
  alcohol?: number | null;
}

export interface MemberInitResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: object;
}

export interface MemberInfoResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    imageUrl: string;
    username: string;
    email: string;
    authType: string;
    adult: boolean;
    acidity?: number;
    sweetness?: number;
    tannin?: number;
    body?: number;
    alcohol?: number;
  };
}

export interface UpdateMemberInfoResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export interface MemberNameResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

export interface MemberDeleteResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: object;
}

export interface AppleMemberDeleteResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: object;
}



export const exchangeKakaoToken = async (token: string) => {
  const response = await client.post<KakaoFirebaseResponse>('/login/kakao/firebase', {
    token,
  });
  return response.data;
};

export const appleLogin = async (identityToken: string) => {
  const response = await client.post<AppleLoginResponse>('/login/apple', {
    identityToken,
  });
  return response.data;
};

export const logout = async () => {
  const response = await client.post<LogoutResponse>('/logout');
  return response.data;
};



export const checkNickname = async (nickname: string) => {
  const response = await client.post<CheckNicknameResponse>(`/member/check/${nickname}`);
  return response.data;
};
export const uploadProfileImage = async (imageUri: string, type: string = 'image/jpeg', name: string = 'profile.jpg') => {
  const formData = new FormData();

  formData.append('profileImg', {
    uri: imageUri,
    type: type,
    name: name,
  } as any);

  const response = await client.post<ProfileImageResponse>('/member/profileImage', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteProfileImage = async () => {
  const response = await client.delete<ProfileImageResponse>('/member/profileImage');
  return response.data;
};

export const updateMemberInitInfo = async (data: MemberInitRequest) => {
  const response = await client.patch<MemberInitResponse>('/member', data);
  return response.data;
};

export const getMemberInfo = async () => {
  const response = await client.get<MemberInfoResponse>('/member/info');
  return response.data;
};

export const updateMemberInfo = async (name: string) => {
  const response = await client.patch<UpdateMemberInfoResponse>('/member/info', {
    name,
  });
  return response.data;
};

export const getMemberName = async () => {
  const response = await client.get<MemberNameResponse>('/member/name');
  return response.data;
};

export const deleteMember = async (reason?: string) => {
  const response = await client.delete<MemberDeleteResponse>('/member/delete', {
    data: { reason },
  });
  return response.data;
};

// deleteAppleMember and other functions remain if they are still supported by backend logic logic
// or if they are to be replaced by Firebase deletion. 
// Assuming deleteAppleMember is still an API call to server to maybe Clean up DB? 
// Or maybe we should use Firebase Auth delete manually.
// For now, keeping existing member management APIs as requested is only about Login logic.
export const deleteAppleMember = async (authorizationCode: string) => {
  const response = await client.delete<AppleMemberDeleteResponse>('/member/delete/apple', {
    data: { authorizationCode },
  });
  return response.data;
};

export interface ReissueResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    accessToken: string;
    refreshToken: string;
  };
}

export const reissueToken = async (refreshToken: string) => {
  const response = await client.post<ReissueResponse>('/reissue', {}, {
    headers: {
      'Authorization-Refresh': refreshToken.replace(/^Bearer\s+/, ''),
    },
  });
  return response.data;
};
