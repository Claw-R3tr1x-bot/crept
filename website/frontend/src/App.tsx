import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiFetch } from './lib/api';

type User = { id: number; username: string; email: string; role: 'admin' | 'user' };

function Layout({ children, user, setUser }: { children: any; user: User | null; setUser: (u: User | null) => void }) {
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
          <Link to="/" className="font-black text-xl">Crept</Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/">Home</Link><Link to="/docs">Docs</Link><Link to="/forms">Forms</Link><Link to="/purchase">Purchase</Link>
            {user ? <>
              <Link to="/dashboard" className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700">{user.username}</Link>
              <button onClick={async () => { await apiFetch('/auth/logout', { method: 'POST' }); setUser(null); }} className="px-2 py-1 rounded bg-rose-600 text-white">Logout</button>
            </> : <>
              <Link to="/login" className="px-2 py-1 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-black">Login</Link>
              <Link to="/signup" className="px-2 py-1 rounded bg-indigo-600 text-white">Signup</Link>
            </>}
            <button onClick={() => setDark(!dark)} className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">{dark ? '☀️' : '🌙'}</button>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 dark:border-slate-700 py-6 text-center text-sm">
        <div className="flex justify-center gap-4"><Link to="/docs">Docs</Link><Link to="/forms">Forms</Link><a href="#">Discord</a><a href="#">Terms</a><a href="#">Privacy</a></div>
      </footer>
    </div>
  );
}

function Home() {
  return <div className="space-y-8">
    <section className="rounded-2xl p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white"><h1 className="text-4xl font-black">Crept</h1><p className="mt-2">Secure licensing, support, documentation, and operations in one platform.</p><Link to="/signup" className="inline-block mt-4 px-4 py-2 bg-white text-indigo-700 rounded">Get Started</Link></section>
    <section className="grid md:grid-cols-4 gap-4">{['Secure','Fast','Modular','Supported'].map(x => <div key={x} className="p-4 rounded-lg border"><h3 className="font-bold">{x}</h3><p className="text-sm">Production-grade workflows and UI.</p></div>)}</section>
    <section className="grid md:grid-cols-3 gap-4"><div className="p-4 border rounded">"Best dashboard we used this year"</div><div className="p-4 border rounded">"Support tickets are finally organized"</div><div className="p-4 border rounded">"Launch-ready in days"</div></section>
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">{['2,340 Users','99.98% Uptime','v1.0.0','24/7 Monitoring'].map(s => <div key={s} className="p-3 rounded bg-slate-100 dark:bg-slate-800">{s}</div>)}</section>
  </div>
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('admin@crept.com'); const [password, setPassword] = useState('Admin1234!'); const [rememberMe, setRememberMe] = useState(true); const [error, setError] = useState('');
  return <form className="max-w-md space-y-3" onSubmit={async e => { e.preventDefault(); setError(''); try { const r = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, rememberMe }) }); onLogin(r.user); } catch (err:any) { setError(err.message); } }}>
    <h2 className="text-2xl font-bold">Login</h2>
    <input className="w-full p-2 border rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
    <input className="w-full p-2 border rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
    <label className="text-sm flex gap-2"><input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} />Remember me</label>
    <Link to="/forgot-password" className="text-sm underline">Forgot password?</Link>
    {error && <p className="text-rose-600 text-sm">{error}</p>}
    <button className="px-3 py-2 rounded bg-indigo-600 text-white">Sign In</button>
    <p className="text-sm">No account? <Link to="/signup" className="underline">Create one</Link></p>
  </form>
}

