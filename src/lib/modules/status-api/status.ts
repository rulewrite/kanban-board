import { Readable, writable } from 'svelte/store';

export interface Status<C> {
  key: string;
  isFetching: boolean;
  receivedAt: number;
  cargo: C | null;
  failMessage: string;
}

// type StatusStore<C> = ReturnType<typeof createStatus<C>>;
export interface StatusStore<C> {
  subscribe: Readable<Status<C>>['subscribe'];
  request: () => void;
  success: (cargo: Status<C>['cargo']) => void;
  failure: (failMessage: string) => void;
}

export function createStatus<C>(key: string): StatusStore<C> {
  const { subscribe, update } = writable<Status<C>>({
    key,
    isFetching: false,
    receivedAt: NaN,
    cargo: null,
    failMessage: '',
  });

  const mergeStatus = (statusToMerge: Partial<Status<C>>) => {
    update((status) => {
      return {
        ...status,
        ...statusToMerge,
      };
    });
  };

  return {
    subscribe,
    request: () => {
      mergeStatus({
        isFetching: true,
      });
    },
    success: (cargo: Status<C>['cargo']) => {
      mergeStatus({
        isFetching: false,
        receivedAt: Date.now(),
        cargo,
        failMessage: '',
      });
    },
    failure: (failMessage: string) => {
      mergeStatus({
        isFetching: false,
        receivedAt: Date.now(),
        failMessage,
      });
    },
  };
}
