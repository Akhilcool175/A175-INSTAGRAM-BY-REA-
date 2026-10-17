import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'

type User = { handle: string; name: string; avatar: string; bio: string; location: string; note: string }
type Comment = { id: string; handle: string; text: string }
type Post = { id: string; handle: string; image: string; caption: string; place: string; time: string; likes: number; liked: boolean; saved: boolean; comments: Comment[] }
type Story = { handle: string; image: string; caption: string }
type Page = 'home' | 'search' | 'explore' | 'reels' | 'messages' | 'notifications' | 'profile' | 'saved'
type DemoMessage = { from: 'me' | 'them'; text: string }

const image = (id: string, width = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const users: User[] = [
  { handle: 'akhil175', name: 'Akhil Sharma', avatar: image('photo-1535713875002-d1d0cf377fde', 160), bio: 'Finding beauty in the everyday. 📷\nA little bit of everywhere.', location: 'Mumbai, India', note: 'Your photo journal' },
  { handle: 'mayasees', name: 'Maya Chen', avatar: image('photo-1534528741775-53994a69daeb', 160), bio: 'A little light, everywhere. Photographing the in-between. ✨', location: 'San Francisco, CA', note: 'A little light, everywhere.' },
  { handle: 'theo.frames', name: 'Theo Rivera', avatar: image('photo-1500648767791-00dcc994a43e', 160), bio: 'collecting quiet moments and open horizons', location: 'Portland, OR', note: 'collecting quiet moments' },
  { handle: 'amara.outside', name: 'Amara Okafor', avatar: image('photo-1531123897727-8f129e1688ce', 160), bio: 'weekends in the wild · slow travel 🌿', location: 'Nairobi, Kenya', note: 'weekends in the wild' },
  { handle: 'softfocus', name: 'Rin Park', avatar: image('photo-1524504388940-b1c1722653e1', 160), bio: 'Soft colors, slower days.', location: 'Seoul, Korea', note: 'Soft colors, slower days.' },
]
const me = users[0]
const initialPosts: Post[] = [
  { id: 'p1', handle: 'mayasees', image: image('photo-1470252649378-9c29740c9fa8'), caption: 'The kind of morning that makes you take the long way home. #goldenhour #slowdays 🌾', place: 'Big Sur, California', time: '18 min ago', likes: 248, liked: false, saved: false, comments: [{ id: 'c1', handle: 'softfocus', text: 'This light is unreal ✨' }, { id: 'c2', handle: 'theo.frames', text: 'Adding this to my list.' }] },
  { id: 'p2', handle: 'theo.frames', image: image('photo-1518837695005-2083093ee35b'), caption: 'Somewhere between the tide coming in and the sun going down. #ocean #weekend', place: 'Oregon Coast', time: '1 hr ago', likes: 132, liked: false, saved: false, comments: [{ id: 'c3', handle: 'mayasees', text: 'I can hear this picture.' }] },
  { id: 'p3', handle: 'amara.outside', image: image('photo-1441974231531-c6227db76b6e'), caption: 'A small reminder to go where the trees are. 🍃 #forestwalk #breathe', place: 'Redwood National Park', time: '3 hrs ago', likes: 391, liked: false, saved: false, comments: [{ id: 'c4', handle: 'akhil175', text: 'Needed this today.' }] },
  { id: 'p4', handle: 'akhil175', image: image('photo-1500530855697-b586d89ba3ee'), caption: 'Taking the scenic route, as usual. #roadtrip #outthere', place: 'Lonavala, India', time: 'Yesterday', likes: 86, liked: false, saved: true, comments: [] },
]
const stories: Story[] = [
  { handle: 'mayasees', image: image('photo-1470252649378-9c29740c9fa8'), caption: 'Morning light in Big Sur' },
  { handle: 'theo.frames', image: image('photo-1518837695005-2083093ee35b'), caption: 'A little salt in the air' },
  { handle: 'amara.outside', image: image('photo-1441974231531-c6227db76b6e'), caption: 'Took the long way through' },
  { handle: 'softfocus', image: image('photo-1500530855697-b586d89ba3ee'), caption: 'A quiet afternoon' },
]

function readStored<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null'); return validate(value) ? value : fallback } catch { return fallback }
}
function useStoredState<T>(key: string, fallback: T, validate: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback, validate))
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage may be disabled or full. */ } }, [key, value])
  return [value, setValue] as const
}
async function makePersistentImage(blobUrl: string): Promise<string> {
  const source = new Image()
  source.src = blobUrl
  await new Promise<void>((resolve, reject) => { source.onload = () => resolve(); source.onerror = () => reject(new Error('Could not read this image.')) })
  const scale = Math.min(1, 1600 / Math.max(source.naturalWidth, source.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.naturalWidth * scale)
  canvas.height = Math.round(source.naturalHeight * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser could not prepare this image.')
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}
const isPosts = (value: unknown): value is Post[] => Array.isArray(value) && value.every(post => typeof post?.id === 'string' && typeof post?.handle === 'string' && typeof post?.image === 'string' && typeof post?.caption === 'string' && typeof post?.place === 'string' && typeof post?.time === 'string' && Number.isFinite(post?.likes) && typeof post?.liked === 'boolean' && typeof post?.saved === 'boolean' && Array.isArray(post?.comments) && post.comments.every((comment: Comment) => typeof comment?.id === 'string' && typeof comment?.handle === 'string' && typeof comment?.text === 'string'))
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>, explore: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>, heart: <path d="M20.8 8.7c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"/>,
    comment: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12 3h.5a8.5 8.5 0 0 1 8.5 8.5Z"/>,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4z"/>, send: <><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>,
    close: <path d="m18 6-12 12M6 6l12 12"/>, back: <path d="m15 18-6-6 6-6"/>, more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    reels: <><rect x="3" y="3" width="18" height="18" rx="5"/><path d="m10 8 6 4-6 4zM3 9h18M8 3l4 6M16 3l4 6"/></>,
    message: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12 3h.5a8.5 8.5 0 0 1 8.5 8.5Z"/><path d="m8 12 3 3 5-6"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  }
  return <svg {...props}>{paths[name] ?? paths.more}</svg>
}

function App() {
  const [posts, setPosts] = useStoredState('akhil175gram.posts', initialPosts, isPosts)
  const [following, setFollowing] = useStoredState('akhil175gram.following', ['mayasees'], isStringArray)
  const [page, setPage] = useState<Page>('home')
  const [profileHandle, setProfileHandle] = useState(me.handle)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [detailPost, setDetailPost] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [compose, setCompose] = useState(false)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState('')
  const [imageError, setImageError] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [editProfile, setEditProfile] = useState(false)
  const [menuPost, setMenuPost] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [activeChat, setActiveChat] = useState('mayasees')
  const [messageDraft, setMessageDraft] = useState('')
  const [chatMessages, setChatMessages] = useState<Record<string, DemoMessage[]>>({ mayasees: [{ from: 'them', text: 'Hey! Loved your latest photo 🌿' }, { from: 'me', text: 'Thank you! It was such a peaceful morning.' }], 'theo.frames': [{ from: 'them', text: 'Are you heading out to the coast this weekend?' }], 'amara.outside': [] })
  const [displayName, setDisplayName] = useStoredState('akhil175gram.displayName', me.name, (value): value is string => typeof value === 'string')
  const [bio, setBio] = useStoredState('akhil175gram.bio', me.bio, (value): value is string => typeof value === 'string')
  const picker = useRef<HTMLInputElement>(null)
  const profile = users.find(user => user.handle === profileHandle) ?? me
  const visiblePosts = useMemo(() => posts.filter(post => page !== 'saved' || post.saved), [posts, page])
  const searchResults = users.filter(user => user.handle.toLowerCase().includes(query.toLowerCase()) || user.name.toLowerCase().includes(query.toLowerCase()))
  const currentDetail = posts.find(post => post.id === detailPost)

  useEffect(() => {
    const openSharedPost = () => {
      const id = window.location.hash.match(/^#post-(.+)$/)?.[1]
      if (id && posts.some(post => post.id === id)) setDetailPost(id)
    }
    openSharedPost()
    window.addEventListener('hashchange', openSharedPost)
    return () => window.removeEventListener('hashchange', openSharedPost)
  }, [posts])

  const openProfile = (handle: string) => { setProfileHandle(handle); setPage('profile') }
  const togglePost = (id: string, key: 'liked' | 'saved') => setPosts(current => current.map(post => post.id === id ? { ...post, [key]: !post[key], ...(key === 'liked' ? { likes: post.likes + (post.liked ? -1 : 1) } : {}) } : post))
  const follow = (handle: string) => setFollowing(current => current.includes(handle) ? current.filter(item => item !== handle) : [...current, handle])
  const sharePost = async (id: string) => {
    try { await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#post-${id}`); setFeedback('Post link copied') }
    catch { setFeedback('Copying links is unavailable in this browser session') }
  }
  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const text = messageDraft.trim(); if (!text) return
    setChatMessages(current => ({ ...current, [activeChat]: [...(current[activeChat] ?? []), { from: 'me', text }] })); setMessageDraft('')
  }
  const addComment = (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault(); const text = commentDrafts[id]?.trim(); if (!text) return
    setPosts(current => current.map(post => post.id === id ? { ...post, comments: [...post.comments, { id: crypto.randomUUID(), handle: me.handle, text }] } : post))
    setCommentDrafts(current => ({ ...current, [id]: '' }))
  }
  const selectImage = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setImageError('Please choose an image file, such as JPG, PNG or WebP.'); return }
    if (file.size > 10 * 1024 * 1024) { setImageError('Choose an image smaller than 10 MB.'); return }
    setImageError(''); setPreview(URL.createObjectURL(file))
  }
  const cancelComposer = () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); setPreview(''); setCaption(''); setImageError(''); setCompose(false); if (picker.current) picker.current.value = '' }
  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!preview || !caption.trim()) return
    try {
      const storedImage = await makePersistentImage(preview)
      setPosts(current => [{ id: crypto.randomUUID(), handle: me.handle, image: storedImage, caption: caption.trim(), place: me.location, time: 'Just now', likes: 0, liked: false, saved: false, comments: [] }, ...current])
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
      setPreview(''); setCaption(''); setCompose(false); setPage('home')
    } catch { setImageError('We could not prepare that image. Please choose another one.') }
  }
  const navTo = (next: Page) => { setPage(next); if (next === 'profile') setProfileHandle(me.handle) }
  const nav = (target: Page, label: string, icon: string) => <button key={label} className={`nav-link ${page === target ? 'active' : ''}`} onClick={() => navTo(target)} aria-current={page === target ? 'page' : undefined}><Icon name={icon}/><span>{label}</span></button>

  return <div className="app-shell">
    <aside className="left-rail"><button className="brand" onClick={() => navTo('home')} aria-label="A175 home"><span className="brand-mark">A</span><span>A175</span></button><nav className="main-nav" aria-label="Main navigation">{nav('home', 'Home', 'home')}{nav('search', 'Search', 'search')}{nav('explore', 'Explore', 'explore')}{nav('reels', 'Reels', 'reels')}{nav('messages', 'Messages', 'message')}{nav('notifications', 'Notifications', 'bell')}<button className="nav-link" onClick={() => setCompose(true)}><Icon name="plus"/><span>Create</span></button>{nav('profile', 'Profile', 'heart')}</nav><div className="rail-footer"><span>Demo space · no real accounts</span><small>Local data stays in this browser.</small><small>© 2025 A175</small></div></aside>
    <main className="main-content"><header className="mobile-header"><button className="brand" onClick={() => navTo('home')}><span className="brand-mark">A</span><span>A175</span></button><button className="mobile-create" onClick={() => setCompose(true)} aria-label="Create a post"><Icon name="plus"/></button></header>
      {page === 'profile' ? <Profile user={profile} posts={posts.filter(post => post.handle === profile.handle)} current={profile.handle === me.handle} following={following.includes(profile.handle)} onFollow={() => follow(profile.handle)} onEdit={() => setEditProfile(true)} onOpenPost={setDetailPost} name={displayName} bio={bio}/> : page === 'explore' || page === 'search' ? <Explore query={query} setQuery={setQuery} results={searchResults} posts={posts} onProfile={openProfile} onPost={setDetailPost} searchOnly={page === 'search'}/> : page === 'reels' ? <ReelsPage onLike={() => setFeedback('Liked this demo reel')} onShare={() => setFeedback('Reel sharing is a demo in A175')}/> : page === 'messages' ? <MessagesPage active={activeChat} onActive={setActiveChat} messages={chatMessages} draft={messageDraft} setDraft={setMessageDraft} onSend={sendMessage}/> : page === 'notifications' ? <NotificationsPage onProfile={openProfile} onPost={setDetailPost}/> : <>
        <div className="feed-layout"><section className="feed-column">{page === 'home' && <div className="story-strip"><div className="story-heading"><h2>Stories</h2><span>Demo stories · not live</span></div><div className="stories">{stories.map((story, index) => <button className="story" key={story.handle} onClick={() => setStoryIndex(index)}><span className={`story-ring ring-${index}`}><img src={users.find(user => user.handle === story.handle)?.avatar} alt=""/></span><span>{story.handle}</span></button>)}</div></div>}
          <div className="feed-label"><h2>{page === 'saved' ? 'Saved posts' : 'Your feed'}</h2><span>{visiblePosts.length} moments</span></div>
          {visiblePosts.length ? visiblePosts.map(post => <PostCard key={post.id} post={post} user={users.find(user => user.handle === post.handle) ?? me} commentDraft={commentDrafts[post.id] ?? ''} onDraft={value => setCommentDrafts(current => ({ ...current, [post.id]: value }))} onComment={event => addComment(event, post.id)} onLike={() => togglePost(post.id, 'liked')} onSave={() => togglePost(post.id, 'saved')} onProfile={openProfile} onDetail={() => setDetailPost(post.id)} onMenu={() => setMenuPost(post.id)} onShare={() => sharePost(post.id)}/>) : <Empty title="Nothing saved yet" description="Tap the bookmark on a post and it will be waiting here."/>}
        </section><aside className="right-column"><div className="my-profile"><button onClick={() => openProfile(me.handle)} className="my-profile-link"><img src={me.avatar} alt=""/><span><b>{me.handle}</b><small>{displayName}</small></span></button><button onClick={() => openProfile(me.handle)}>Switch</button></div><div className="suggestions"><div className="suggestion-title"><h2>Suggested for you</h2><button onClick={() => navTo('explore')}>See all</button></div>{users.filter(user => user.handle !== me.handle).slice(0, 4).map(user => <div className="suggestion" key={user.handle}><button className="suggestion-user" onClick={() => openProfile(user.handle)}><img src={user.avatar} alt=""/><span><b>{user.handle}</b><small>Suggested for you</small></span></button><button className="follow-button" onClick={() => follow(user.handle)}>{following.includes(user.handle) ? 'Following' : 'Follow'}</button></div>)}</div><p className="fine-print">About · Help · Privacy · Terms<br/><br/>A175 · Demo content</p></aside></div>
      </>}
    </main><nav className="bottom-nav" aria-label="Mobile navigation">{nav('home', 'Home', 'home')}{nav('search', 'Search', 'search')}{nav('explore', 'Explore', 'explore')}{nav('reels', 'Reels', 'reels')}{nav('messages', 'Messages', 'message')}{nav('notifications', 'Notifications', 'bell')}{nav('profile', 'Profile', 'heart')}</nav>
    {compose && <Modal onClose={cancelComposer} label="Create a new post"><form className="compose-modal" onSubmit={publishPost}><div className="modal-head"><div><span className="eyebrow">SHARE A MOMENT</span><h2>Create a post</h2></div><button type="button" className="close-modal" onClick={cancelComposer} aria-label="Close create post"><Icon name="close"/></button></div>{preview ? <div className="upload-preview"><img src={preview} alt="Preview of your post"/><button type="button" onClick={() => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); setPreview(''); if (picker.current) picker.current.value = '' }}>Remove photo</button></div> : <label className="upload-box" htmlFor="post-image"><span className="upload-icon"><Icon name="plus" size={22}/></span><b>Choose a photo</b><small>JPG, PNG or WebP · up to 10 MB</small><input ref={picker} id="post-image" type="file" accept="image/*" onChange={event => selectImage(event.target.files?.[0])}/></label>}{imageError && <p className="form-error" role="alert">{imageError}</p>}<label className="caption-label" htmlFor="caption">Write a caption</label><textarea id="caption" value={caption} onChange={event => setCaption(event.target.value)} placeholder="What would you like to remember?" rows={3}/><button className="publish-button" disabled={!preview || !caption.trim()}>Share post <span>→</span></button></form></Modal>}
    {storyIndex !== null && <StoryViewer index={storyIndex} onIndex={setStoryIndex} onClose={() => setStoryIndex(null)}/>}
    {currentDetail && <Modal onClose={() => { setDetailPost(null); if (window.location.hash.startsWith('#post-')) history.replaceState(null, '', `${window.location.pathname}${window.location.search}`) }} label="Post details"><div className="detail-layout"><PostCard post={currentDetail} user={users.find(user => user.handle === currentDetail.handle) ?? me} commentDraft={commentDrafts[currentDetail.id] ?? ''} onDraft={value => setCommentDrafts(current => ({ ...current, [currentDetail.id]: value }))} onComment={event => addComment(event, currentDetail.id)} onLike={() => togglePost(currentDetail.id, 'liked')} onSave={() => togglePost(currentDetail.id, 'saved')} onProfile={openProfile} onDetail={() => setDetailPost(currentDetail.id)} onMenu={() => setMenuPost(currentDetail.id)} onShare={() => sharePost(currentDetail.id)}/><button className="detail-close" onClick={() => setDetailPost(null)} aria-label="Close post details"><Icon name="close"/></button></div></Modal>}
    {menuPost && <Modal onClose={() => setMenuPost(null)} label="Post actions"><div className="post-menu"><button className="menu-danger" onClick={() => { setFeedback('Report tools are not connected in this demo'); setMenuPost(null) }}>Report (demo only)</button><button onClick={() => { togglePost(menuPost, 'saved'); setMenuPost(null) }}>{posts.find(post => post.id === menuPost)?.saved ? 'Remove from saved' : 'Save post'}</button><button onClick={() => { void sharePost(menuPost); setMenuPost(null) }}>Copy post link</button><button onClick={() => { setDetailPost(menuPost); setMenuPost(null) }}>View post details</button><button onClick={() => setMenuPost(null)}>Cancel</button></div></Modal>}
    {feedback && <div className="toast" role="status"><span>{feedback}</span><button onClick={() => setFeedback('')} aria-label="Dismiss message"><Icon name="close" size={15}/></button></div>}
    {editProfile && <Modal onClose={() => setEditProfile(false)} label="Edit profile"><form className="compose-modal" onSubmit={event => { event.preventDefault(); setEditProfile(false) }}><div className="modal-head"><h2>Edit profile</h2><button type="button" className="close-modal" onClick={() => setEditProfile(false)} aria-label="Close edit profile"><Icon name="close"/></button></div><label className="caption-label" htmlFor="display-name">Display name</label><input className="image-url-input" id="display-name" value={displayName} onChange={event => setDisplayName(event.target.value)}/><label className="caption-label" htmlFor="profile-bio">Bio</label><textarea id="profile-bio" rows={3} value={bio} onChange={event => setBio(event.target.value)}/><button className="publish-button">Save changes</button></form></Modal>}
  </div>
}

