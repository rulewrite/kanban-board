import StatusApi from '../modules/status-api/StatusApi';

interface Params {
  // Paginate
  _page?: number;
  _limit?: number;

  // Relationships
  _expand?: string;
  _embed?: string;

  // Search
  q?: string;
}

export default class JsonPlaceholder<E extends { id: number }> {
  private static statusApi = new StatusApi(
    'https://jsonplaceholder.typicode.com'
  );

  constructor(private path: string) {}

  read(id: E['id'], params: Params) {
    return JsonPlaceholder.statusApi.get<E>({
      pathname: `${this.path}/${id}`,
      params,
    });
  }

  readList(params: Params) {
    return JsonPlaceholder.statusApi.get<Array<E>>({
      pathname: this.path,
      params,
    });
  }
}
