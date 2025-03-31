import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { MessageBubble } from '../atoms/message-bubble';
import { Avatar, AvatarFallback, AvatarImage } from '../atoms/avatar';

interface MessageItem {
  id: string;
  sender: string;
  avatar: string;
  time: string; // ISO string
  content: React.ReactNode;
  isSelf?: boolean;
}

interface MessageGroup {
  sender: string;
  avatar: string;
  time: string;
  messages: MessageItem[];
}

interface MessagesProps {
  messages: MessageItem[];
  className?: string;
}

const groupMessages = (messages: MessageItem[]) => {
  const grouped: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((msg) => {
    const msgTime = new Date(msg.time).getTime();

    if (
      !currentGroup ||
      currentGroup.sender !== msg.sender ||
      msgTime - new Date(currentGroup.time).getTime() > 60000
    ) {
      currentGroup = {
        sender: msg.sender,
        avatar: msg.avatar,
        time: msg.time,
        messages: [msg],
      };
      grouped.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  return grouped;
};

const Message = ({ messages, className }: MessagesProps) => {
  const groupedMessages = groupMessages(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={className}>
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4">
          <div
            className={`flex gap-3 ${
              group.messages[0].isSelf ? 'flex-row-reverse' : ''
            }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={group.avatar} alt={group.sender} />
              <AvatarFallback>{group.sender.substring(0, 1)}</AvatarFallback>
            </Avatar>
            <div
              className={`flex flex-col gap-1 max-w-[80%] ${
                group.messages[0].isSelf ? 'items-end' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {group.messages[0].isSelf ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(group.time), 'HH:mm')}
                    </span>
                    <span className="font-semibold">{group.sender}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{group.sender}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(group.time), 'HH:mm')}
                    </span>
                  </>
                )}
              </div>
              {group.messages.map((msg, msgIndex) => (
                <MessageBubble
                  key={msg.id}
                  variant={msg.isSelf ? 'sent' : 'received'}
                >
                  {msg.content}
                </MessageBubble>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />{' '}
      {/* 🔥 This keeps the scroll at the bottom */}
    </div>
  );
};

export default Message;
