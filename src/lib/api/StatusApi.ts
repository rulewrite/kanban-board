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

  create({
    key,
    body,
    params,
  }: {
    key: string;
    body: Omit<E, 'id'>;
    params?: P;
  }) {
    const url = StatusApi.getUrl<P>(this.URL, params);

    if (!this.mapKeyToStatusEntity.has(url)) {
      this.mapKeyToStatusEntity.set(url, this.createStatusEntity(url));
    }
    const status = this.mapKeyToStatusEntity.get(url);

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    status.request();
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
      .then<E>((response) => response.json())
      .then((response) => {
        status.success({ ...response, ...body });
        this.mapKeyToStatusEntities.get(key)?.add(response.id);
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }

  read({ id, params, isForce }: { id: E['id']; params: P; isForce?: boolean }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);

    if (!this.mapKeyToStatusEntity.has(url)) {
      this.mapKeyToStatusEntity.set(url, this.createStatusEntity(url));
    }
    const status = this.mapKeyToStatusEntity.get(url);

    const $status = get(status);
    if ($status.isFetching) {
      return status;
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

    return status;
  }

  readList({ params, isForce }: { params: P; isForce?: boolean }) {
    const url = StatusApi.getUrl<P>(this.URL, params);

    if (!this.mapKeyToStatusEntities.has(url)) {
      this.mapKeyToStatusEntities.set(url, this.createStatusEntities(url));
    }
    const status = this.mapKeyToStatusEntities.get(url);

    const $status = get(status);
    if ($status.isFetching) {
      return status;
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

    return status;
  }

  update({ id, body, params }: { id: E['id']; body: Partial<E>; params?: P }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);

    if (!this.mapKeyToStatusEntity.has(url)) {
      this.mapKeyToStatusEntity.set(url, this.createStatusEntity(url));
    }
    const status = this.mapKeyToStatusEntity.get(url);

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    status.request();
    fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
      .then<E>((response) => response.json())
      .then((response) => {
        status.success({
          ...response,
          ...body,
        });
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }

  delete({ id, params }: { id: E['id']; params?: P }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);

    if (!this.mapKeyToStatusEntity.has(url)) {
      this.mapKeyToStatusEntity.set(url, this.createStatusEntity(url));
    }
    const status = this.mapKeyToStatusEntity.get(url);

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    status.request();
    fetch(url, {
      method: 'DELETE',
    })
      .then<{}>((response) => response.json())
      .then(() => {
        status.successDelete(id);
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }
}
