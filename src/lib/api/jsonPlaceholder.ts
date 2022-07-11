import { schema } from 'normalizr';
import StatusApi from '../modules/status-api/StatusApi';
import { CARDS_SCHEMA_KEY, SECTIONS_SCHEMA_KEY } from '../store/entities';

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

const URL = 'https://jsonplaceholder.typicode.com';

export interface Card {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}
const cardSchema = new schema.Entity<Card>(CARDS_SCHEMA_KEY);
export const cardApi = new StatusApi<Params, Card>(
  `${URL}/comments`,
  cardSchema
);

export interface Section {
  id: number;
  title: string;
  body: string;
  userId?: number;
  comments?: Array<Card['id']>;
}
export const sectionApi = new StatusApi<Params, Section>(
  `${URL}/posts`,
  new schema.Entity<Section>(SECTIONS_SCHEMA_KEY, {
    comments: [cardSchema],
  }),
  1
);
