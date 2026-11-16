import json, re, sys
src = open('catalog_src.txt', encoding='utf-8').read().splitlines()
inds = []; cur = None
for ln in src:
    if not ln.strip() or ln.startswith('# '): continue
    if ln.startswith('@'):
        k, label, desc, trait = ln[1:].split('|')
        cur = {"key": k, "label": label, "desc": desc, "trait": trait, "skills": [], "roles": []}
        inds.append(cur)
    elif ln.startswith('S: '):
        cur["skills"] = [s.strip() for s in ln[3:].split(';') if s.strip()]
    else:
        parts = [p.strip() for p in ln.split(' | ')]
        assert len(parts) == 3, ln[:60]
        cur["roles"].append({"label": parts[0],
            "tasks": [t.strip() for t in parts[1].split(';') if t.strip()],
            "skills": [s.strip() for s in parts[2].split(';') if s.strip()]})
# extra duties (so every role has 12) and core competencies
comp = {}
byrole = {r["label"]: r for i in inds for r in i["roles"]}
for ln in open('extra_tasks.txt', encoding='utf-8').read().splitlines():
    if ln.startswith('C@'):
        k, v = ln[2:].split(':', 1); comp[k.strip()] = [s.strip() for s in v.split(';') if s.strip()]
    elif ln.startswith('+ '):
        nm, tk = [p.strip() for p in ln[2:].split(' | ')]
        byrole[nm]["tasks"] += [t.strip() for t in tk.split(';') if t.strip()]
for i in inds: i["comp"] = comp.get(i["key"], [])
errs = []; n = 0
for i in inds:
    if len(i["skills"]) < 10: errs.append(i["key"] + " skills<10")
    if len(i["comp"]) < 8: errs.append(i["key"] + " competencies<8")
    for r in i["roles"]:
        n += 1
        if not 10 <= len(r["tasks"]) <= 14: errs.append(f'{r["label"]}: tasks={len(r["tasks"])}')
        merged = list(dict.fromkeys(r["skills"] + i["skills"]))
        if len(merged) < 10: errs.append(f'{r["label"]}: merged skills={len(merged)}')
        for t in r["tasks"] + r["skills"]:
            if not t.isascii(): errs.append(f'non-ascii {r["label"]}: {t}')
print("industries", len(inds), "roles", n)
if errs: print("\n".join(errs)); sys.exit(1)

LEVELS = [
 {"key":"fresher","label":"Fresher / Entry level","years":"0-1","adj":"Motivated"},
 {"key":"junior","label":"Junior (1-3 years)","years":"1-3","adj":"Dependable"},
 {"key":"experienced","label":"Experienced (3-7 years)","years":"3-7","adj":"Experienced"},
 {"key":"senior","label":"Senior (7-12 years)","years":"7-12","adj":"Highly experienced"},
 {"key":"expert","label":"Expert (12+ years)","years":"12+","adj":"Seasoned"},
]
# frontend: labels + suggested skills only
fe = {"levels": LEVELS, "industries": [
  {"key": i["key"], "label": i["label"], "desc": i["desc"],
   "roles": [{"label": r["label"], "skills": list(dict.fromkeys(r["skills"] + i["skills"]))[:12]} for r in i["roles"]]}
  for i in inds]}
open('../src/shared/catalog.js', 'w').write("var KX_CATALOG=" + json.dumps(fe, separators=(',', ':')) + ";\n")
be = {i["key"]: {"label": i["label"], "trait": i["trait"], "skills": i["skills"], "comp": i["comp"],
      "roles": {r["label"]: {"tasks": r["tasks"], "skills": r["skills"]} for r in i["roles"]}} for i in inds}
gs = "// AUTO-GENERATED content library. Edit gen/catalog_src.txt and regenerate.\nconst CONTENT = " + json.dumps(be, indent=1) + ";\n"
gs += "const LEVELS = " + json.dumps({l["key"]: l for l in LEVELS}, indent=1) + ";\n"
open('../backend/Content.gs', 'w').write(gs)
print("ok", len(json.dumps(fe)), len(gs))
