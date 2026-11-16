import sys, io
from playwright.sync_api import sync_playwright
from reportlab.pdfgen import canvas
from pypdf import PdfReader
from PIL import Image
fails=[]
def ok(c,m):
    if not c: fails.append(m); print('  FAIL',m)
def mk(path,n,label):
    c=canvas.Canvas(path)
    for i in range(n):
        c.setFont('Helvetica',40); c.drawString(100,700,f'{label} page {i+1}'); c.showPage()
    c.save()
mk('/tmp/a.pdf',3,'A'); mk('/tmp/b.pdf',2,'B')
Image.new('RGB',(800,600),(200,80,80)).save('/tmp/i1.jpg'); Image.new('RGB',(600,900),(80,80,200)).save('/tmp/i2.png')
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(accept_downloads=True,viewport={'width':390,'height':844}); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8765/pdf-tools.html')
    def run(tool, files, setup=None, n_out=1):
        pg.select_option('#tool',tool); pg.set_input_files('#fileIn',files)
        if setup: setup()
        pg.click('#run'); pg.wait_for_selector('#out:not(.hide)',timeout=60000)
        outs=[]
        for a in pg.locator('#outList a').all():
            with pg.expect_download() as d: a.click()
            f=d.value.path(); outs.append((d.value.suggested_filename,open(f,'rb').read()))
        return outs
    o=run('merge',['/tmp/a.pdf','/tmp/b.pdf']); ok(len(PdfReader(io.BytesIO(o[0][1])).pages)==5,'merge 5 pages')
    # reorder: move second file up then merge
    pg.select_option('#tool','merge'); pg.set_input_files('#fileIn',['/tmp/a.pdf','/tmp/b.pdf']); pg.click('#list li:nth-child(2) [data-a=up]')
    pg.click('#run'); pg.wait_for_selector('#out:not(.hide)')
    with pg.expect_download() as d: pg.locator('#outList a').first.click()
    t=PdfReader(d.value.path()).pages[0].extract_text(); ok('B page 1' in t,'merge reorder: '+t)
    o=run('split',['/tmp/a.pdf'],lambda: pg.fill('#o1','1-2, 3')); ok(len(o)==2 and len(PdfReader(io.BytesIO(o[0][1])).pages)==2,'split ranges')
    o=run('split',['/tmp/a.pdf'],lambda: pg.fill('#o1','')); ok(len(o)==3,'split each page')
    o=run('rotate',['/tmp/a.pdf'],lambda: (pg.select_option('#o1','90'),pg.fill('#o2','2'))); r=PdfReader(io.BytesIO(o[0][1])); ok(r.pages[1].get('/Rotate')==90 and not r.pages[0].get('/Rotate'),'rotate page 2 only')
    o=run('remove',['/tmp/a.pdf'],lambda: pg.fill('#o1','2')); r=PdfReader(io.BytesIO(o[0][1])); ok(len(r.pages)==2 and 'A page 3' in r.pages[1].extract_text(),'remove page')
    o=run('organise',['/tmp/a.pdf'],lambda: pg.fill('#o1','3,1')); r=PdfReader(io.BytesIO(o[0][1])); ok(len(r.pages)==2 and 'A page 3' in r.pages[0].extract_text(),'reorder')
    o=run('pagenum',['/tmp/a.pdf'],lambda: pg.fill('#o2','5')); ok('5' in PdfReader(io.BytesIO(o[0][1])).pages[0].extract_text(),'page numbers')
    o=run('watermark',['/tmp/a.pdf'],lambda: pg.fill('#o1','DRAFT')); ok('DRAFT' in PdfReader(io.BytesIO(o[0][1])).pages[0].extract_text(),'watermark')
    o=run('img2pdf',['/tmp/i1.jpg','/tmp/i2.png']); r=PdfReader(io.BytesIO(o[0][1])); ok(len(r.pages)==2,'images to pdf')
    o=run('pdf2img',['/tmp/a.pdf']); ok(len(o)==3 and o[0][1][:2]==b'\xff\xd8','pdf to jpg x3')
    o=run('compress',['/tmp/a.pdf']); ok(len(PdfReader(io.BytesIO(o[0][1])).pages)==3,'compress keeps pages')
    # errors
    pg.select_option('#tool','remove'); pg.set_input_files('#fileIn','/tmp/a.pdf'); pg.fill('#o1','9'); pg.click('#run'); pg.wait_for_selector('#err:not(.hide)'); ok('does not exist' in pg.inner_text('#err'),'range error shown')
    pg.select_option('#tool','merge'); pg.set_input_files('#fileIn','/tmp/a.pdf'); pg.click('#run'); ok('two PDFs' in pg.inner_text('#err'),'merge needs two')
    ok(not errs,f'errors {errs}')
    b.close()
print('FAILED %d'%len(fails) if fails else 'ALL PASSED'); sys.exit(1 if fails else 0)
