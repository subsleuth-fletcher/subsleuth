import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  organizations,
  orgMembers,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "../auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = getDb();

  return {
    ...authConfig,
    // Override providers to include Resend (requires adapter)
    providers: [
      Resend({
        from: process.env.EMAIL_FROM || "SubSleuth <noreply@subsleuth.com>",
      }),
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: {
      strategy: "jwt",
    },
    callbacks: {
      ...authConfig.callbacks,
      async session({ session, token }) {
        // Add user id to session
        session.user.id = token.sub;

        // Find user's organization (either owned or member)
        const userOrg = await db.query.organizations.findFirst({
          where: eq(organizations.ownerId, user.id),
        });

        if (userOrg) {
          session.user.organizationId = userOrg.id;
          session.user.organizationPlan = userOrg.plan;
          session.user.previewEndsAt = userOrg.previewEndsAt?.toISOString() ?? null;
        } else {
          // Check if user is a member of any org
          const membership = await db.query.orgMembers.findFirst({
            where: eq(orgMembers.userId, user.id),
            with: { organization: true },
          });
          if (membership) {
            session.user.organizationId = membership.orgId;
            session.user.organizationPlan = membership.organization.plan;
            session.user.previewEndsAt = membership.organization.previewEndsAt?.toISOString() ?? null;
          }
        }

        return session;
      },
    },
    events: {
      async createUser({ user }) {
        // Auto-create a default organization for new users
        if (!user.id || !user.email) return;

        const orgName = user.name
          ? `${user.name}'s Organization`
          : `${user.email.split("@")[0]}'s Organization`;

        // New organizations start in 7-day preview mode
        const now = new Date();
        const previewEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [newOrg] = await db
          .insert(organizations)
          .values({
            name: orgName,
            ownerId: user.id,
            previewStartedAt: now,
            previewEndsAt: previewEndsAt,
          })
          .returning();

        // Also add user as admin member
        await db.insert(orgMembers).values({
          orgId: newOrg.id,
          userId: user.id,
          role: "admin",
        });
      },
    },
  };
});

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      organizationId?: string;
      organizationPlan?: "starter" | "growth" | "business" | null;
      previewEndsAt?: string | null;
    };
  }
}
