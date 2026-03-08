import { auth } from "../auth";

export default auth;

export const config = {
    matcher: [
        "/api/gateway/:path*",
    ],
};