function Signup({ onLogin }: { onLogin: (u: User) => void }) {
  const [f, setF] = useState({ username: '', email: '', password: '', confirm: '', terms: false });
  const [error, setError] = useState('');
  const strength = useMemo(() => (f.password.length >= 12 ? 'Strong' : f.password.length >= 8 ? 'Medium' : 'Weak'), [f.password]);
  return <form className="max-w-md space-y-3" onSubmit={async e => { e.preventDefault(); setError(''); if (f.password !== f.confirm) return setError('Passwords do not match'); if (!f.terms) return setError('You must accept terms'); try { const r = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username: f.username, email: f.email, password: f.password }) }); onLogin(r.user); } catch (err:any) { setError(err.message); } }}>
    <h2 className="text-2xl font-bold">Signup</h2>
    <input className="w-full p-2 border rounded" placeholder="Username" value={f.username} onChange={e=>setF({...f, username:e.target.value})} />
    <input className="w-full p-2 border rounded" placeholder="Email" value={f.email} onChange={e=>setF({...f, email:e.target.value})} />
    <input className="w-full p-2 border rounded" placeholder="Password" type="password" value={f.password} onChange={e=>setF({...f, password:e.target.value})} />
    <div className="text-xs">Password strength: <span className="font-bold">{strength}</span></div>
    <input className="w-full p-2 border rounded" placeholder="Confirm Password" type="password" value={f.confirm} onChange={e=>setF({...f, confirm:e.target.value})} />
    <label className="text-sm flex gap-2"><input type="checkbox" checked={f.terms} onChange={e=>setF({...f, terms:e.target.checked})}/>I accept Terms of Service</label>
    {error && <p className="text-rose-600 text-sm">{error}</p>}
    <button className="px-3 py-2 rounded bg-indigo-600 text-white">Create Account</button>
  </form>
}

