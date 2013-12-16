#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, re
import simplejson as json
from difflib import SequenceMatcher

with open(sys.argv[1], 'r') as source:
    data = json.loads(source.read())

DEBUG = True if len(sys.argv) > 2 else False
def log(text):
    if DEBUG:
        print >> sys.stderr, text

def get_mark_from_last(text, start, last=""):
    log("- GET Extract from " + start + " to " + last)
    res = []
    start = re.compile(r'^%s([\)\.°\-\s]+)' % start)
    if last:
        last = re.compile(r'^%s([\)\.°\-\s]+)' % last)
    re_end = None
    record = False
    for i in text:
        sep = start.match(i)
        log("   TEST: " + i[:15])
        if re_end and re_end.match(i):
            log("  --> END FOUND")
            if last:
                re_end = re.compile(r'^[IVX0-9]{1,4}%s' % sep)
                last = ""
            else:
                record = False
                break
        elif sep:
            sep = sep.group(1)
            log("  --> START FOUND " + sep)
            record = True
            if last:
                re_end = last
            else:
                re_end = re.compile(r'^[IVX0-9]{1,4}%s' % sep)
        if record:
            log("    copy alinea")
            res.append(i)
    return res

re_clean_bister = re.compile(r'(un|duo|tre|bis|qua|quint|quinqu|sex|oct|nov|non|dec|ter|ies)+|pr..?liminaire', re.I)

for art in data['articles']:
    for i, step in enumerate(data['articles'][art]['steps']):
    # Clean comments (Texte du Sénat), 5texte de la Commissiohn), ...
        if step['text'] and step['text'][0].startswith('(Texte d'):
            step['text'].pop(0)
        if len(step['text']) == 1:
            text = step['text'][0].encode('utf-8')
    # Clean empty articles with only "Supprimé" as text
            if text.startswith("(Supprimé)"):
                step['text'].pop(0)
    # Clean empty articles with only "Non-modifié" and einclude text from previous step
            elif i and text.startswith("(Non modifié)"):
                step['text'].pop(0)
                step['text'].extend(data['articles'][art]['steps'][i-1]['text'])
        gd_text = []
        for j, text in enumerate(step['text']):
            text = text.encode('utf-8')
    # Clean low/upcase issues with BIS TER etc.
            text = re_clean_bister.sub(lambda m: m.group(0).lower(), text)
    # Clean different versions of same comment.
            text = text.replace('(Suppression maintenue)', '(Supprimé)')
            if i and "(non modifié" in text:
                part = re.split("\s*([\)\.°\-]+\s*)+", text)
                if not part:
                    log("ERROR trying to get non-modifiés")
                    exit(1)
                todo = part[0]
                log("EXTRACT non-modifiés: " + todo)
    # Extract series of non-modified subsections of articles from previous version.
                if " à " in todo:
                    start = re.split(" à ", todo)[0]
                    end = re.split(" à ", todo)[1]
                    piece = get_mark_from_last(data['articles'][art]['steps'][i-1]['text'], start, end)
    # Extract set of non-modified subsections of articles from previous version.
                elif "," in todo or " et " in todo or " & " in todo:
                    piece = []
                    for i, mark in enumerate(re.split("(?:\s*(,|&|et)\s*)", todo)):
                        if i % 2 == 1:
                            continue
                        piece.extend(get_mark_from_last(data['articles'][art]['steps'][i-1]['text'], mark))
    # Extract single non-modified subsection of articles from previous version.
                else:
                    piece = get_mark_from_last(data['articles'][art]['steps'][i-1]['text'], todo)
                gd_text.extend(piece)
            else:
                gd_text.append(text.decode('utf-8'))
        step['text'] = gd_text

        txt = " ".join(step['text'])
        step['length'] = len(txt)
        step['n_diff'] = 0
    # Regenerate comparison elements with previous version and add a text distance
        if i:
            if not data['articles'][art]['steps'][i-1]['text']:
                step['status'] = 'new'
            else:
                oldtxt = " ".join(data['articles'][art]['steps'][i-1]['text'])
                if txt == oldtxt:
                    step['diff'] = 'none'
                else:
                    step['diff'] = 'both'
                    a = SequenceMatcher(None, oldtxt, txt).ratio()
                    b = SequenceMatcher(None, txt, oldtxt).ratio()
                    step['n_diff'] = 1 - (a + b)/2


with open("%s.new" % sys.argv[1], 'w') as output:
    json.dump(data, output, indent=4, encoding='utf-8')

