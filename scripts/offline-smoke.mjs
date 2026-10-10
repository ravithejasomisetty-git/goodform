import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
try {
const context=await browser.newContext();const page=await context.newPage();
page.on('pageerror',e=>console.error(e.message));
page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url(),r.failure()));
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
console.log('Opening production app');
await page.goto(process.env.APP_URL||'http://127.0.0.1:4173/');
await page.getByRole('heading',{name:'Ready when you are.'}).waitFor();
console.log('Waiting for offline cache');
await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),{},{timeout:20000});
await page.locator('.routine-card').filter({hasText:'Chest + Triceps'}).click();
await page.getByRole('button',{name:"Review today's plan"}).click();
await page.getByRole('button',{name:'Start workout',exact:true}).click();
await page.getByLabel('Set 1 weight',{exact:true}).fill('42');
await page.getByRole('button',{name:'Complete set 1',exact:true}).click();
await page.waitForTimeout(800);
await context.setOffline(true);await page.reload();
await page.getByRole('button',{name:'Resume workout',exact:true}).click();
assert.equal(await page.getByLabel('Set 1 weight',{exact:true}).inputValue(),'42');
await page.getByLabel('Set 2 weight',{exact:true}).fill('44');
await page.waitForTimeout(800);await page.reload();
await page.getByRole('button',{name:'Resume workout',exact:true}).click();
assert.equal(await page.getByLabel('Set 2 weight',{exact:true}).inputValue(),'44');
console.log('PASS production offline reload, saved workout recovery and offline edits');
} finally {await browser.close();}

