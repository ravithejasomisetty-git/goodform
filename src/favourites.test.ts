import {it,expect} from 'vitest';
import {defaultPlans,createDefaultRoutine,upgradeDefaultRoutine,shortenDefaultLegDay} from './favourites';
import {starterExercises} from './catalogue';
it('shortens only the unchanged twelve-exercise Leg Day',()=>{
 const plan=defaultPlans.find(p=>p.name==='Leg Day')!;
 const old={id:'legs',name:'Leg Day',favorite:true,items:plan.groups.flatMap(group=>starterExercises.filter(e=>e.group===group).slice(0,3)).map(e=>({id:'item-'+e.id,exerciseId:e.id,sets:3,reps:10}))};
 const short=shortenDefaultLegDay(old);expect(short.items).toHaveLength(6);expect(short.id).toBe(old.id);
 expect(short.items.every(item=>old.items.some(previous=>previous.id===item.id))).toBe(true);
 expect(shortenDefaultLegDay(short)).toBe(short);
 const edited={...old,items:old.items.map(item=>({...item,sets:2}))};expect(shortenDefaultLegDay(edited)).toBe(edited);
});
it('uses three per upper-body/core group and one or two per Leg Day group',()=>{
 for(const plan of defaultPlans){const routine=createDefaultRoutine(plan);for(const group of plan.groups)expect(routine.items.filter(item=>starterExercises.find(e=>e.id===item.exerciseId)?.group===group)).toHaveLength(plan.name==='Leg Day'?(group==='Quads'||group==='Hamstrings'?2:1):3);}
});
it('upgrades untouched defaults while preserving routine and existing item identities',()=>{
 const old={id:'routine',name:'Chest + Triceps',favorite:true,items:[0,1,9].map(i=>({id:'item-'+i,exerciseId:'exercise-'+i,sets:3,reps:10}))};
 const upgraded=upgradeDefaultRoutine(old);expect(upgraded.id).toBe(old.id);expect(upgraded.items).toHaveLength(6);expect(upgraded.items.find(e=>e.exerciseId==='exercise-9')?.id).toBe('item-9');
 expect(upgradeDefaultRoutine(upgraded)).toBe(upgraded);
 expect(upgradeDefaultRoutine({...old,items:old.items.map(e=>({...e,sets:4}))}).items).toHaveLength(3);
});


