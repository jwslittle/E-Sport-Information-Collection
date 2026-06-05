import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { AuthProvider } from "@/components/auth-provider";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/ui/page-transition";
import { Toaster } from "sonner";
import { QuestTracker } from "@/components/quest-tracker";

// 영문 폰트 (숫자·영어 전용)
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

// 한국어 폰트 — Next.js Google Fonts (CJK 폰트는 subset 대신 display 설정)
const notoSansKR = Noto_Sans_KR({
    weight: ['400', '500', '700', '900'],
    variable: '--font-noto-kr',
    display: 'swap',
    preload: false, // CJK 폰트는 용량이 커서 preload 비활성화 권장
});

export const metadata: Metadata = {
  metadataBase: new URL('https://e-sport-information-collection.vercel.app'),
  title: {
    default: "E-Sport Information Collection",
    template: "%s | E-Sport IC",
  },
  description: "LCK 경기 예측, 퀴즈, 팀 정보를 한 곳에서. 비상업적 팬 프로젝트.",
  keywords: ["LCK", "리그 오브 레전드", "e스포츠", "판타지", "경기 예측", "팬"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://e-sport-information-collection.vercel.app",
    siteName: "E-Sport Information Collection",
    title: "E-Sport Information Collection",
    description: "LCK 경기 예측, 퀴즈, 팀 정보를 한 곳에서. 비상업적 팬 프로젝트.",
    images: [
      {
        // Next.js app/opengraph-image.tsx 에서 자동 생성 (Edge Runtime)
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "E-Sport Information Collection — LCK 경기 예측 리그",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "E-Sport Information Collection",
    description: "LCK 경기 예측, 퀴즈, 팀 정보를 한 곳에서.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // userScalable: false 제거 — 접근성(WCAG 1.4.4): 저시력 사용자의 확대 기능 보장
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansKR.variable} font-sans bg-zinc-950 text-white min-h-screen flex flex-col`}>
        <AuthProvider>
          <QuestTracker />
          <Navbar />
          <main className="container mx-auto px-4 py-8 flex-1 pb-24 md:pb-8">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#18181b', border: '1px solid #3f3f46', color: '#fff' },
              className: 'text-sm',
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
