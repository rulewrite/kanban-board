import { createStatus, StatusStore } from './status';

export default class StatusApi<P extends Object> {
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

  private mapKeyToStatus = new Map<string, ReturnType<typeof createStatus>>();

  constructor(private readonly URL: string) {}

  private getUrl(pathname: string, params: P) {
    return `${this.URL}/${pathname}${StatusApi.paramsToString(params)}`;
  }

  get<R, C = R>({
    pathname,
    params,
    intercepter,
  }: {
    pathname: string;
    params: P;
    intercepter?: (response: R) => C;
  }) {
    const url = this.getUrl(pathname, params);

    if (!this.mapKeyToStatus.has(url)) {
      this.mapKeyToStatus.set(url, createStatus<C>(url));
    }
    const status = this.mapKeyToStatus.get(url) as StatusStore<C>;

    status.request();
    fetch(url)
      .then<R>((response) => response.json())
      .then((response) => {
        status.success(
          intercepter ? intercepter(response) : (response as unknown as C)
        );
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }

  set<R, C = R>({
    pathname,
    params,
    method,
    body,
    intercepter,
  }: {
    pathname: string;
    params: P;
    method: 'POST' | 'PATCH' | 'DELETE';
    body?: Partial<R>;
    intercepter?: (response: R) => C;
  }) {
    const url = this.getUrl(pathname, params);
    const status = createStatus<C>(url);

    status.request();
    fetch(url, {
      method,
      body: JSON.stringify(body),
    })
      .then<R>((response) => response.json())
      .then((response) => {
        status.success(
          intercepter ? intercepter(response) : (response as unknown as C)
        );
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }
}
