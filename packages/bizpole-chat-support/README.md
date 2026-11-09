# bizpole-chat-support

A reusable React support-chat widget built from the existing BizNova ChatBox. It includes the chat UI, quick actions, file attachments, chat history, and the existing support-ticket workflow.

The widget talks directly to a compatible backend. It does not contain AI credentials or implement backend services.

## Requirements

- React 18 or later and React DOM 18 or later
- A running backend implementing the endpoints documented below
- An API base URL reachable from the consuming browser
- A tenant slug accepted by that backend

The published build includes its Tailwind utility CSS. The consuming application does not need Tailwind configured. Import the package stylesheet once in the application.

## Installation

```sh
npm install bizpole-chat-support
```

The package name `bizpole-chat-support` was not found in the npm registry when checked on 2026-10-27. Check availability again before publishing.

## Quick start

```tsx
import { ChatBox } from "bizpole-chat-support";
import "bizpole-chat-support/style.css";

export default function App() {
  return (
    <ChatBox
      apiUrl="https://your-api.example.com/api"
      tenantSlug="your-tenant"
    />
  );
}
```

`apiUrl` is the API base URL. Include the `/api` path when the backend mounts routes beneath `/api`, as this project's Express backend does. The widget adds endpoint paths such as `/chat/ask`.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `apiUrl` | `string` | Yes | Base URL for the backend API, for example `https://api.example.com/api`. |
| `tenantSlug` | `string` | Yes | Tenant slug sent as the `x-tenant-slug` header. |
| `token` | `string` | No | Optional bearer token. Sent as `Authorization: Bearer <token>`; it is never added to a URL. |
| `user` | `ChatUser` | No | Current customer identity. `id` enables history and ticket-list requests; name, email, and phone are forwarded where applicable. |
| `product` | `string` | No | Initial product context forwarded with chat requests. |
| `title` | `string` | No | Widget title. Defaults to `BizNova AI`. |
| `welcomeMessage` | `string` | No | Header welcome text. Defaults to `How can we help today?`. |
| `botImage` | `string` | No | URL for the assistant avatar. Defaults to the included BizNova image. |
| `launcherImage` | `string` | No | URL for the launcher animation. Defaults to the included GIF. |
| `onMessageSent` | `(message: string) => void` | No | Called when a chat message or quick action is submitted. |
| `onError` | `(error: unknown) => void` | No | Called when a backend request fails. |
| `onClose` | `() => void` | No | Called when the open chat panel is closed. |

`ChatUser`, `ChatMessage`, `AIMessage`, and `ChatResponse` are exported TypeScript types.

## API contract and backend configuration

The widget preserves the existing backend route and payload contracts. It does not add routes or transform response formats.

All endpoints below are relative to `apiUrl`. The current backend mounts these under `/api`.

| Method and path | Purpose | Request/response expected by the widget |
| --- | --- | --- |
| `GET /knowledge/quick-actions` | Load configured quick actions | Send `x-tenant-slug`; the response is an array containing `id` and `title` and/or `quick_action_label`. |
| `POST /chat/ask` | Send a message or verify a contact | `multipart/form-data`: `message`, JSON-encoded `history`, `session_id`, optional `product`, optional `file`, and optional user fields (`user_id`, `name`, `email`, `phone`). Send `x-tenant-slug`. Response fields used are `text`, optional `files`, `classification`, `product`, and `redirect`. |
| `GET /chat-history/sessions?user_id=...` | Load registered user's sessions | Send `x-tenant-slug`; response is an array with `session_id`, optional `title`, `created_at`, and optional `expires_at`. |
| `GET /chat-history/:sessionId` | Load a session's messages | Send `x-tenant-slug`; response is an array with `sender` (`user` or `bot`) and `message`. |
| `GET /tickets/user/list?user_id=...` | Load registered user's tickets | Send `x-tenant-slug`; response is an array with `id`, `subject`, `status`, and `created_at`. |
| `POST /tickets` | Create a support ticket | JSON body: `subject`, `description`, `priority`, `tenantSlug`, and optional `user` (`id`, `name`, `email`, `phone`). Send `x-tenant-slug`. The current backend returns an `id`. |

The chat response classifications handled by the component are `kb`, `greeting`, `unrelated`, `kb_no_answer`, `raise_ticket`, `collect_user_for_ticket`, `not_registered`, `product_interest`, `collect_contact`, and `enquiry_done`.

History and ticket-list views require `user.id`. Ticket creation can be started without a supplied `user`, but the existing flow asks the backend to verify a registered email or 10-digit phone number before creating a ticket. The backend must support that verification behavior for the flow to complete.

### Authentication and CORS

The optional `token` prop is forwarded as a bearer authorization header. The inspected backend routes do not show bearer-token validation; configure authentication and tenant authorization on your server before relying on this header. Never place server-side AI, database, or cloud-provider credentials in the React application or pass them to this component.

The backend must allow browser requests from the consuming application's origin. The current backend enables CORS with Express `cors()`; production deployments should restrict origins appropriately.

### Attachments

The input accepts images and PDFs. The current chat route handles a single uploaded file with a 10 MiB server-side size limit. Actual file parsing and supported content behavior depend on the backend's chat route and services.

### Ticket creation

Ticket creation requires the backend `POST /tickets` endpoint and its database services. Ticket history additionally requires a `user.id` and the backend `GET /tickets/user/list` route. The widget does not persist tickets locally.

## Customization and error handling

The title, welcome text, and image URLs can be customized through props. The original responsive layout and UI are retained. The CSS package contains Tailwind utilities used by the widget and excludes Tailwind Preflight, so it does not install a global reset in the host application.

Failed backend requests are logged to the browser console, surfaced in the chat where applicable, and passed to `onError` when provided. Optional history and quick-action loading failures are logged and reported through `onError`.

## Development

From this package directory:

```sh
npm install
npm run typecheck
npm run build
npm run typecheck:example
npm pack --dry-run
```

The build produces ES module and CommonJS JavaScript, declarations, CSS, and bundled image assets in `dist/`. `examples/App.tsx` shows the public API; it requires a host React application and a compatible backend to run.

## Publishing

The package is prepared at version `1.0.0`. Check that the name is still available and that you are logged into the intended npm account before publishing.

```sh
npm login
npm whoami
npm pack --dry-run
npm publish
```

Do not publish until the package owner and final `npm pack --dry-run` contents have been reviewed. To release a new version, update `version` in `package.json` using semantic versioning, then rerun the typecheck, build, and pack review. No publish command is run as part of this workspace setup.

## Troubleshooting

- **API requests use the wrong path:** Set `apiUrl` to the backend API root, including `/api` if your server mounts routes there.
- **Tenant is rejected:** Check the `tenantSlug` value and ensure the backend accepts the `x-tenant-slug` header.
- **No history or ticket list appears:** Pass a `user` with an `id`; check that the corresponding backend routes return arrays in the documented format.
- **Files fail to upload:** Check the backend's 10 MiB limit, CORS configuration, and server-side file parsing.
- **Styles are missing:** Import `bizpole-chat-support/style.css` in the host application.
