# SchemeX

SchemeX matches Indian entrepreneurs with government schemes, explains eligibility, calculates estimates, and provides application guidance.

## Local development

```bash
npm install
npm run dev:full
```

The frontend runs on port `8443` and the API on port `8787`. Local mode includes SQLite-backed accounts, profiles, and scheme management. It is for development only.

## Production deployment

Use Supabase for production authentication, user profiles, roles, and scheme management. Add these build-time environment variables in your hosting provider:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor, create the administrator account, and set its email in the role setup query.

### Docker

The container builds the React client and serves it together with the Express API on `PORT` (default `3000`).

```bash
docker build -t schemex .
docker run -p 3000:3000 -e PORT=3000 schemex
```

For production, local password authentication is disabled automatically. Do not set `ALLOW_LOCAL_AUTH=true` on a public deployment.
