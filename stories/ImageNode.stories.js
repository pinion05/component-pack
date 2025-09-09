import { createImageNode } from './ImageNode';

export default {
  title: 'Components/ImageNode',
  tags: ['autodocs'],
  render: ({ tagsCsv, imageUrl }) => {
    const tags = (tagsCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return createImageNode({ imageUrl, tags });
  },
  argTypes: {
    imageUrl: { control: 'text' },
    tagsCsv: { control: 'text', description: 'Comma separated tags' },
  },
  args: {
    imageUrl: '',
    tagsCsv: 'alpha, beta, gamma',
  },
};

export const Default = {};

export const WithImage = {
  args: {
    imageUrl:
      'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=800&auto=format&fit=crop',
    tagsCsv: 'mountain, sunrise, nature',
  },
};

export const ManyTags = {
  args: {
    imageUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
    tagsCsv:
      'tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12',
  },
};

export const NoTags = {
  args: {
    imageUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop',
    tagsCsv: '',
  },
};

