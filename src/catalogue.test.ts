import {describe,it,expect} from 'vitest';
import {groups,type Exercise} from './domain';
import {starterExercises,missingCatalogueExercises} from './catalogue';
describe('exercise catalogue',()=>{
 it('offers six distinct exercises in every muscle group',()=>{
  for(const group of groups){const names=starterExercises.filter(e=>e.group===group).map(e=>e.name);expect(new Set(names).size).toBeGreaterThanOrEqual(6);}
  expect(new Set(starterExercises.map(e=>e.id)).size).toBe(starterExercises.length);
 });
 it('preserves legacy identities and adds missing entries without replacing custom data',()=>{
  const legacy=starterExercises.slice(0,22);
  expect(legacy[0]).toMatchObject({id:'exercise-0',name:'Bench press'});
  expect(legacy[21]).toMatchObject({id:'exercise-21',name:'Assisted pull-up'});
  const custom:Exercise={id:'mine',name:'My press',group:'Chest',kind:'weighted',perHand:false,custom:true};
  const existing=[...legacy,custom];const before=structuredClone(existing);
  const additions=missingCatalogueExercises(existing);
  expect(additions).toHaveLength(38);expect(existing).toEqual(before);
  expect(missingCatalogueExercises([...existing,...additions])).toEqual([]);
 });
});
