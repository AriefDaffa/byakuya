-- CreateTable
CREATE TABLE "PrivateChat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateChatUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "privateChatId" TEXT NOT NULL,

    CONSTRAINT "PrivateChatUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChatUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupChatId" TEXT NOT NULL,

    CONSTRAINT "GroupChatUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "privateChatId" TEXT,
    "groupChatId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateChatUser_userId_privateChatId_key" ON "PrivateChatUser"("userId", "privateChatId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupChatUser_userId_groupChatId_key" ON "GroupChatUser"("userId", "groupChatId");

-- AddForeignKey
ALTER TABLE "PrivateChatUser" ADD CONSTRAINT "PrivateChatUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateChatUser" ADD CONSTRAINT "PrivateChatUser_privateChatId_fkey" FOREIGN KEY ("privateChatId") REFERENCES "PrivateChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChatUser" ADD CONSTRAINT "GroupChatUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChatUser" ADD CONSTRAINT "GroupChatUser_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "GroupChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_privateChatId_fkey" FOREIGN KEY ("privateChatId") REFERENCES "PrivateChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "GroupChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
