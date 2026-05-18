import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { comparePassword } from "@/lib/utils/auth-helper";
import { loginSchema } from "@/lib/validators/auth.validator";
const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authConfig: NextAuthConfig = {
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
          .select("+password")
          .lean();

        if (!user?.password || !user.isActive) return null;

        const valid = await comparePassword(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      await connectDB();
      const email = user.email?.toLowerCase();
      if (!email) return false;

      let dbUser = await User.findOne({ email });
      if (!dbUser) {
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
        dbUser = await User.create({
          name: user.name ?? "User",
          email,
          avatar: user.image ?? undefined,
          googleId: account.providerAccountId,
          role: email === adminEmail ? "admin" : "user",
          emailVerified: new Date(),
        });
      } else if (!dbUser.googleId) {
        dbUser.googleId = account.providerAccountId;
        if (user.image) dbUser.avatar = user.image;
        await dbUser.save();
      }

      user.id = dbUser._id.toString();
      (user as { role?: string }).role = dbUser.role;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.role =
          ((user as { role?: "user" | "admin" }).role ?? "user") as "user" | "admin";
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.picture = session.avatar ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.name = token.name;
        session.user.email = token.email ?? "";
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
};
