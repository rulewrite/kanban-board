import { normalize, schema } from 'normalizr';
import { Readable, writable } from 'svelte/store';
import { Entity, mapKeyToEntities, mergeEntities } from '../../store/entities';

export type Cargo = Array<Entity['id']> | Entity['id'];

export interface Status<C extends Cargo> {
  key: string;
  isFetching: boolean;
  receivedAt: number;
  cargo: C | null;
  failMessage: string;
}

// type StatusStore<C> = ReturnType<typeof createStatus<C>>;
export interface StatusStore<C extends Cargo = Cargo> {
  subscribe: Readable<Status<C>>['subscribe'];
  request: () => void;
  success: <R extends Entity | Array<Entity>>(response: R) => C;
  successDelete: (id: C) => C;
  failure: (failMessage: string) => void;
  updateCargo: (updater: (cargo: C) => C) => void;
}

export function getCreateStatus<E extends Entity>(schema: schema.Entity<E>) {
  return <C extends Cargo>(key: string): StatusStore<C> => {
    const { subscribe, update } = writable<Status<C>>({
      key,
      isFetching: false,
      receivedAt: NaN,
      cargo: null,
      failMessage: '',
    });

    const normalizeEntities = <R>(response: R) => {
      const { entities, result } = normalize(
        response,
        Array.isArray(response) ? [schema] : schema
      );

      mergeEntities(entities);

      return result as C;
    };

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
      success: <R extends Entity | Array<Entity>>(response: R) => {
        const cargo = normalizeEntities<R>(response);

        mergeStatus({
          isFetching: false,
          receivedAt: Date.now(),
          cargo,
          failMessage: '',
        });

        return cargo;
      },
      successDelete: (id: C) => {
        mergeStatus({
          isFetching: false,
          receivedAt: Date.now(),
          cargo: id,
          failMessage: '',
        });

        const entities = mapKeyToEntities[schema.key];
        entities?.delete(id);

        return id;
      },
      failure: (failMessage: string) => {
        mergeStatus({
          isFetching: false,
          receivedAt: Date.now(),
          failMessage,
        });
      },
      updateCargo: (updater: (cargo: C) => C) => {
        update((status) => {
          return {
            ...status,
            cargo: updater(status.cargo),
          };
        });
      },
    };
  };
}
