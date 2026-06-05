'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    ThumbsUp, Eye, MessageSquare, ArrowLeft, Trash2,
    Loader2, Send, Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { UserName } from '@/components/admin-badge'

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface PostDetail {
    id: string; title: string; content: string; category: string
    viewCount: number; isPinned: boolean; likeCount: number; isLiked: boolean
    commentCount: number; createdAt: string; updatedAt: string
    author: { id: string; name: string | null; image: string | null; role: string; displayTitle: string | null }
}
interface CommentItem {
    id: string; content: string; createdAt: string
    author: { id: string; name: string | null; image: string | null; role: string; displayTitle: string | null }
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
    FREE: '자유', ANALYSIS: '분석', PREDICTION: '예측토론', INFO: '정보'
}

function timeAgo(dateStr: string) {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko })
    } catch { return dateStr }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
// Next.js 16에서 params는 Promise — React.use()로 언래핑
export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: postId } = use(params)
    const { data: session } = useSession()
    const router = useRouter()

    const [post, setPost] = useState<PostDetail | null>(null)
    const [comments, setComments] = useState<CommentItem[]>([])
    const [loadingPost, setLoadingPost] = useState(true)
    const [commentText, setCommentText] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const myId = (session?.user as any)?.id
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    const fetchPost = useCallback(async () => {
        const [postRes, commentsRes] = await Promise.all([
            fetch(`/api/community/${postId}`),
            fetch(`/api/community/${postId}/comments`),
        ])
        if (postRes.ok) setPost(await postRes.json())
        else router.push('/community')
        if (commentsRes.ok) setComments(await commentsRes.json())
        setLoadingPost(false)
    }, [postId, router])

    useEffect(() => { fetchPost() }, [fetchPost])

    const handleLike = async () => {
        if (!session) { toast.error('로그인이 필요합니다.'); return }
        setLikeLoading(true)
        try {
            const res = await fetch(`/api/community/${postId}/like`, { method: 'POST' })
            if (res.ok) {
                const d = await res.json()
                setPost(prev => prev ? { ...prev, isLiked: d.liked, likeCount: d.likeCount } : prev)
            }
        } finally { setLikeLoading(false) }
    }

    const handleComment = async () => {
        if (!commentText.trim()) return
        setSubmittingComment(true)
        try {
            const res = await fetch(`/api/community/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentText }),
            })
            const d = await res.json()
            if (res.ok) {
                setComments(prev => [...prev, d])
                setCommentText('')
                setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev)
            } else {
                toast.error(d.error ?? '댓글 작성 실패')
            }
        } finally { setSubmittingComment(false) }
    }

    const handleDelete = async () => {
        if (!confirm('게시글을 삭제하시겠습니까?')) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/community/${postId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('삭제되었습니다.')
                router.push('/community')
            } else {
                const d = await res.json()
                toast.error(d.error ?? '삭제 실패')
            }
        } finally { setDeleting(false) }
    }

    if (loadingPost) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    if (!post) return null

    return (
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {/* 뒤로가기 */}
            <Link href="/community" className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> 커뮤니티로
            </Link>

            {/* 게시글 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
                {/* 헤더 */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                                {CATEGORY_LABELS[post.category] ?? post.category}
                            </span>
                            <h1 className="text-xl font-bold text-white leading-tight">{post.title}</h1>
                        </div>
                        {(myId === post.author.id || isAdmin) && (
                            <Button
                                variant="ghost" size="sm"
                                aria-label="게시글 삭제"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                        )}
                    </div>

                    {/* 작성자 정보 */}
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={post.author.image ?? ''} />
                                <AvatarFallback className="text-[10px] bg-zinc-800">
                                    {post.author.name?.[0] ?? 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <Link href={`/profile/${post.author.id}`} className="hover:opacity-80 transition-opacity">
                                <UserName name={post.author.name} role={post.author.role} />
                            </Link>
                            {post.author.displayTitle && post.author.role !== 'ADMIN' && (
                                <span className="text-yellow-600 text-xs flex items-center gap-0.5">
                                    <Crown className="w-3 h-3" />
                                    {post.author.displayTitle}
                                </span>
                            )}
                        </div>
                        <span className="text-zinc-600">·</span>
                        <span className="text-xs">{timeAgo(post.createdAt)}</span>
                        <span className="flex items-center gap-1 text-xs text-zinc-600 ml-auto">
                            <Eye className="w-3.5 h-3.5" />{post.viewCount}
                        </span>
                    </div>
                </div>

                <hr className="border-zinc-800" />

                {/* 본문 */}
                <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                    {post.content}
                </div>

                <hr className="border-zinc-800" />

                {/* 좋아요 */}
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        className={cn(
                            'gap-2 px-6 border-zinc-700 transition-all',
                            post.isLiked
                                ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                                : 'text-zinc-400 hover:border-blue-700 hover:text-blue-300'
                        )}
                        onClick={handleLike}
                        disabled={likeLoading}
                    >
                        {likeLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <ThumbsUp className="w-4 h-4" />}
                        좋아요 {post.likeCount}
                    </Button>
                </div>
            </div>

            {/* 댓글 섹션 */}
            <div className="space-y-4">
                <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    댓글 {post.commentCount}개
                </h2>

                {/* 댓글 목록 */}
                {comments.length > 0 ? (
                    <div className="space-y-3">
                        {comments.map(comment => (
                            <div key={comment.id} className={cn(
                                'border rounded-lg p-4 space-y-2',
                                comment.author.role === 'ADMIN'
                                    ? 'bg-red-950/10 border-red-900/30'
                                    : 'bg-zinc-900/40 border-zinc-800'
                            )}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={comment.author.image ?? ''} />
                                        <AvatarFallback className="text-[10px] bg-zinc-800">
                                            {comment.author.name?.[0] ?? 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Link href={`/profile/${comment.author.id}`} className="hover:opacity-80 transition-opacity">
                                        <UserName name={comment.author.name} role={comment.author.role} />
                                    </Link>
                                    {comment.author.displayTitle && comment.author.role !== 'ADMIN' && (
                                        <span className="text-yellow-600 text-xs">{comment.author.displayTitle}</span>
                                    )}
                                    <span className="text-xs text-zinc-600 ml-auto">{timeAgo(comment.createdAt)}</span>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-6 text-zinc-600 text-sm">첫 댓글을 남겨보세요!</p>
                )}

                {/* 댓글 작성 */}
                {session ? (
                    <div className="flex gap-2 items-end">
                        <Textarea
                            placeholder="댓글을 입력하세요... (최대 1000자)"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            className="bg-zinc-900 border-zinc-700 text-white resize-none flex-1"
                            onKeyDown={e => {
                                if (e.key === 'Enter' && e.ctrlKey) handleComment()
                            }}
                        />
                        <Button
                            onClick={handleComment}
                            disabled={submittingComment || !commentText.trim()}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-full min-h-[80px]"
                        >
                            {submittingComment
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-4 text-zinc-500 text-sm">
                        <Link href="/auth/signin" className="text-yellow-400 hover:text-yellow-300">로그인</Link>
                        {' '}후 댓글을 달 수 있습니다.
                    </div>
                )}
            </div>
        </div>
    )
}
