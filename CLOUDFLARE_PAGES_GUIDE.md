# מדריך פריסה ל-Cloudflare Pages (Next.js)

כדי להעלות את המערכת "המזווה החכם" ל-Cloudflare Pages, יש צורך בביצוע מספר התאמות, שכן המערכת כרגע משתמשת במסד נתונים מקומי מסוג SQLite (הקובץ `dev.db`), שאינו נתמך בסביבת "Serverless" (ענן ללא שרת כמו Cloudflare, Vercel וכו').

להלן השלבים והפתרונות:

## שלב 1: התאמת מסד הנתונים (חובה)
Cloudflare Pages מריץ קוד בענן ואין לו "כונן קשיח" קבוע לשמור בו את קובץ ה-SQLite שלך.
לכן, תצטרך להחליף את ה-SQLite במסד נתונים מרוחק, כגון:
1. **Cloudflare D1**: מסד הנתונים הרשמי של Cloudflare שמשתלב מעולה עם Pages.
2. **Neon / Supabase**: מסדי נתונים (PostgreSQL) מעולים וחינמיים שקל לחבר ל-Prisma.

כדי לתמוך באחד מהם, יש לשנות את קובץ ה-`prisma/schema.prisma` כדי שישתמש ב-PostgreSQL למשל, להריץ `npx prisma db push` מול השרת החדש, ולעדכן את מחרוזת החיבור (`DATABASE_URL`) בקובץ ה-`.env`.

## שלב 2: הגדרת הפרויקט ל-Cloudflare Pages
יש להשתמש בחבילה המיוחדת של Cloudflare עבור Next.js.
במסוף הפקודות בתיקיית הפרויקט, הרץ:
```bash
npm install -D @cloudflare/next-on-pages eslint-plugin-next-on-pages
```

## שלב 3: חיבור החשבון והעלאה במערכת Cloudflare

1. היכנס לחשבון שלך ב-[Cloudflare Dashboard](https://dash.cloudflare.com).
2. בתפריט הצד לחץ על **Workers & Pages**.
3. לחץ על **Create application** ואז בחר בלשונית **Pages**.
4. לחץ על **Connect to Git** ובחר בחשבון ה-GitHub שלך.
5. בחר במאגר שהעלינו עכשיו: `JacKap990/v1.0`
6. בהגדרות הבנייה (Build settings) של Cloudflare, הגדר כך:
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`

7. הגדר משתני סביבה (Environment variables) ב-Cloudflare (תחת הגדרות הפרויקט) עם ה-`DATABASE_URL` החדש שלך ומפתחות ה-AI/Auth (Google Gemini, NextAuth Secret וכו').
8. **חשוב מאוד: דגל תאימות (Compatibility flags)** - רד מעט למטה באותו מסך ל-Compatibility flags, הוסף דגל חדש והקלד: `nodejs_compat`. זה קריטי כדי ש-Prisma ו-NextAuth יעבדו ללא תקלות.
9. לחץ על **Save and Deploy**.

Cloudflare ייקח את הקוד מה-Git, יבנה אותו, ויעניק לך כתובת URL ציבורית ברגע שהוא יסיים!
