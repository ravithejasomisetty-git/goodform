import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const output='test-results/journeys';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const results=[];
async function journey(name,body){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 const nav=name=>page.locator('.sidebar').getByRole('button',{name,exact:true}).click();
 const read=()=>page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('goodform-local');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await Promise.all(['sessions','routines','bests','last'].map(name=>new Promise((resolve,reject)=>{const r=db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}))).then(([sessions,routines,bests,last])=>({sessions,routines,bests,last}));}finally{db.close();}});
 const exercise=async name=>{await page.locator('.session-list button').filter({has:page.getByText(name,{exact:true})}).click();await page.locator('.log-panel h2').filter({hasText:name}).waitFor();};
 const log=async(i,weight,reps=10)=>{await page.getByLabel(`Set ${i} weight`,{exact:true}).fill(String(weight));const input=page.getByLabel(`Set ${i} reps`,{exact:true});if(await input.count())await input.fill(String(reps));else await page.getByLabel(`Set ${i} seconds`,{exact:true}).fill(String(reps));await page.getByRole('button',{name:`Complete set ${i}`,exact:true}).click();await page.getByRole('button',{name:`Undo set ${i}`,exact:true}).waitFor();};
 const shared=async(name,weight)=>{await exercise(name);await page.getByLabel('Same weight for unfinished sets').check();await log(1,weight);await log(2,weight);await log(3,weight);};
 const start=async names=>{await nav('Today');for(const name of names)await page.locator('.routine-card').filter({hasText:name}).click();await page.getByRole('button',{name:"Review today's plan"}).click();await page.getByRole('button',{name:'Start workout',exact:true}).click();await page.getByRole('heading',{name:'One set at a time.'}).waitFor();};
 const finish=async()=>{await page.getByRole('button',{name:'End workout',exact:true}).click();await page.getByRole('heading',{name:'Workout history'}).waitFor();await nav('Today');assert.equal(await page.locator('.routine-card[aria-pressed="true"]').count(),0);assert.equal(await page.getByRole('button',{name:"Review today's plan"}).isEnabled(),false);return read();};
 const reopen=async()=>{await nav('History');await page.locator('.session-row').click();await page.getByRole('button',{name:'Reopen to continue or correct'}).click();await page.getByRole('heading',{name:'One set at a time.'}).waitFor();};
 const skip=async name=>{await exercise(name);await page.getByRole('button',{name:'Skip',exact:true}).click();};
 const defer=async name=>{await exercise(name);await page.getByRole('button',{name:'Do later',exact:true}).click();};
 try{await page.goto(process.env.APP_URL||'http://127.0.0.1:4176/');await page.getByRole('heading',{name:'Ready when you are.'}).waitFor();await body({page,nav,read,exercise,log,shared,start,finish,reopen,skip,defer});assert.deepEqual(errors,[]);await page.screenshot({path:`${output}/${name}.png`,fullPage:true});results.push({name,status:'PASS'});console.log('PASS '+name);}
 catch(e){await page.screenshot({path:`${output}/${name}-failure.png`,fullPage:true}).catch(()=>{});results.push({name,status:'FAIL',error:String(e),runtimeErrors:errors});console.log('FAIL '+name+': '+e.message);}
 finally{await context.close();}
}
const find=(data,name)=>data.sessions[0].exercises.find(e=>e.name===name);
try{
await journey('01-Arun',async t=>{
 await t.start(['Chest + Triceps']);await t.exercise('Bench press');for(const [i,w,r] of [[1,30,10],[2,35,8],[3,40,6]])await t.log(i,w,r);
 await t.shared('Tricep pushdown',15);await t.skip('Chest press machine');for(const n of ['Incline dumbbell press','Overhead extension','Straight-bar pushdown'])await t.shared(n,10);
 const data=await t.finish();assert.deepEqual(find(data,'Bench press').sets.map(s=>s.weight),[30,35,40]);assert(find(data,'Chest press machine').skipped);assert.equal(data.sessions.length,1);assert.equal(find(data,'Tricep pushdown').sets.filter(s=>s.done&&s.weight===15).length,3);assert(!data.bests.some(b=>b.name==='Chest press machine'));
});
await journey('02-Maya',async t=>{
 await t.start(['Back + Biceps','Core / Abs']);await t.shared('Lat pulldown',30);await t.exercise('Bicep curl');for(let i=1;i<=3;i++)await t.log(i,i+4);await t.exercise('Plank');await t.log(1,0,30);await t.defer('Side plank');await t.skip('Assisted pull-up');
 const data=await t.finish();assert.equal(data.sessions[0].exercises.length,9);assert(find(data,'Side plank').skipped);assert.deepEqual(find(data,'Bicep curl').sets.map(s=>s.weight),[5,6,7]);assert(find(data,'Bicep curl').perHand);await t.start(['Shoulders']);await t.finish();assert.equal((await t.read()).sessions.length,2);
});
await journey('03-Ravi',async t=>{
 await t.start(['Leg Day']);await t.exercise('Squat');await t.log(1,40);await t.page.getByLabel('Same weight for unfinished sets').check();await t.log(2,45);await t.log(3,50);await t.skip('Hip thrust');await t.exercise('Calf raise');await t.log(1,20);await t.log(2,20);
 const data=await t.finish();assert.deepEqual(find(data,'Squat').sets.map(s=>s.weight),[40,45,50]);assert.equal(find(data,'Calf raise').sets.filter(s=>s.done).length,2);assert(find(data,'Hip thrust').skipped);
});
await journey('04-Neha',async t=>{
 await t.start(['Chest + Triceps']);await t.exercise('Bench press');await t.log(1,25);await t.page.getByRole('button',{name:'Replace',exact:true}).click();await t.page.getByRole('dialog').getByRole('button',{name:'Push-up',exact:true}).click();await t.exercise('Push-up');await t.log(1,0,12);await t.log(2,0,10);await t.defer('Incline dumbbell press');await t.shared('Tricep pushdown',15);
 const data=await t.finish();assert.equal(find(data,'Bench press').sets.filter(s=>s.done).length,1);assert.equal(find(data,'Push-up').sets.filter(s=>s.done).length,2);assert(find(data,'Incline dumbbell press').skipped);const favourite=data.routines.find(r=>r.name==='Chest + Triceps');assert(favourite.items.some(i=>i.exerciseId==='exercise-0'));assert(!favourite.items.some(i=>i.exerciseId==='exercise-20'));
});
await journey('05-Sam',async t=>{
 await t.start(['Shoulders','Core / Abs']);await t.shared('Shoulder press',10);await t.exercise('Lateral raise');await t.log(1,4);await t.log(2,5);await t.defer('Crunch');await t.page.reload();await t.page.getByRole('button',{name:'Resume workout',exact:true}).click();await t.exercise('Lateral raise');assert.equal(await t.page.getByLabel('Set 2 weight',{exact:true}).inputValue(),'5');await t.page.getByRole('button',{name:'Pause',exact:true}).click();await t.page.getByRole('button',{name:'Resume',exact:true}).waitFor();const pause=(await t.read()).sessions[0].pausedAt;assert(pause);await t.page.waitForTimeout(200);await t.page.getByRole('button',{name:'Resume',exact:true}).click();await t.skip('Side plank');const data=await t.finish();assert.equal(data.sessions.length,1);assert(data.sessions[0].pausedMs>0);assert(find(data,'Crunch').skipped);
});
await journey('06-Priya',async t=>{
 await t.start(['Back + Biceps']);await t.exercise('Seated row');await t.log(1,20);await t.log(2,200);await t.log(3,20);for(const name of ['Lat pulldown','Assisted pull-up','Bicep curl','Hammer curl','Barbell curl'])await t.skip(name);const initial=await t.finish();assert(initial.bests.some(b=>b.weight===200));const id=initial.sessions[0].id;
 await t.reopen();await t.exercise('Seated row');await t.page.getByLabel('Set 2 weight',{exact:true}).fill('20');await t.exercise('Bicep curl');await t.log(1,5);assert(!(await t.page.locator('.session-list button').filter({has:t.page.getByText('Bicep curl',{exact:true})}).innerText()).includes('Skipped'),'Reopened exercise must stop showing Skipped after logging');const final=await t.finish();assert.equal(final.sessions.length,1);assert.equal(final.sessions[0].id,id);assert(!final.bests.some(b=>b.weight===200));assert(final.bests.some(b=>b.name==='Bicep curl'));assert.equal(find(final,'Bicep curl').skipped,false);
});
await journey('07-Leo',async t=>{
 await t.start(['Leg Day']);await t.defer('Squat');await t.defer('Leg press');for(const name of ['Leg curl','Romanian deadlift','Hip thrust','Calf raise'])await t.skip(name);const initial=await t.finish();assert(initial.sessions[0].exercises.every(e=>e.skipped));assert.equal(initial.bests.length,0);const id=initial.sessions[0].id;await t.reopen();await t.exercise('Squat');await t.log(1,40);assert(!(await t.page.locator('.session-list button').filter({has:t.page.getByText('Squat',{exact:true})}).innerText()).includes('Skipped'),'Reopened exercise must stop showing Skipped after logging');const final=await t.finish();assert.equal(final.sessions.length,1);assert.equal(final.sessions[0].id,id);assert.equal(find(final,'Squat').skipped,false);await t.start(['Leg Day']);await t.finish();assert.equal((await t.read()).sessions.length,2);
});
}finally{fs.writeFileSync(`${output}/report.json`,JSON.stringify(results,null,2));await browser.close();}
if(results.some(r=>r.status==='FAIL'))process.exitCode=1;


