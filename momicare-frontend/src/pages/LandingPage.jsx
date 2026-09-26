import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangContext'
import LangSwitcher from '../components/LangSwitcher'

/* ── Medical conditions ──────────────────────────────── */
const CONDITIONS = [
  {
    id: 1, color: '#c0001a', emoji: '🩸',
    title: 'Kuchli qon ketishi',
    subtitle: 'Haemorrhage',
    short: 'Tug\'ruqdan keyingi 24 soatda 500 ml dan ortiq qon yo\'qotish.',
    sections: [
      { title: 'Bu nima?', body: 'Postpartum haemorrhage (PPH) — tug\'ruqdan keyingi kuchli qon ketishi juda muhim sabab. WHO PPHni tug\'ruqdan keyingi 24 soat ichida 500 ml yoki undan ko\'p qon yo\'qotish deb ta\'riflaydi.' },
      { title: 'Asosiy sabablar', list: ['Bachadon yetarlicha qisqarmasligi (uterine atony)', 'Placenta bilan bog\'liq muammolar', 'Tug\'ruq yo\'llaridagi jarohatlar', 'Qon ivishi muammolari'] },
      { title: 'Oldini olish', list: ['Homiladorlikda anemiyani davolash', 'Malakali tibbiy xodim nazorati', 'Qon ketishini muntazam kuzatish', 'WHO tavsiya qilgan oksitotsin'] },
      { title: 'MomiCare bilan bog\'lanishi', body: 'MomiCare BP, HR, anemiya tarixi va boshqa ma\'lumotlarni tartiblab, klinik jamoaga bemorning holatini yaxshiroq ko\'rishga yordam beradi.', highlight: true },
    ],
  },
  {
    id: 2, color: '#7c3aed', emoji: '🫀',
    title: 'Preeklampsiya',
    subtitle: 'Gipertenziv kasalliklar',
    short: 'Homiladorlik davrida yuqori qon bosimi bilan bog\'liq jiddiy holat. WHO: global maternal o\'limlarning ~16%.',
    highlight: true,
    sections: [
      { title: 'Bu nima?', body: 'Odatda 20-haftadan keyin rivojlanadi. Preeklampsiya eklampsiyaga olib kelishi mumkin. WHO ma\'lumotiga ko\'ra 2023 yilda ~16% maternal o\'limning sababi.' },
      { title: 'Xavf omillari', list: ['Birinchi homiladorlik', 'Egizak / ko\'p homilalik', 'Oldindan mavjud gipertoniya', 'Diabet, buyrak kasalligi, semirish', 'Oilaviy tarix'] },
      { title: 'Oldini olish', list: ['Muntazam antenatal nazorat', 'Qon bosimini kuzatish', 'Siydikdagi oqsilni tekshirish', 'Past dozali aspirin (shifokor bilan)', 'Kalsiy qo\'shimchasi (kerak bo\'lsa)'] },
      {
        title: 'MomiCare bilan eng kuchli bog\'lanish', highlight: true,
        body: '128/82 → 135/85 + headache\n→ CHANGE DETECTED → Nurse Review → Doctor Decision\n\nAI ma\'lumotdagi o\'zgarishni strukturalab ko\'rsatadi, tashxis qo\'ymaydi.',
      },
    ],
  },
  {
    id: 3, color: '#d97706', emoji: '🦠',
    title: 'Sepsis',
    subtitle: 'Og\'ir infeksiya',
    short: 'Infeksiyaga qarshi organizmning haddan tashqari reaksiyasi. WHO: maternal o\'limning asosiy sababi.',
    sections: [
      { title: 'Bu nima?', body: 'Homiladorlik, tug\'ruq yoki tug\'ruqdan keyingi davrda rivojlanishi mumkin. Organlar faoliyatiga zarar yetkazib, hayotga xavf tug\'diradi.' },
      { title: 'Asosiy manbalar', list: ['Homiladorlik davrida infeksiya', 'Tug\'ruq vaqtida infeksiya', 'Tug\'ruqdan keyingi davrda infeksiya', 'O\'z vaqtida aniqlanmagan infeksiya'] },
      { title: 'Oldini olish', list: ['Muntazam prenatal nazorat', 'Infeksiyalarni erta aniqlash', 'Gigiyena va infeksiya nazorati', 'Xavfsiz tug\'ruq sharoiti', 'Simptomlarni kuzatish'] },
      { title: 'MomiCare bilan bog\'lanishi', body: 'Temperature + HR + symptoms + history → trend → healthcare team. MomiCare sepsisni tashxislamaydi — shifokorga vaqtida o\'zgarishlarni ko\'rsatadi.', highlight: true },
    ],
  },
]

