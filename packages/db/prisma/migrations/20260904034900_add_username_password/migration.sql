-- 手写 apply（v1 简化登录：用户名 + 密码 hash 代替邮箱魔法链接）
-- 配套 prisma/schema.prisma 同步：User.email 改 nullable，加 username + passwordHash
ALTER TABLE "User" ADD COLUMN "username" TEXT NOT NULL;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
