import json, sys, re
from playwright.sync_api import sync_playwright
BASE='http://localhost:8765/'
fails=[]; seen=[]
def ok(c,m):
    if not c: fails.append(m); print('  FAIL',m)
def setup(page, handler):
    errs=[]
    page.on('pageerror', lambda e: errs.append('pageerror: '+str(e)))
    page.on('console', lambda m: errs.append('console.error: '+m.text) if m.type=='error' else None)
    def route(r):
        req=r.request
        body=req.post_data or ''
        try: j=json.loads(body)
        except Exception: j={}
        seen.append(j)
        res=handler(j)
        r.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin':'*'}, body=json.dumps(res))
    page.route('https://script.google.com/**', route)
    return errs
def backend(j):
    a=j.get('action')
    if a=='submit': return {'ok':True,'ref':'KTX-0042','warnings':[]}
    if a=='order': return {'ok':True,'ref':'KTX-0043','warnings':['x']}
    if a=='status':
        if j.get('contact')=='bad': return {'ok':False,'error':'We could not find an order matching those details.'}
        return {'ok':True,'order':{'ref':j['ref'],'service':'ATS & Technical CV','rush':True,'status':'in_progress','paid':'paid','created':'2026-11-10T08:00:00Z','due':'2026-11-12T08:00:00Z','note':'Draft is with the writer.'}}
    if a=='revision': return {'ok':True,'free':True}
    if a=='admin_list':
        if j.get('key')!='secret': return {'ok':False,'error':'Wrong admin key.'}
        return {'ok':True,'orders':[{'ref':'KTX-0002','created':'2026-11-11T08:00:00Z','name':'Amina Yusuf','email':'a@x.com','phone':'+254700','service':'LinkedIn Basic','total':70,'paid':'unpaid','status':'received','due':'2026-11-12T08:00:00Z','rush':True},{'ref':'KTX-0001','created':'2026-11-10T08:00:00Z','name':'Joseph Mwangi','email':'j@x.com','phone':'+971501','service':'ATS & Technical CV','total':50,'paid':'paid','status':'delivered','due':'2026-11-12T08:00:00Z','rush':False}]}
    if a=='admin_get': return {'ok':True,'order':{'ref':j['ref'],'created':'2026-11-10 08:00','name':'Amina Yusuf','email':'a@x.com','phone':'+254700','service':'LinkedIn Basic','target':'','pay':'M-Pesa','total':70,'notes':'my link','folder':'https://drive.google.com/drive/folders/abc','status':'received','paid':'unpaid','note':'','revisions':0}}
    if a=='admin_update': return {'ok':True,'message':'Saved.'}
    return {'ok':False,'error':'unknown'}

