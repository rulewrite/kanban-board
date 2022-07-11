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

  get<R>({ pathname, params }: { pathname: string; params: P }) {
    const url = this.getUrl(pathname, params);

    if (!this.mapKeyToStatus.has(url)) {
      this.mapKeyToStatus.set(url, createStatus<R>(url));
    }
    const status = this.mapKeyToStatus.get(url) as StatusStore<R>;

    status.request();
    fetch(url)
      .then<R>((response) => response.json())
      .then((response) => {
        status.success(response);
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }
}
