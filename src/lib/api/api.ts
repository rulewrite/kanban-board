import { schema } from 'normalizr';
import { SECTIONS_SCHEMA_KEY } from '../store/entities';
import JsonPlaceholder from './JsonPlaceholder';

export interface Section {
  id: number;
  title: string;
  body: string;
  userId?: number;
}
export const sectionApi = new JsonPlaceholder<Section>(
  'posts',
  new schema.Entity<Section>(SECTIONS_SCHEMA_KEY)
);
