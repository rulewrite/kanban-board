import { schema } from 'normalizr';
import { CARDS_SCHEMA_KEY, SECTIONS_SCHEMA_KEY } from '../store/entities';
import JsonPlaceholder from './JsonPlaceholder';

export interface Card {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}
const cardSchema = new schema.Entity<Card>(CARDS_SCHEMA_KEY);

export interface Section {
  id: number;
  title: string;
  body: string;
  userId?: number;
  comments?: Array<Card['id']>;
}
export const sectionApi = new JsonPlaceholder<Section>(
  'posts',
  new schema.Entity<Section>(SECTIONS_SCHEMA_KEY, {
    comments: [cardSchema],
  })
);
