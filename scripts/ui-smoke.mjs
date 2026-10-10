import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=modulePath?await import(pathToFileURL(path.join(modulePath,'index.mjs')).href):await import('playwright');
const output=path.resolve('test-results');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,downloadsPath:output,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
const checks=[],warnings=[];async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name);}
const nav=async(name)=>page.locator('.sidebar').getByRole('button',{name,exact:true}).click();
try{
await page.goto(process.env.APP_URL||'http://127.0.0.1:5173/');
await page.getByRole('heading',{name:'Ready when you are.'}).waitFor();
await check('Default favourites include expanded plans',async()=>{
for(const [name,count] of [['Chest + Triceps',6],['Back + Biceps',6],['Leg Day',6],['Core / Abs',3],['Shoulders',3]]){
assert((await page.locator('.routine-card').filter({hasText:name}).innerText()).includes(`${count} exercises`));
}
});
await check('Desktop layout and brand',async()=>{assert.equal(await page.locator('.brand-mark').count(),2);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'today-desktop.png'),fullPage:true});});
await check('Create a routine and custom exercise',async()=>{
await nav('Routines');await page.getByRole('button',{name:'Create routine',exact:true}).click();
let modal=page.getByRole('dialog');await modal.getByLabel('Routine name').fill('UI Test Routine');
for(const group of ['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Core / Abs']){
await modal.getByRole('button',{name:group,exact:true}).click();
assert.equal(await modal.locator('.exercise-choices button').count(),6,`${group} has six suggested exercises`);
}
await modal.getByRole('button',{name:'Chest',exact:true}).click();
await modal.getByRole('button',{name:'Bench press',exact:true}).click();
await modal.getByRole('button',{name:'Add your own exercise'}).click();
const custom=page.getByRole('dialog',{name:'Add a custom exercise'});await custom.getByLabel('Exercise name').fill('My cable press');await custom.getByRole('button',{name:'Save exercise'}).click();
modal=page.getByRole('dialog',{name:'Edit routine'});await modal.getByRole('button',{name:'Save routine'}).click();await modal.waitFor({state:'hidden'});
await page.getByRole('heading',{name:'UI Test Routine',exact:true}).waitFor();
});
await check('Combine favourites and handle duplicates',async()=>{
await nav('Today');await page.locator('.routine-card').filter({hasText:'Chest + Triceps'}).click();await page.locator('.routine-card').filter({hasText:'UI Test Routine'}).click();
await page.getByRole('button',{name:"Review today's plan"}).click();await page.getByRole('button',{name:'Merge sets'}).click();
assert.equal(await page.getByRole('dialog').getByRole('button',{name:'Merge sets'}).count(),0);
await page.getByRole('button',{name:'Start workout',exact:true}).click();await page.getByRole('heading',{name:'One set at a time.'}).waitFor();
});
await check('Same-weight mode protects completed sets',async()=>{
await page.getByLabel('Set 1 weight',{exact:true}).fill('40');await page.getByRole('button',{name:'Complete set 1',exact:true}).click();
await page.getByLabel('Same weight for unfinished sets').check();await page.getByLabel('Set 2 weight',{exact:true}).fill('45');
await page.waitForFunction(()=>document.querySelector('[aria-label="Set 3 weight"]').value==='45');
assert.equal(await page.getByLabel('Set 1 weight',{exact:true}).inputValue(),'40');
assert.equal(await page.getByLabel('Set 3 weight',{exact:true}).inputValue(),'45');
});
await check('Refresh recovery, pause and warm-up',async()=>{
await page.reload();await page.getByRole('button',{name:'Resume workout',exact:true}).click();assert.equal(await page.getByLabel('Set 1 weight',{exact:true}).inputValue(),'40');
await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).waitFor();await page.getByRole('button',{name:'Resume',exact:true}).click();
await page.getByRole('button',{name:'Log warm-up',exact:true}).click();const modal=page.getByRole('dialog');await modal.getByLabel('Activity',{exact:true}).fill('Cycling');await modal.getByLabel('Duration · minutes').fill('5');await modal.getByRole('button',{name:'Save warm-up'}).click();await modal.waitFor({state:'hidden'});await page.screenshot({path:path.join(output,'workout-desktop.png'),fullPage:true});
});
await check('End and reopen without duplicate sessions',async()=>{
await page.getByRole('button',{name:'End workout',exact:true}).click();await page.getByRole('heading',{name:'Workout history'}).waitFor();assert.equal(await page.locator('.session-row').count(),1);
await nav('Today');
assert.equal(await page.locator('.routine-card[aria-pressed="true"]').count(),0);
assert.equal(await page.locator('.routine-card.featured').count(),0);
assert.equal(await page.getByRole('button',{name:"Review today's plan"}).isEnabled(),false);
await nav('History');
await page.locator('.session-row').click();await page.getByRole('button',{name:'Reopen to continue or correct'}).click();await page.getByRole('heading',{name:'One set at a time.'}).waitFor();await page.getByRole('button',{name:'End workout',exact:true}).click();await page.getByRole('heading',{name:'Workout history'}).waitFor();assert.equal(await page.locator('.session-row').count(),1);
});
await check('Dated profile measurements and BMI',async()=>{
await nav('Profile & settings');await page.getByLabel('Height · cm',{exact:true}).fill('170');await page.getByLabel('Body weight · kg',{exact:true}).fill('71.8');assert.equal(await page.locator('.bmi-box strong').textContent(),'24.8');await page.getByRole('button',{name:'Save dated measurement'}).click();await page.getByRole('heading',{name:'Measurement history',exact:true}).waitFor();assert.equal(await page.locator('.measurement-row').count(),1);
await page.getByRole('button',{name:'Measurements',exact:true}).click();await page.getByLabel('Height · cm',{exact:true}).fill('171');await page.getByLabel('Body weight · kg',{exact:true}).fill('72');await page.getByRole('button',{name:'Save dated measurement'}).click();await page.getByRole('heading',{name:'Measurement history',exact:true}).waitFor();assert.equal(await page.locator('.measurement-row').count(),2);
await page.screenshot({path:path.join(output,'profile-desktop.png'),fullPage:true});
});
await check('Backup export and invalid import preserves records',async()=>{
await page.getByRole('button',{name:'Account & backup',exact:true}).click();
await page.evaluate(()=>{const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{window.__exportBlob=blob;return original(blob);};});
const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const download=await downloadEvent;
try{await download.saveAs(path.join(output,'backup.json'));}catch(e){if(!String(e).includes('canceled'))throw e;warnings.push('Native download completion is blocked by this browser sandbox; the generated export Blob and restore flow were validated.');const json=await page.evaluate(()=>window.__exportBlob.text());fs.writeFileSync(path.join(output,'backup.json'),json);}
const backup=JSON.parse(fs.readFileSync(path.join(output,'backup.json'),'utf8'));assert.equal(backup.measurements.length,2);assert.equal(backup.sessions.length,1);
await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});await page.getByRole('alert').filter({hasText:'Invalid backup'}).waitFor();
await page.getByRole('button',{name:'History',exact:true}).filter({has:page.locator('nothing')}).count();
await page.getByRole('button',{name:'History',exact:true}).last().click();assert.equal(await page.locator('.measurement-row').count(),2);
});
await check('Validated restore replaces data correctly',async()=>{
await page.getByRole('button',{name:'Account & backup',exact:true}).click();await page.getByRole('button',{name:'Delete all local data'}).click();await page.getByRole('status').filter({hasText:'Workspace reset'}).waitFor();
await page.locator('input[type=file]').setInputFiles(path.join(output,'backup.json'));await page.getByRole('button',{name:'Replace local data and restore'}).click();await page.getByRole('status').filter({hasText:'Backup restored successfully'}).waitFor();await page.getByRole('button',{name:'History',exact:true}).last().click();assert.equal(await page.locator('.measurement-row').count(),2);
});
await check('End an entirely unlogged session as skipped',async()=>{
await nav('Today');await page.locator('.routine-card').filter({hasText:'Shoulders'}).click();
await page.getByRole('button',{name:"Review today's plan"}).click();await page.getByRole('button',{name:'Start workout',exact:true}).click();
await page.getByRole('button',{name:'End workout',exact:true}).click();await page.getByRole('heading',{name:'Workout history'}).waitFor();
await page.locator('.session-row').filter({hasText:'Shoulders'}).click();
assert.equal(await page.getByText('All sets skipped',{exact:true}).count(),3);
await page.getByRole('button',{name:'Close dialog',exact:true}).click();
await nav('Today');assert.equal(await page.locator('.routine-card[aria-pressed="true"]').count(),0);
});
await check('Mobile layout fits 390px and navigation works',async()=>{
await page.setViewportSize({width:390,height:844});await page.locator('.mobile-nav').getByRole('button',{name:'Today',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'today-mobile.png'),fullPage:true});await page.getByRole('button',{name:'Open profile',exact:true}).click();await page.getByRole('button',{name:'Measurements',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'profile-mobile.png'),fullPage:true});
});
assert.deepEqual(errors,[],'No browser runtime errors');
fs.writeFileSync(path.join(output,'ui-report.json'),JSON.stringify({checks,errors,warnings},null,2));console.log(`${checks.length} browser UI checks passed. Screenshots in test-results/.`);if(warnings.length)console.log(warnings.join('\n'));
}catch(e){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});console.error('Browser runtime errors:',errors);throw e;}finally{await browser.close();}

