import { revalidatePath } from "next/cache";

export function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (e) {
    // Outside of request store (e.g. CLI or test runner)
  }
}

