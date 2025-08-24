import { ChatList } from "@/components/chat/conversations/pairing-conversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SharedPairing } from "@/types/pairing";
import { MessageSquare, Shield, Users } from "lucide-react";
// import { getAccountEnrollments } from "@/lib/actions/enrollments.action";
import { getAccountPairings } from "@/lib/actions/pairing.server.actions";
import { getProfileRole } from "@/lib/actions/user.actions";
import { createClient, createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchUserAdminConversations } from "@/lib/actions/chat.server.actions";
import { Button } from "@/components/ui/button";

export default async function ChatPage() {
  const supabase = createClient();
  const user = await supabase.auth.getUser();
  console.log("returned user");
  const userId = user.data.user?.id;
  if (!userId) redirect("/");

  // const [enrollments, role] = await Promise.all([
  //   getAccountEnrollments(userId),
  //   getProfileRole(userId),
  // ]);

  const [adminConversationID, pairings, role] = await Promise.all([
    fetchUserAdminConversations(userId),
    getAccountPairings(userId),
    getProfileRole(userId),
  ]);

  console.log("ADMIN: ", adminConversationID);

  console.log("Pairings:", pairings);
  return (
    <div className="flex flex-col h-screen">
      <div>
        <div className="p-4">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/40">
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />

            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Admin Conversation
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Connect with administrators for support and guidance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Students & Tutors</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>Real-time Support</span>
                </div>
              </div>

              <Button
                // onClick={handleAccessAdmin}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-colors"
              >
                Access Admin Conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <ChatList
        pairings={pairings!}
        currentUserId="7b4dbab0-436b-4cfd-bdb5-2640caebe920"
        role={role as any}
      />
    </div>
  );
}
