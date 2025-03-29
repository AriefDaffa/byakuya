import Link from 'next/link';

import { ScrollArea } from '@/components/atoms/scroll-area';
import Message from '../molecules/Message';

interface MessageThreadProps {
  className?: string;
}

const MessageThread = ({ className }: MessageThreadProps) => {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${className}`}>
      <ScrollArea className="flex-1 px-4 h-1">
        <div className="flex flex-col gap-6">
          <div className="text-center text-sm text-muted-foreground">
            Today, April 11
          </div>

          <Message
            sender="Raulll"
            avatar="/placeholder.svg?height=40&width=40"
            time="09:18 AM"
            content={<p>Guysss cek Figmaku dong, minta feedbacknyaa</p>}
            mentions={['Momon', 'Fazaa', 'Farhan']}
          />

          <Message
            sender="You"
            avatar="/placeholder.svg?height=40&width=40"
            time="09:19 AM"
            content={<p>Gokill Bangetttt!</p>}
            isSelf={true}
          />

          <Message
            sender="Farhan"
            avatar="/placeholder.svg?height=40&width=40"
            time="05:01 PM"
            content={
              <>
                <div className="w-64 h-48 bg-gray-800 rounded-lg flex items-center justify-center mb-2">
                  <div className="text-center text-white">
                    <div className="text-xs mb-2">VIG</div>
                    <div className="font-bold">Visual Identity</div>
                    <div className="font-bold">Guidelines</div>
                  </div>
                </div>
                <p>Ada yang typo nih</p>
              </>
            }
          />

          <Message
            sender="Momon"
            avatar="/placeholder.svg?height=40&width=40"
            time="05:11 PM"
            content={<p>Gas ULLLL!</p>}
          />

          <Message
            sender="Nolaaa"
            avatar="/placeholder.svg?height=40&width=40"
            time="09:25 AM"
            content={
              <>
                <p>Like dlu guysss hehe</p>
                <Link
                  href="https://www.instagram.com/p/Cq2AzG..."
                  className="text-primary block mt-1 truncate"
                >
                  https://www.instagram.com/p/Cq2AzG...
                </Link>
              </>
            }
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageThread;
