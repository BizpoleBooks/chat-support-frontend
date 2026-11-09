import { ChatBox } from "bizpole-chat-support";
import "bizpole-chat-support/style.css";

export default function App() {
  return (
    <main>
      <ChatBox
        apiUrl="https://your-api.example.com/api"
        tenantSlug="your-tenant"
        user={{
          id: "customer-123",
          name: "Ada Lovelace",
          email: "ada@example.com",
        }}
      />
    </main>
  );
}
