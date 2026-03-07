import { auth } from "../auth";

export default auth;

export const config = {
    matcher: [
        "/((?!api/auth|api/register|login|register|_next/static|_next/image|favicon.ico|bg-abstract.jpg).*)",
    ],
};