with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------- every page loads clean in light + dark, desktop + phone
    pages=['index','intake','other-services','document-cleanup','document-merge','order-status','revision-request','admin','pdf-tools','terms','privacy','legal-notice','copyright','contact','blog']
    for dev,vp in (('phone',{'width':390,'height':844}),('desk',{'width':1280,'height':900})):
        for theme in ('light','dark'):
            ctx=b.new_context(viewport=vp,color_scheme=theme,device_scale_factor=1)
            for n in pages:
                pg=ctx.new_page(); errs=setup(pg,backend)
                pg.goto(BASE+n+'.html'); pg.wait_for_load_state('networkidle')
                ok(not errs, f'{n} {dev} {theme} errors: {errs}')
                ok(pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'), f'{n} {dev} {theme} horizontal overflow {pg.evaluate("document.documentElement.scrollWidth")}')
                ok(pg.evaluate("document.documentElement.getAttribute('data-theme')")==theme, f'{n} theme attr')
                if theme=='light' or n in('index','intake'): pg.screenshot(path=f'/home/claude/kinetix/tests/out/p-{n}-{dev}-{theme}.png', full_page=(n!='intake'))
                pg.close()
            ctx.close()
    print('pages loaded')

    # ---------- intake end-to-end on a phone
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); errs=setup(pg,backend)
    pg.goto(BASE+'intake.html')
    # step 1
    ok(pg.locator('input[name=service]').count()==5, 'five packages: %d'%pg.locator('input[name=service]').count())
    pg.locator('input[name=service][value=cv_ats]').check()
    ok(pg.locator('input[name=style]:checked').get_attribute('value')=='ats_classic','ats default style')
    pg.locator('input[name=rush]').check()
    ok('AED 70' in pg.inner_text('#total'), 'total 70: '+pg.inner_text('#total'))
    pg.locator('input[name=service][value=pkg_site]').check()
    ok(pg.locator('input[name=cover]').is_checked() and pg.locator('input[name=cover]').is_disabled(),'bundle includes cover')
    ok('AED 120' in pg.inner_text('#total'), 'bundle+rush 120: '+pg.inner_text('#total'))
    pg.locator('input[name=service][value=cv_ats]').check()
    pg.locator('input[name=style][value=side_navy]').check()
    pg.screenshot(path='/home/claude/kinetix/tests/out/i-step1.png', full_page=True)
    pg.click('#next')
    # step 2: validation first
    pg.click('#next'); ok(pg.locator('.f.bad').count()>=4, 'step2 validation shows errors: %d'%pg.locator('.f.bad').count())
    pg.fill('#fullName','Amina Yusuf'); pg.fill('#email','amina@example.com'); pg.fill('#phone','+254 712 345 678')
    pg.select_option('#nationality','Kenya'); pg.select_option('#country','United Arab Emirates')
    ok(pg.locator('#city option').count()>5,'city list populated')
    pg.select_option('#city','Mussafah')
    ok(pg.locator('#country option[value="Saudi Arabia"]').count()==1, 'GCC countries present')
    ok(pg.locator('#nationality option[value="Uganda"]').count()==1 and pg.locator('#nationality option[value="Nigeria"]').count()==1,'african nationalities present')
    pg.select_option('#country','Outside the GCC'); ok(pg.locator('#city').is_hidden() and pg.locator('#cityOther').is_visible(),'outside GCC shows free text city')
    pg.select_option('#country','United Arab Emirates'); pg.select_option('#city','Mussafah')
    # photo upload
    from PIL import Image
    Image.new('RGB',(1800,1200),(120,160,200)).save('/tmp/photo.jpg')
    pg.set_input_files('#photoIn','/tmp/photo.jpg'); pg.wait_for_function("document.getElementById('photoNote').textContent.indexOf('added')>-1")
    pg.click('#next')
    # step 3
    ok(pg.locator('#industry option').count()==12,'11 industries + placeholder: %d'%pg.locator('#industry option').count())
    ok(pg.locator('#industry option[value=warehouse]').count()==1,'warehouse industry present')
    pg.click('#next'); ok(pg.locator('.f.bad').count()>=3,'step3 validation')
    pg.select_option('#industry','warehouse'); ok(pg.locator('#role option').count()>8,'roles cascade: %d'%pg.locator('#role option').count())
    pg.select_option('#role','Storekeeper'); ok(pg.locator('#skillPrev .chip').count()>=6,'skill preview chips')
    pg.select_option('#level','experienced'); ok(pg.input_value('#years')=='3','years autofilled from level')
    pg.fill('#years','4'); pg.select_option('#visa','demob'); pg.select_option('#avail','immediate')
    ok(pg.locator('#visa option').count()>=10,'visa options')
    pg.check('input[name=pref][value="Any UAE location"]'); pg.fill('#extraSkills','SAP, Oracle')
    pg.screenshot(path='/home/claude/kinetix/tests/out/i-step3.png', full_page=True)
    pg.click('#next')
    # step 4 experience
    pg.locator('#exps [data-k=title]').first.fill('Storekeeper'); pg.locator('#exps [data-k=company]').first.fill('Gulf Stores LLC')
    pg.locator('#exps [data-k=country]').first.fill('UAE'); pg.locator('#exps [data-k=from]').first.fill('2022-02'); pg.locator('#exps [data-k=current]').first.check()
    pg.click('[data-add=exp]'); ok(pg.locator('#exps .rrow').count()==2,'add job row')
    pg.locator('#exps .rrow').nth(1).locator('[data-rm]').click(); ok(pg.locator('#exps .rrow').count()==1,'remove job row')
    pg.click('#next')
    # step 5
    pg.locator('#edus [data-k=level]').first.select_option('diploma'); pg.locator('#edus [data-k=field]').first.fill('Logistics')
    pg.click('[data-add=cert]'); pg.locator('#certs [data-k=name]').first.fill('Forklift Licence'); pg.locator('#certs [data-k=year]').first.fill('2023')
    pg.set_input_files('#fileIn',['/tmp/photo.jpg']); pg.wait_for_selector('#files .file')
    pg.check('input[name=certOrder][value=newest]')
    pg.screenshot(path='/home/claude/kinetix/tests/out/i-step5.png', full_page=True)
    pg.click('#next')
    # step 6
    ok('Amina Yusuf' in pg.inner_text('#review') and 'Storekeeper' in pg.inner_text('#review'),'review lists data')
    ok(pg.inner_text('#nextTxt')=='Submit order','submit label')
    pg.click('#next'); ok(pg.locator('#consentE').is_visible(),'consent required')
    pg.check('input[name=consent]'); pg.check('input[name=pay][value=equity]')
    pg.screenshot(path='/home/claude/kinetix/tests/out/i-step6.png', full_page=True)
    # slow the backend a little so the progress UI is observable
    def slow(r):
        import time; time.sleep(1.2)
        r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({'ok':True,'ref':'KTX-0042','warnings':[]}))
        seen.append(json.loads(r.request.post_data))
    pg.unroute('https://script.google.com/**'); pg.route('https://script.google.com/**', slow)
    pg.click('#next')
    pg.wait_for_selector('#prog[open]', timeout=3000)
    ok(pg.get_attribute('#next','aria-busy')=='true' and pg.is_disabled('#next'),'button shows busy state while sending')
    ok(pg.locator('#stages li').count()==4,'4 stages listed')
    pg.screenshot(path='/home/claude/kinetix/tests/out/i-progress.png')
    pg.wait_for_selector('#done:not(.hide)', timeout=8000)
    ok(pg.inner_text('#dRef')=='KTX-0042','success shows reference')
    ok('Amina' in pg.inner_text('#dName'),'thank-you name')
    ok('247247' in pg.inner_text('#dPay') and 'AED 70' in pg.inner_text('#dTotal'),'payment panel: '+pg.inner_text('#dPay'))
    ok('wa.me/254758587881' in pg.get_attribute('#dWa','href'),'whatsapp link')
    pg.screenshot(path='/home/claude/kinetix/tests/out/i-done.png', full_page=True)
    sub=[s for s in seen if s.get('action')=='submit'][-1]
    ok(sub['person']['fullName']=='Amina Yusuf' and sub['person']['city']=='Mussafah','payload person')
    ok(sub['target']['industry']=='warehouse' and sub['target']['role']=='Storekeeper' and sub['target']['visa']=='demob','payload target')
    ok(sub['service']=='cv_ats' and sub['style']=='side_navy' and sub['pay']=='equity' and sub['certOrder']=='newest','payload options')
    ok(sub['photo'] and sub['photo']['type']=='image/jpeg' and len(sub['files'])==1,'photo + 1 file in payload')
    ok(len(sub['photo']['data'])<150000, 'photo shrunk: %d chars'%len(sub['photo']['data']))
    ok(sub['experience'][0]['current'] is True and sub['education'][0]['level']=='diploma' and sub['certificates'][0]['name']=='Forklift Licence','payload lists')
    ok(len(sub['files'][0]['data'])<400000,'cert file shrunk: %d'%len(sub['files'][0]['data']))
    ok(not errs, f'intake errors {errs}')
    ctx.close()

    # ---------- failure path: server error shows message, button recovers
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page()
    errs=setup(pg, lambda j: {'ok':False,'error':'Enter a valid email address.'})
    pg.goto(BASE+'intake.html')
    pg.click('#next'); pg.fill('#fullName','Test User'); pg.fill('#email','t@example.com'); pg.fill('#phone','0712345678'); pg.select_option('#nationality','Ghana'); pg.select_option('#country','Qatar'); pg.click('#next')
    pg.select_option('#industry','hse'); pg.select_option('#role','HSE Officer'); pg.select_option('#level','junior'); pg.fill('#years','2'); pg.select_option('#visa','employment'); pg.select_option('#avail','2w'); pg.click('#next')
    pg.click('#next'); pg.click('#next'); pg.check('input[name=consent]'); pg.click('#next')
    pg.wait_for_selector('#err:not(.hide)',timeout=5000)
    ok('valid email' in pg.inner_text('#err'),'server error displayed')
    ok(pg.get_attribute('#next','aria-busy')=='false' and not pg.is_disabled('#next'),'button recovers after error')
    ok(pg.locator('#done').is_hidden(),'no false success')
    # draft restore
    pg.reload(); ok(pg.locator('#resumed').count()==1 and pg.input_value('#fullName')=='Test User','draft restored after reload')
    ok(pg.input_value('#role')=='HSE Officer','role restored')
    ctx.close()

    # ---------- unreachable server message
    ctx=b.new_context(); pg=ctx.new_page(); pg.route('https://script.google.com/**', lambda r: r.abort())
    pg.goto(BASE+'order-status.html'); pg.fill('#ref','ktx-1'); pg.fill('#who','a@b.co'); pg.click('#go')
    pg.wait_for_selector('#err:not(.hide)'); ok('Could not reach the server' in pg.inner_text('#err'),'network error message'); ctx.close()

    # ---------- other-services / cleanup / merge
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); errs=setup(pg,backend)
    pg.goto(BASE+'other-services.html'); ok(pg.locator('input[name=service]').count()==4,'4 other services')
    pg.fill('#name','Amina'); pg.fill('#email','a@x.com'); pg.fill('#phone','0700000000'); pg.check('#rush'); pg.check('#agree')
    pg.locator('input[name=service][value=linkedin_full]').check(); ok('AED 120' in pg.inner_text('#total'),'linkedin full + rush 120: '+pg.inner_text('#total'))
    pg.set_input_files('#fileIn','/tmp/photo.jpg'); pg.wait_for_selector('#files .file')
    pg.click('#go'); pg.wait_for_selector('#done:not(.hide)'); ok(pg.inner_text('#dRef')=='KTX-0043','other order ref'); ok(pg.locator('#dWarn:not(.hide)').count()==1,'warning notice shown')
    o=[s for s in seen if s.get('action')=='order'][-1]; ok(o['service']=='linkedin_full' and o['rush'] and o['total']==120 and len(o['files'])==1,'order payload')
    pg.goto(BASE+'document-cleanup.html'); pg.fill('#name','A B'); pg.fill('#email','a@x.com'); pg.fill('#phone','0700000000'); pg.check('#agree'); pg.click('#go')
    ok('attach the document' in pg.inner_text('#err'),'cleanup requires a file')
    pg.goto(BASE+'document-merge.html'); ok(pg.locator('input[name=service]').count()==2,'merge services')
    ok(not errs,f'other errors {errs}'); ctx.close()

    # ---------- status
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); errs=setup(pg,backend)
    pg.goto(BASE+'order-status.html?ref=ktx-0042'); ok(pg.input_value('#ref')=='KTX-0042','ref prefilled uppercase')
    pg.fill('#who','bad'); pg.click('#go'); pg.wait_for_selector('#err:not(.hide)'); ok('could not find' in pg.inner_text('#err'),'status mismatch message')
    pg.fill('#who','j@x.com'); pg.click('#go'); pg.wait_for_selector('#res:not(.hide)')
    t=pg.inner_text('#res'); ok('In progress' in t and 'Payment received' in t and 'Draft is with the writer' in t and 'express' in t,'status card: '+t[:120])
    pg.screenshot(path='/home/claude/kinetix/tests/out/s-status.png', full_page=True)
    ok('revision-request.html?ref=KTX-0042' in pg.get_attribute('#res a.btn','href'),'revision link')
    pg.goto(BASE+'revision-request.html?ref=KTX-0042'); pg.fill('#who','j@x.com'); pg.fill('#msg','Change my title to Senior Storekeeper'); pg.click('#go'); pg.wait_for_selector('#ok:not(.hide)'); ok('free' in pg.inner_text('#okT'),'revision success')
    ok(not errs,f'status errors {errs}'); ctx.close()

    # ---------- admin
    ctx=b.new_context(viewport={'width':1100,'height':800}); pg=ctx.new_page(); errs=setup(pg,backend)
    pg.goto(BASE+'admin.html'); pg.fill('#key','nope'); pg.click('#lgo'); pg.wait_for_selector('#lerr:not(.hide)'); ok('Wrong admin key' in pg.inner_text('#lerr'),'wrong key')
    pg.fill('#key','secret'); pg.click('#lgo'); pg.wait_for_selector('#dash:not(.hide)')
    ok(pg.locator('#rows tr').count()==2,'two rows'); ok('70' in pg.inner_text('#stats') and '50' in pg.inner_text('#stats'),'stats: '+pg.inner_text('#stats').replace('\n',' '))
    pg.fill('#q','joseph'); ok(pg.locator('#rows tr').count()==1,'search filter')
    pg.fill('#q',''); pg.select_option('#fp','unpaid'); ok(pg.locator('#rows tr').count()==1 and 'KTX-0002' in pg.inner_text('#rows'),'paid filter')
    pg.select_option('#fp',''); pg.click('#rows tr >> nth=0'); pg.wait_for_selector('dialog[open]'); ok('Open Drive folder' in pg.inner_text('#dBody'),'detail dialog')
    pg.screenshot(path='/home/claude/kinetix/tests/out/a-detail.png')
    pg.select_option('#ds','in_progress'); pg.click('#dsv'); pg.wait_for_selector('dialog:not([open])',state='attached')
    u=[s for s in seen if s.get('action')=='admin_update'][-1]; ok(u['status']=='in_progress' and u['key']=='secret','admin update payload')
    pg.reload(); ok(pg.locator('#dash:not(.hide)').count()==1,'session keeps admin signed in')
    ok(not errs,f'admin errors {errs}'); ctx.close()
    b.close()
print('\nFAILED %d'%len(fails) if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
