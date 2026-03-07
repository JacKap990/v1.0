import { auth } from "../../../auth";

export async function getUserId() {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) {
        throw new Error("Unauthorized");
    }
    return user.id;
}
