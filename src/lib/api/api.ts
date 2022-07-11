import JsonPlaceholder from './JsonPlaceholder';

interface Section {
  id: number;
  title: string;
  body: string;
  userId?: number;
}
export const sectionApi = new JsonPlaceholder<Section>('posts');
