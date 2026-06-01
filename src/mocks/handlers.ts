import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/spaces', () => {
    return HttpResponse.json([
      { id: 'table-1', name: '逃离糖果共和国', system: 'COC' },
      { id: 'table-2', name: '棉花不谢', system: 'COC' },
      { id: 'table-3', name: '诡桥仙', system: 'COC' },
    ]);
  }),
];
