import {describe,it,expect} from 'vitest';
import {cutoffDate,setSharedWeight,updateRecords,bmi,durations,backupSchema,bestSummary,snapshot,type Session,type SessionExercise} from './domain';
const e:SessionExercise={id:'bench',instanceId:'one',name:'Bench press',group:'Chest',kind:'weighted',perHand:false,same:true,skipped:false,sets:[{id:'1',weight:40,reps:10,seconds:0,done:true,warmup:false},{id:'2',weight:40,reps:8,seconds:0,done:false,warmup:false}]};
const session:Session={id:'s1',name:'Chest',date:'2026-10-09',startedAt:1000,pausedMs:2000,status:'complete',endedAt:10000,exercises:[e],warmups:[]};
describe('record integrity',()=>{
it('blocks removed exercises in new sessions without changing historical records',()=>{const archived={...e,custom:true,archived:true};expect(()=>snapshot([{id:'p',exerciseId:'bench',sets:3,reps:10}],[archived],[])).toThrow('removed exercise');expect(updateRecords([],{...session,exercises:[archived]})).toHaveLength(1);});
it('does not overwrite completed sets with a shared weight',()=>{const changed=setSharedWeight(e,45);expect(changed.sets.map(x=>x.weight)).toEqual([40,45]);expect(e.sets[1].weight).toBe(40);});
it('excludes unfinished and warm-up sets from records',()=>{const warm={...session,exercises:[{...e,sets:[{...e.sets[0],warmup:true},{...e.sets[1],weight:100}]}]};expect(updateRecords([],warm)).toHaveLength(0);});
it('retains older records when a later set is lighter',()=>{const previous=updateRecords([],{...session,exercises:[{...e,sets:[{...e.sets[0],weight:45,reps:8}]}]});const records=updateRecords(previous,session);expect(records.some(x=>x.weight===45&&x.reps===8)).toBe(true);});
it('does not replace an achievement date for a tied result',()=>{const old={...session,date:'2026-07-01'};const records=updateRecords(updateRecords([],old),session);expect(records[0].date).toBe('2026-07-01');});
it('compares assisted reps at equal assistance',()=>{const assisted={...e,id:'pullup',kind:'assisted' as const};const records=updateRecords([],{...session,exercises:[assisted]});expect(bestSummary(records,assisted,40)[0]).toContain('Most reps with 40 kg assistance: 10');expect(bestSummary(records,assisted,20)[0]).toContain('No record');});
});
describe('dates and measurements',()=>{
it('uses two calendar months and clamps month end',()=>{expect(cutoffDate(new Date(2026,3,30))).toBe('2026-02-28');expect(cutoffDate(new Date(2026,9,9))).toBe('2026-08-09');expect(cutoffDate(new Date(2026,0,31))).toBe('2025-11-30');});
it('calculates BMI from the paired height and weight',()=>{expect(bmi({id:'m',date:'2026-10-09',height:170,weight:71.8})).toBeCloseTo(24.844,2);});
it('separates explicit pauses from elapsed duration',()=>{expect(durations(session)).toEqual({elapsed:9000,active:7000});expect(durations({...session,status:'active',endedAt:undefined,pausedAt:8000},12000)).toEqual({elapsed:11000,active:5000});});
});
describe('backup validation',()=>{
const backup={version:1,exportedAt:'2026-10-09',profile:[],exercises:[{id:'bench',name:'Bench press',group:'Chest',kind:'weighted',perHand:false}],routines:[],sessions:[session],measurements:[],bests:[],last:[],settings:[]};
it('preserves removed exercise status through backup validation',()=>{const parsed=backupSchema.parse({...backup,exercises:[{...backup.exercises[0],custom:true,archived:true}]});expect(parsed.exercises[0].archived).toBe(true);});
it('accepts genuine pause durations and valid data',()=>{expect(backupSchema.safeParse({...backup,sessions:[{...session,pausedMs:600000}]}).success).toBe(true);});
it('rejects missing routine exercise references',()=>{expect(backupSchema.safeParse({...backup,routines:[{id:'r',name:'Missing',favorite:true,items:[{id:'p',exerciseId:'missing',sets:3,reps:8}]}]}).success).toBe(false);});
it('rejects multiple active sessions',()=>{expect(backupSchema.safeParse({...backup,sessions:[{...session,status:'active'},{...session,id:'s2',status:'active'}]}).success).toBe(false);});
it('rejects invalid measurement dates and nonnumeric weights',()=>{expect(backupSchema.safeParse({...backup,measurements:[{id:'m',date:'2026-02-31',height:170,weight:71}]}).success).toBe(false);expect(backupSchema.safeParse({...backup,measurements:[{id:'m',date:'2026-10-09',height:170,weight:'71'}]}).success).toBe(false);});
});
