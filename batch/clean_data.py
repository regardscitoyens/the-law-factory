#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, re
import simplejson as json
from difflib import SequenceMatcher

with open(sys.argv[1], 'r') as source:
    data = json.loads(source.read())

#from pprint import pprint
#pprint(data)

re_clean_bister = re.compile(r'(un|duo|tre|bis|qua|quint|quinqu|sex|oct|nov|non|dec|ter|ies)+|pr..?liminaire', re.I)

for art in data['articles']:
    for i, step in enumerate(data['articles'][art]['steps']):
        if step['text'] and step['text'][0].startswith('(Texte d'):
            step['text'].pop(0)
        for j, text in enumerate(step['text']):
            step['text'][j] = re_clean_bister.sub(lambda m: m.group(0).lower(), text)
        txt = " ".join(step['text'])
        step['length'] = len(txt)
        step['n_diff'] = 0
        if i:
            oldtxt = " ".join(data['articles'][art]['steps'][i-1]['text'])
            if txt == oldtxt:
                step['diff'] = 'none'
            else:
                step['diff'] = 'both'
                step['n_diff'] = 1 - SequenceMatcher(None, oldtxt, txt).ratio()

with open("%s.new" % sys.argv[1], 'w') as output:
    json.dump(data, output, indent=4, encoding='utf-8')


