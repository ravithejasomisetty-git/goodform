import {type Exercise} from './domain';

// Keep the original IDs and labels stable: saved routines and records reference them.
const original: [string,string,Exercise['kind']][] = [
 ['Bench press','Chest','weighted'],['Incline dumbbell press','Chest','weighted'],['Chest press machine','Chest','weighted'],
 ['Seated row','Back','weighted'],['Lat pulldown','Back','weighted'],['Shoulder press','Shoulders','weighted'],['Lateral raise','Shoulders','weighted'],
 ['Bicep curl','Biceps','weighted'],['Hammer curl','Biceps','weighted'],['Tricep pushdown','Triceps','weighted'],['Overhead extension','Triceps','weighted'],
 ['Squat','Quads','weighted'],['Leg press','Quads','weighted'],['Leg curl','Hamstrings','weighted'],['Romanian deadlift','Hamstrings','weighted'],
 ['Hip thrust','Glutes','weighted'],['Glute bridge','Glutes','bodyweight'],['Calf raise','Calves','weighted'],['Plank','Core / Abs','timed'],
 ['Crunch','Core / Abs','bodyweight'],['Push-up','Chest','bodyweight'],['Assisted pull-up','Back','assisted']
];
const additions: [string,string,Exercise['kind'],boolean?][] = [
 ['Dumbbell fly','Chest','weighted',true],['Cable fly','Chest','weighted',true],
 ['Bent-over barbell row','Back','weighted'],['One-arm dumbbell row','Back','weighted',true],['Chest-supported row','Back','weighted',true],
 ['Barbell overhead press','Shoulders','weighted'],['Reverse pec-deck fly','Shoulders','weighted'],['Cable face pull','Shoulders','weighted'],['Arnold press','Shoulders','weighted',true],
 ['Barbell curl','Biceps','weighted'],['Preacher curl','Biceps','weighted'],['Incline dumbbell curl','Biceps','weighted',true],['Cable curl','Biceps','weighted'],
 ['Straight-bar pushdown','Triceps','weighted'],['Cable overhead extension','Triceps','weighted'],['Skull crusher','Triceps','weighted'],['Close-grip bench press','Triceps','weighted'],
 ['Front squat','Quads','weighted'],['Leg extension','Quads','weighted'],['Hack squat','Quads','weighted'],['Bulgarian split squat','Quads','weighted',true],
 ['Seated leg curl','Hamstrings','weighted'],['Standing single-leg curl','Hamstrings','weighted'],['Dumbbell Romanian deadlift','Hamstrings','weighted',true],['Stability-ball leg curl','Hamstrings','bodyweight'],
 ['Cable kickback','Glutes','weighted'],['Hip abduction machine','Glutes','weighted'],['Step-up','Glutes','weighted',true],['Reverse lunge','Glutes','weighted',true],
 ['Seated calf raise','Calves','weighted'],['Leg-press calf raise','Calves','weighted'],['Single-leg calf raise','Calves','bodyweight'],['Smith-machine calf raise','Calves','weighted'],['Donkey calf raise','Calves','weighted'],
 ['Side plank','Core / Abs','timed'],['Cable crunch','Core / Abs','weighted'],['Hanging knee raise','Core / Abs','bodyweight'],['Reverse crunch','Core / Abs','bodyweight']
];
export const starterExercises:Exercise[] = [
 ...original.map(([name,group,kind],i)=>({id:'exercise-'+i,name,group,kind,perHand:['Incline dumbbell press','Lateral raise','Bicep curl','Hammer curl'].includes(name)})),
 ...additions.map(([name,group,kind,perHand=false])=>({id:'catalogue-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,group,kind,perHand}))
];
export function missingCatalogueExercises(existing:Exercise[]):Exercise[]{
 const ids=new Set(existing.map(e=>e.id));
 return starterExercises.filter(e=>!ids.has(e.id));
}
