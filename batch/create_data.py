# -*- coding: utf-8 -*-
import json,re,csv,os
import difflib



path = '.' #the folder path where the laws folders are saved

laws = [ f for f in os.listdir(path) if not os.path.isfile(os.path.join(path,f)) ]

def getParentFolder(root, f):
	abs = os.path.abspath(os.path.join(root, f))
	return os.path.basename(os.path.abspath(os.path.join(abs, os.pardir)))

def unifyStatus(status):
	return {
	"none" : "none",
	"nouveau" : "new",
	"supprimé" : "sup",
	"suppression maintenue" : "sup",
	"suppression conforme" : "sup",
	"non modifié" : "sup",
	"conforme" : "none",
	"supprimés" : "sup",
	"non modifié" : "none",
	"conformes" : "none",
	"supprimé par la commission mixte paritaire" : "sup"
	}[status.strip()]

for law in laws:
	with open(law + "/procedure.json","r") as properties:
		properties = json.load(properties)
	out = {}
	out['articles'] = {}

	steps = properties['steps']
	for step in steps:
		try:
			path = law + '/' +step['resulting_text_directory']
			step_name = step['step']
			step_stage = step['stage']
			step_institution = step['institution']

			for root, dirs, files in os.walk(path):
				articleFiles = [os.path.abspath(os.path.join(root,f)) for f in files if re.search(r'^A.*', getParentFolder(root, f)) and re.search(r'^.*?json', f)]
				if len(articleFiles) > 0:
					for articleFile in articleFiles:
						with open(articleFile,"r") as article:
						 	article = json.load(article)

						if article.get('section'):
							id = 'id_' + str(article['titre']) + '_' + str(article['section'])
						else:
							id = 'id_' + str(article['titre'])

						if out['articles'].get(id):
							s = {}
							
							s['step'] = step_name
							s['stage'] = step_stage
							if article.get('statut'):
								s['status'] = unifyStatus(article['statut'].encode('utf8'))
							else:
								s['status'] = 'none'
							
							text = []
							for key in sorted(article['alineas'].keys()):
								if article['alineas'][key] != '':
									text.append(article['alineas'][key])

							s['length'] = len(' '.join(text))
							s['text'] = text
							pos = len(out['articles'][id]['steps']) -1

							if s['status'] == 'sup':
								out['articles'][id]['steps'][pos]['last'] = 'true'

							s['first'] = 'false'
							if out['articles'][id]['steps'][pos]['first'] == 'true':
								s['status'] = 'none'
								s['first'] = 'true'

							text2 = out['articles'][id]['steps'][pos]['text']
							compare = list(difflib.ndiff(text, text2))

							mods = []
							for line in compare:
								mods.append(line[0].encode("utf8"))
							
							if '+' in mods and '-' in mods:
								s['diff'] = 'both'
							elif '+' in mods and '-' not in mods :
								s['diff'] = "add"
							elif '-' in mods and '+' not in mods :
								s['diff'] = "rem"
							else:
								s['diff'] = "none"

							s['id_step'] = step_stage + '_' + step_institution + '_' + step_name
							s['id_step'] = s['id_step'].strip()
							s['last'] = 'false'
							out['articles'][id]['steps'].append(s)
						else:
							out['articles'][id] = {}
							out['articles'][id]['num'] = article['num']
							out['articles'][id]['id'] = id
							out['articles'][id]['titre'] = article['titre']
							if article.get('section'):
								out['articles'][id]['section'] = article['section']
							else:
								out['articles'][id]['section'] = 'none'
							out['articles'][id]['steps'] = []
							s = {}
							s['step'] = step_name
							s['stage'] = step_stage
							if article.get('statut'):
								s['status'] = unifyStatus(article['statut'].encode('utf8'))
							else:
								s['status'] = 'none'

							if s['status'] == 'new':
								s['first'] = 'true'
							else:
								s['first'] = 'false'

							text = []
							for key in sorted(article['alineas'].keys()):
								if article['alineas'][key] != '':
									text.append(article['alineas'][key])

							s['length'] = len(' '.join(text))
							s['diff'] = 'none'
							s['last'] = 'false'
							s['text'] = text
							s['id_step'] = step_stage + '_' + step_institution + '_' + step_name
							s['id_step'] = s['id_step'].strip()
							out['articles'][id]['steps'].append(s)

		except Exception, e:
			print e
			continue
	with open(law + '.json', 'w') as outfile:
  		outfile.write(json.dumps(out, indent = 4, ensure_ascii=False).encode('utf8'))
