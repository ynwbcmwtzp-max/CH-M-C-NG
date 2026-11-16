export const options: readonly (readonly [string, string])[] = [
  ['TTKS', 'Làm việc TTKS'], ['XLVPHC', 'Làm việc XLVPHC'],
  ['CT', 'Công tác'], ['H', 'Học'], ['P', 'Phép'], ['TS', 'Thai sản'],
  ['N', 'Nghỉ T7, CN'], ['NB', 'Nghỉ bù'], ['BENH', 'Nghỉ bệnh'],
  ['TH', 'Tập huấn'], ['NL', 'Nghỉ lễ'],
];
export type Person = {id:string; full_name:string; position:string; active:boolean};
export type Mark = {id:string; person_id:string; work_date:string; status:string; hours:number; note:string};
export type ReportType = 'daily' | 'allowance' | 't9';
export const isCurrentStatus = (status:string) => options.some(([code]) => code === status);
export function dailySymbol(mark?: Mark): string {
  if (!mark || mark.status === 'XLVPHC') return '';
  return mark.status === 'TTKS' ? 'X' : mark.status;
}
export function allowanceSymbol(mark?: Mark): string {
  if (mark?.status !== 'TTKS') return '';
  return mark.hours >= 4 ? 'X' : mark.hours > 0 ? '1/2' : '';
}
export function nextMonth(month:string): string {
  const [year, value] = month.split('-').map(Number);
  return `${value === 12 ? year + 1 : year}-${String(value === 12 ? 1 : value + 1).padStart(2, '0')}-01`;
}
export function reportData(type:ReportType, month:string, people:Person[], marks:Mark[]) {
  const days = new Date(+month.slice(0,4), +month.slice(5,7), 0).getDate();
  const lookup = new Map(marks.map(mark => [mark.person_id + '|' + mark.work_date, mark]));
  const dayHeaders = Array.from({length:days}, (_, i) => i + 1);
  const tail = type === 'daily' ? options.map(([,label]) => label)
    : type === 'allowance' ? ['Từ 04 giờ/ngày trở lên', 'Dưới 04 giờ/ngày'] : ['Số ngày', 'Mức hưởng'];
  const header = ['STT', 'Họ và tên', 'Chức vụ', ...(type === 't9' ? ['Công việc'] : []), ...dayHeaders, ...tail];
  const rows = people.map((person, i) => {
    const ds = dayHeaders.map(day => lookup.get(`${person.id}|${month}-${String(day).padStart(2,'0')}`));
    const prefix = [i + 1, person.full_name, person.position];
    if (type === 'daily') return [...prefix, ...ds.map(dailySymbol), ...options.map(([code]) => ds.filter(m => m?.status === code).length)];
    if (type === 'allowance') {
      const symbols = ds.map(allowanceSymbol);
      return [...prefix, ...symbols, symbols.filter(s => s === 'X').length, symbols.filter(s => s === '1/2').length];
    }
    return [...prefix, '', ...ds.map(m => m?.status === 'TTKS' ? 'X' : ''), ds.filter(m => m?.status === 'TTKS').length, ''];
  });
  return {header, rows};
}
