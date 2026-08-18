const API = {
  async getQueue(gen = 'all', order = 'random', count = 10, type_filter = 'all') {
    const r = await fetch(`/api/queue?gen=${gen}&order=${order}&count=${count}&type_filter=${type_filter}`);
    if (!r.ok) throw new Error('Queue fetch failed');
    return r.json();
  },

  async getPokemon(id) {
    const r = await fetch(`/api/pokemon/${id}`);
    if (!r.ok) throw new Error(`Pokemon ${id} fetch failed`);
    return r.json();
  },

  async getChoices(pid, gen = 'all', type_filter = 'all') {
    const r = await fetch(`/api/choices/${pid}?gen=${gen}&type_filter=${type_filter}`);
    if (!r.ok) throw new Error('Choices fetch failed');
    return r.json();
  },
};
