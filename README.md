# E-Sport Information Collection

## Project Overview
**E-Sport Information Collection** is a non-commercial fan platform for LCK (League of Legends Champions Korea). It automatically collects real LCK match schedules and results, and lets fans predict match outcomes, chat with an AI analyst, compare real player stats, and compete on a GP (in-app point) leaderboard.

This project is developed as a personal portfolio project to demonstrate full-stack web development and applied AI (LLM/RAG) skills, combined with a genuine interest in LoL Esports.

## Key Features
- **Match Schedule Collection**: Automatically syncs real LCK/MSI/Worlds/First Stand/EWC schedules and results via scheduled Vercel Cron jobs.
- **Match Prediction**: Predict real match winners and events to earn GP (risk-free, for fun).
- **AI Analyst**: Chat with an AI analyst (RAG-grounded on real historical team/player stats) for match insights, plus a daily AI-generated briefing.
- **Player & Team Stats**: Compare real players' KDA/CS/DPM/vision stats and browse team season records.
- **Ranking**: Prediction leaderboard, GP ranking, and a friends list.
- **Daily Quiz & Quests**: Earn GP through daily LCK trivia quizzes and quests/achievements.
- **GP Shop**: Spend earned GP on cosmetic mascots, profile titles, and other non-commercial items.
- **Community Board**: Post, comment, and discuss with other LCK fans.
- **Item Auction**: Peer-to-peer cosmetic item trading (in progress).

> Note: An earlier version of this project explored a salary-cap "build your own virtual roster" fantasy mode with fictional teams/players. That mode has since been discontinued in favor of the real-match prediction format above; some legacy code/seed data for it may still exist in the repository history.

## Technology Stack
- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth (Google OAuth)
- **AI**: LangChain, OpenAI API — lightweight RAG over structured match/player data (no vector DB)
- **Infra**: Vercel (hosting + Cron), Upstash Redis (caching / rate limiting), Sentry (error monitoring), Cloudinary (image hosting)
- **Data Source**: Match schedules/results via [LoL Esports](https://lolesports.com); historical player/team stats via [Oracle's Elixir](https://oracleselixir.com)

## Legal Disclaimer
This is a **non-commercial fan project** — no paid transactions, advertisements, or commercial gain of any kind. **E-Sport Information Collection** isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties, are trademarks or registered trademarks of Riot Games, Inc.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/jwslittle/E-Sport-Information-Collection.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env`) — see `.env.example` for the full list:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="..."
   NEXTAUTH_URL="http://localhost:3000"
   OPENAI_API_KEY="..."
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed initial data:
   ```bash
   npx tsx prisma/seed-shop.ts
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## License
This project is licensed under the MIT License.
