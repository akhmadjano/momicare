import React, { useRef, useEffect } from 'react'
import { useLang } from '../i18n/LangContext'

const ORDER = { Low: 0, Moderate: 1, High: 2, Critical: 3 }
const DOT_C = ['#16a34a', '#d97706', '#e11d48', '#c0001a']

export default function SketchLineChart({ data = [], width = 480, height = 200 }) {
  const canvasRef = useRef(null)
  const { t }     = useLang()

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width  = width  * dpr
    cv.height = height * dpr
    cv.style.width  = width  + 'px'
    cv.style.height = height + 'px'

    const ctx = cv.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const P  = { t: 16, r: 20, b: 40, l: 80 }
    const cW = width  - P.l - P.r
    const cH = height - P.t - P.b

    /* Background */
    ctx.fillStyle = '#fafafa'
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(0, 0, width, height, 10)
    else ctx.rect(0, 0, width, height)
    ctx.fill()

    /* Y labels + grid */
    const yLabels = [
      t('risk.Low')      || 'Low',
      t('risk.Moderate') || 'Moderate',
      t('risk.High')     || 'High',
      t('risk.Critical') || 'Critical',
    ]

    for (let i = 0; i <= 3; i++) {
      const y = P.t + cH - (i / 3) * cH

      ctx.beginPath()
      ctx.setLineDash(i === 0 ? [] : [3, 5])
      ctx.strokeStyle = i === 0 ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.05)'
      ctx.lineWidth   = 1
      ctx.moveTo(P.l, y); ctx.lineTo(P.l + cW, y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.font = `600 10px Inter, system-ui`
      ctx.fillStyle = DOT_C[i]
      ctx.textAlign = 'right'
      ctx.fillText(yLabels[i], P.l - 8, y + 4)

      ctx.beginPath()
      ctx.strokeStyle = 'rgba(0,0,0,.15)'
      ctx.lineWidth = 1
      ctx.moveTo(P.l - 4, y); ctx.lineTo(P.l, y)
      ctx.stroke()
    }

    if (!data.length) return

    const pts = data.map((d, i) => {
      const v = typeof d.value === 'number' ? d.value : (ORDER[d.value] ?? 0)
      const x = P.l + (data.length === 1 ? cW / 2 : (i / (data.length - 1)) * cW)
      const y = P.t + cH - (v / 3) * cH
      return { x, y, label: d.label, val: v }
    })

    /* Area fill */
    if (pts.length > 1) {
      const ag = ctx.createLinearGradient(0, P.t, 0, P.t + cH)
      ag.addColorStop(0, 'rgba(192,0,26,.14)')
      ag.addColorStop(1, 'rgba(192,0,26,.01)')
      ctx.beginPath()
      ctx.moveTo(pts[0].x, P.t + cH)
      pts.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.lineTo(pts[pts.length - 1].x, P.t + cH)
      ctx.closePath()
      ctx.fillStyle = ag
      ctx.fill()
    }

    /* Line */
    if (pts.length > 1) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        const cp = (pts[i - 1].x + pts[i].x) / 2
        ctx.bezierCurveTo(cp, pts[i-1].y, cp, pts[i].y, pts[i].x, pts[i].y)
      }
      ctx.strokeStyle = '#c0001a'
      ctx.lineWidth   = 2.5
      ctx.lineJoin    = 'round'
      ctx.stroke()
    }

    /* Dots */
    pts.forEach(p => {
      const col = DOT_C[Math.round(p.val)] ?? '#c0001a'
      ctx.beginPath(); ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = col; ctx.fill()
      ctx.beginPath(); ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2)
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke()
    })

    /* X labels */
    ctx.textAlign = 'center'
    ctx.font      = `500 10px Inter, system-ui`
    pts.forEach(p => {
      ctx.save()
      ctx.translate(p.x, P.t + cH + 15)
      ctx.rotate(-0.3)
      ctx.fillStyle = '#888'
      ctx.fillText(p.label ?? '', 0, 0)
      ctx.restore()
    })
  }, [data, width, height, t])

  return (
    <canvas ref={canvasRef}
      style={{ display: 'block', maxWidth: '100%', borderRadius: 10 }}
      aria-label="Risk history chart" role="img"
    />
  )
}
