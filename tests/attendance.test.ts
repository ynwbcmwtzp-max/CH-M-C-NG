import assert from 'node:assert/strict';
import {options, dailySymbol, allowanceSymbol, nextMonth, reportData} from '../lib/attendance.ts';
import type {Mark} from '../lib/attendance.ts';
const mark = (status:string, day=1, hours=8):Mark => ({id:String(day),person_id:'test',work_date:`2026-11-${String(day).padStart(2,'0')}`,status,hours,note:'kept'});
assert.equal(options.length,11);
for (const [code] of options) {
  assert.equal(dailySymbol(mark(code)),code==='TTKS'?'X':code==='XLVPHC'?'':code);
  assert.equal(allowanceSymbol(mark(code)),code==='TTKS'?'X':'');
}
for (const code of ['LV','TB','K']) assert.equal(allowanceSymbol(mark(code)),'');
for (const [hours,symbol] of [[0,''],[0.5,'1/2'],[3.9,'1/2'],[4,'X'],[8,'X']] as const) assert.equal(allowanceSymbol(mark('TTKS',1,hours)),symbol);
assert.equal(nextMonth('2026-11'),'2026-12-01');
assert.equal(nextMonth('2026-12'),'2027-01-01');
const people=[{id:'test',full_name:'Test',position:'',active:true}];
const marks=[mark('TTKS',1),mark('XLVPHC',2),mark('CT',3),mark('LV',4),mark('TTKS',30,2)];
const before=JSON.stringify(marks);
const daily=reportData('daily','2026-11',people,marks);
assert.equal(daily.rows[0][3],'X');assert.equal(daily.rows[0][4],'');
assert.equal(daily.rows[0][33],2); // TTKS count, not CT/LV/XLVPHC
const allowance=reportData('allowance','2026-11',people,marks);
assert.deepEqual(allowance.rows[0].slice(-2),[1,1]);
const t9=reportData('t9','2026-11',people,marks);
assert.equal(t9.rows[0].at(-2),2);assert.equal(t9.rows[0][5],'');
for (const type of ['daily','allowance','t9'] as const) {
 for (const month of ['2026-02','2028-02','2026-11','2026-12']) {
  const report=reportData(type,month,people,marks);
  assert.equal(report.rows[0].length,report.header.length);
 }
}
assert.equal(JSON.stringify(marks),before);
console.log('Attendance rules passed: 11 statuses, legacy data, hour boundaries, three reports, month boundaries.');
// Round-trip through the actual XLSX writer/reader used by the app.
const XLSX = await import('xlsx');
for (const type of ['daily','allowance','t9'] as const) {
  const {header,rows}=reportData(type,'2026-11',people,marks);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([header,...rows]),'Report');
  const reopened=XLSX.read(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}),{type:'buffer'});
  const data=XLSX.utils.sheet_to_json(reopened.Sheets.Report,{header:1,defval:''});
  assert.deepEqual(data,[header,...rows]);
}
console.log('All three XLSX reports round-trip without changed cells.');
