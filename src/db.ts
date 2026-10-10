import {defaultPlans,createDefaultRoutine,upgradeDefaultRoutine,shortenDefaultLegDay} from './favourites';
import {starterExercises,missingCatalogueExercises} from './catalogue';
export {starterExercises} from './catalogue';
import Dexie,{type Table} from 'dexie';
import {type Exercise,type Routine,type Session,type Profile,type Measurement,type Best,type LastPerformance,type Setting,type Backup,cutoffDate,updateRecords,uid,today} from './domain';
export class GymDB extends Dexie{
exercises!:Table<Exercise,string>;routines!:Table<Routine,string>;sessions!:Table<Session,string>;profile!:Table<Profile,string>;measurements!:Table<Measurement,string>;bests!:Table<Best,string>;last!:Table<LastPerformance,string>;settings!:Table<Setting,string>;
constructor(account:string){super('goodform-'+account);this.version(1).stores({exercises:'id,group',routines:'id',sessions:'id,date,status,startedAt',profile:'id',measurements:'id,date',bests:'id,exerciseId,sessionId',last:'id,exerciseId',settings:'id'});}
}
export async function initialize(db:GymDB){
 await db.transaction('rw',db.exercises,db.routines,db.profile,db.settings,async()=>{
  const fresh=await db.exercises.count()===0;
  const missing=missingCatalogueExercises(await db.exercises.toArray());
  if(missing.length)await db.exercises.bulkAdd(missing);
  if(fresh)await db.routines.bulkAdd(defaultPlans.map(createDefaultRoutine));
  if(!await db.settings.get('default-favourites-v2')){
   const routines=await db.routines.toArray();
   for(const routine of routines){const upgraded=upgradeDefaultRoutine(routine);if(upgraded!==routine)await db.routines.put(upgraded);}
   if(!fresh&&!routines.some(r=>r.name==='Shoulders'))await db.routines.add(createDefaultRoutine(defaultPlans[4]));
   await db.settings.put({id:'default-favourites-v2',value:'true'});
  }
  if(!await db.settings.get('short-leg-day-v3')){for(const routine of await db.routines.toArray()){const shorter=shortenDefaultLegDay(routine);if(shorter!==routine)await db.routines.put(shorter);}await db.settings.put({id:'short-leg-day-v3',value:'true'});}if(await db.profile.count()===0)await db.profile.put({id:'me',name:'',goal:'strength',unit:'kg'});
 });await prune(db);
}
export async function saveSession(db:GymDB,s:Session){await db.transaction('rw',db.sessions,async()=>{const other=await db.sessions.where('status').equals('active').filter(x=>x.id!==s.id).first();if(s.status==='active'&&other)throw new Error('Resume or end the existing active workout first.');await db.sessions.put(s);});}
export async function finishSession(db:GymDB,s:Session){await db.transaction('rw',db.sessions,db.bests,db.last,async()=>{const current=await db.sessions.get(s.id);if(!current||current.status==='complete')return;const ended={...s,exercises:s.exercises.map(e=>({...e,skipped:!e.sets.some(set=>set.done)})),status:'complete' as const,endedAt:Date.now(),pausedMs:s.pausedMs+(s.pausedAt?Date.now()-s.pausedAt:0),pausedAt:undefined};await db.sessions.put(ended);let old=(await db.bests.toArray()).filter(r=>r.sessionId!==s.id);const retained=await db.sessions.where('status').equals('complete').filter(x=>x.id!==s.id).toArray();for(const previous of retained.sort((a,b)=>a.startedAt-b.startedAt))old=updateRecords(old,previous);await db.bests.clear();await db.bests.bulkPut(updateRecords(old,ended));for(const e of ended.exercises){const sets=e.sets.filter(x=>x.done&&!x.warmup);if(sets.length)await db.last.put({id:e.id,exerciseId:e.id,date:ended.date,sets});}});}
export async function prune(db:GymDB,now=new Date()){const boundary=cutoffDate(now);await db.transaction('rw',db.sessions,db.bests,db.last,async()=>{const old=await db.sessions.where('date').below(boundary).filter(s=>s.status==='complete').toArray();if(!old.length)return;let records=await db.bests.toArray();for(const s of old.sort((a,b)=>a.startedAt-b.startedAt)){records=updateRecords(records,s);for(const e of s.exercises){const sets=e.sets.filter(x=>x.done&&!x.warmup);const previous=await db.last.get(e.id);if(sets.length&&(!previous||previous.date<s.date))await db.last.put({id:e.id,exerciseId:e.id,date:s.date,sets});}}await db.bests.bulkPut(records);await db.sessions.bulkDelete(old.map(s=>s.id));});}
export async function exportData(db:GymDB):Promise<Backup>{const [profile,exercises,routines,sessions,measurements,bests,last,settings]=await Promise.all([db.profile.toArray(),db.exercises.toArray(),db.routines.toArray(),db.sessions.toArray(),db.measurements.toArray(),db.bests.toArray(),db.last.toArray(),db.settings.toArray()]);return {version:1,exportedAt:new Date().toISOString(),profile,exercises,routines,sessions,measurements,bests,last,settings};}
export async function restoreData(db:GymDB,b:Backup){await db.transaction('rw',db.tables,async()=>{for(const table of db.tables){await table.clear();const entries=b[table.name as keyof Backup];if(Array.isArray(entries)&&entries.length)await table.bulkPut(entries);}await prune(db);});}
export async function loadDemo(db:GymDB){if(await db.sessions.count()||await db.measurements.count())throw new Error('Example data can only be loaded before adding workouts or measurements.');const date=(days:number)=>{const d=new Date();d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);};await db.measurements.bulkPut([28,14,0].map((days,i)=>({id:uid(),date:date(days),height:170,weight:72.4-i*.3})));await db.settings.put({id:'demo',value:'true'});await db.profile.put({id:'me',name:'Alex · example',goal:'maintain',unit:'kg'});await db.bests.put({id:'exercise-0:45:8',exerciseId:'exercise-0',name:'Bench press',kind:'weighted',perHand:false,weight:45,reps:8,seconds:0,date:date(90),sessionId:'example-old'});const e=starterExercises[0];const s:Session={id:uid(),name:'Chest + Triceps · example',date:date(2),startedAt:Date.now()-2*86400000,endedAt:Date.now()-2*86400000+38*60000,pausedMs:0,status:'complete',warmups:[{id:uid(),name:'Cycling',minutes:5}],exercises:[{...e,instanceId:uid(),same:false,skipped:false,sets:[10,8,8].map(reps=>({id:uid(),weight:40,reps,seconds:0,done:true,warmup:false}))}]};await db.sessions.put(s);await db.last.put({id:e.id,exerciseId:e.id,date:s.date,sets:s.exercises[0].sets});}




