import { useState, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import './App.css'

const SECRET = 'lenamiu2025'
const CLOUD_NAME = 'dhw1jpjnz'
const UPLOAD_PRESET = 'test_unsigned'

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [slots, setSlots] = useState([])
  const [likedVideos, setLikedVideos] = useState({})
  const [lbIdx, setLbIdx] = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [videoType, setVideoType] = useState('upload')
  const [videoUrl, setVideoUrl] = useState('')
  const [capInput, setCapInput] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [activeDelete, setActiveDelete] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Check URL hash for access
  useEffect(() => {
    const check = () => {
      if (window.location.hash.replace('#', '') === SECRET) setUnlocked(true)
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])

  // Load saved slots from localStorage
  useEffect(() => {
    if (!unlocked) return
    
    const saved = localStorage.getItem('lenamiu_slots_backup')
    console.log('Loading slots from localStorage:', saved)
    
    if (saved && saved !== 'undefined') {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlots(parsed)
        } else {
          initSlots()
        }
      } catch (err) {
        console.error('Error parsing slots:', err)
        initSlots()
      }
    } else {
      initSlots()
    }
    
    const liked = localStorage.getItem('likedVideos')
    if (liked) setLikedVideos(JSON.parse(liked))
  }, [unlocked])

  function initSlots() {
    const defaultSlots = [
      { caption: 'memory 01', type: null, src: null, thumb: null, ownerEmail: '', likes: 0 },
      { caption: 'memory 02', type: null, src: null, thumb: null, ownerEmail: '', likes: 0 },
      { caption: 'memory 03', type: null, src: null, thumb: null, ownerEmail: '', likes: 0 },
    ]
    setSlots(defaultSlots)
    localStorage.setItem('lenamiu_slots_backup', JSON.stringify(defaultSlots))
  }

  function saveToLocal(newSlots) {
    localStorage.setItem('lenamiu_slots_backup', JSON.stringify(newSlots))
    console.log('Saved slots to localStorage:', newSlots)
  }

  // Working upload function
  async function uploadToCloudinary(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('resource_type', 'video')

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed')
      }
      
      return data
    } catch (err) {
      throw new Error(err.message)
    }
  }

  function openEdit(idx) {
    setEditingIdx(idx)
    setPendingFile(null)
    setVideoUrl('')
    setCapInput(slots[idx]?.caption || '')
    setOwnerEmail(slots[idx]?.ownerEmail || '')
    setVideoType('upload')
  }

  function closeEdit() { 
    if (!uploading) { 
      setEditingIdx(null)
      setPendingFile(null)
    } 
  }

  async function saveSlot() {
    if (editingIdx === null) return
    
    const cap = capInput.trim() || slots[editingIdx].caption
    let newSlot

    if (videoType === 'youtube') {
      if (!videoUrl.trim()) { 
        alert('Please paste a YouTube or Vimeo link')
        return 
      }
      newSlot = {
        caption: cap, 
        type: 'youtube', 
        src: videoUrl.trim(), 
        thumb: null,
        ownerEmail: ownerEmail.trim(), 
        likes: slots[editingIdx]?.likes || 0,
      }
    } else {
      if (!pendingFile) { 
        alert('Please choose a video file first')
        return 
      }
      
      setUploading(true)
      
      try {
        const data = await uploadToCloudinary(pendingFile)
        console.log('Upload successful:', data.secure_url)
        
        const thumb = data.secure_url
          .replace('/video/upload/', '/video/upload/so_2,w_480,c_fill,q_auto/')
          .replace(/\.[^.]+$/, '.jpg')
        
        newSlot = {
          caption: cap, 
          type: 'upload', 
          src: data.secure_url, 
          thumb: thumb,
          ownerEmail: ownerEmail.trim(), 
          likes: slots[editingIdx]?.likes || 0,
        }
      } catch (err) {
        alert('Upload failed: ' + err.message)
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const next = [...slots]
    next[editingIdx] = newSlot
    setSlots(next)
    saveToLocal(next)
    closeEdit()
    alert('✅ Video saved! It will stay after refresh.')
  }

  function addSlot() {
    const next = [...slots, {
      caption: `memory 0${slots.length + 1}`,
      type: null,
      src: null,
      thumb: null,
      ownerEmail: '',
      likes: 0,
    }]
    setSlots(next)
    saveToLocal(next)
  }

  function deleteVideoOnly(idx) {
    if (!confirm('Remove the video from this polaroid?')) return
    const slot = slots[idx]
    const next = [...slots]
    next[idx] = { 
      caption: slot.caption, 
      type: null, 
      src: null, 
      thumb: null, 
      ownerEmail: slot.ownerEmail || '', 
      likes: slot.likes || 0 
    }
    setSlots(next)
    saveToLocal(next)
    setActiveDelete(null)
    alert('✅ Video removed')
  }

  function likeVideo(idx) {
    const slot = slots[idx]
    if (!slot.ownerEmail?.trim()) { 
      alert("The owner hasn't set an email for notifications.")
      return 
    }
    if (likedVideos[idx]) { 
      alert("You already liked this video!")
      return 
    }
    const newLiked = { ...likedVideos, [idx]: true }
    setLikedVideos(newLiked)
    localStorage.setItem('likedVideos', JSON.stringify(newLiked))
    const next = [...slots]
    next[idx] = { ...slot, likes: (slot.likes || 0) + 1 }
    setSlots(next)
    saveToLocal(next)
    const subject = `Someone liked "${slot.caption}" on LenaMiu!`
    const body = `Hi!\n\nSomeone just liked your video "${slot.caption}" on LenaMiu.`
    window.open(`mailto:${slot.ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
    alert('Liked! Your email client will open to notify the owner.')
  }

  function closeLightbox() { setLbIdx(null) }
  
  function lbNav(dir) {
    let next = lbIdx
    for (let i = 1; i <= slots.length; i++) {
      const t = ((lbIdx + dir * i) % slots.length + slots.length) % slots.length
      if (slots[t]?.type) { next = t; break }
    }
    setLbIdx(next)
  }

  const rots = ['-2.8deg', '1.5deg', '-1deg', '2.2deg', '-1.8deg', '2.6deg', '-0.8deg']
  const pageUrl = `${window.location.origin}${window.location.pathname}#${SECRET}`
  const lbSlot = lbIdx !== null ? slots[lbIdx] : null

  if (!unlocked) {
    return (
      <div id="lock-screen">
        <h1>LenaMiu</h1>
        <div className="sub">private access only</div>
        <div className="pill">This page is private.<br />Scan your QR code to enter</div>
      </div>
    )
  }

  return (
    <>
      <header className="header">
        <div className="logo">LenaMiu</div>
        <div className="tagline">my little corner</div>
      </header>

      <div className="section">
        <div className="section-title">click a polaroid → delete button appears ↓</div>
        <div className="polaroid-grid">
          {slots.map((s, i) => {
            const hasVideo = s && s.type && s.src
            const isLiked = likedVideos[i] || false
            const likeCount = s?.likes || 0
            return (
              <div key={i} className={`polaroid${hasVideo ? ' has-video' : ''}`}
                style={{ transform: `rotate(${rots[i % rots.length]})` }}
                onClick={() => hasVideo && setActiveDelete(activeDelete === i ? null : i)}>
                <div className="tape" />
                <div className="polaroid-img"
                  onClick={e => { e.stopPropagation(); hasVideo ? setLbIdx(i) : openEdit(i) }}>
                  {hasVideo ? (
                    s.type === 'youtube' ? (
                      <img src={`https://img.youtube.com/vi/${new URL(s.src).searchParams.get('v')}/mqdefault.jpg`} alt={s.caption} />
                    ) : s.thumb ? (
                      <img src={s.thumb} alt={s.caption} />
                    ) : (
                      <video src={s.src} muted preload="metadata" />
                    )
                  ) : (
                    <div className="empty-placeholder">
                      <div className="empty-plus">＋</div>
                      <span>add video</span>
                    </div>
                  )}
                  {hasVideo && <div className="play-overlay"><div className="play-btn">▶</div></div>}
                </div>
                <div className="polaroid-caption">{s?.caption || 'memory'}</div>
                <button className={`like-heart${isLiked ? ' liked' : ''}`}
                  onClick={e => { e.stopPropagation(); likeVideo(i) }}>
                  {isLiked ? '❤️' : '♡'}{likeCount > 0 ? ` ${likeCount}` : ''}
                </button>
                {hasVideo && (
                  <button className="delete-video-icon"
                    style={{ display: activeDelete === i ? 'flex' : 'none' }}
                    onClick={e => { e.stopPropagation(); deleteVideoOnly(i) }}>🗑️</button>
                )}
              </div>
            )
          })}
        </div>
        <button className="add-btn" onClick={addSlot}>+ add another polaroid</button>
      </div>

      <div className="section">
        <div className="section-title">share via QR</div>
        <div className="qr-box">
          <h3>scan to visit</h3>
          <p>share this with your people</p>
          <QRCodeCanvas value={pageUrl} size={200} bgColor="#ffffff" fgColor="#1a1a2e" level="H" />
          <div className="qr-url">{pageUrl}</div>
        </div>
      </div>

      <footer>made with ♡ by <span>LenaMiu</span></footer>

      {lbSlot && lbSlot.type && (
        <div id="lightbox" className="open"
          onClick={e => { if (e.currentTarget === e.target) closeLightbox() }}>
          <div className="lb-inner">
            <button className="lb-close" onClick={closeLightbox}>✕</button>
            <div className="lb-polaroid">
              <div className="lb-tape" />
              <div className="lb-video-wrap">
                {lbSlot.type === 'youtube'
                  ? <iframe src={`https://www.youtube.com/embed/${new URL(lbSlot.src).searchParams.get('v')}?autoplay=1`}
                    allow="autoplay; encrypted-media" allowFullScreen title={lbSlot.caption} />
                  : <video src={lbSlot.src} controls autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                }
              </div>
              <div className="lb-caption">{lbSlot.caption}</div>
            </div>
            <div className="lb-nav">
              <div className="lb-arrow" onClick={() => lbNav(-1)}>←</div>
              <div className="lb-arrow" onClick={() => lbNav(1)}>→</div>
            </div>
          </div>
        </div>
      )}

      {editingIdx !== null && (
        <div id="edit-modal-bg" className="open">
          <div className="edit-modal">
            <button className="close-edit" onClick={closeEdit}>✕</button>
            <h3>add your video</h3>
            <label>video type</label>
            <select value={videoType} onChange={e => setVideoType(e.target.value)} disabled={uploading}>
              <option value="upload">upload from device</option>
              <option value="youtube">youtube / vimeo link</option>
            </select>
            {videoType === 'youtube' ? (
              <>
                <label>paste video url</label>
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." />
              </>
            ) : (
              <>
                <label>choose video file</label>
                <div className="upload-drop"
                  onClick={() => !uploading && document.getElementById('file-in').click()}>
                  <input type="file" id="file-in" accept="video/*" style={{ display: 'none' }}
                    onChange={e => { 
                      const file = e.target.files[0]
                      if (file) {
                        setPendingFile(file)
                        console.log('File selected:', file.name, file.size)
                      }
                    }} />
                  🎬 tap to choose a video<br />
                  <span style={{ fontSize: '.7rem' }}>mp4 · mov · webm</span>
                  {pendingFile && !uploading && (
                    <div style={{ marginTop: 8, fontSize: '.8rem', color: '#7fd7ff' }}>
                      ✓ {pendingFile.name} ({(pendingFile.size / 1024 / 1024).toFixed(1)} MB)
                    </div>
                  )}
                </div>
                {uploading && <p>⏳ Uploading to Cloudinary... Please wait</p>}
              </>
            )}
            <label>caption</label>
            <input type="text" value={capInput} onChange={e => setCapInput(e.target.value)}
              placeholder="summer 2025..." disabled={uploading} />
            <label>📧 owner email (for like notifications)</label>
            <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
              placeholder="owner@example.com" disabled={uploading} />
            <div className="modal-btns">
              <button className="btn-cancel" onClick={closeEdit} disabled={uploading}>cancel</button>
              <button className="btn-save" onClick={saveSlot} disabled={uploading}>
                {uploading ? '⏳ Uploading...' : 'save ♡'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}