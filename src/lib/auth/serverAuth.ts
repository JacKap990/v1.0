import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

export async function getUserId() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
        throw new Error("Unauthorized");
    }
    return user.id;
}
