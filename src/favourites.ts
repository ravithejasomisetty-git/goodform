import {type Routine,uid} from './domain';
import {starterExercises} from './catalogue';
export const defaultPlans=[
 {name:'Chest + Triceps',groups:['Chest','Triceps'],legacy:[0,1,9]},
 {name:'Back + Biceps',groups:['Back','Biceps'],legacy:[3,4,7]},
 {name:'Leg Day',groups:['Quads','Hamstrings','Glutes','Calves'],legacy:[11,13,17]},
 {name:'Core / Abs',groups:['Core / Abs'],legacy:[18,19]},
 {name:'Shoulders',groups:['Shoulders'],legacy:[]}
];
export function createDefaultRoutine(plan:typeof defaultPlans[number]):Routine{
 const exercises=plan.groups.flatMap(group=>starterExercises.filter(e=>e.group===group).slice(0,plan.name==='Leg Day'?(group==='Quads'||group==='Hamstrings'?2:1):3));
 return {id:uid(),name:plan.name,favorite:true,items:exercises.map(e=>({id:uid(),exerciseId:e.id,sets:3,reps:e.kind==='timed'?30:10}))};
}
export function shortenDefaultLegDay(routine:Routine):Routine{
 if(routine.name!=='Leg Day'||!routine.favorite||routine.warmups?.length)return routine;
 const plan=defaultPlans.find(p=>p.name==='Leg Day')!;
 const previous=plan.groups.flatMap(group=>starterExercises.filter(e=>e.group===group).slice(0,3));
 if(routine.items.length!==previous.length||!routine.items.every((item,i)=>item.exerciseId===previous[i].id&&item.sets===3&&item.reps===10))return routine;
 const next=createDefaultRoutine(plan);
 return {...routine,items:next.items.map(item=>routine.items.find(old=>old.exerciseId===item.exerciseId)??item)};
}
export function upgradeDefaultRoutine(routine:Routine):Routine{
 const plan=defaultPlans.find(p=>p.name===routine.name&&p.legacy.length);
 if(!plan||routine.warmups?.length||!routine.favorite||routine.items.length!==plan.legacy.length||
 !routine.items.every((item,i)=>item.exerciseId==='exercise-'+plan.legacy[i]&&item.sets===3&&item.reps===10))return routine;
 const expanded=createDefaultRoutine(plan);
 return {...routine,items:expanded.items.map(item=>routine.items.find(old=>old.exerciseId===item.exerciseId)??item)};
}
