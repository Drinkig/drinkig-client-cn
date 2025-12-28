import client from './client';



export interface AppleLoginRequest {
  identityToken: string;
}

export interface AppleLoginResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    id: number;
    username: string;
    role: string;
    isFirst: boolean;
    accessToken?: string;
    refreshToken?: string;
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



export const loginWithApple = async (identityToken: string) => {
  const response = await client.post<AppleLoginResponse>('/login/apple', {
    identityToken,
  });

  const cookies = response.headers['set-cookie'];
  if (cookies && Array.isArray(cookies)) {
    const getCookieValue = (name: string) => {
      const regex = new RegExp(`${name}=([^;]+)`);
      for (const cookieString of cookies) {
        const match = cookieString.match(regex);
        if (match && match[1]) {
          return match[1];
        }
      }
      return undefined;
    };

    const accessToken = getCookieValue('accessToken');
    const refreshToken = getCookieValue('refreshToken');

    // 응답 데이터에 토큰 주입 (프론트엔드 로직 호환성 유지)
    if (accessToken && response.data.result) {
      response.data.result.accessToken = accessToken;
    }
    if (refreshToken && response.data.result) {
      response.data.result.refreshToken = refreshToken;
    }
  }

  return response.data;
};

export const loginWithKakao = async (kakaoName: string, kakaoEmail: string, socialId: string) => {
  const response = await client.post<AppleLoginResponse>('/login/kakao', {
    kakaoName,
    kakaoEmail,
    socialId,
  });

  // 서버가 토큰을 Body가 아닌 'Set-Cookie' 헤더로 주는 경우 처리
  const cookies = response.headers['set-cookie'];
  if (cookies && Array.isArray(cookies)) {
    const getCookieValue = (name: string) => {
      const regex = new RegExp(`${name}=([^;]+)`);
      for (const cookieString of cookies) {
        const match = cookieString.match(regex);
        if (match && match[1]) {
          return match[1];
        }
      }
      return undefined;
    };

    const accessToken = getCookieValue('accessToken');
    const refreshToken = getCookieValue('refreshToken');

    // 응답 데이터에 토큰 주입 (프론트엔드 로직 호환성 유지)
    if (accessToken && response.data.result) {
      response.data.result.accessToken = accessToken;
    }
    if (refreshToken && response.data.result) {
      response.data.result.refreshToken = refreshToken;
    }
  }

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

export const deleteAppleMember = async (authorizationCode: string) => {
  const response = await client.delete<AppleMemberDeleteResponse>('/member/delete/apple', {
    data: { authorizationCode },
  });
  return response.data;
};
