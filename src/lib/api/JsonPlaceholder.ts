import { normalize, schema } from 'normalizr';
import StatusApi from '../modules/status-api/StatusApi';
import { mergeEntities } from '../store/entities';

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

  constructor(private path: string, private schema: schema.Entity<E>) {}

  read(id: E['id'], params: Params) {
    return JsonPlaceholder.statusApi.get<E, E['id']>({
      pathname: `${this.path}/${id}`,
      params,
      intercepter: (response) => {
        const { entities, result } = normalize(response, this.schema);

        mergeEntities(entities);

        return result;
      },
    });
  }

  readList(params: Params) {
    return JsonPlaceholder.statusApi.get<Array<E>, Array<E['id']>>({
      pathname: this.path,
      params,
      intercepter: (response) => {
        const { entities, result } = normalize(response, [this.schema]);

        mergeEntities(entities);

        return result;
      },
    });
  }

  update(id: E['id'], body: Partial<E>) {
    return JsonPlaceholder.statusApi.set<E>({
      pathname: `${this.path}/${id}`,
      params: {},
      method: 'PATCH',
      body,
      intercepter: (response) => {
        const entity = { ...response, ...body };
        const { entities } = normalize(entity, this.schema);

        mergeEntities(entities);

        return entity;
      },
    });
  }
}