function PostCard({ post, user, commentDraft, onDraft, onComment, onLike, onSave, onProfile, onDetail, onMenu, onShare }: { post: Post; user: User; commentDraft: string; onDraft: (value: string) => void; onComment: (event: FormEvent<HTMLFormElement>) => void; onLike: () => void; onSave: () => void; onProfile: (handle: string) => void; onDetail: () => void; onMenu: () => void; onShare: () => void }) {
  return <article className="post-card"><div className="post-head"><button className="user-button" onClick={() => onProfile(user.handle)}><img src={user.avatar} alt=""/><span><b>{user.handle}</b><small>{post.time} · {post.place}</small></span></button><button className="more-button" onClick={onMenu} aria-label={`More options for ${user.handle}'s post`} title="More options"><Icon name="more"/></button></div><button className="post-image-button" onClick={onDetail} aria-label={`View post by ${user.handle}`}><img className="post-image" src={post.image} alt={`Photo shared by ${user.name}: ${post.caption}`}/></button><div className="post-actions"><div><button className={`action-button ${post.liked ? 'liked' : ''}`} onClick={onLike} aria-label={post.liked ? 'Unlike post' : 'Like post'} aria-pressed={post.liked}><Icon name="heart"/></button><button className="action-button" onClick={() => document.getElementById(`comment-${post.id}`)?.focus()} aria-label="Write a comment"><Icon name="comment"/></button><button className="action-button" onClick={onShare} aria-label="Share post"><Icon name="send"/></button></div><button className={`action-button save-button ${post.saved ? 'saved' : ''}`} onClick={onSave} aria-label={post.saved ? 'Remove bookmark' : 'Bookmark post'} aria-pressed={post.saved}><Icon name="bookmark"/></button></div><div className="post-copy"><b className="like-count">{post.likes.toLocaleString()} likes</b><p><b>{post.handle}</b> {post.caption.split(/(#[\w]+)/g).map((part, i) => part.startsWith('#') ? <span className="hashtag" key={i}>{part}</span> : part)}</p>{post.comments.slice(-2).map(comment => <p className="comment" key={comment.id}><b>{comment.handle}</b> {comment.text}</p>)}{post.comments.length > 2 && <button className="view-comments" onClick={onDetail}>View all {post.comments.length} comments</button>}<span className="post-time">{post.time}</span></div><form className="comment-form" onSubmit={onComment}><input id={`comment-${post.id}`} value={commentDraft} onChange={event => onDraft(event.target.value)} placeholder="Add a comment..." aria-label={`Comment on ${user.handle}'s post`}/><button type="submit" disabled={!commentDraft.trim()}>Post</button></form></article>
}

function Profile({ user, posts, current, following, onFollow, onEdit, onOpenPost, name, bio }: { user: User; posts: Post[]; current: boolean; following: boolean; onFollow: () => void; onEdit: () => void; onOpenPost: (id: string) => void; name: string; bio: string }) {
  const [tab, setTab] = useState<'posts' | 'saved'>('posts')
  const shown = tab === 'saved' && current ? posts.filter(post => post.saved) : posts
  return <section className="profile-page"><div className="profile-cover"/><div className="profile-info"><img src={user.avatar} className="profile-avatar" alt={`${user.name} avatar`}/><div><span className="eyebrow">PHOTO JOURNAL</span><h1>{current ? name : user.name}</h1><p>@{user.handle} · {user.location}</p><p className="profile-bio">{current ? bio : user.bio}</p></div>{current ? <button className="edit-profile" onClick={onEdit}>Edit Profile</button> : <button className="edit-profile" onClick={onFollow}>{following ? 'Following' : 'Follow'}</button>}</div><div className="profile-stats"><span><b>{posts.length}</b> posts</span><span><b>{current ? 824 : following ? 825 : 824}</b> followers</span><span><b>{current ? 306 : 128}</b> following</span></div><div className="profile-tabs"><button className={tab === 'posts' ? 'selected' : ''} onClick={() => setTab('posts')}>Posts</button>{current && <button className={tab === 'saved' ? 'selected' : ''} onClick={() => setTab('saved')}>Saved</button>}</div>{shown.length ? <div className="photo-grid">{shown.map(post => <button key={post.id} className="grid-photo" onClick={() => onOpenPost(post.id)} aria-label={`Open post: ${post.caption}`}><img src={post.image} alt={post.caption}/><span><Icon name="heart" size={16}/> {post.likes}</span></button>)}</div> : <Empty title={tab === 'saved' ? 'No saved posts yet' : 'No posts yet'} description={tab === 'saved' ? 'Bookmark a post to find it here.' : 'When you share a photo, it will show up here.'}/>}</section>
}

function Explore({ query, setQuery, results, posts, onProfile, onPost, searchOnly = false }: { query: string; setQuery: (value: string) => void; results: User[]; posts: Post[]; onProfile: (handle: string) => void; onPost: (id: string) => void; searchOnly?: boolean }) {
  const filtered = query ? posts.filter(post => { const user = users.find(item => item.handle === post.handle); return `${post.caption} ${post.place} ${user?.name} ${post.handle}`.toLowerCase().includes(query.toLowerCase()) }) : posts
  return <section className="explore-page"><header className="page-heading"><div><span className="eyebrow">{searchOnly ? 'FIND YOUR PEOPLE' : 'A WORLD OF PHOTOS'}</span><h1>{searchOnly ? 'Search' : 'Explore'}</h1><p>{searchOnly ? 'Search accounts, captions and places.' : 'Discover photos shared by the A175 community.'}</p></div></header><label className="search-box"><Icon name="search"/><input autoFocus={searchOnly} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people, places, captions..." aria-label="Search people and posts"/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={16}/></button>}</label>{query && <div className="search-results"><h2>Accounts</h2>{results.length ? results.map(user => <button key={user.handle} className="search-result" onClick={() => onProfile(user.handle)}><img src={user.avatar} alt=""/><span><b>{user.handle}</b><small>{user.name}</small></span><Icon name="back"/></button>) : <p className="search-empty">No accounts match “{query}”. Try a different name.</p>}</div>}{!searchOnly && <><h2 className="explore-grid-title">{query ? 'Matching photos' : 'Discover photos'}</h2>{filtered.length ? <div className="explore-grid">{filtered.map((post, index) => <button key={post.id} className={`explore-tile tile-${index % 5}`} onClick={() => onPost(post.id)} aria-label={`Open photo by ${post.handle}: ${post.caption}`}><img src={post.image} alt={post.caption}/><span><Icon name="heart" size={16}/> {post.likes}</span></button>)}</div> : <Empty title="No photos found" description="Try another search, or check back for new moments."/>}</>}</section>
}

function ReelsPage({ onLike, onShare }: { onLike: () => void; onShare: () => void }) {
  const clips = [
    { handle: 'mayasees', poster: image('photo-1470252649378-9c29740c9fa8'), caption: 'A golden hour worth slowing down for. #eveninglight' },
    { handle: 'theo.frames', poster: image('photo-1518837695005-2083093ee35b'), caption: 'Ocean air and nowhere to be. #coast' },
    { handle: 'amara.outside', poster: image('photo-1441974231531-c6227db76b6e'), caption: 'Into the green we go. #outside' },
  ]
  return <section className="reels-page"><header className="section-heading"><div><h1>Reels</h1><p>Short video previews · demo content</p></div><span>Not live</span></header><div className="reels-list">{clips.map((clip, index) => <article className="reel-card" key={clip.handle}><video controls playsInline preload="none" poster={clip.poster} aria-label={`Demo reel by ${clip.handle}`}><source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4"/>Your browser does not support demo video.</video><div className="reel-caption"><b>@{clip.handle}</b><p>{clip.caption}</p><small>Sample video {index + 1} · demo clip</small></div><div className="reel-actions"><button onClick={onLike} aria-label="Like demo reel"><Icon name="heart"/></button><button onClick={onShare} aria-label="Share demo reel"><Icon name="send"/></button></div></article>)}</div></section>
}

function MessagesPage({ active, onActive, messages, draft, setDraft, onSend }: { active: string; onActive: (handle: string) => void; messages: Record<string, DemoMessage[]>; draft: string; setDraft: (value: string) => void; onSend: (event: FormEvent<HTMLFormElement>) => void }) {
  const conversations = users.filter(user => user.handle !== me.handle).slice(0, 3)
  const user = users.find(item => item.handle === active) ?? conversations[0]
  return <section className="messages-page"><div className="messages-panel"><aside className="conversation-list"><header><h1>Messages</h1><span>Demo inbox</span></header>{conversations.map(person => <button key={person.handle} className={`conversation ${active === person.handle ? 'selected' : ''}`} onClick={() => onActive(person.handle)}><img src={person.avatar} alt=""/><span><b>{person.name}</b><small>{person.note}</small></span></button>)}</aside><section className="chat-panel"><header><img src={user.avatar} alt=""/><span><b>{user.name}</b><small>@{user.handle} · demo chat</small></span></header><div className="chat-notice">Messages are local demo content and are not sent to anyone.</div><div className="chat-messages">{(messages[active] ?? []).map((message, index) => <p key={`${active}-${index}`} className={`chat-bubble ${message.from === 'me' ? 'mine' : ''}`}>{message.text}</p>)}{!(messages[active] ?? []).length && <p className="chat-empty">No messages yet. Start a demo conversation.</p>}</div><form className="chat-compose" onSubmit={onSend}><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a demo message..." aria-label="Write a demo message"/><button disabled={!draft.trim()}>Send</button></form></section></div></section>
}

function NotificationsPage({ onProfile, onPost }: { onProfile: (handle: string) => void; onPost: (id: string) => void }) {
  return <section className="notifications-page"><header className="section-heading"><div><h1>Notifications</h1><p>Sample activity from demo accounts.</p></div></header><h2>This week</h2><button className="notification-row" onClick={() => onProfile('mayasees')}><img src={users[1].avatar} alt=""/><span><b>mayasees</b> started following you. <small>2h</small></span><span className="notification-action">View profile</span></button><button className="notification-row" onClick={() => onPost('p1')}><img src={users[4].avatar} alt=""/><span><b>softfocus</b> liked a photo you may enjoy. <small>5h</small></span><img className="notification-thumb" src={initialPosts[0].image} alt="Post preview"/></button><button className="notification-row" onClick={() => onProfile('amara.outside')}><img src={users[3].avatar} alt=""/><span><b>amara.outside</b> and 12 others shared new photos. <small>1d</small></span></button><p className="demo-caption">Notifications are examples only. A175 does not connect to real accounts.</p></section>
}

function Empty({ title, description }: { title: string; description: string }) { return <div className="empty-state"><span>✳</span><h2>{title}</h2><p>{description}</p></div> }
function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const frame = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const controls = () => frame.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')
    controls()?.[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
      if (event.key === 'Tab') {
        const items = controls()
        if (!items?.length) return
        const first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [])
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div ref={frame} className="modal-frame" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div></div>
}
function StoryViewer({ index, onIndex, onClose }: { index: number; onIndex: (index: number) => void; onClose: () => void }) { const story = stories[index]; const user = users.find(item => item.handle === story.handle) ?? me; return <Modal onClose={onClose} label={`${user.name}'s story`}><div className="story-viewer" style={{ backgroundImage: `linear-gradient(0deg, #0009, transparent 38%), url("${story.image}")` }}><div className="story-progress">{stories.map((item, i) => <span key={item.handle} className={i <= index ? 'done' : ''}/>)}</div><div className="story-viewer-head"><img src={user.avatar} alt=""/><b>{user.handle}</b><small>Today</small><button onClick={onClose} aria-label="Close story"><Icon name="close"/></button></div><button className="story-nav story-prev" onClick={() => onIndex((index - 1 + stories.length) % stories.length)} aria-label="Previous story"><Icon name="back"/></button><p>{story.caption}</p><button className="story-nav story-next" onClick={() => onIndex((index + 1) % stories.length)} aria-label="Next story"><Icon name="back"/></button></div></Modal> }

export default App
