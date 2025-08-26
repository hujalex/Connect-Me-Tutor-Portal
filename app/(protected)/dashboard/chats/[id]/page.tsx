type Conversation = {
  id: string; //uuid
  participants: string[]; //uuid relation on Profile.id table
  admin_conversation: boolean;
};
