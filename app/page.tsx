'use client';
import {useEffect,useMemo,useState} from 'react';
import {db} from '../lib/db';
import type {User} from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import {options,isCurrentStatus,reportData,nextMonth} from '../lib/attendance';
import type {Person,Mark,ReportType} from '../lib/attendance';
export default function Home(){
 const [user,setUser]=useState<User|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[msg,setMsg]=useState(''),[people,setPeople]=useState<Person[]>([]),[marks,setMarks]=useState<Mark[]>([]),[role,setRole]=useState('viewer'),[month,setMonth]=useState(new Date().toISOString().slice(0,7)),[date,setDate]=useState(new Date().toLocaleDateString('en-CA')),[newName,setNewName]=useState(''),[newPosition,setNewPosition]=useState('');
 const load=async()=>{if(!db)return;const [p,m,r]=await Promise.all([db.from('personnel').select('*').eq('active',true).order('full_name'),db.from('attendance').select('*').gte('work_date',month+'-01').lt('work_date',nextMonth(month)),db.from('profiles').select('role').eq('id',(await db.auth.getUser()).data.user?.id||'').maybeSingle()]);if(p.error||m.error||r.error)setMsg([p.error?.message,m.error?.message,r.error?.message].filter(Boolean).join('; '));setPeople(p.data||[]);setMarks(m.data||[]);setRole(r.data?.role||'viewer')};
 useEffect(()=>{if(!db)return;db.auth.getUser().then(({data})=>setUser(data.user));const {data:{subscription}}=db.auth.onAuthStateChange((_event,s)=>setUser(s?.user||null));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(user)load()},[user,month]);
 useEffect(() => {
  const client = db;
  if (!user || !client) return;

  const channel = client
    .channel('attendance-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance' },
      () => load()
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}, [user, month]);
 const canEdit=['admin','editor'].includes(role);const selected=useMemo(()=>new Map(marks.filter(m=>m.work_date===date).map(m=>[m.person_id,m])),[marks,date]);
 async function login(e:React.FormEvent){e.preventDefault();if(!db)return;const {error}=await db.auth.signInWithPassword({email,password});setMsg(error?.message||'Đã đăng nhập');}
 async function update(person_id:string,status:string){if(!db||!canEdit||!isCurrentStatus(status))return;const existing=selected.get(person_id);const {error}=await db.from('attendance').upsert({person_id,work_date:date,status,hours:status==='TTKS'?8:0,note:existing?.note||'',updated_by:user?.id},{onConflict:'person_id,work_date'});setMsg(error?.message||'Đã lưu');await load()}
 async function addPerson(){if(!db||role!=='admin'||!newName.trim())return;const {error}=await db.from('personnel').insert({full_name:newName.trim(),position:newPosition.trim()});setMsg(error?.message||'Đã thêm cán bộ');if(!error){setNewName('');setNewPosition('');await load()}}
 function exportReport(type:ReportType){
  const {header,rows}=reportData(type,month,people,marks);
  const title=type==='daily'?'BẢNG CHẤM CÔNG LÀM NGÀY':type==='allowance'?'BẢNG CHẤM CÔNG TIỀN ĂN ĐỊNH LƯỢNG':'DANH SÁCH THỦ TỤC TIỀN ĂN T9';
  const ws=XLSX.utils.aoa_to_sheet([['TRẠM CSGT PHÚ QUỐC'],[title+' - '+month],[],header,...rows]);
  ws['!cols']=[{wch:7},{wch:28},{wch:20},...Array.from({length:header.length-3},()=>({wch:12}))];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Báo cáo');
  const catalog=XLSX.utils.aoa_to_sheet([
   ['DANH MỤC CHẤM CÔNG'],['Mã','Trạng thái','Ký hiệu bảng ngày','Tính ngày làm việc'],
   ...options.map(([code,label])=>[code,label,code==='TTKS'?'X':code==='XLVPHC'?'':code,code==='TTKS'?1:0]),
   [],['Chỉ TTKS được tính định lượng; từ 4 giờ: X, trên 0 đến dưới 4 giờ: 1/2.'],
   ['Mã cũ LV, TB, K giữ nguyên dữ liệu, không tự quy đổi thành TTKS.'],
  ]);catalog['!cols']=[{wch:16},{wch:28},{wch:24},{wch:24}];
  XLSX.utils.book_append_sheet(wb,catalog,'Danh mục chấm công');
  XLSX.writeFile(wb,`cham-cong-${type}-${month}.xlsx`);
 }
 if(!db)return <main><h1>Chấm công Trạm CSGT Phú Quốc</h1><p>Chưa cấu hình Supabase. Xem README.md và thiết lập biến môi trường.</p></main>;
 if(!user)return <main className="login"><h1>TRẠM CSGT PHÚ QUỐC</h1><h2>Đăng nhập chấm công</h2><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Mật khẩu<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button>Đăng nhập</button></form><p>{msg}</p></main>;
 return <main><header><div><h1>CHẤM CÔNG TRẠM CSGT PHÚ QUỐC</h1><small>{user.email} · Vai trò: {role}</small></div><button onClick={()=>db?.auth.signOut()}>Đăng xuất</button></header><section className="toolbar"><label>Tháng <input type="month" value={month} onChange={e=>{setMonth(e.target.value);setDate(e.target.value+'-01')}}/></label><label>Ngày <input type="date" value={date} min={month+'-01'} max={month+'-'+new Date(+month.slice(0,4),+month.slice(5,7),0).getDate()} onChange={e=>setDate(e.target.value)}/></label><button onClick={()=>load()}>Làm mới</button></section><p className="notice">{msg||'Dữ liệu đồng bộ qua cơ sở dữ liệu. Chỉ người được phân quyền mới có thể sửa.'}</p><div className="tablewrap"><table><thead><tr><th>STT</th><th>Họ tên</th><th>Chức vụ</th><th>Trạng thái ngày {date}</th></tr></thead><tbody>{people.map((p,i)=><tr key={p.id}><td>{i+1}</td><td>{p.full_name}</td><td>{p.position}</td><td><select disabled={!canEdit} value={selected.get(p.id)?.status||''} onChange={e=>update(p.id,e.target.value)}><option value="" disabled>Chưa chấm</option>{selected.get(p.id)&&!isCurrentStatus(selected.get(p.id)!.status)&&<option value={selected.get(p.id)!.status} disabled>{selected.get(p.id)!.status} (dữ liệu cũ)</option>}{options.map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></td></tr>)}</tbody></table></div><section><h2>Danh mục chấm công</h2><p>Chỉ Làm việc TTKS tính ngày làm việc và định lượng. XLVPHC để trống trong các ô ngày của bảng chấm công ngày.</p><div className="tablewrap"><table><thead><tr><th>Mã</th><th>Trạng thái</th><th>Ký hiệu bảng ngày</th><th>Ngày làm việc</th></tr></thead><tbody>{options.map(([code,label])=><tr key={code}><td>{code}</td><td>{label}</td><td>{code==='TTKS'?'X':code==='XLVPHC'?'Để trống':code}</td><td>{code==='TTKS'?1:0}</td></tr>)}</tbody></table></div><p>Mã cũ LV, TB, K được giữ nguyên và không tự tính thành TTKS.</p></section><h2>Xuất báo cáo tháng</h2><div className="buttons"><button onClick={()=>exportReport('daily')}>Chấm công ngày</button><button onClick={()=>exportReport('allowance')}>Tiền ăn định lượng</button><button onClick={()=>exportReport('t9')}>Thủ tục tiền ăn T9</button></div><p className="notice">Bản mẫu kỹ thuật: các bảng xuất chưa tái tạo chính xác định dạng, công thức và điều kiện hưởng theo mẫu gốc; cần đối chiếu, phê duyệt trước khi sử dụng chính thức.</p>{role==='admin'&&<section><h2>Thêm cán bộ</h2><div className="buttons"><input placeholder="Họ và tên" value={newName} onChange={e=>setNewName(e.target.value)}/><input placeholder="Chức vụ" value={newPosition} onChange={e=>setNewPosition(e.target.value)}/><button onClick={addPerson}>Thêm</button></div></section>}</main>;
}
