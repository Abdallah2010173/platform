import { prisma } from '../src';

async function main() {
  const counts = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    sessions: await prisma.session.count(),
    refreshTokens: await prisma.refreshToken.count(),
    oauthStates: await prisma.oAuthState.count(),
    emailVerificationTokens: await prisma.emailVerificationToken.count(),
    passwordResetTokens: await prisma.passwordResetToken.count(),
  };

  console.log('Development account reset preview:');
  console.log(JSON.stringify(counts, null, 2));

  if (process.env.NODE_ENV === 'production' || !process.argv.includes('--confirm')) {
    console.log('No data was deleted. Run with NODE_ENV=development and --confirm to execute.');
    return;
  }

  await prisma.user.deleteMany({});
  console.log('Deleted all users and cascading user-owned authentication/application records. Global configuration was preserved.');
}

main().finally(() => prisma.$disconnect());
