const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, email, name, avatar_url FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        const existing = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [
          profile.id,
          email,
        ]);

        if (existing.rows.length > 0) {
          const user = existing.rows[0];
          if (user.google_id !== profile.id) {
            await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [
              profile.id,
              profile.photos?.[0]?.value,
              user.id,
            ]);
          }
          return done(null, user);
        }

        const inserted = await pool.query(
          'INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
          [profile.id, email, profile.displayName, profile.photos?.[0]?.value]
        );
        return done(null, inserted.rows[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
