import type { schema } from 'normalizr';
import { get } from 'svelte/store';
import type { Entity } from '../store/entities';
import {
  getCreateStatusEntities,
  getCreateStatusEntity,
  StatusEntitiesStore,
  StatusEntityStore,
} from '../store/status';

export default class StatusApi<P extends Object, E extends Entity> {
  private static paramsToString<P>(params: P) {
    if (!params) {
      return '';
    }

    const pairs = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`);

    if (!pairs.length) {
      return '';
    }

    return `?${pairs.join('&')}`;
  }

  private static minutesToMs(minutes: number) {
    return minutes * 60 * 1000;
  }

  private static getUrl<P>(pathname: string, params: P) {
    return `${pathname}${StatusApi.paramsToString(params)}`;
  }

  private static getKey(url: string, method = 'GET') {
    return `${method} ${url}`;
  }

  private mapKeyToStatusEntity = new Map<string, StatusEntityStore>();
  private mapKeyToStatusEntities = new Map<string, StatusEntitiesStore>();

  private createStatusEntity: ReturnType<typeof getCreateStatusEntity>;
  private createStatusEntities: ReturnType<typeof getCreateStatusEntities>;

  constructor(
    private readonly URL: string,
    schema: schema.Entity<E>,
    private expirationMinutes = 0
  ) {
    this.createStatusEntity = getCreateStatusEntity<E>(schema);
    this.createStatusEntities = getCreateStatusEntities<E>(schema);
  }

  create({ body, params }: { body: Partial<Omit<E, 'id'>>; params?: P }) {
    const method = 'POST';
    const url = StatusApi.getUrl<P>(this.URL, params);

    const key = StatusApi.getKey(url, method);
    if (!this.mapKeyToStatusEntity.has(key)) {
      this.mapKeyToStatusEntity.set(key, this.createStatusEntity(key));
    }
    const status = this.mapKeyToStatusEntity.get(key);

    const $status = get(status);
    if ($status.isFetching) {
      return { subscribe: status.subscribe };
    }

    status.request();
    fetch(url, {
      method,
      body: JSON.stringify(body),
    })
      .then<E>((response) => response.json())
      .then((response) => {
        status.success({ ...response, ...body });
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return { subscribe: status.subscribe };
  }

  read({ id, params, isForce }: { id: E['id']; params: P; isForce?: boolean }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);

    const key = StatusApi.getKey(url);
    if (!this.mapKeyToStatusEntity.has(key)) {
      this.mapKeyToStatusEntity.set(key, this.createStatusEntity(key));
    }
    const status = this.mapKeyToStatusEntity.get(key);

    const $status = get(status);
    if ($status.isFetching) {
      return { subscribe: status.subscribe };
    }

    if (
      isForce ||
      !this.expirationMinutes ||
      !$status.receivedAt ||
      Date.now() - $status.receivedAt >
        StatusApi.minutesToMs(this.expirationMinutes)
    ) {
      status.request();
      fetch(url)
        .then<E>((response) => response.json())
        .then((response) => {
          status.success(response);
        })
        .catch((error: Error) => {
          status.failure(error.message ?? 'Unknown Error');
        });
    }

    return { subscribe: status.subscribe };
  }

  readList({ params, isForce }: { params: P; isForce?: boolean }) {
    const url = StatusApi.getUrl<P>(this.URL, params);

    const key = StatusApi.getKey(url);
    if (!this.mapKeyToStatusEntities.has(key)) {
      this.mapKeyToStatusEntities.set(key, this.createStatusEntities(key));
    }
    const status = this.mapKeyToStatusEntities.get(key);

    const $status = get(status);
    if ($status.isFetching) {
      return { subscribe: status.subscribe };
    }

    if (
      isForce ||
      !this.expirationMinutes ||
      !$status.receivedAt ||
      Date.now() - $status.receivedAt >
        StatusApi.minutesToMs(this.expirationMinutes)
    ) {
      status.request();
      fetch(url)
        .then<Array<E>>((response) => response.json())
        .then((response) => {
          status.success(response);
        })
        .catch((error: Error) => {
          status.failure(error.message ?? 'Unknown Error');
        });
    }

    return { push: status.push, subscribe: status.subscribe };
  }

  update({ id, body, params }: { id: E['id']; body: Partial<E>; params?: P }) {
    const method = 'PATCH';
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);

    const key = StatusApi.getKey(url, method);
    if (!this.mapKeyToStatusEntity.has(key)) {
      this.mapKeyToStatusEntity.set(key, this.createStatusEntity(key));
    }
    const status = this.mapKeyToStatusEntity.get(key);

    const $status = get(status);
    if ($status.isFetching) {
      return { subscribe: status.subscribe };
    }

    status.request();
    fetch(url, {
      method,
      body: JSON.stringify(body),
    })
      .then<E>((response) => response.json())
      .then((response) => {
        status.success({
          id,
          ...response,
          ...body,
        });
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return { subscribe: status.subscribe };
  }

  delete({ id, params }: { id: E['id']; params?: P }) {
    const method = 'DELETE';
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);

    const key = StatusApi.getKey(url, method);
    if (!this.mapKeyToStatusEntity.has(key)) {
      this.mapKeyToStatusEntity.set(key, this.createStatusEntity(key));
    }
    const status = this.mapKeyToStatusEntity.get(key);

    const $status = get(status);
    if ($status.isFetching) {
      return { subscribe: status.subscribe };
    }

    status.request();
    fetch(url, {
      method,
    })
      .then<{}>((response) => response.json())
      .then(() => {
        status.successDelete(id);
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return { subscribe: status.subscribe };
  }
}
