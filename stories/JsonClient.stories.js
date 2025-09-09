import { createJsonClient } from './JsonClient';

export default {
  title: 'Components/JsonClient',
  tags: ['autodocs'],
  render: ({ json, height }) => createJsonClient({ json, height }),
  argTypes: {
    json: { control: 'text' },
    height: { control: { type: 'number', min: 200, max: 800, step: 20 } },
  },
  args: {
    height: 360,
    json: '{\n  "title": "JSON 뷰어",\n  "count": 3,\n  "active": true,\n  "items": [\n    {"id": 1, "name": "alpha"},\n    {"id": 2, "name": "beta"},\n    {"id": 3, "name": "gamma", "tags": ["x", "y", "z"]}\n  ],\n  "meta": {"owner": null}\n}',
  },
};

export const Default = {};

export const InvalidJson = {
  args: {
    json: '{ invalid: true, }',
  },
};

export const DeepNested = {
  args: {
    json: JSON.stringify({ a: { b: { c: { d: { e: { f: { g: { h: 1 } } } } } } } }, null, 2),
  },
};

