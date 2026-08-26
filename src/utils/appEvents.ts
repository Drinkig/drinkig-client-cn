// 화면 간 상태 동기화용 초경량 이벤트 버스.
// 예: 노트 상세/프로필에서 유저를 차단하면 이미 렌더된 피드 목록에서도
// 그 작성자의 카드를 즉시 걷어내야 한다 — 내비게이션 param이나 전역
// 컨텍스트를 늘리는 대신 구독/발행으로 푼다.

type AppEventMap = {
  /** 유저 차단 성공 — payload는 차단된 memberId */
  memberBlocked: number;
  /** 팔로우/언팔로우 성공 — 피드 카드의 팔로우 버튼 상태 동기화용 */
  memberFollowChanged: { memberId: number; isFollowing: boolean };
  /** 노트 좋아요 토글 성공 — 피드/상세 간 카운트 동기화용 */
  noteLikeChanged: { noteId: number; likedByMe: boolean; likeCount: number };
  /** 노트 댓글 수 변동(작성/삭제) — 피드 카드 카운트 동기화용 */
  noteCommentCountChanged: { noteId: number; commentCount: number };
};

type Listener<T> = (payload: T) => void;

const listeners: { [K in keyof AppEventMap]?: Set<Listener<AppEventMap[K]>> } =
  {};

export const appEvents = {
  on<K extends keyof AppEventMap>(
    event: K,
    listener: Listener<AppEventMap[K]>
  ): () => void {
    // 이벤트가 유니온이 되면 TS가 제네릭 대입을 증명하지 못해 명시 캐스트 필요
    const existing = listeners[event] as
      | Set<Listener<AppEventMap[K]>>
      | undefined;
    const set = existing ?? new Set<Listener<AppEventMap[K]>>();
    if (!existing) {
      listeners[event] = set as (typeof listeners)[K];
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  },
  emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]) {
    (listeners[event] as Set<Listener<AppEventMap[K]>> | undefined)?.forEach(
      (listener) => listener(payload)
    );
  },
};
