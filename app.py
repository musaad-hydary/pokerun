import os
import json
import random
import requests
from flask import Flask, jsonify, render_template, request, send_from_directory

app = Flask(__name__)

CACHE_DIR = '/tmp/cache' if os.environ.get('VERCEL') else 'cache'
os.makedirs(CACHE_DIR, exist_ok=True)

GENERATIONS = {
    'all':  {'name': 'All Generations',   'start': 1,   'end': 1025},
    'gen1': {'name': 'Gen I – Kanto',     'start': 1,   'end': 151},
    'gen2': {'name': 'Gen II – Johto',    'start': 152, 'end': 251},
    'gen3': {'name': 'Gen III – Hoenn',   'start': 252, 'end': 386},
    'gen4': {'name': 'Gen IV – Sinnoh',   'start': 387, 'end': 493},
    'gen5': {'name': 'Gen V – Unova',     'start': 494, 'end': 649},
    'gen6': {'name': 'Gen VI – Kalos',    'start': 650, 'end': 721},
    'gen7': {'name': 'Gen VII – Alola',   'start': 722, 'end': 809},
    'gen8': {'name': 'Gen VIII – Galar',  'start': 810, 'end': 905},
    'gen9': {'name': 'Gen IX – Paldea',   'start': 906, 'end': 1025},
}

POKEMON_TYPES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

ALL_NAMES_CACHE = os.path.join(CACHE_DIR, 'all_names.json')


def get_all_names():
    if os.path.exists(ALL_NAMES_CACHE):
        with open(ALL_NAMES_CACHE) as f:
            return json.load(f)
    try:
        resp = requests.get('https://pokeapi.co/api/v2/pokemon?limit=1025', timeout=30)
        resp.raise_for_status()
        data = resp.json()
        result = {str(i + 1): item['name'] for i, item in enumerate(data['results'])}
        with open(ALL_NAMES_CACHE, 'w') as f:
            json.dump(result, f)
        return result
    except Exception as e:
        print(f'Failed to fetch names: {e}')
        return {}


def get_type_ids(type_name):
    """Return sorted list of Pokemon IDs (1–1025) that have this type. Cached."""
    cache_file = os.path.join(CACHE_DIR, f'type_{type_name}.json')
    if os.path.exists(cache_file):
        with open(cache_file) as f:
            return json.load(f)
    try:
        resp = requests.get(f'https://pokeapi.co/api/v2/type/{type_name}', timeout=15)
        resp.raise_for_status()
        data = resp.json()
        ids = []
        for entry in data.get('pokemon', []):
            url = entry['pokemon']['url']
            pid = int(url.rstrip('/').split('/')[-1])
            if 1 <= pid <= 1025:
                ids.append(pid)
        ids.sort()
        with open(cache_file, 'w') as f:
            json.dump(ids, f)
        return ids
    except Exception as e:
        print(f'Failed to fetch type {type_name}: {e}')
        return []


def fmt_name(raw):
    return raw.replace('-', ' ').title()


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/sw.js')
def service_worker():
    return send_from_directory('static', 'sw.js', mimetype='application/javascript')


@app.route('/api/generations')
def api_generations():
    return jsonify(GENERATIONS)


@app.route('/api/queue')
def api_queue():
    gen         = request.args.get('gen', 'all')
    order       = request.args.get('order', 'random')
    count       = int(request.args.get('count', 10))
    type_filter = request.args.get('type_filter', 'all')

    gen_data = GENERATIONS.get(gen, GENERATIONS['all'])
    ids = set(range(gen_data['start'], gen_data['end'] + 1))

    if type_filter != 'all' and type_filter in POKEMON_TYPES:
        type_ids = get_type_ids(type_filter)
        if type_ids:
            ids = ids & set(type_ids)

    ids = list(ids)

    if order == 'random':
        random.shuffle(ids)
    else:
        ids.sort()

    # count <= 0 means "all available"
    if count > 0:
        ids = ids[:count]

    return jsonify(ids)


@app.route('/api/pokemon/<int:pid>')
def api_pokemon(pid):
    cache_file = os.path.join(CACHE_DIR, f'p_{pid}.json')

    if os.path.exists(cache_file):
        with open(cache_file) as f:
            return jsonify(json.load(f))

    try:
        resp = requests.get(f'https://pokeapi.co/api/v2/pokemon/{pid}', timeout=15)
        resp.raise_for_status()
        data = resp.json()

        sprites = data['sprites']
        official = (sprites.get('other') or {}).get('official-artwork', {}).get('front_default')

        result = {
            'id': data['id'],
            'name': fmt_name(data['name']),
            'types': [t['type']['name'] for t in data['types']],
            'sprite': sprites.get('front_default'),
            'official_artwork': official,
        }

        with open(cache_file, 'w') as f:
            json.dump(result, f)

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/choices/<int:pid>')
def api_choices(pid):
    gen         = request.args.get('gen', 'all')
    type_filter = request.args.get('type_filter', 'all')

    gen_data = GENERATIONS.get(gen, GENERATIONS['all'])
    pool = set(range(gen_data['start'], gen_data['end'] + 1))
    pool.discard(pid)

    # Prefer wrong answers from the same type pool if type filter is active
    if type_filter != 'all' and type_filter in POKEMON_TYPES:
        type_ids = set(get_type_ids(type_filter))
        type_pool = (pool & type_ids) - {pid}
        if len(type_pool) >= 3:
            pool = type_pool

    pool = list(pool)
    wrong_ids = random.sample(pool, min(3, len(pool)))
    choice_ids = [pid] + wrong_ids
    random.shuffle(choice_ids)

    names = get_all_names()
    choices = [{'id': cid, 'name': fmt_name(names.get(str(cid), f'Pokemon {cid}'))} for cid in choice_ids]

    return jsonify({'choices': choices, 'correct_id': pid})


@app.route('/api/daily')
def api_daily():
    from datetime import date
    today = date.today().isoformat()
    seed = int(today.replace('-', ''))
    rng = random.Random(seed)
    ids = list(range(1, 1026))
    rng.shuffle(ids)
    return jsonify({'date': today, 'ids': ids[:6]})


if __name__ == '__main__':
    app.run(debug=True, port=8765)
