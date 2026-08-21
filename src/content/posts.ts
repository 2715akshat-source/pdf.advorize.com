import type { Post } from "./types";
import { postsA } from "./posts-a";
import { postsB } from "./posts-b";
import { postsC } from "./posts-c";
import { postsD } from "./posts-d";

/**
 * Every post, newest first. Split across four files only so each stays
 * something a person can open and read — the order here is the order the
 * index shows, and nothing depends on which file a post lives in.
 */
export const posts: Post[] = [...postsA, ...postsB, ...postsC, ...postsD];

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);

/** The post written about a given tool, if there is one. */
export const postForTool = (tool: string) => posts.find((p) => p.tool === tool);
