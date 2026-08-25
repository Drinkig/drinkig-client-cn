// 화면 간 상태 동기화용 초경량 이벤트 버스.
// 예: 노트 상세/프로필에서 유저를 차단하면 이미 렌더된 피드 목록에서도
// 그 작성자의 카드를 즉시 걷어내야 한다 — 내비게이션 param이나 전역
// 컨텍스트를 늘리는 대신 구독/발행으로 푼다.

type AppEventMap = {
  /** 유저 차단 성공 — payload는 차단된 memberId */
  memberBlocked: number;
};

type Listener<T> = (payload: T) => void;

const listeners: { [K in keyof AppEventMap]?: Set<Listener<AppEventMap[K]>> } =
  {};

export const appEvents = {
  on<K extends keyof AppEventMap>(
    event: K,
    listener: Listener<AppEventMap[K]>
  ): () => void {
    const set = (listeners[event] ??= new Set());
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  },
  emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]) {
    listeners[event]?.forEach((listener) => listener(payload));
  },
};