function Dashboard() {
  const [data, setData] = useState<any>(null); const [show, setShow] = useState(false); const [now, setNow] = useState(Date.now());
  useEffect(() => { apiFetch('/hwid/mine').then(setData).catch(()=>{}); const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);
  if (!data?.license) return <p>No license data.</p>;
  const exp = new Date(data.license.expiry_date).getTime();
  const rem = Math.max(0, exp - now); const d = Math.floor(rem/86400000), h=Math.floor((rem%86400000)/3600000), m=Math.floor((rem%3600000)/60000);
  return <div className="space-y-4">
    <h2 className="text-2xl font-bold">Purchase Dashboard</h2>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 border rounded space-y-2">
        <p><b>Product/Tier:</b> Crept {data.license.plan}</p>
        <p><b>License Key:</b> <button className="underline" onClick={()=>setShow(!show)}>{show ? data.license.license_key : '•••••••••••••••••••'}</button></p>
        <p><b>Status:</b> <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">{data.license.status}</span></p>
        <p><b>Time Remaining:</b> {d}d {h}h {m}m</p>
        <p><b>Expiry Date:</b> {new Date(data.license.expiry_date).toLocaleString()}</p>
        <p><b>HWID:</b> {String(data.license.hwid || 'Unbound').replace(/.(?=.{4})/g, '*')}</p>
        <button className="px-3 py-2 rounded bg-amber-600 text-white" onClick={async()=>{await apiFetch('/hwid/reset-request',{method:'POST', body: JSON.stringify({reason:'User requested reset'})}); alert('Request submitted')}}>HWID Reset Request</button>
        <a className="inline-block px-3 py-2 rounded bg-indigo-600 text-white" href="https://example.com/releases/latest">Download</a>
      </div>
      <div className="p-4 border rounded">
        <h3 className="font-bold">Reset History</h3>
        <ul className="text-sm list-disc pl-5">{(data.resets || []).map((r:any)=> <li key={r.id}>{new Date(r.reset_at).toLocaleString()}</li>)}</ul>
        <h3 className="font-bold mt-3">Invoice History</h3>
        <table className="w-full text-sm"><thead><tr><th>Date</th><th>Amount</th><th>Plan</th><th>Status</th></tr></thead><tbody><tr><td>{new Date().toLocaleDateString()}</td><td>$39</td><td>{data.license.plan}</td><td>Paid</td></tr></tbody></table>
        <h3 className="font-bold mt-3">Referral</h3><p>Code: CRPTREFUSER</p><p>Share: https://crept.example.com?r=CRPTREFUSER</p>
        <Link className="underline" to="/settings">Account settings</Link>
      </div>
    </div>
  </div>
}

function Purchase() {
  const [yearly, setYearly] = useState(false);
  const plans = [
    {name:'Basic', m:19, y:190, features:['Core license','Email support','Docs access'], url: import.meta.env.VITE_CHECKOUT_BASIC_URL || '#'},
    {name:'Pro', m:39, y:390, features:['Priority support','Advanced modules','Status alerts'], url: import.meta.env.VITE_CHECKOUT_PRO_URL || '#'},
    {name:'Elite', m:79, y:790, features:['All features','Admin tooling','SLA support'], url: import.meta.env.VITE_CHECKOUT_ELITE_URL || '#'}
  ];
  return <div className="space-y-4"><h2 className="text-2xl font-bold">Pricing</h2><label className="flex gap-2 items-center"><input type="checkbox" checked={yearly} onChange={e=>setYearly(e.target.checked)} />Yearly billing <span className="text-xs bg-emerald-100 text-emerald-700 px-2 rounded">Save 16%</span></label><div className="grid md:grid-cols-3 gap-4">{plans.map(p=> <div key={p.name} className="border rounded p-4"><h3 className="font-bold text-xl">{p.name}</h3><p className="text-2xl">${yearly ? p.y : p.m}<span className="text-sm">/{yearly?'yr':'mo'}</span></p><ul className="text-sm list-disc pl-5">{p.features.map(f=> <li key={f}>✅ {f}</li>)}</ul><a className="inline-block mt-3 px-3 py-2 rounded bg-indigo-600 text-white" href={p.url}>Buy Now</a></div>)}</div><div><h3 className="font-bold">FAQ</h3><details><summary>Can I upgrade later?</summary><p>Yes, prorated upgrades are supported.</p></details><details><summary>Is there a refund policy?</summary><p>30-day money-back guarantee.</p></details></div><div className="p-3 rounded bg-emerald-100 text-emerald-700">30-day money-back guarantee</div><div className="text-sm">Payments: Visa · Mastercard · PayPal (placeholder)</div></div>
}

function Forms() {
  const [tab, setTab] = useState('Help'); const tabs=['Help','Announcements','Servers','Random','Account'];
  const [tickets,setTickets]=useState<any[]>([]); const [anns,setAnns]=useState<any[]>([]); const [status,setStatus]=useState<any>(null);
  useEffect(()=>{ apiFetch('/tickets').then(r=>setTickets(r.tickets||[])).catch(()=>{}); apiFetch('/announcements').then(r=>setAnns(r.announcements||[])).catch(()=>{}); apiFetch('/status').then(setStatus).catch(()=>{}); },[]);
  return <div className="space-y-4"><h2 className="text-2xl font-bold">Forms</h2><div className="flex gap-2 flex-wrap">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 rounded ${tab===t?'bg-indigo-600 text-white':'bg-slate-200 dark:bg-slate-700'}`}>{t}</button>)}</div>
  {tab==='Help' && <div className="grid md:grid-cols-2 gap-4"><form className="space-y-2 border rounded p-4" onSubmit={async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); const file=fd.get('file') as File; if (file && file.size>5*1024*1024) return alert('Max 5MB'); await apiFetch('/tickets',{method:'POST',body:JSON.stringify({subject:fd.get('subject'),category:fd.get('category'),priority:fd.get('priority'),description:fd.get('description')})}); alert('Ticket sent');}}><h3 className="font-bold">Submit Ticket</h3><input name="subject" className="w-full p-2 border rounded" placeholder="Subject"/><select name="category" className="w-full p-2 border rounded"><option>Technical</option><option>Billing</option><option>Account</option><option>Other</option></select><textarea name="description" className="w-full p-2 border rounded" placeholder="Description"/><select name="priority" className="w-full p-2 border rounded"><option>Low</option><option>Medium</option><option>High</option></select><input name="file" type="file" accept="image/*" className="w-full"/><button className="px-3 py-2 rounded bg-indigo-600 text-white">Submit</button></form><div className="border rounded p-4"><h3 className="font-bold">My Open Tickets</h3><table className="w-full text-sm"><thead><tr><th>ID</th><th>Subject</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>{tickets.slice(0,10).map(t=><tr key={t.id}><td>{t.id}</td><td>{t.subject}</td><td>{t.status}</td><td>{new Date(t.created_at).toLocaleDateString()}</td><td><button className="underline" onClick={async()=>{const d=await apiFetch(`/tickets/${t.id}`); alert(d.messages.map((m:any)=>m.body).join('\n'));}}>View</button></td></tr>)}</tbody></table></div></div>}
  {tab==='Announcements' && <div className="space-y-2">{anns.map(a=><article key={a.id} className="border rounded p-4"><h3 className="font-bold">{a.title} {a.pinned ? '📌' : ''}</h3><p className="text-xs">{a.category} • {new Date(a.published_at).toLocaleDateString()}</p><p>{a.body}</p></article>)}</div>}
  {tab==='Servers' && <div><h3 className="font-bold">Service Board</h3><ul>{(status?.statuses||[]).map((s:any)=><li key={s.id}>{s.service_name}: {s.status} • Uptime 99.{70+s.id}%</li>)}</ul><h3 className="font-bold mt-3">Incidents</h3>{(status?.incidents||[]).map((i:any)=><details key={i.id}><summary>{i.title}</summary><p>{i.description}</p><p>{i.resolution || 'Pending'}</p></details>)}<form className="mt-3" onSubmit={e=>{e.preventDefault(); alert('Subscribed')}}><input className="p-2 border rounded" placeholder="Email for updates"/><button className="ml-2 px-3 py-2 rounded bg-indigo-600 text-white">Subscribe</button></form></div>}
  {tab==='Random' && <div className="grid md:grid-cols-2 gap-4"><div className="border rounded p-4"><h3 className="font-bold">Community Polls</h3><p>Should we prioritize API v2 docs?</p><div className="flex gap-2"><button className="px-2 py-1 rounded bg-slate-200">Yes</button><button className="px-2 py-1 rounded bg-slate-200">No</button></div><div className="mt-2 h-2 bg-slate-200 rounded"><div className="h-2 bg-indigo-600 rounded" style={{width:'72%'}}/></div></div><div className="border rounded p-4"><h3 className="font-bold">Fun Stats</h3><p>Total licenses: 12,481</p><p>Requests today: 4,992</p><h4 className="font-semibold mt-2">Changelog</h4><ul className="list-disc pl-5 text-sm"><li>1.0.4: Ticket workflow improvements</li><li>1.0.3: New pricing cards</li><li>1.0.2: Incident feed added</li><li>1.0.1: Dark mode</li><li>1.0.0: Launch</li></ul><p className="mt-2">Community: <a className="underline" href="#">Join Discord</a></p></div></div>}
  {tab==='Account' && <Settings />}
  </div>
}

function Settings() {
  return <div className="space-y-4"><h2 className="text-2xl font-bold">Account Settings</h2><form className="grid md:grid-cols-2 gap-3" onSubmit={e=>e.preventDefault()}><input className="p-2 border rounded" placeholder="New username"/><button className="px-3 py-2 bg-indigo-600 text-white rounded">Change Username</button><input className="p-2 border rounded" placeholder="New email"/><input className="p-2 border rounded" placeholder="Current password" type="password"/><button className="px-3 py-2 bg-indigo-600 text-white rounded">Change Email</button><input className="p-2 border rounded" placeholder="Current password" type="password"/><input className="p-2 border rounded" placeholder="New password" type="password"/><input className="p-2 border rounded" placeholder="Confirm password" type="password"/><button className="px-3 py-2 bg-indigo-600 text-white rounded">Change Password</button></form><div className="border rounded p-4"><h3 className="font-bold">Two-Factor Authentication</h3><p>Toggle and QR provisioning area.</p><div className="w-40 h-40 bg-slate-200 dark:bg-slate-700 rounded" /></div><div className="space-y-1"><label className="block"><input type="checkbox"/> Email on expiry</label><label className="block"><input type="checkbox"/> Email on HWID reset</label><label className="block"><input type="checkbox"/> Announcements</label></div><div className="border border-rose-400 rounded p-4"><h3 className="font-bold text-rose-600">Danger Zone</h3><button className="px-3 py-2 bg-rose-600 text-white rounded" onClick={()=>confirm('Delete account?') && alert('Deletion requested')}>Delete Account</button></div></div>
}

function Docs() {
  const [md, setMd] = useState('# Loading...'); const sections = ['introduction','how-to-download','how-to-run','system-requirements','faq','changelog','troubleshooting','config-reference'];
  const [active, setActive] = useState(sections[0]);
  useEffect(()=>{ fetch(`/../../docs/${active}.md`).then(r=>r.text()).then(setMd).catch(()=>setMd('# Docs unavailable')); }, [active]);
  return <div className="grid md:grid-cols-[260px_1fr] gap-4"><aside className="border rounded p-3"><h3 className="font-bold">Docs</h3>{sections.map(s=><button key={s} onClick={()=>setActive(s)} className="block text-left underline">{s}</button>)}</aside><article className="prose dark:prose-invert max-w-none border rounded p-4"><ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown></article></div>
}

const wikiArticles = [
  { slug:'setup/getting-started-guide', title:'Getting Started Guide', category:'Setup', author:'Crept Team', updated:'2026-04-05' },
  { slug:'tips/best-practices', title:'Best Practices', category:'Tips & Tricks', author:'Crept Team', updated:'2026-04-05' },
  { slug:'advanced/api-integration', title:'API Integration', category:'Advanced', author:'Crept Team', updated:'2026-04-05' },
];

function WikiHome() {
  const [q,setQ]=useState('');
  const items = wikiArticles.filter(a=>a.title.toLowerCase().includes(q.toLowerCase())||a.category.toLowerCase().includes(q.toLowerCase()));
  return <div className="space-y-4"><h2 className="text-2xl font-bold">Wiki</h2><input className="w-full md:w-80 p-2 border rounded" placeholder="Search articles" value={q} onChange={e=>setQ(e.target.value)}/><div className="grid md:grid-cols-3 gap-4">{items.map(a=><Link key={a.slug} to={`/wiki/${encodeURIComponent(a.slug)}`} className="border rounded p-4"><h3 className="font-bold">{a.title}</h3><p className="text-xs">{a.category}</p></Link>)}</div><div className="text-sm">Categories: Setup, Tips & Tricks, Advanced, Scripting, Troubleshooting</div></div>
}

function WikiArticle() {
  const slug = decodeURIComponent(window.location.pathname.replace('/wiki/',''));
  const [md, setMd] = useState('# Loading article...');
  useEffect(()=>{ fetch(`/../../wiki/${slug}.md`).then(r=>r.text()).then(setMd).catch(()=>setMd('# Article not found')); }, [slug]);
  const meta = wikiArticles.find(a=>a.slug===slug) || {title:slug, author:'Community', updated:'Unknown', category:'General'};
  return <div className="grid md:grid-cols-[1fr_260px] gap-4"><article className="border rounded p-4"><h1 className="text-2xl font-bold">{meta.title}</h1><p className="text-xs">By {meta.author} • Updated {meta.updated}</p><div className="prose dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown></div></article><aside className="border rounded p-4"><h3 className="font-bold">Related</h3>{wikiArticles.filter(a=>a.slug!==slug).map(a=><Link key={a.slug} to={`/wiki/${encodeURIComponent(a.slug)}`} className="block underline">{a.title}</Link>)}<p className="mt-2 text-sm">Tags: setup, config, support</p></aside></div>
}

function Admin({ user }: { user: User | null }) {
  const [tab, setTab] = useState('Dashboard');
  const [users, setUsers] = useState<any[]>([]); const [licenses,setLicenses]=useState<any[]>([]); const [requests,setRequests]=useState<any[]>([]); const [tickets,setTickets]=useState<any[]>([]); const [anns,setAnns]=useState<any[]>([]); const [status,setStatus]=useState<any>(null); const [audit,setAudit]=useState<any[]>([]);
  useEffect(()=>{ if (!user || user.role !== 'admin') return; apiFetch('/users').then(r=>setUsers(r.users)); apiFetch('/licenses').then(r=>setLicenses(r.licenses)); apiFetch('/hwid/requests').then(r=>setRequests(r.requests)); apiFetch('/tickets').then(r=>setTickets(r.tickets)); apiFetch('/announcements').then(r=>setAnns(r.announcements)); apiFetch('/status').then(setStatus); apiFetch('/audit-log').then(r=>setAudit(r.rows)); }, [user]);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  const tabs = ['Dashboard','User Management','License Management','HWID Reset Requests','Announcement Manager','Ticket Manager','Server Status Manager','Settings'];
  return <div className="grid md:grid-cols-[220px_1fr] gap-4"><aside className="border rounded p-3">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`block w-full text-left px-2 py-1 rounded ${tab===t?'bg-indigo-600 text-white':'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{t}</button>)}</aside><section className="border rounded p-4 overflow-auto">
    {tab==='Dashboard' && <div className="space-y-3"><div className="grid md:grid-cols-4 gap-2"><div className="p-3 bg-slate-100 dark:bg-slate-800 rounded">Total users: {users.length}</div><div className="p-3 bg-slate-100 dark:bg-slate-800 rounded">Active licenses: {licenses.filter(l=>l.status==='active').length}</div><div className="p-3 bg-slate-100 dark:bg-slate-800 rounded">Open tickets: {tickets.filter(t=>['Open','In Progress'].includes(t.status)).length}</div><div className="p-3 bg-slate-100 dark:bg-slate-800 rounded">MRR: $12,940</div></div><h3 className="font-bold">Recent signups</h3><table className="w-full text-sm"><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Date</th></tr></thead><tbody>{users.slice(0,10).map(u=><tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email}</td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>)}</tbody></table><h3 className="font-bold">Ticket Activity</h3><ul>{tickets.slice(0,10).map(t=><li key={t.id}>#{t.id} {t.subject} - {t.status}</li>)}</ul></div>}
    {tab==='User Management' && <div><h3 className="font-bold">Users</h3><table className="w-full text-sm"><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Plan</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{users.map(u=>{const lic=licenses.find(l=>l.user_id===u.id);return <tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email}</td><td>{lic?.plan||'-'}</td><td>{u.banned_at?'Banned':'Active'}</td><td>{new Date(u.created_at).toLocaleDateString()}</td><td className="space-x-1"><button onClick={()=>alert(JSON.stringify(u,null,2))}>View</button><button onClick={async()=>{await apiFetch(`/users/${u.id}/ban`,{method:'PATCH',body:JSON.stringify({banned:!u.banned_at})});location.reload();}}>{u.banned_at?'Unban':'Ban'}</button><button onClick={async()=>{if(confirm('Delete user?')){await apiFetch(`/users/${u.id}`,{method:'DELETE'});location.reload();}}}>Delete</button></td></tr>})}</tbody></table></div>}
    {tab==='License Management' && <div><h3 className="font-bold">Licenses</h3><table className="w-full text-sm"><thead><tr><th>Key</th><th>User</th><th>Plan</th><th>Expiry</th><th>Status</th><th>HWID</th><th>Actions</th></tr></thead><tbody>{licenses.map(l=><tr key={l.id}><td>{String(l.license_key).slice(0,8)}•••</td><td>{l.user_id}</td><td>{l.plan}</td><td>{new Date(l.expiry_date).toLocaleDateString()}</td><td>{l.status}</td><td>{l.hwid||'-'}</td><td><button onClick={async()=>{await apiFetch(`/licenses/${l.id}`,{method:'PATCH',body:JSON.stringify({status:'revoked'})});location.reload();}}>Revoke</button></td></tr>)}</tbody></table><h4 className="font-semibold mt-3">Create License</h4><form className="flex gap-2" onSubmit={async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); await apiFetch('/licenses',{method:'POST',body:JSON.stringify({user_id:Number(fd.get('user_id')),plan:fd.get('plan'),days:Number(fd.get('days'))})}); location.reload();}}><input name="user_id" className="border p-1" placeholder="User ID"/><select name="plan" className="border p-1"><option>Basic</option><option>Pro</option><option>Elite</option></select><input name="days" className="border p-1" defaultValue="30"/><button className="px-2 py-1 bg-indigo-600 text-white rounded">Create</button></form></div>}
    {tab==='HWID Reset Requests' && <div><h3 className="font-bold">Queue</h3><table className="w-full text-sm"><thead><tr><th>User</th><th>Date</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}><td>{r.user_id}</td><td>{new Date(r.requested_at).toLocaleString()}</td><td>{r.reason}</td><td>{r.status}</td><td className="space-x-1"><button onClick={async()=>{await apiFetch(`/hwid/requests/${r.id}/approve`,{method:'POST'});location.reload();}}>Approve</button><button onClick={async()=>{await apiFetch(`/hwid/requests/${r.id}/deny`,{method:'POST'});location.reload();}}>Deny</button></td></tr>)}</tbody></table></div>}
    {tab==='Announcement Manager' && <div><h3 className="font-bold">Create Announcement</h3><form className="space-y-2" onSubmit={async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); await apiFetch('/announcements',{method:'POST',body:JSON.stringify({title:fd.get('title'),category:fd.get('category'),body:fd.get('body'),pinned:Boolean(fd.get('pinned'))})}); location.reload();}}><input name="title" className="w-full border p-2" placeholder="Title"/><select name="category" className="w-full border p-2"><option>Update</option><option>Maintenance</option><option>Alert</option></select><textarea name="body" className="w-full border p-2" placeholder="Body markdown"/><label><input type="checkbox" name="pinned"/> Pin</label><button className="px-2 py-1 bg-indigo-600 text-white rounded">Publish</button></form><table className="w-full text-sm mt-3"><tbody>{anns.map(a=><tr key={a.id}><td>{a.title}</td><td>{a.category}</td><td><button onClick={async()=>{await apiFetch(`/announcements/${a.id}`,{method:'DELETE'});location.reload();}}>Delete</button></td></tr>)}</tbody></table></div>}
    {tab==='Ticket Manager' && <div><h3 className="font-bold">Ticket Inbox</h3>{tickets.map(t=><details key={t.id}><summary>#{t.id} {t.subject} ({t.status})</summary><div className="space-x-2"><button onClick={async()=>{await apiFetch(`/tickets/${t.id}/status`,{method:'PATCH',body:JSON.stringify({status:'In Progress'})});location.reload();}}>In Progress</button><button onClick={async()=>{await apiFetch(`/tickets/${t.id}/status`,{method:'PATCH',body:JSON.stringify({status:'Resolved'})});location.reload();}}>Resolved</button></div></details>)}</div>}
    {tab==='Server Status Manager' && <div><h3 className="font-bold">Service Status</h3><ul>{(status?.statuses||[]).map((s:any)=><li key={s.id}>{s.service_name}: {s.status}</li>)}</ul><form className="flex gap-2 mt-2" onSubmit={async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); await apiFetch('/status',{method:'POST',body:JSON.stringify({service_name:fd.get('service_name'),status:fd.get('status')})}); location.reload();}}><input name="service_name" className="border p-1" placeholder="Service"/><select name="status" className="border p-1"><option>Online</option><option>Degraded</option><option>Offline</option></select><button className="px-2 py-1 bg-indigo-600 text-white rounded">Update</button></form><h4 className="font-semibold mt-3">Create Incident</h4><form className="space-y-2" onSubmit={async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); await apiFetch('/incidents',{method:'POST',body:JSON.stringify({title:fd.get('title'),severity:fd.get('severity'),affected_services:String(fd.get('affected_services')).split(',').map(s=>s.trim()),description:fd.get('description'),resolution:fd.get('resolution')})}); location.reload();}}><input name="title" className="w-full border p-1" placeholder="Title"/><select name="severity" className="w-full border p-1"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><input name="affected_services" className="w-full border p-1" placeholder="Auth Server, API Gateway"/><textarea name="description" className="w-full border p-1"/><textarea name="resolution" className="w-full border p-1"/><button className="px-2 py-1 bg-indigo-600 text-white rounded">Create Incident</button></form></div>}
    {tab==='Settings' && <div><h3 className="font-bold">Site Settings</h3><form className="space-y-2" onSubmit={async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); await apiFetch('/settings',{method:'PATCH',body:JSON.stringify({site_name:fd.get('site_name'),logo_url:fd.get('logo_url'),download_url:fd.get('download_url'),checkout_url:fd.get('checkout_url'),max_hwid_resets:fd.get('max_hwid_resets'),maintenance_mode:fd.get('maintenance_mode')==='on'})}); alert('Saved')}}><input name="site_name" className="w-full border p-1" defaultValue="Crept"/><input name="logo_url" className="w-full border p-1" defaultValue="/assets/icons/logo.svg"/><input name="download_url" className="w-full border p-1"/><input name="checkout_url" className="w-full border p-1"/><input name="max_hwid_resets" className="w-full border p-1" defaultValue="1"/><label><input name="maintenance_mode" type="checkbox"/> Maintenance mode</label><button className="px-2 py-1 bg-indigo-600 text-white rounded">Save</button></form><h4 className="font-semibold mt-3">Audit Log</h4><ul className="text-sm">{audit.map(a=><li key={a.id}>{new Date(a.created_at).toLocaleString()} — {a.action}</li>)}</ul></div>}
  </section></div>
}

function Forgot() { return <p>Forgot password flow will be emailed to your registered account.</p> }
function NotFound() { return <div><h1 className="text-3xl font-bold">404</h1><p>Page not found.</p><Link to="/" className="underline">Return home</Link></div>; }

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { apiFetch('/auth/me').then(r => setUser(r.user)).catch(() => {}); }, []);

  return <Layout user={user} setUser={setUser}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login onLogin={setUser} />} />
      <Route path="/signup" element={<Signup onLogin={setUser} />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/purchase" element={<Purchase />} />
      <Route path="/forms" element={user ? <Forms /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" replace />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/wiki" element={<WikiHome />} />
      <Route path="/wiki/:slug" element={<WikiArticle />} />
      <Route path="/admin" element={<Admin user={user} />} />
      <Route path="/forgot-password" element={<Forgot />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>;
}
