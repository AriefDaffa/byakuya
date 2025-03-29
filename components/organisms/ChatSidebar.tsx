import { ScrollArea } from '@/components/atoms/scroll-area';
import { ChatList } from '@/components/molecules/ChatList';
import SearchInput from '@/components/molecules/SearchInput';
import { ModeToggle } from '../atoms/mode-toggle';

const ChatSidebar = () => {
  return (
    <div className="w-80 border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Messages</h1>
          {/* <Button variant="ghost" size="icon" className="rounded-full">
            <Edit className="h-5 w-5 text-muted-foreground" />
          </Button> */}
          <ModeToggle />
        </div>
        <div className="mt-4">
          <SearchInput placeholder="Search messages..." />
        </div>
      </div>

      <ScrollArea className="flex-1 h-1">
        <div className="p-2">
          <div className="text-xs text-muted-foreground px-2 py-1">
            <span>Pinned Message</span>
          </div>

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Hatypo Studio"
            message="Mas Aditt Typing....."
            time="09:26 PM"
            unread={2}
            active
            fallback="A"
          />

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Hatypo Studio"
            message="Mas Happy Typing....."
            time="09:11 PM"
            unread={1}
            color="bg-orange-500"
            fallback="A"
          />

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Nolaaa"
            message="PPPPPPPPPPPPPPPPPPPP"
            time="09:12 PM"
            unread={11}
            fallback="A"
          />

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="OMOC Project"
            message="Aldit Typing....."
            time="09:11 PM"
            unread={2}
            fallback="A"
          />

          <div className="text-xs text-muted-foreground px-2 py-1 mt-4">
            <span>All Message</span>
          </div>

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Momon"
            message="Typing..."
            time="09:26 PM"
            online
            fallback="A"
          />

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Farhan"
            message="Cek Figma coba han"
            time="09:25 PM"
            online
            fallback="A"
          />

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Mas Aditt"
            message="Typing..."
            time="09:21 AM"
            online
            fallback="A"
          />

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Zhofran"
            message="Yaudah jop"
            time="Yesterday"
            online
            fallback="A"
          />

          <ChatList
            avatar="/placeholder.svg?height=40&width=40"
            name="Vitoo"
            message="Pie to jaremu?"
            time="Yesterday"
            online
            fallback="A"
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
