'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
    MessageSquare, ThumbsUp, Eye, PenSquare, Search, RefreshCw,
    ChevronLeft, ChevronRight, Loader2, Pin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface PostItem {
    id: string; title: string; category: string
    viewCount: number; isPinned: boolean; createdAt: string
    author: { id: string; name: string | null; image: string | null; displayTitle: string | null }
    commentCount: number; likeCount: number
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
    { value: 'ALL',        label: '전체',     color: 'bg-zinc-700 text-zinc-300' },
    { value: 'FREE',       label: '자유',     color: 'bg-blue-900/50 text-blue-300' },
    { value: 'ANALYSIS',   label: '분석',     color: 'bg-green-900/50 text-green-300' },
    { value: 'PREDICTION', label: '예측토론', color: 'bg-yellow-900/50 text-yellow-300' },
    { value: 'INFO',       label: '정보',     color: 'bg-purple-900/50 text-purple-300' },
]

function CategoryBadge({ category }: { category: string }) {
    const cat = CATEGORIES.find(c => c.value === category)
    return (
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', cat?.color ?? 'bg-zinc-700 text-zinc-400')}>
            {cat?.label ?? category}
        </span>
    )
}

function timeAgo(dateStr: string) {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko })
    } catch {
        return dateStr
    }
}

// ─── 글쓰기 모달 ──────────────────────────────────────────────────────────────
function WriteDialog({ open, onClose, onCreated }: {
    open: boolean; onClose: () => void; onCreated: () => void
}) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('FREE')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('제목과 내용을 입력해주세요.')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch('/api/community', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category }),
            })
            const d = await res.json()
            if (res.ok) {
                toast.success('게시글이 등록되었습니다!')
                setTitle(''); setContent(''); setCategory('FREE')
                onCreated()
                onClose()
            } else {
                toast.error(d.error ?? '글 작성에 실패했습니다.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle>게시글 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    {/* 카테고리 */}
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.filter(c => c.value !== 'ALL').map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={cn(
                                    'text-xs px-3 py-1.5 rounded-lg border transition-all',
                                    category === cat.value
                                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300'
                                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    {/* 제목 */}
                    <Input
                        placeholder="제목 (최대 100자)"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        maxLength={100}
                        className="bg-zinc-950 border-zinc-700 text-white"
                    />
                    {/* 내용 */}
                    <Textarea
                        placeholder="내용을 작성해주세요. (최대 5000자)"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        maxLength={5000}
                        rows={8}
                        className="bg-zinc-950 border-zinc-700 text-white resize-none"
                    />
                    <p className="text-xs text-zinc-600 text-right">{content.length} / 5000</p>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>취소</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !title.trim() || !content.trim()}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '등록'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function CommunityPage() {
    const { data: session } = useSession()
    const router = useRouter()

    const [posts, setPosts] = useState<PostItem[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [page, setPage] = useState(1)
    const [category, setCategory] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [writeOpen, setWriteOpen] = useState(false)

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), category })
            const res = await fetch(`/api/community?${params}`)
            if (res.ok) {
                const d = await res.json()
                setPosts(d.posts)
                setTotal(d.total)
                setTotalPages(d.totalPages)
            }
        } finally {
            setLoading(false)
        }
    }, [page, category])

    useEffect(() => { fetchPosts() }, [fetchPosts])

    const handleCategoryChange = (cat: string) => {
        setCategory(cat)
        setPage(1)
    }

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <MessageSquare className="w-7 h-7 text-blue-400" />
                        커뮤니티
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">LCK 팬들과 자유롭게 소통하세요</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchPosts} className="hover:bg-zinc-800">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    {session && (
                        <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold gap-1.5"
                            onClick={() => setWriteOpen(true)}
                        >
                            <PenSquare className="w-4 h-4" /> 글쓰기
                        </Button>
                    )}
                </div>
            </div>

            {/* 카테고리 탭 */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => handleCategoryChange(cat.value)}
                        className={cn(
                            'text-sm px-4 py-1.5 rounded-full border transition-all',
                            category === cat.value
                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300 font-medium'
                                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                        )}
                    >
                        {cat.label}
                        {cat.value !== 'ALL' && (
                            <span className="ml-1.5 text-xs text-zinc-600">{cat.value === category ? total : ''}</span>
                        )}
                    </button>
                ))}
                <span className="text-xs text-zinc-600 self-center ml-auto">총 {total}개</span>
            </div>

            {/* 게시글 목록 */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500">아직 게시글이 없습니다.</p>
                    {session && (
                        <Button
                            variant="outline"
                            className="border-yellow-600/50 text-yellow-400"
                            onClick={() => setWriteOpen(true)}
                        >
                            첫 글을 작성해보세요
                        </Button>
                    )}
                </div>
            ) : (
                <div className="divide-y divide-zinc-800/60">
                    {posts.map(post => (
                        <Link
                            key={post.id}
                            href={`/community/${post.id}`}
                            className="flex items-start gap-3 py-4 hover:bg-zinc-900/40 px-2 -mx-2 rounded-lg transition-colors"
                        >
                            {/* 왼쪽: 카테고리 + 제목 */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {post.isPinned && (
                                        <Pin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                    )}
                                    <CategoryBadge category={post.category} />
                                    <span className="font-medium text-white text-sm leading-tight truncate">
                                        {post.title}
                                    </span>
                                    {post.commentCount > 0 && (
                                        <span className="text-blue-400 text-xs font-medium shrink-0">
                                            [{post.commentCount}]
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={post.author.image ?? ''} />
                                            <AvatarFallback className="text-[8px] bg-zinc-800">
                                                {post.author.name?.[0] ?? 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{post.author.name ?? '익명'}</span>
                                        {post.author.displayTitle && (
                                            <span className="text-yellow-600">{post.author.displayTitle}</span>
                                        )}
                                    </div>
                                    <span>{timeAgo(post.createdAt)}</span>
                                </div>
                            </div>

                            {/* 오른쪽: 조회수, 좋아요 */}
                            <div className="flex items-center gap-3 text-xs text-zinc-600 shrink-0">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />{post.viewCount}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ThumbsUp className="w-3.5 h-3.5" />{post.likeCount}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                        variant="outline" size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className="border-zinc-700 text-zinc-400"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-zinc-400">{page} / {totalPages}</span>
                    <Button
                        variant="outline" size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="border-zinc-700 text-zinc-400"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* 글쓰기 모달 */}
            <WriteDialog
                open={writeOpen}
                onClose={() => setWriteOpen(false)}
                onCreated={fetchPosts}
            />
        </div>
    )
}