function ConditionCard({ cond }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card a-fadeUp" style={{ overflow: 'hidden', cursor: 'default' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left',
        transition: 'background var(--t-fast)',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cond.color}15`, border: `1px solid ${cond.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
          {cond.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{cond.title}</span>
            <span style={{ fontSize: '.75rem', color: cond.color, fontWeight: 600, background: `${cond.color}12`, padding: '1px 8px', borderRadius: 99 }}>
              {cond.subtitle}
            </span>
            {cond.highlight && (
              <span className="badge badge-ai">⭐ MomiCare'ga eng bog'liq</span>
            )}
          </div>
          <p style={{ fontSize: '.8125rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{cond.short}</p>
        </div>
        <span style={{ color: 'var(--text-3)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0, fontSize: '.75rem', marginTop: 4 }}>▼</span>
      </button>

      {open && (
        <div className="a-fadeIn" style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          {cond.sections.map((sec, i) => (
            <div key={i} style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 700, fontSize: '.8125rem', color: 'var(--text)', marginBottom: 8 }}>{sec.title}</p>
              {sec.body && (
                <p style={{
                  fontSize: '.8125rem', color: 'var(--text-2)', lineHeight: 1.65,
                  whiteSpace: 'pre-line',
                  ...(sec.highlight ? { background: `${cond.color}08`, borderLeft: `3px solid ${cond.color}`, padding: '10px 12px', borderRadius: '0 6px 6px 0' } : {}),
                }}>
                  {sec.body}
                </p>
              )}
              {sec.list && (
                <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {sec.list.map((item, j) => (
                    <li key={j} style={{ display: 'flex', gap: 8, fontSize: '.8125rem', color: 'var(--text-2)' }}>
                      <span style={{ color: cond.color, flexShrink: 0, marginTop: 1 }}>•</span>{item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactForm() {
  const [f, setF]   = useState({ name: '', phone: '', msg: '' })
  const [sent, setSent] = useState(false)
  const h = e => setF(p => ({ ...p, [e.target.name]: e.target.value }))
  const submit = e => { e.preventDefault(); setSent(true) }

  if (sent) return (
    <div className="a-popIn" style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green-bg)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.4rem' }}>✅</div>
      <h3 style={{ marginBottom: 6 }}>Xabar yuborildi!</h3>
      <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>Tez orada siz bilan bog'lanamiz.</p>
    </div>
  )

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label className="label">F.I.O</label>
          <input className="input" name="name" value={f.name} onChange={h} placeholder="Ismingiz" required />
        </div>
        <div className="field">
          <label className="label">Telefon</label>
          <input className="input" name="phone" value={f.phone} onChange={h} type="tel" placeholder="998…" required />
        </div>
      </div>
      <div className="field">
        <label className="label">Izoh</label>
        <textarea className="input" name="msg" value={f.msg} onChange={h} rows={3} placeholder="Savolingiz…" style={{ resize: 'none' }} />
      </div>
      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Yuborish →</button>
    </form>
  )
}

export default function LandingPage() {
  const { t } = useLang()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '.85rem' }}>🤰</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '.95rem', letterSpacing: '-.02em' }}>
              Momi<span style={{ color: 'var(--red)' }}>Care</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 4, marginLeft: 24 }}>
            {['Haqida', 'Xavflar', 'AI', 'Aloqa'].map((l, i) => (
              <a key={i} href={`#section-${i}`} style={{ padding: '5px 11px', borderRadius: 6, fontSize: '.8rem', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', transition: 'all var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}>
                {l}
              </a>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 9, alignItems: 'center' }}>
            <LangSwitcher />
            <Link to="/login"    className="btn btn-secondary btn-sm">Kirish</Link>
            <Link to="/register" className="btn btn-primary  btn-sm">Boshlash →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="section-0" style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px 64px' }}>
        <div style={{ maxWidth: 680 }}>
          <div className="a-fadeDown" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'var(--red-subtle)', border: '1px solid var(--red-muted)', borderRadius: 99, marginBottom: 20, fontSize: '.78rem', fontWeight: 600, color: 'var(--red-dark)' }}>
            🤰 Maternal sog'liq monitoring platformasi
          </div>
          <h1 className="a-fadeUp" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 20 }}>
            Homiladorlik xavflarini<br />
            <span style={{ color: 'var(--red)' }}>erta aniqlaymiz</span>
          </h1>
          <p className="a-fadeUp" style={{ animationDelay: '.06s', fontSize: '1rem', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 560, marginBottom: 32 }}>
            Qon bosimi, yurak urishi, simptomlar — barcha ma'lumot bir yerda. AI tibbiy jamoaga o'zgarishlarni real vaqtda ko'rsatadi.
          </p>
          <div className="a-fadeUp" style={{ animationDelay: '.12s', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-xl">Bepul boshlash →</Link>
            <Link to="/login"    className="btn btn-secondary btn-xl">Kirish</Link>
          </div>
        </div>

        {/* Feature chips */}
        <div className="stagger" style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 48 }}>
          {[
            { icon: '💉', label: 'BP kuzatuvi' },
            { icon: '🤖', label: 'Gemini AI' },
            { icon: '🔔', label: 'Ogohlantirish' },
            { icon: '📊', label: 'Risk grafik' },
            { icon: '👩‍⚕️', label: 'Hamshira kiritish' },
            { icon: '🗺',  label: 'Mintaqaviy tahlil' },
            { icon: '📱', label: 'Ovozli kiritish' },
            { icon: '📴', label: 'Oflayn navbat' },
          ].map((f, i) => (
            <div key={i} className="a-fadeUp" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 13px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 99, fontSize: '.8rem', color: 'var(--text)', fontWeight: 500, boxShadow: 'var(--shadow-1)' }}>
              <span style={{ fontSize: '.95rem' }}>{f.icon}</span>{f.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--gray-950)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 24 }}>
          {[
            { num: '16%',   label: 'Maternal o\'limlarning gipertenziya ulushi (WHO 2023)' },
            { num: '500ml', label: 'PPH chegarasi — tug\'ruqdan keyingi 24 soat' },
            { num: '3×',    label: 'Erta aniqlash orqali xavfni kamaytirish' },
            { num: '24/7',  label: 'Uzluksiz kuzatuv va ogohlantirish' },
          ].map((s, i) => (
            <div key={i} className="a-fadeUp" style={{ animationDelay: `${i * .07}s` }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--red-muted)', letterSpacing: '-.03em', marginBottom: 6 }}>{s.num}</div>
              <p style={{ fontSize: '.8rem', color: 'var(--gray-400)', lineHeight: 1.55 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MEDICAL INFO ── */}
      <section id="section-1" style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px 56px' }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Tibbiy ma'lumot</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 10 }}>Asosiy maternal xavf omillari</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '.9rem', maxWidth: 560, lineHeight: 1.6 }}>
            Quyida ona sog'liqni xavf ostiga qo'yadigan uchta asosiy sabab haqida tafsilot. Har birini kengaytirish uchun bosing.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CONDITIONS.map((c, i) => <ConditionCard key={c.id} cond={c} />)}
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section id="section-2" style={{ background: 'var(--bg-subtle)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>AI Cross-Check</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 10 }}>AI tahlil qanday ishlaydi?</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '.9rem', maxWidth: 520, lineHeight: 1.6 }}>
              Har bir o'lchov kiritilganda qoidalar tizimi va Gemini AI mustaqil baholaydi.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { step: '01', title: 'Ma\'lumot kiritish', body: 'Bemor yoki hamshira BP, HR va simptomlarni kiritadi. Ovozli kiritish ham qo\'llab-quvvatlanadi.', icon: '📋' },
              { step: '02', title: 'Qoidalar tizimi', body: 'Tizim kiritilgan ma\'lumotlar asosida xavf darajasini hisoblaydi: Low → Moderate → High → Critical.', icon: '⚙️' },
              { step: '03', title: 'Gemini AI baholashi', body: 'Gemini 1.5 Flash qoidalar tizimidan mustaqil holda bir xil ma\'lumotni baholaydi.', icon: '🤖' },
              { step: '04', title: 'Taqqoslash', body: 'Ikkala natija taqqoslanadi. MATCH yoki MISMATCH. Farq bo\'lsa — shifokorga bayroq.', icon: '🔍' },
            ].map((item, i) => (
              <div key={i} className="card card-p a-fadeUp stagger" style={{ animationDelay: `${i * .07}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '.7rem', fontWeight: 800, color: 'var(--red)', letterSpacing: '.06em', background: 'var(--red-subtle)', padding: '2px 8px', borderRadius: 99 }}>{item.step}</span>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                </div>
                <h3 style={{ marginBottom: 7, fontSize: '.9rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: '.8125rem', lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>

          <div className="a-fadeUp" style={{ marginTop: 24, padding: '14px 16px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '.8rem', color: 'var(--text-2)' }}>
            ⚠ <strong>Muhim:</strong> MomiCare tashxis qo'ymaydi. AI faqat o'zgarishlarni strukturalab, tibbiy jamoaga ko'rsatadi.
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Jarayon</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.02em' }}>Qanday ishlaydi?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'start' }}>
          {[
            { n: 1, role: 'Bemor', icon: '🤰', body: 'Kunlik holatini tekshiradi: tana holati, BP, HR. Ovozli ham kiritish mumkin.' },
            { n: 2, role: 'Hamshira', icon: '👩‍⚕️', body: 'Vizitda vitalllarni kiritadi. Oflayn ham ishlaydi — tarmoq kelganda sinxronlanadi.' },
            { n: 3, role: 'AI tizim', icon: '🤖', body: 'Qoidalar + Gemini AI natijani taqqoslaydi, xavf darajasini hisoblaydi.' },
            { n: 4, role: 'Shifokor', icon: '👨‍⚕️', body: 'Dashboard\'da barcha bemorlarni ko\'radi, ogohlantirishlarni hal qiladi.' },
          ].map((s, i) => (
            <div key={i} className="a-fadeUp" style={{ animationDelay: `${i * .08}s`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--red-subtle)', border: '2px solid var(--red-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Qadam {s.n}</div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 6 }}>{s.role}</div>
                <p style={{ color: 'var(--text-2)', fontSize: '.8rem', lineHeight: 1.55 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="section-3" style={{ background: 'var(--bg-subtle)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Bog'lanish</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 10 }}>Aloqa</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '.9rem' }}>Savolingiz yoki taklifingiz bo'lsa xabar qoldiring.</p>
          </div>
          <div className="card card-p a-scaleIn">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem' }}>🤰</div>
            <span style={{ fontWeight: 800, fontSize: '.85rem', letterSpacing: '-.02em' }}>MomiCare</span>
            <span style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>— Ona va bola sog'liq platformasi</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/login"    style={{ fontSize: '.8rem', color: 'var(--text-2)' }}>Kirish</Link>
            <Link to="/register" style={{ fontSize: '.8rem', color: 'var(--red)', fontWeight: 600 }}>Boshlash →</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
