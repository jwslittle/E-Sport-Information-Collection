# E-Sport SuperTeam (LCK Fantasy League)

## Project Overview
**E-Sport SuperTeam** is a fan-made fantasy sports platform dedicated to LCK (League of Legends Champions Korea). It allows fans to create their own dream teams using real LCK players, compete based on match performance, and engage with various gamification features like AI analysis and match predictions.

This project is developed as a personal portfolio and fan project to demonstrate web development skills and passion for LoL Esports.

## Key Features
- **My Team Building**: Build a 5-man roster + 1 wildcard within a salary cap.
- **Fantasy Point System**: Points are calculated based on K/D/A, CS, Vision Score, and Objectives.
- **Simulation Engine**: Simulates match results for off-season entertainment.
- **Point Shop**: Purchase cosmetic mascots and utility items with earned points.
- **AI Analyst**: Get team building advice from an AI chatbot powered by RAG.
- **Prediction Challenge**: Predict match winners and events (Risk-free).

## Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI**: LangChain, OpenAI API
- **Data Source**: Riot Games API (Planned/In-progress)

## Legal Disclaimer
**E-Sport SuperTeam** isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/e-sport-fantasy.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env`):
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
