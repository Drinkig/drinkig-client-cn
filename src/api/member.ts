import client from './client';

// --------------------
// Auth API Types
// --------------------

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
    role: string; // e.g., "ROLE_ADMIN", "ROLE_USER"
    isFirst: boolean; // 최초 로그인 여부 (회원가입 필요 여부 판단)
    accessToken?: string; // 토큰이 같이 오는지 확인 필요 (보통 로그인 성공 시 옴)
    refreshToken?: string;
  };
}

export interface LogoutResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
}

// --------------------
// Member API Types
// --------------------

export interface CheckNicknameResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: boolean; // true: 사용 가능, false: 중복
}

export interface ProfileImageResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string; // 업로드된 이미지 URL 또는 결과 메시지
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
  result: object; // 결과 객체 (필요 시 구체화)
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

// --------------------
// Auth API Functions
// --------------------

// 애플 로그인 API
export const loginWithApple = async (identityToken: string) => {
  const response = await client.post<AppleLoginResponse>('/login/apple', {
    identityToken,
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

// 카카오 로그인 API
export const loginWithKakao = async (kakaoName: string, kakaoEmail: string) => {
  const response = await client.post<AppleLoginResponse>('/login/kakao', {
    kakaoName,
    kakaoEmail,
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

// 로그아웃 API
export const logout = async () => {
  const response = await client.post<LogoutResponse>('/logout');
  return response.data;
};

// --------------------
// Member API Functions
// --------------------

// 닉네임 중복 확인 API
export const checkNickname = async (nickname: string) => {
  const response = await client.post<CheckNicknameResponse>(`/member/check/${nickname}`);
  return response.data;
};

// 프로필 이미지 업로드 API
export const uploadProfileImage = async (imageUri: string, type: string = 'image/jpeg', name: string = 'profile.jpg') => {
  const formData = new FormData();
  
  // React Native에서 FormData에 파일 추가하는 방식
  formData.append('profileImg', {
    uri: imageUri,
    type: type,
    name: name,
  } as any); // 타입 에러 방지를 위해 any 캐스팅

  const response = await client.post<ProfileImageResponse>('/member/profileImage', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 프로필 이미지 삭제 API
export const deleteProfileImage = async () => {
  const response = await client.delete<ProfileImageResponse>('/member/profileImage');
  return response.data;
};

// 사용자 초기 정보 추가 API (회원가입 후 추가 정보 입력)
export const updateMemberInitInfo = async (data: MemberInitRequest) => {
  const response = await client.patch<MemberInitResponse>('/member', data);
  return response.data;
};

// 마이페이지 유저 정보 조회 API
export const getMemberInfo = async () => {
  const response = await client.get<MemberInfoResponse>('/member/info');
  return response.data;
};

// 마이페이지 정보 수정 API (현재는 닉네임 수정만)
export const updateMemberInfo = async (name: string) => {
  const response = await client.patch<UpdateMemberInfoResponse>('/member/info', {
    name,
  });
  return response.data;
};

// 멤버 닉네임 조회 API
export const getMemberName = async () => {
  const response = await client.get<MemberNameResponse>('/member/name');
  return response.data;
};

// 회원 탈퇴 API (일반)
export const deleteMember = async () => {
  const response = await client.delete<MemberDeleteResponse>('/member/delete');
  return response.data;
};

// 애플 회원 탈퇴 API
export const deleteAppleMember = async (authorizationCode: string) => {
  const response = await client.delete<AppleMemberDeleteResponse>('/member/delete/apple', {
    data: { authorizationCode },
  });
  return response.data;
};
